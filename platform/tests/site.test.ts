import { readFileSync } from "node:fs";
import { beforeEach, describe, it } from "node:test";
import { expect } from "./expect.js";
import { CampsFile, MiamiFile, upsertCamps, upsertMiami } from "../src/admin/config.js";
import { site } from "../src/handlers/site.js";
import { offerNext } from "../src/lib/waitlist.js";
import { addAccessCode, call, countRows, deliver, get, makeDeps, post, resetDb, sessionIdFrom } from "./helpers.js";

const deps = makeDeps();
const { db } = deps;

async function seedSite() {
  await upsertCamps(db, CampsFile.parse(JSON.parse(readFileSync("data/camps.json", "utf8"))));
  await upsertMiami(db, MiamiFile.parse(JSON.parse(readFileSync("data/miami.json", "utf8"))));
}

/** Miami in its private-school window: open now, public phase later, one test code. */
async function miamiCodeWindow() {
  await db`update public.miami_event set opens_at = now() - interval '1 day', public_opens_at = now() + interval '10 days', reserved_total = 0`;
  await addAccessCode(db, "TEST-CODE-123");
}

const siteCall = (req: Request) => call(deps, site, req);

const campForm = {
  campId: "arlington_catholic_2027",
  session: "summer",
  playerName: "Alex Rivera",
  parentName: "Jamie Rivera",
  playerAge: "10",
  parentEmail: "jamie.rivera@example.test",
  town: "Brookline",
};

const miamiForm = {
  campId: "miami_combine_2027",
  session: "girls",
  accessCode: "TEST-CODE-123",
  playerName: "Taylor Ann Brooks",
  playerEmail: "taylor@example.test",
  playerAge: "16",
  heightFt: "5",
  heightIn: "6",
  weight: "130",
  gradYear: "2028",
  position: "Winger",
  club: "Test FC",
  clothingSize: "Adult S",
  parentName: "Morgan Brooks",
  parentEmail: "morgan@example.test",
  parentPhone: "(305) 555-0142",
  address1: "1 Test Street",
  address2: "",
  city: "Miami",
  state: "fl",
  zip: "33184",
};

async function pay(url: string) {
  const sessionId = sessionIdFrom(url);
  const res = await deliver(deps, deps.payments.complete(sessionId));
  expect(res.status).toBe(200);
  return sessionId;
}

beforeEach(async () => {
  await resetDb(db);
  await seedSite();
  deps.mailer.sent.length = 0;
});

describe("site adapter: camp checkout", () => {
  it("takes the site's camp form as-is and lands a registration with Stripe's phone", async () => {
    const res = await siteCall(post("/api/site/checkout", campForm));
    expect(res.status).toBe(200);
    const { url } = (await res.json()) as { url: string };
    const sessionId = sessionIdFrom(url);
    const mock = deps.payments.sessions.get(sessionId)!;
    expect(mock.amountTotal).toBe(50000);
    expect(mock.input).toMatchObject({ collectPhone: true, allowPromotionCodes: true, customerEmail: "jamie.rivera@example.test" });
    expect(mock.input.cancelUrl).toBe("https://footyupp.test/cancel?camp=summerCamp%2Farlington-catholic");

    await pay(url);
    const [reg] = await db`
      select r.player_name, r.player_age, r.parent_name, r.parent_phone, r.parent_town, s.slug as session, c.slug as camp
        from public.registrations r join public.sessions s on s.id = r.session_id join public.camps c on c.id = r.camp_id`;
    expect(reg).toMatchObject({
      player_name: "Alex Rivera", player_age: 10, parent_name: "Jamie Rivera", parent_phone: "+16175550199",
      parent_town: "Brookline", session: "summer", camp: "arlington_catholic_2027",
    });
  });

  it("sells Watertown's \"both\" option as two registrations in one payment", async () => {
    const res = await siteCall(post("/api/site/checkout", { ...campForm, campId: "watertown_2027", session: "both" }));
    const { url } = (await res.json()) as { url: string };
    expect(deps.payments.sessions.get(sessionIdFrom(url))!.amountTotal).toBe(83000);
    await pay(url);
    const regs = await db`select s.slug from public.registrations r join public.sessions s on s.id = r.session_id order by r.line_no`;
    expect(regs.map((r) => r.slug)).toEqual(["week1", "week2"]);
  });

  it("answers in the site's { error } shape for bad sessions, ages, info-only camps and missing fields", async () => {
    const bad = async (body: Record<string, unknown>) => {
      const res = await siteCall(post("/api/site/checkout", body));
      expect(res.status).toBe(400);
      return ((await res.json()) as { error: string }).error;
    };
    expect(await bad({ ...campForm, session: "nope" })).toBe("Please choose a camp session.");
    expect(await bad({ ...campForm, campId: "unknown_camp" })).toBe("Please choose a camp session.");
    expect(await bad({ ...campForm, playerAge: "15" })).toBe("This session is for ages 6–13.");
    expect(await bad({ ...campForm, campId: "bbn_2027", session: "full" })).toBe("This camp registers through the host school.");
    expect(await bad({ ...campForm, town: "" })).toBe("Please fill in your town.");
  });

  it("closes a camp at its closing time", async () => {
    await db`update public.sessions set closes_at = now() - interval '1 minute' where slug = 'full' and camp_id = (select id from public.camps where slug = 'veterans_canton_2026')`;
    const res = await siteCall(post("/api/site/checkout", { ...campForm, campId: "veterans_canton_2026", session: "full" }));
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ code: "session_closed" });
    const access = await (await siteCall(get("/api/site/camp-access?campId=veterans_canton_2026"))).json();
    expect(access).toMatchObject({ open: false, closed: true, gated: false });
  });
});

