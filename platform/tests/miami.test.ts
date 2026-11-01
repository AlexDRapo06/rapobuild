import { beforeEach, describe, it } from "node:test";
import { expect } from "./expect.js";
import { miamiCheckout, miamiStatus, miamiVerifyCode } from "../src/handlers/miami.js";
import type { MiamiStatusResponse } from "../src/contract.js";
import { cleanup } from "../src/handlers/cleanup.js";
import {
  addAccessCode,
  call,
  deliver,
  fillMiami,
  get,
  makeDeps,
  miamiParent,
  miamiPlayer,
  neutralMiami,
  post,
  resetDb,
  seed,
  sessionIdFrom,
  shipping,
} from "./helpers.js";

const deps = makeDeps();
const { db } = deps;

const checkout = (body: Record<string, unknown>) =>
  call(deps, miamiCheckout, post("/api/miami/checkout", { parent: miamiParent, shippingAddress: shipping, ...body }));
const boy = (extra: Record<string, unknown> = {}) => checkout({ players: [miamiPlayer("boy")], ...extra });
const girl = (extra: Record<string, unknown> = {}) => checkout({ players: [miamiPlayer("girl")], ...extra });
const amountOf = async (res: Response) => deps.payments.sessions.get(sessionIdFrom(((await res.json()) as { checkoutUrl: string }).checkoutUrl))!.amountTotal;
const status = async () => (await (await call(deps, miamiStatus, get("/api/miami"))).json()) as MiamiStatusResponse;

beforeEach(async () => {
  await resetDb(db);
  await seed(db);
  await neutralMiami(db);
});

describe("seeded settings match the client's Kickoff Form", () => {
  it("stores the combine schedule, price, opening and closing times", async () => {
    await seed(db);
    const [event] = await db`select name, opens_at, public_opens_at, closes_at, reserved_total from public.miami_event`;
    expect(event).toMatchObject({
      name: "FOOTYUP x GOINGFORGOAT College Combine",
      reserved_total: 200,
      opens_at: new Date("2026-11-01T15:00:00Z"),
      public_opens_at: new Date("2026-11-01T15:00:00Z"),
      closes_at: new Date("2027-03-02T04:59:00Z"),
    });
    const groups = await db`
      select grp, starts_on, ends_on, to_char(daily_start_time, 'HH24:MI') as start, to_char(daily_end_time, 'HH24:MI') as finish,
             price_public_cents, price_code_holder_cents
        from public.miami_groups order by grp`;
    expect(groups).toEqual([
      { grp: "boys", starts_on: "2027-05-21", ends_on: "2027-05-23", start: "16:30", finish: "20:30", price_public_cents: 150000, price_code_holder_cents: 150000 },
      { grp: "girls", starts_on: "2027-05-24", ends_on: "2027-05-26", start: "16:30", finish: "20:30", price_public_cents: 150000, price_code_holder_cents: 150000 },
    ]);
  });
});

describe("access code gate (acceptance #4)", () => {
  beforeEach(async () => {
    await addAccessCode(db, "FootyUp-Test-Code");
  });

  it("blocks a missing or wrong code and allows the right one", async () => {
    expect(await (await boy()).json()).toMatchObject({ error: "access_code_required" });
    expect(await (await boy({ accessCode: "guess" })).json()).toMatchObject({ error: "access_code_invalid" });
    const ok = await boy({ accessCode: "  footyup-test-code " });
    expect(ok.status).toBe(200);
    expect(await amountOf(ok)).toBe(157500);
  });

  it("removing the code opens checkout to the public at the public price", async () => {
    await db`update public.access_codes set active = false`;
    const res = await boy();
    expect(res.status).toBe(200);
    expect(await amountOf(res)).toBe(130000);
  });

  it("an end date in the past opens checkout without a deploy", async () => {
    await db`update public.access_codes set ends_at = now() - interval '1 minute'`;
    expect((await boy()).status).toBe(200);
  });

  it("a code limited to one group does not unlock the other", async () => {
    await db`delete from public.access_codes`;
    await addAccessCode(db, "girls-only", { grp: "girls" });
    expect(await (await boy({ accessCode: "girls-only" })).json()).toMatchObject({ error: "access_code_invalid" });
    expect((await girl({ accessCode: "girls-only" })).status).toBe(200);
  });

  it("verify-code reports code-holder prices and rejects bad codes", async () => {
    const bad = await call(deps, miamiVerifyCode, post("/api/miami/verify-code", { accessCode: "nope" }));
    expect(bad.status).toBe(403);
    const good = await call(deps, miamiVerifyCode, post("/api/miami/verify-code", { accessCode: "footyup-test-code" }));
    expect(await good.json()).toMatchObject({ valid: true, groups: [{ group: "boys", priceCents: 157500, spotsLeft: 200 }, { group: "girls" }] });
  });

  it("rate-limits code guessing", async () => {
    const ip = "203.0.113.9";
    for (let i = 0; i < 10; i++) await call(deps, miamiVerifyCode, post("/api/miami/verify-code", { accessCode: `guess-${i}` }, ip));
    const res = await call(deps, miamiVerifyCode, post("/api/miami/verify-code", { accessCode: "footyup-test-code" }, ip));
    expect(res.status).toBe(429);
  });
});

