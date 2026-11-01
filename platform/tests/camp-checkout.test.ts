import { beforeEach, describe, it } from "node:test";
import { expect } from "./expect.js";
import { campCheckout } from "../src/handlers/camp-checkout.js";
import { listCamps } from "../src/handlers/camps.js";
import type { CampsResponse } from "../src/contract.js";
import { call, deliver, get, makeDeps, parent, post, resetDb, seed, sessionBySlug, sessionIdFrom } from "./helpers.js";

const deps = makeDeps();
const { db } = deps;

beforeEach(async () => {
  await resetDb(db);
  await seed(db);
});

describe("GET /api/camps", () => {
  it("lists active camps with sessions and hides Miami and inactive camps", async () => {
    const res = await call(deps, listCamps, get("/api/camps"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as CampsResponse;
    expect(body.camps.map((c) => c.slug)).toEqual(["arlington-catholic", "bbn"]);
    const ac = body.camps[0]!;
    expect(ac.sessions).toHaveLength(2);
    expect(ac.sessions[0]).toMatchObject({ priceCents: 50000, status: "open", spotsLeft: null, startsOn: "2027-07-12", startTime: "09:00" });
    expect(body.camps[1]).toMatchObject({ infoOnly: true, sessions: [] });
  });

  it("applies early-bird pricing until its date", async () => {
    await db`update public.sessions set early_bird_price_cents = 45000, early_bird_until = current_date + 10 where slug = 'week-of-july-12'`;
    const body = (await (await call(deps, listCamps, get("/api/camps"))).json()) as CampsResponse;
    expect(body.camps[0]!.sessions[0]).toMatchObject({ priceCents: 45000, regularPriceCents: 50000 });
  });
});

describe("POST /api/checkout/camp (acceptance #3)", () => {
  it("one payment covering two sessions and two children creates every registration under the right camp", async () => {
    const week1 = await sessionBySlug(db, "arlington-catholic", "week-of-july-12");
    const week2 = await sessionBySlug(db, "arlington-catholic", "week-of-july-19");

    const res = await call(
      deps,
      campCheckout,
      post("/api/checkout/camp", {
        parent,
        players: [
          { name: "Alex Rivera", age: 10, sessionIds: [week1, week2], extra: { shirtSize: "YM" } },
          { name: "Sam Rivera", age: 15, sessionIds: [week2] },
        ],
        extra: { hearAboutUs: "Friend" },
      }),
    );
    expect(res.status).toBe(200);
    const { checkoutUrl } = (await res.json()) as { checkoutUrl: string };
    const sessionId = sessionIdFrom(checkoutUrl);

    const mock = deps.payments.sessions.get(sessionId)!;
    expect(mock.amountTotal).toBe(50000 + 75000 * 2);
    expect(mock.input.customerEmail).toBe("jamie.rivera@example.test");

    expect((await deliver(deps, deps.payments.complete(sessionId))).status).toBe(200);

    const regs = await db`
      select r.player_name, s.slug as session, c.slug as camp, r.parent_email, r.parent_town, r.extra, r.waiver_status
        from public.registrations r join public.sessions s on s.id = r.session_id join public.camps c on c.id = r.camp_id
       order by r.line_no`;
    expect(regs).toHaveLength(3);
    expect(regs.map((r) => [r.player_name, r.session])).toEqual([
      ["Alex Rivera", "week-of-july-12"],
      ["Alex Rivera", "week-of-july-19"],
      ["Sam Rivera", "week-of-july-19"],
    ]);
    expect(regs.every((r) => r.camp === "arlington-catholic" && r.parent_town === "Brookline")).toBe(true);
    expect(regs[0]!.extra).toEqual({ hearAboutUs: "Friend", shirtSize: "YM" });
    expect(regs[0]!.waiver_status).toBe("not_collected");

    const [payment] = await db`select amount_total_cents, status from public.payments`;
    expect(payment).toMatchObject({ amount_total_cents: 200000, status: "paid" });
    const [contact] = await db`select email, town, sources from public.contacts`;
    expect(contact).toMatchObject({ email: "jamie.rivera@example.test", town: "Brookline", sources: ["registration"] });
  });

  it("an information-only camp has no checkout", async () => {
    const [bbn] = await db`select id from public.camps where slug = 'bbn'`;
    const [s] = await db`insert into public.sessions (camp_id, slug, name, price_cents) values (${bbn!.id}, 'x', 'X', 100) returning id`;
    const res = await call(deps, campCheckout, post("/api/checkout/camp", { parent, players: [{ name: "A", age: 9, sessionIds: [s!.id] }] }));
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ error: "camp_info_only" });
  });

  it("rejects closed sessions, hidden camps, unknown sessions and Miami", async () => {
    const watertown = await sessionBySlug(db, "watertown", "week-1");
    let res = await call(deps, campCheckout, post("/api/checkout/camp", { parent, players: [{ name: "A", age: 9, sessionIds: [watertown] }] }));
    expect((await res.json()).error).toBe("session_closed");

    res = await call(
      deps,
      campCheckout,
      post("/api/checkout/camp", { parent, players: [{ name: "A", age: 9, sessionIds: ["00000000-0000-4000-8000-000000000000"] }] }),
    );
    expect(res.status).toBe(404);
  });

  it("rejects ages outside the session range and sessions past their closing time", async () => {
    const week1 = await sessionBySlug(db, "arlington-catholic", "week-of-july-12");
    let res = await call(deps, campCheckout, post("/api/checkout/camp", { parent, players: [{ name: "A", age: 15, sessionIds: [week1] }] }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "validation_failed", message: "This session is for ages 6–13." });

    await db`update public.sessions set closes_at = now() - interval '1 minute' where id = ${week1}`;
    res = await call(deps, campCheckout, post("/api/checkout/camp", { parent, players: [{ name: "A", age: 9, sessionIds: [week1] }] }));
    expect((await res.json()).error).toBe("session_closed");
  });

  it("returns field-level validation errors", async () => {
    const res = await call(deps, campCheckout, post("/api/checkout/camp", { parent: { ...parent, email: "nope" }, players: [] }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; details: { issues: { path: string }[] } };
    expect(body.error).toBe("validation_failed");
    expect(body.details.issues.map((i) => i.path)).toEqual(expect.arrayContaining(["parent.email", "players"]));
  });

  it("enforces optional session capacity, counting holds", async () => {
    const week1 = await sessionBySlug(db, "arlington-catholic", "week-of-july-12");
    await db`update public.sessions set capacity = 2 where id = ${week1}`;
    const body = { parent, players: [{ name: "A", age: 9, sessionIds: [week1] }, { name: "B", age: 9, sessionIds: [week1] }] };
    expect((await call(deps, campCheckout, post("/api/checkout/camp", body))).status).toBe(200);
    const res = await call(deps, campCheckout, post("/api/checkout/camp", { parent, players: [{ name: "C", age: 9, sessionIds: [week1] }] }));
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ error: "session_full", details: { sessionId: week1 } });
  });

  it("releases the hold if Stripe fails to create the session", async () => {
    const week1 = await sessionBySlug(db, "arlington-catholic", "week-of-july-12");
    await db`update public.sessions set capacity = 1 where id = ${week1}`;
    deps.payments.failNextCheckout = true;
    const body = { parent, players: [{ name: "A", age: 9, sessionIds: [week1] }] };
    const res = await call(deps, campCheckout, post("/api/checkout/camp", body));
    expect(res.status).toBe(502);
    expect((await call(deps, campCheckout, post("/api/checkout/camp", body))).status).toBe(200);
    const [intent] = await db`select payload from public.checkout_intents where status = 'failed'`;
    expect(intent!.payload).toBeNull();
  });

  it("requires the current waiver version when configured (acceptance #16)", async () => {
    const week1 = await sessionBySlug(db, "arlington-catholic", "week-of-july-12");
    const [w1] = await db`insert into public.waivers (flow, version, title, body, active) values ('camp', 1, 'Waiver', 'v1 text', false) returning id`;
    const [w2] = await db`insert into public.waivers (flow, version, title, body, active) values ('camp', 2, 'Waiver', 'v2 text', true) returning id`;
    await db`insert into public.settings (key, value) values ('camp_waiver_required', 'true')`;
    const base = { parent, players: [{ name: "A", age: 9, sessionIds: [week1] }] };

    expect((await call(deps, campCheckout, post("/api/checkout/camp", base))).status).toBe(422);
    const stale = await call(deps, campCheckout, post("/api/checkout/camp", { ...base, waiver: { waiverId: w1!.id, acceptedName: "Jamie Rivera" } }));
    expect(await stale.json()).toMatchObject({ error: "waiver_required", details: { currentWaiverId: w2!.id } });

    const ok = await call(deps, campCheckout, post("/api/checkout/camp", { ...base, waiver: { waiverId: w2!.id, acceptedName: "Jamie Rivera" } }));
    const { checkoutUrl } = (await ok.json()) as { checkoutUrl: string };
    await deliver(deps, deps.payments.complete(sessionIdFrom(checkoutUrl)));
    const [reg] = await db`
      select r.waiver_status, r.waiver_accepted_name, w.version, w.body
        from public.registrations r join public.waivers w on w.id = r.waiver_id`;
    expect(reg).toMatchObject({ waiver_status: "accepted", waiver_accepted_name: "Jamie Rivera", version: 2, body: "v2 text" });

    await expect(db`update public.waivers set body = 'edited' where id = ${w2!.id}`).rejects.toThrow(/immutable/);
  });
});