describe("site adapter: the fields the forms now ask for", () => {
  it("camp form: the parent's phone, promo code, news opt-in and waiver go straight in; Stripe asks for nothing extra", async () => {
    await db`insert into public.promo_codes (code, kind, amount, scope) values ('SAVE10', 'percent', 10, 'all')`;
    const [w] = await db`insert into public.waivers (flow, version, title, body, active) values ('camp', 1, 'Camp waiver', 'Waiver text for the test.', true) returning id`;
    const res = await siteCall(post("/api/site/checkout", {
      ...campForm, parentPhone: "(617) 555-0142", promoCode: "save10", marketingOptIn: true, waiverId: w!.id, waiverAccepted: true,
    }));
    expect(res.status).toBe(200);
    const { url } = (await res.json()) as { url: string };
    const mock = deps.payments.sessions.get(sessionIdFrom(url))!;
    expect(mock.amountTotal).toBe(45000);
    expect(mock.input).toMatchObject({ collectPhone: false, allowPromotionCodes: false });
    await pay(url);
    const [reg] = await db`select parent_phone, waiver_status, waiver_accepted_name from public.registrations`;
    expect(reg).toMatchObject({ parent_phone: "(617) 555-0142", waiver_status: "accepted", waiver_accepted_name: "Jamie Rivera" });
    const [contact] = await db`select consent from public.contacts where email = 'jamie.rivera@example.test'`;
    expect(contact!.consent).toBe("granted");
    const [payment] = await db`select promo_code from public.payments`;
    expect(payment!.promo_code).toBe("SAVE10");
  });

  it("Miami form: separate first and last names, emergency phone and short size, so Stripe asks for nothing extra", async () => {
    await miamiCodeWindow();
    const { playerName, parentName, ...rest } = miamiForm;
    const res = await siteCall(post("/api/site/checkout", {
      ...rest, playerFirstName: "Taylor Ann", playerLastName: "Brooks", parentFirstName: "Morgan", parentLastName: "Brooks",
      emergencyPhone: "305-555-0188", shortSize: "Adult M",
    }));
    expect(res.status).toBe(200);
    const { url } = (await res.json()) as { url: string };
    expect(deps.payments.sessions.get(sessionIdFrom(url))!.input.customFields ?? []).toHaveLength(0);
    await pay(url);
    const [reg] = await db`select player_first_name, player_last_name, parent_first_name, emergency_phone, short_size from public.registrations`;
    expect(reg).toMatchObject({ player_first_name: "Taylor Ann", player_last_name: "Brooks", parent_first_name: "Morgan", emergency_phone: "305-555-0188", short_size: "Adult M" });
  });

  it("Miami form: checks the grad year and short size against the dashboard's lists", async () => {
    await miamiCodeWindow();
    let res = await siteCall(post("/api/site/checkout", { ...miamiForm, gradYear: "1999" }));
    expect(((await res.json()) as { error: string }).error).toBe("Please choose a graduation year.");
    res = await siteCall(post("/api/site/checkout", { ...miamiForm, shortSize: "Huge" }));
    expect(res.status).toBe(400);
  });

  it("the catalog tells the forms which waiver to show, whether a promo box is useful, and the option lists", async () => {
    let body = (await (await siteCall(get("/api/site/catalog"))).json()) as any;
    expect(body.forms).toMatchObject({ camp: { waiver: null, waiverRequired: false, promoCodes: false }, miami: { promoCodes: false } });
    expect(body.miami.options.gradYears).toEqual(["2027", "2028", "2029", "2030", "2031", "2032"]);
    await db`insert into public.promo_codes (code, kind, amount, scope) values ('MIAMI5', 'amount', 500, 'miami')`;
    await db`insert into public.waivers (flow, version, title, body, active) values ('all', 1, 'Waiver', 'Waiver text for the test.', true)`;
    await db`insert into public.settings (key, value) values ('camp_waiver_required', 'true')`;
    body = (await (await siteCall(get("/api/site/catalog"))).json()) as any;
    expect(body.forms.camp).toMatchObject({ waiverRequired: true, promoCodes: false, waiver: { title: "Waiver" } });
    expect(body.forms.miami).toMatchObject({ waiverRequired: false, promoCodes: true });
    expect(body.camps.veterans_canton_2026.sessions.full.closesAt).toBe("2026-11-11T14:00:00.000Z");
  });
});