describe("registration phases from the Kickoff Form", () => {
  beforeEach(async () => {
    await addAccessCode(db, "host-code");
  });

  it("before the public opening, only code holders can register", async () => {
    await db`update public.miami_event set public_opens_at = now() + interval '1 day'`;
    expect(await (await boy()).json()).toMatchObject({ error: "access_code_required" });
    expect((await boy({ accessCode: "host-code" })).status).toBe(200);
    expect(await status()).toMatchObject({ accessCodeRequired: true, accessCodeAccepted: true, event: { publicOpen: false } });
  });

  it("after the public opening, everyone can register and the code is optional", async () => {
    await db`update public.miami_event set public_opens_at = now() - interval '1 minute'`;
    const pub = await boy();
    expect(pub.status).toBe(200);
    expect(await amountOf(pub)).toBe(130000);
    const host = await boy({ accessCode: "host-code" });
    expect(await amountOf(host)).toBe(157500);
    expect((await boy({ accessCode: "typo" })).status).toBe(403);
    expect(await status()).toMatchObject({ accessCodeRequired: false, accessCodeAccepted: true, event: { publicOpen: true } });
  });

  it("with no code active and the public opening still ahead, nobody can register yet", async () => {
    await db`delete from public.access_codes`;
    await db`update public.miami_event set public_opens_at = now() + interval '1 day'`;
    expect(await (await boy()).json()).toMatchObject({ error: "registration_not_open" });
  });

  it("checkout opens at opens_at and closes at closes_at", async () => {
    await db`update public.miami_event set opens_at = now() + interval '1 hour'`;
    expect(await (await boy({ accessCode: "host-code" })).json()).toMatchObject({ error: "registration_not_open" });
    await db`update public.miami_event set opens_at = null, closes_at = now() - interval '1 minute'`;
    const closed = await boy({ accessCode: "host-code" });
    expect(await closed.json()).toMatchObject({ error: "registration_not_open", message: "Miami registration has closed." });
    expect((await status()).event.open).toBe(false);
  });
});

