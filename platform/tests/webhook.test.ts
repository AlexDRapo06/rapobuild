import { beforeEach, describe, it } from "node:test";
import { expect } from "./expect.js";
import { campCheckout } from "../src/handlers/camp-checkout.js";
import { call, countRows, deliver, makeDeps, parent, post, resetDb, seed, sessionBySlug, sessionIdFrom } from "./helpers.js";

const deps = makeDeps();
const { db } = deps;

async function startCampCheckout() {
  const week1 = await sessionBySlug(db, "arlington-catholic", "week-of-july-12");
  const res = await call(deps, campCheckout, post("/api/checkout/camp", { parent, players: [{ name: "Alex Rivera", age: 10, sessionIds: [week1] }] }));
  return sessionIdFrom(((await res.json()) as { checkoutUrl: string }).checkoutUrl);
}

beforeEach(async () => {
  await resetDb(db);
  await seed(db);
});

describe("Stripe webhook (acceptance #1, #2)", () => {
  it("creates exactly one registration even when the same event is delivered twice", async () => {
    const sessionId = await startCampCheckout();
    const delivery = deps.payments.complete(sessionId);

    const first = await deliver(deps, delivery);
    const second = await deliver(deps, delivery);
    expect(await first.json()).toMatchObject({ result: "registered" });
    expect(await second.json()).toMatchObject({ result: "duplicate" });

    expect(await countRows(db, "registrations")).toBe(1);
  });

  it("is idempotent under simultaneous duplicate deliveries and distinct events for the same session", async () => {
    const sessionId = await startCampCheckout();
    const delivery = deps.payments.complete(sessionId);
    const other = deps.payments.signedEvent("checkout.session.async_payment_succeeded", deps.payments.sessionObject(sessionId));
    const results = await Promise.all([deliver(deps, delivery), deliver(deps, delivery), deliver(deps, other)]);
    expect(results.every((r) => r.status === 200)).toBe(true);
    expect(await countRows(db, "registrations")).toBe(1);
  });

  it("clears the stored form payload once registrations exist", async () => {
    const sessionId = await startCampCheckout();
    await deliver(deps, deps.payments.complete(sessionId));
    const [intent] = await db`select status, payload from public.checkout_intents`;
    expect(intent).toMatchObject({ status: "completed", payload: null });
    const [hold] = await db`select count(*)::int as n from public.holds where status = 'active'`;
    expect(hold!.n).toBe(0);
  });

  it("records full and partial refunds on the payment", async () => {
    const sessionId = await startCampCheckout();
    await deliver(deps, deps.payments.complete(sessionId));

    await deliver(deps, deps.payments.refund(sessionId, 20000));
    let [payment] = await db`select status, refunded_cents from public.payments`;
    expect(payment).toMatchObject({ status: "partially_refunded", refunded_cents: 20000 });

    await deliver(deps, deps.payments.refund(sessionId, 50000));
    [payment] = await db`select status, refunded_cents from public.payments`;
    expect(payment).toMatchObject({ status: "refunded", refunded_cents: 50000 });
  });

  it("rejects events without a valid Stripe signature", async () => {
    const sessionId = await startCampCheckout();
    const delivery = deps.payments.complete(sessionId);
    const forged = await deliver(deps, { body: delivery.body, signature: "t=1,v1=deadbeef" });
    expect(forged.status).toBe(400);
    const tampered = await deliver(deps, { body: delivery.body.replace("50000", "1"), signature: delivery.signature });
    expect(tampered.status).toBe(400);
    expect(await countRows(db, "registrations")).toBe(0);
  });

  it("releases holds when Stripe reports the session expired", async () => {
    const week1 = await sessionBySlug(db, "arlington-catholic", "week-of-july-12");
    await db`update public.sessions set capacity = 1 where id = ${week1}`;
    const sessionId = await startCampCheckout();
    await deliver(deps, deps.payments.expire(sessionId));
    const [intent] = await db`select status, payload from public.checkout_intents`;
    expect(intent).toMatchObject({ status: "expired", payload: null });
    const res = await call(deps, campCheckout, post("/api/checkout/camp", { parent, players: [{ name: "B", age: 9, sessionIds: [week1] }] }));
    expect(res.status).toBe(200);
  });

  it("keeps payments from the legacy checkout that have no intent", async () => {
    const delivery = deps.payments.signedEvent("checkout.session.completed", {
      id: "cs_live_legacy_1",
      payment_status: "paid",
      amount_total: 40000,
      amount_subtotal: 40000,
      currency: "usd",
      payment_intent: "pi_legacy_1",
      metadata: { playerName: "Legacy Kid" },
      customer_details: { email: "legacy@example.test" },
    });
    expect(await (await deliver(deps, delivery)).json()).toMatchObject({ result: "legacy_payment_recorded" });
    const [payment] = await db`select intent_id, amount_total_cents, legacy_metadata from public.payments`;
    expect(payment).toMatchObject({ intent_id: null, amount_total_cents: 40000, legacy_metadata: { metadata: { playerName: "Legacy Kid" } } });
  });
});