describe("site adapter: Miami", () => {
  it("maps the site's combine form, gates on the access code and asks Stripe for the missing fields", async () => {
    await miamiCodeWindow();
    let res = await siteCall(post("/api/site/checkout", { ...miamiForm, accessCode: "WRONG" }));
    expect(res.status).toBe(403);

    res = await siteCall(post("/api/site/checkout", miamiForm));
    expect(res.status).toBe(200);
    const { url } = (await res.json()) as { url: string };
    const mock = deps.payments.sessions.get(sessionIdFrom(url))!;
    expect(mock.amountTotal).toBe(150000);
    expect(mock.input.cancelUrl).toBe("https://footyupp.test/cancel?camp=miami");
    expect(mock.input.customFields!.map((f) => f.key)).toEqual(["emergency_phone", "short_size"]);

    await pay(url);
    const [reg] = await db`
      select player_first_name, player_last_name, player_sex, player_height_in, miami_group, via_access_code,
             emergency_phone, short_size, shirt_size, parent_first_name, parent_last_name, ship_state, extra
        from public.registrations`;
    expect(reg).toMatchObject({
      player_first_name: "Taylor Ann", player_last_name: "Brooks", player_sex: "girl", player_height_in: 66,
      miami_group: "girls", via_access_code: true, emergency_phone: "617-555-0123", short_size: "Adult XS",
      shirt_size: "Adult S", parent_first_name: "Morgan", parent_last_name: "Brooks", ship_state: "FL",
    });
    expect(reg!.extra).toMatchObject({ gradYear: "2028" });
  });

  it("enforces the combine's age range", async () => {
    await miamiCodeWindow();
    const res = await siteCall(post("/api/site/checkout", { ...miamiForm, playerAge: "12" }));
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe("The girls combine is for ages 14–18.");
  });

  it("camp-access reports the gate and checks the code like the site's old endpoint", async () => {
    const before = await (await siteCall(get("/api/site/camp-access?campId=miami_combine_2027"))).json();
    expect(before).toMatchObject({ open: false, closed: false });

    await miamiCodeWindow();
    const status = await (await siteCall(get("/api/site/camp-access?campId=miami_combine_2027"))).json();
    expect(status).toMatchObject({ open: true, gated: true });

    const wrong = await siteCall(post("/api/site/camp-access", { campId: "miami_combine_2027", code: "NOPE" }));
    expect(wrong.status).toBe(403);
    const right = await siteCall(post("/api/site/camp-access", { campId: "miami_combine_2027", code: "test-code-123" }));
    expect(await right.json()).toMatchObject({ ok: true, gated: true });
  });
});