describe("caps and holds (acceptance #5)", () => {
  it("the 201st boy and the 201st girl cannot check out", async () => {
    await fillMiami(db, "boys", 200);
    await fillMiami(db, "girls", 199);
    expect(await (await boy()).json()).toMatchObject({ error: "group_full", details: { group: "boys" } });
    expect((await girl()).status).toBe(200);
    expect(await (await girl()).json()).toMatchObject({ error: "group_full", details: { group: "girls" } });
  });

  it("two simultaneous attempts for the last spot: exactly one wins", async () => {
    await fillMiami(db, "boys", 199);
    const results = await Promise.all(Array.from({ length: 8 }, () => boy()));
    const statuses = results.map((r) => r.status);
    expect(statuses.filter((s) => s === 200)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(7);
  });

  it("never oversells under heavy concurrency at the database level", async () => {
    await db`update public.miami_groups set cap = 25 where grp = 'boys'`;
    const attempts = await Promise.allSettled(
      Array.from({ length: 60 }, () =>
        db.begin(async (tx) => {
          const [intent] = await tx`insert into public.checkout_intents (flow, amount_cents, expires_at) values ('miami', 0, now() + interval '1 hour') returning id`;
          await tx`select public.reserve_miami(${intent!.id}, ${tx.json({ boys: 1 })}, false, now() + interval '1 hour')`;
        }),
      ),
    );
    expect(attempts.filter((a) => a.status === "fulfilled")).toHaveLength(25);
    const [holds] = await db`select sum(quantity)::int as held from public.holds where status = 'active'`;
    expect(holds!.held).toBe(25);
  });

  it("an abandoned checkout releases its hold when the session expires", async () => {
    await fillMiami(db, "boys", 199);
    const first = await boy();
    expect(first.status).toBe(200);
    expect((await boy()).status).toBe(409);

    await deliver(deps, deps.payments.expire(sessionIdFrom(((await first.json()) as { checkoutUrl: string }).checkoutUrl)));
    expect((await boy()).status).toBe(200);
  });

  it("a hold past its expiry stops counting even if the expiry webhook never arrives", async () => {
    await fillMiami(db, "boys", 199);
    expect((await boy()).status).toBe(200);
    await db`update public.holds set expires_at = now() - interval '1 second'`;
    expect((await boy()).status).toBe(200);
    const res = await call(deps, cleanup, get("/api/cron/cleanup"));
    expect(await res.json()).toMatchObject({ holdsReleased: 1 });
  });

  it("a refunded registration frees its spot", async () => {
    await fillMiami(db, "boys", 199);
    const res = await boy();
    const sessionId = sessionIdFrom(((await res.json()) as { checkoutUrl: string }).checkoutUrl);
    await deliver(deps, deps.payments.complete(sessionId));
    expect((await boy()).status).toBe(409);
    await deliver(deps, deps.payments.refund(sessionId, 130000));
    expect((await boy()).status).toBe(200);
  });

  it("stores every field from the Kickoff Form with the registration", async () => {
    await addAccessCode(db, "code");
    const res = await checkout({
      accessCode: "code",
      players: [miamiPlayer("boy", 1), { ...miamiPlayer("girl", 2), shippingAddress: { line1: "9 Other Rd", city: "Miami", state: "FL", postalCode: "33156" } }],
    });
    await deliver(deps, deps.payments.complete(sessionIdFrom(((await res.json()) as { checkoutUrl: string }).checkoutUrl)));
    const regs = await db`
      select miami_group, via_access_code, parent_first_name, parent_last_name, parent_name, parent_email, parent_phone,
             emergency_phone, parent_town, player_first_name, player_last_name, player_name, player_age, player_height_in,
             player_weight_lb, player_position, player_club, player_email, shirt_size, short_size,
             ship_line1, ship_line2, ship_city, ship_state, ship_postal_code, session_id
        from public.registrations order by line_no`;
    expect(regs[0]).toEqual({
      miami_group: "boys",
      via_access_code: true,
      parent_first_name: "Jamie",
      parent_last_name: "Rivera",
      parent_name: "Jamie Rivera",
      parent_email: "jamie.rivera@example.test",
      parent_phone: "(617) 555-0142",
      emergency_phone: "617-555-0177",
      parent_town: "Brookline",
      player_first_name: "Test",
      player_last_name: "Player 1",
      player_name: "Test Player 1",
      player_age: 16,
      player_height_in: 70,
      player_weight_lb: 150,
      player_position: "Midfielder",
      player_club: "Test FC",
      player_email: "player1@example.test",
      shirt_size: "M",
      short_size: "L",
      ship_line1: "1 Test Street",
      ship_line2: "Apt 2",
      ship_city: "Brookline",
      ship_state: "MA",
      ship_postal_code: "02445",
      session_id: null,
    });
    expect(regs[1]).toMatchObject({ miami_group: "girls", ship_line1: "9 Other Rd", ship_city: "Miami", parent_town: "Brookline" });
  });
});

describe("reserved spots", () => {
  it("per-group: the public cannot take spots reserved for code holders while a code is active", async () => {
    await db`update public.miami_groups set cap = 10, reserved_for_code_holders = 4 where grp = 'boys'`;
    await addAccessCode(db, "host-families", { endsAt: new Date(Date.now() + 86_400_000) });
    await db`update public.miami_event set public_opens_at = now() - interval '1 minute'`;
    await fillMiami(db, "boys", 6, false);

    const [avail] = await db`select left_for_code_holders, left_for_public from public.miami_availability() where grp = 'boys'`;
    expect(avail).toEqual({ left_for_code_holders: 4, left_for_public: 0 });
    expect(await (await boy()).json()).toMatchObject({ error: "group_full" });
    expect((await boy({ accessCode: "host-families" })).status).toBe(200);

    await db`update public.access_codes set active = false`;
    const [after] = await db`select left_for_public from public.miami_availability() where grp = 'boys'`;
    expect(after!.left_for_public).toBe(3);
  });

  it("shared pool: 200-style reservation across both groups holds back public spots in either group", async () => {
    await db`update public.miami_groups set cap = 10`;
    await db`update public.miami_event set reserved_total = 5, public_opens_at = now() - interval '1 minute'`;
    await addAccessCode(db, "host");
    await fillMiami(db, "boys", 8, false);
    await fillMiami(db, "girls", 7, false);

    const rows = await db`select grp, left_for_public, left_for_code_holders from public.miami_availability() order by grp`;
    expect(rows).toEqual([
      { grp: "boys", left_for_public: 0, left_for_code_holders: 2 },
      { grp: "girls", left_for_public: 0, left_for_code_holders: 3 },
    ]);
    expect(await (await girl()).json()).toMatchObject({ error: "group_full" });
    expect((await girl({ accessCode: "host" })).status).toBe(200);

    await db`update public.miami_event set reserved_until = now() - interval '1 second'`;
    const [boys] = await db`select left_for_public from public.miami_availability() where grp = 'boys'`;
    expect(boys!.left_for_public).toBe(2);
  });

  it("shared pool: simultaneous boys and girls checkouts cannot overrun the public share", async () => {
    await db`update public.miami_groups set cap = 10`;
    await db`update public.miami_event set reserved_total = 18, public_opens_at = now() - interval '1 minute'`;
    await addAccessCode(db, "host");
    const results = await Promise.all([...Array.from({ length: 10 }, () => boy()), ...Array.from({ length: 10 }, () => girl())]);
    expect(results.filter((r) => r.status === 200)).toHaveLength(2);
  });
});

describe("configuration", () => {
  it("refuses checkout until a price is configured", async () => {
    await db`update public.miami_groups set price_public_cents = null, price_code_holder_cents = null`;
    const res = await boy();
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ error: "pricing_not_configured" });
  });

  it("refuses checkout when paused", async () => {
    await db`update public.miami_event set checkout_open = false`;
    expect(await (await boy()).json()).toMatchObject({ error: "registration_not_open" });
  });

  it("validates position, shirt and short sizes against configured lists", async () => {
    await db`update public.miami_event set shirt_sizes = '{YL,S,M,L,XL}', short_sizes = '{S,M,L}', positions = '{Goalkeeper,Defender,Midfielder,Forward}'`;
    const bad = await checkout({ players: [{ ...miamiPlayer("boy"), shortSize: "XXL" }] });
    expect(await bad.json()).toMatchObject({ error: "validation_failed", details: { issues: [{ path: "players.0.shortSize" }] } });
    expect((await checkout({ players: [{ ...miamiPlayer("boy"), shirtSize: "xl", position: "midfielder" }] })).status).toBe(200);
  });

  it("rejects a registration missing a required Kickoff Form field", async () => {
    const { club: _club, ...noClub } = miamiPlayer("boy");
    const res = await checkout({ players: [noClub], parent: { ...miamiParent, emergencyPhone: undefined } });
    const body = (await res.json()) as { details: { issues: { path: string }[] } };
    expect(body.details.issues.map((i) => i.path)).toEqual(expect.arrayContaining(["players.0.club", "parent.emergencyPhone"]));
  });

  it("flags registrations as waiver not collected when no Miami waiver exists yet", async () => {
    const res = await boy();
    await deliver(deps, deps.payments.complete(sessionIdFrom(((await res.json()) as { checkoutUrl: string }).checkoutUrl)));
    const [reg] = await db`select waiver_status from public.registrations`;
    expect(reg!.waiver_status).toBe("not_collected");
  });

  it("GET /api/miami reports phase, schedules and availability without exposing codes", async () => {
    await addAccessCode(db, "secret-code");
    await fillMiami(db, "girls", 200);
    const res = await call(deps, miamiStatus, get("/api/miami"));
    const text = await res.text();
    expect(text).not.toContain("secret-code");
    const body = JSON.parse(text) as MiamiStatusResponse;
    expect(body.accessCodeRequired).toBe(true);
    expect(body.groups).toMatchObject([
      { group: "boys", label: "Boys", priceCents: 157500, spotsLeft: 200, full: false, startsOn: "2027-05-21", dailyStartTime: "16:30" },
      { group: "girls", label: "Girls", priceCents: 157500, spotsLeft: 0, full: true, startsOn: "2027-05-24", dailyEndTime: "20:30" },
    ]);
  });
});