describe("site adapter: private training", () => {
  it("saves inquiries, adds the contact and notifies the admin", async () => {
    const res = await siteCall(post("/api/site/inquiry", {
      name: "Pat Lee", email: "pat@example.test", phone: "617-555-0101", players: "2", bundle: "Group of 2 — 5 Sessions", ages: "9, 11", notes: "Weekends please",
    }));
    expect(await res.json()).toEqual({ success: true });
    const [row] = await db`select parent_name, players, bundle, player_ages, message from public.private_training_requests`;
    expect(row).toMatchObject({ parent_name: "Pat Lee", players: "2", bundle: "Group of 2 — 5 Sessions", player_ages: "9, 11", message: "Weekends please" });
    const [contact] = await db`select sources from public.contacts where email = 'pat@example.test'`;
    expect(contact!.sources).toEqual(["private_training"]);

    const bot = await siteCall(post("/api/site/inquiry", { name: "Bot", email: "bot@example.test", phone: "617-555-0102", website: "spam" }));
    expect(await bot.json()).toEqual({ success: true });
    expect(await countRows(db, "private_training_requests")).toBe(1);
  });

  it("records a bought package with the player Stripe collected", async () => {
    expect((await siteCall(post("/api/site/checkout-training", { packageId: "nope" }))).status).toBe(400);
    const res = await siteCall(post("/api/site/checkout-training", { packageId: "individual_5" }));
    const { url } = (await res.json()) as { url: string };
    expect(deps.payments.sessions.get(sessionIdFrom(url))!.amountTotal).toBe(55000);
    await pay(url);
    const [row] = await db`select package_id, package_name, email, phone, player_name, player_age, status from public.training_purchases`;
    expect(row).toMatchObject({
      package_id: "individual_5", package_name: "Individual — 5 Sessions (1 hr 30 min each)", email: "stripe-asked@example.test",
      phone: "+16175550199", player_name: "Mock Answer", player_age: "12", status: "new",
    });
  });
});

describe("site adapter: brief fields the site's forms didn't ask for", () => {
  const family = { parentName: "Robin Wait", email: "robin.wait@example.test", phone: "617-555-0131", town: "Newton", spots: "1" };

  it("private training: town and player names are saved, kept on the contact and in the coaches' email", async () => {
    await db`insert into public.settings (key, value) values ('notify_email', '"coaches@example.test"')`;
    const res = await siteCall(post("/api/site/inquiry", {
      name: "Pat Lee", email: "pat@example.test", phone: "617-555-0101", town: "Needham", playerNames: "Sam Lee, Jo Lee", players: "2", ages: "9, 11",
    }));
    expect(await res.json()).toEqual({ success: true });
    const [row] = await db`select town, player_name from public.private_training_requests`;
    expect(row).toMatchObject({ town: "Needham", player_name: "Sam Lee, Jo Lee" });
    const [contact] = await db`select town from public.contacts where email = 'pat@example.test'`;
    expect(contact!.town).toBe("Needham");
    expect(deps.mailer.sent.at(-1)!.text).toContain("Player name(s): Sam Lee, Jo Lee");
  });

  it("waitlist: a full session takes sign-ups, the offer link resolves to the site's ids, and the held spot checks out", async () => {
    await db`update public.sessions set capacity = 1 where slug = 'summer'`;
    await pay(((await (await siteCall(post("/api/site/checkout", { ...campForm, parentPhone: "617-555-0100" }))).json()) as { url: string }).url);
    const catalog = (await (await siteCall(get("/api/site/catalog"))).json()) as any;
    expect(catalog.camps.arlington_catholic_2027.sessions.summer.spotsLeft).toBe(0);

    expect((await siteCall(post("/api/site/waitlist", { ...family, campId: campForm.campId, session: "summer", town: "" }))).status).toBe(400);
    expect(await (await siteCall(post("/api/site/waitlist", { ...family, campId: campForm.campId, session: "summer" }))).json()).toEqual({ success: true });
    await siteCall(post("/api/site/waitlist", { ...family, email: "bot@example.test", campId: campForm.campId, session: "summer", website: "spam" }));
    expect(await countRows(db, "waitlist_entries")).toBe(1);
    const [contact] = await db`select town, sources from public.contacts where email = 'robin.wait@example.test'`;
    expect(contact).toMatchObject({ town: "Newton", sources: ["waitlist"] });

    await db`update public.sessions set capacity = 2 where slug = 'summer'`;
    const [session] = await db<{ id: string }[]>`select id from public.sessions where slug = 'summer'`;
    await offerNext(deps, { sessionId: session!.id });
    const link = deps.mailer.sent.at(-1)!.text.match(/https:\/\/footyupp\.test\/\?waitlist=([\w-]+)/);
    expect(link === null).toBe(false);
    const offer = (await (await siteCall(get(`/api/site/waitlist?token=${link![1]}`))).json()) as any;
    expect(offer).toMatchObject({ valid: true, campId: "arlington_catholic_2027", session: "summer", spots: 1, parent: { name: "Robin Wait", town: "Newton" } });

    // The held spot isn't free to anyone else, but the offer holder gets it.
    expect((await siteCall(post("/api/site/checkout", { ...campForm, parentEmail: "other@example.test" }))).status).toBe(409);
    const res = await siteCall(post("/api/site/checkout", { ...campForm, parentName: "Robin Wait", parentEmail: family.email, parentPhone: family.phone, waitlistToken: link![1] }));
    expect(res.status).toBe(200);
    await pay(((await res.json()) as { url: string }).url);
    const [entry] = await db`select status from public.waitlist_entries`;
    expect(entry!.status).toBe("converted");
    expect(await (await siteCall(get(`/api/site/waitlist?token=${link![1]}`))).json()).toEqual({ valid: false });
  });

  it("waitlist: Watertown's \"both\" waits on either week", async () => {
    await siteCall(post("/api/site/waitlist", { ...family, campId: "watertown_2027", session: "both" }));
    const rows = await db`select s.slug from public.waitlist_entries w join public.sessions s on s.id = w.session_id order by s.slug`;
    expect(rows.map((r) => r.slug)).toEqual(["week1", "week2"]);
  });

  it("waitlist: a Miami offer link checks out without the access code, and a made-up token still can't skip it", async () => {
    await miamiCodeWindow();
    await siteCall(post("/api/site/waitlist", { ...family, campId: "miami_combine_2027", session: "girls" }));
    const [entry] = await db`select miami_group, session_id from public.waitlist_entries`;
    expect(entry).toMatchObject({ miami_group: "girls", session_id: null });

    const { accessCode, ...noCode } = miamiForm;
    expect((await siteCall(post("/api/site/checkout", { ...noCode, waitlistToken: "made-up-token-123" }))).status).toBe(409);

    await offerNext(deps, { miamiGroup: "girls" });
    const token = deps.mailer.sent.at(-1)!.text.match(/waitlist=([\w-]+)/)![1]!;
    expect(((await (await siteCall(get(`/api/site/waitlist?token=${token}`))).json()) as any).session).toBe("girls");
    const res = await siteCall(post("/api/site/checkout", { ...noCode, waitlistToken: token }));
    expect(res.status).toBe(200);
  });
});

describe("site adapter: catalog", () => {
  it("publishes dashboard prices, spots and options in the site's ids", async () => {
    await db`update public.sessions set price_cents = 52500, capacity = 30 where slug = 'summer'`;
    const body = (await (await siteCall(get("/api/site/catalog"))).json()) as any;
    expect(body.camps.arlington_catholic_2027.sessions.summer).toMatchObject({ price: 525, spotsLeft: 30, minAge: 6, maxAge: 13, open: true });
    expect(body.camps.watertown_2027.sessions.both).toMatchObject({ price: 830 });
    expect(body.miami).toMatchObject({ id: "miami_combine_2027", price: 1500 });
    expect(body.miami.priceTiers).toHaveLength(2);
    expect(body.miami.options.positions).toContain("Winger");
    expect(body.trainingPackages.group2_7).toMatchObject({ price: 1000 });
  });
});

describe("payments from the site's original checkout (before the switch)", () => {
  const legacy = (id: string, amount: number, metadata: Record<string, string>) =>
    deps.payments.signedEvent("checkout.session.completed", {
      id, payment_status: "paid", amount_total: amount, amount_subtotal: amount, currency: "usd",
      payment_intent: `pi_${id}`, metadata, customer_details: { email: metadata.parent_email, phone: "+16175550111" },
    });

  it("turns old camp metadata into registrations, once", async () => {
    const event = legacy("cs_old_camp", 83000, {
      camp_id: "watertown_2027", session_id: "both", player_name: "Sam Rivera", player_age: "9",
      parent_name: "Jamie Rivera", parent_email: "jamie@example.test", town: "Watertown",
    });
    expect(await (await deliver(deps, event)).json()).toMatchObject({ result: "registered" });
    expect(await (await deliver(deps, event)).json()).toMatchObject({ result: "duplicate" });
    const replay = deps.payments.signedEvent("checkout.session.completed", JSON.parse(event.body).data.object, "backfill_cs_old_camp");
    expect(await (await deliver(deps, replay)).json()).toMatchObject({ result: "already_completed" });
    const regs = await db`select player_name, parent_phone, parent_town, price_cents from public.registrations order by line_no`;
    expect(regs.map((r) => r.price_cents)).toEqual([41500, 41500]);
    expect(regs[0]).toMatchObject({ player_name: "Sam Rivera", parent_phone: "+16175550111", parent_town: "Watertown" });
  });

  it("spreads a Stripe promotion code over the registrations so revenue by program adds up", async () => {
    const event = deps.payments.signedEvent("checkout.session.completed", {
      id: "cs_old_promo", payment_status: "paid", amount_subtotal: 83000, amount_total: 73000, total_details: { amount_discount: 10000 },
      currency: "usd", payment_intent: "pi_old_promo", customer_details: { email: "promo@example.test" },
      metadata: { camp_id: "watertown_2027", session_id: "both", player_name: "Pat Promo", player_age: "10", parent_name: "Lee Promo", parent_email: "promo@example.test", town: "Watertown" },
    });
    await deliver(deps, event);
    const regs = await db`select price_cents, discount_cents from public.registrations order by line_no`;
    expect(regs.map((r) => [r.price_cents, r.discount_cents])).toEqual([[36500, 5000], [36500, 5000]]);
    const [payment] = await db`select amount_total_cents, discount_cents from public.payments`;
    expect(payment).toMatchObject({ amount_total_cents: 73000, discount_cents: 10000 });
  });

  it("turns old combine metadata into a Miami registration", async () => {
    await deliver(deps, legacy("cs_old_miami", 150000, {
      camp_id: "miami_combine_2027", session_id: "boys", player_name: "Chris Day", player_age: "17", player_email: "chris@example.test",
      player_height: "5' 11\"", player_weight_lb: "160", position: "Striker", club: "Test FC", clothing_size: "Adult M",
      parent_name: "Robin Day", parent_email: "robin@example.test", parent_phone: "305-555-0100",
      address_line1: "2 Test Ave", address_city: "Miami", address_state: "FL", address_zip: "33184", access_code: "verified",
    }));
    const [reg] = await db`select miami_group, player_height_in, via_access_code, parent_phone from public.registrations`;
    expect(reg).toMatchObject({ miami_group: "boys", player_height_in: 71, via_access_code: true, parent_phone: "305-555-0100" });
  });

  it("records old training package purchases", async () => {
    const event = deps.payments.signedEvent("checkout.session.completed", {
      id: "cs_old_training", payment_status: "paid", amount_total: 64000, amount_subtotal: 64000, currency: "usd", payment_intent: "pi_old_training",
      metadata: { package_id: "individual_7", package_name: "Individual — 7 Sessions (1 hr 30 min each)" },
      customer_details: { email: "lee@example.test", name: "Lee Park", phone: "+16175550122" },
      custom_fields: [{ key: "player_name", type: "text", text: { value: "Jo Park" } }, { key: "player_age", type: "text", text: { value: "11" } }],
    });
    expect(await (await deliver(deps, event)).json()).toMatchObject({ result: "training_recorded" });
    const [row] = await db`select package_id, parent_name, player_name, player_age from public.training_purchases`;
    expect(row).toMatchObject({ package_id: "individual_7", parent_name: "Lee Park", player_name: "Jo Park", player_age: "11" });
  });
});
