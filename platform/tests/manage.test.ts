import { beforeEach, describe, it } from "node:test"
import { expect } from "./expect.js"
import { admin } from "../src/handlers/admin.js"
import { campCheckout } from "../src/handlers/camp-checkout.js"
import { miamiCheckout, miamiStatus } from "../src/handlers/miami.js"
import { joinWaitlist, waitlistOffer } from "../src/handlers/waitlist.js"
import { waitlistCron } from "../src/handlers/cleanup.js"
import { signDevToken } from "../src/lib/admin-auth.js"
import { call, deliver, get, makeDeps, miamiParent, miamiPlayer, neutralMiami, parent, post, resetDb, seed, sessionBySlug, sessionIdFrom, shipping } from "./helpers.js"

const deps = makeDeps()
const { db } = deps
let token: string
let week1: string
let week2: string

const adminCall = (view: string, body?: unknown) =>
  call(deps, admin, new Request(`https://footyupp.test/api/admin/${view}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }))
const adminJson = async (view: string, body?: unknown) => (await adminCall(view, body)).json() as Promise<any>

async function campPay(players: { name: string; age: number; sessionIds: string[] }[], extra: Record<string, unknown> = {}, email = "jamie@example.test") {
  const res = await call(deps, campCheckout, post("/api/checkout/camp", { parent: { ...parent, email }, players, ...extra }))
  const body = (await res.json()) as { checkoutUrl?: string; error?: string }
  if (!body.checkoutUrl) return { res, body }
  const id = sessionIdFrom(body.checkoutUrl)
  const amount = deps.payments.sessions.get(id)!.amountTotal
  await deliver(deps, deps.payments.complete(id))
  return { res, body, id, amount }
}

beforeEach(async () => {
  await resetDb(db)
  await seed(db)
  await neutralMiami(db)
  deps.mailer.sent.length = 0
  const [a] = await db`insert into auth.users (email) values ('alex@example.test') returning id`
  await db`insert into public.admin_users (user_id, email) values (${a!.id}, 'alex@example.test')`
  token = signDevToken(deps, { id: a!.id, email: "alex@example.test" }).token
  week1 = await sessionBySlug(db, "arlington-catholic", "week-of-july-12")
  week2 = await sessionBySlug(db, "arlington-catholic", "week-of-july-19")
})

const sessionBody = (overrides: Record<string, unknown> = {}) => ({
  id: week1, campId: "", name: "Week of July 12 (ages 6-13)", startsOn: "2027-07-12", endsOn: "2027-07-16", startTime: "09:00", location: "AC",
  ageMin: 6, ageMax: 13, priceCents: 50000, earlyBirdPriceCents: null, earlyBirdUntil: null, capacity: null, status: "open", infoText: null,
  reminderDays: [7, 1], sortOrder: 1, ...overrides,
})

describe("settings changes reach checkout immediately", () => {
  it("editing a session price changes the next Stripe checkout", async () => {
    const [s] = await db`select camp_id from public.sessions where id = ${week1}`
    expect((await adminCall("session-save", sessionBody({ campId: s!.camp_id, priceCents: 47500 }))).status).toBe(200)
    const { amount } = await campPay([{ name: "Alex Rivera", age: 10, sessionIds: [week1] }])
    expect(amount).toBe(47500)
  })

  it("creates a camp and a session from the dashboard, and closing a session stops checkout", async () => {
    const { id: campId } = await adminJson("camp-save", { name: "Dover Summer Camp", host: "Dover", kind: "summer", infoOnly: false, active: true, description: null, infoUrl: "", sortOrder: 4 })
    const { id: sessionId } = await adminJson("session-save", sessionBody({ id: undefined, campId, name: "Week 1", priceCents: 42500, capacity: 30 }))
    expect((await campPay([{ name: "Kid One", age: 9, sessionIds: [sessionId] }])).amount).toBe(42500)
    await adminJson("session-save", sessionBody({ id: sessionId, campId, name: "Week 1", priceCents: 42500, capacity: 30, status: "closed" }))
    expect((await campPay([{ name: "Kid Two", age: 9, sessionIds: [sessionId] }])).body).toMatchObject({ error: "session_closed" })
  })

  it("keeps the site's camp and session ids exactly as entered, and refuses duplicates", async () => {
    const camp = { name: "Dover Summer Camp", host: "Dover", kind: "summer", infoOnly: false, active: true, description: null, infoUrl: "", sortOrder: 4, slug: "dover_2027", siteRoute: "summerCamp/dover" }
    const { id: campId } = await adminJson("camp-save", camp)
    await adminJson("session-save", sessionBody({ id: undefined, campId, name: "Week 1", priceCents: 42500, slug: "week1" }))
    const [row] = await db`select c.slug as camp, c.site_route, s.slug as session from public.camps c join public.sessions s on s.camp_id = c.id where c.id = ${campId}`
    expect(row).toMatchObject({ camp: "dover_2027", site_route: "summerCamp/dover", session: "week1" })
    expect((await adminCall("camp-save", camp)).status).toBe(422)
    expect((await adminCall("camp-save", { ...camp, slug: "Dover 2027" })).status).toBe(400)
  })

  it("refuses a capacity below what's already taken", async () => {
    const [s] = await db`select camp_id from public.sessions where id = ${week1}`
    await campPay([{ name: "A B", age: 9, sessionIds: [week1] }, { name: "C D", age: 9, sessionIds: [week1] }])
    const res = await adminCall("session-save", sessionBody({ campId: s!.camp_id, capacity: 1 }))
    expect(res.status).toBe(422)
  })

  it("Miami caps, prices and an access code set in the dashboard take effect", async () => {
    const data = await adminJson("settings-data")
    const e = data.miami.event
    const groups = data.miami.groups.map((g: any) => ({
      grp: g.grp, label: g.label, cap: g.grp === "boys" ? 1 : 200, startsOn: g.starts_on, endsOn: g.ends_on, dailyStartTime: g.daily_start_time, dailyEndTime: g.daily_end_time,
      reservedForCodeHolders: 0, reservedUntil: null, priceCodeHolderCents: 160000, pricePublicCents: 160000, open: true,
    }))
    const event = { name: e.name, location: e.location, infoText: e.info_text, opensAt: null, publicOpensAt: null, closesAt: null, checkoutOpen: true, waiverRequired: false, reservedTotal: 0, reservedUntil: null, positions: [], shirtSizes: ["S", "M"], shortSizes: [] }
    expect((await adminCall("miami-save", { event, groups })).status).toBe(200)

    expect((await adminCall("access-code", { action: "add", code: "HostFamily2027", label: "Host families", group: null, endsAt: null })).status).toBe(200)
    const status = (await (await call(deps, miamiStatus, get("/api/miami"))).json()) as any
    expect(status).toMatchObject({ accessCodeRequired: true, options: { shirtSizes: ["S", "M"] } })
    expect(status.groups[0]).toMatchObject({ group: "boys", spotsLeft: 1, priceCents: 160000 })
    expect(JSON.stringify(await adminJson("settings-data"))).not.toContain("HostFamily2027")

    const buy = () => call(deps, miamiCheckout, post("/api/miami/checkout", { parent: miamiParent, shippingAddress: shipping, accessCode: "hostfamily2027", players: [miamiPlayer("boy")] }))
    const first = await buy()
    expect(first.status).toBe(200)
    expect((await buy()).status).toBe(409)

    const [code] = (await adminJson("settings-data")).codes
    await adminJson("access-code", { action: "update", id: code.id, active: false, endsAt: null })
    expect(((await (await call(deps, miamiStatus, get("/api/miami"))).json()) as any).accessCodeRequired).toBe(false)
  })

  it("publishing a waiver from the dashboard makes it required at checkout", async () => {
    await adminJson("waiver-publish", { flow: "camp", title: "Participant waiver", body: "I agree to the Footy Up participation terms and release.", url: "" })
    await adminJson("waiver-required", { camp: true, miami: false })
    const { body } = await campPay([{ name: "A B", age: 9, sessionIds: [week1] }])
    expect(body).toMatchObject({ error: "waiver_required" })
  })
})

describe("discounts (D10, acceptance #14)", () => {
  it("the sibling discount applies to the second child and is recorded", async () => {
    await adminJson("pricing-settings", { sibling_discount: { kind: "percent", amount: 10, applies: "camps" }, waitlist_hold_hours: 48 })
    const { amount } = await campPay([{ name: "Alex Rivera", age: 10, sessionIds: [week1] }, { name: "Sam Rivera", age: 8, sessionIds: [week1] }])
    expect(amount).toBe(50000 + 45000)
    const regs = await db`select player_name, price_cents, discount_cents from public.registrations order by line_no`
    expect(regs).toEqual([
      { player_name: "Alex Rivera", price_cents: 50000, discount_cents: 0 },
      { player_name: "Sam Rivera", price_cents: 45000, discount_cents: 5000 },
    ])
    const [p] = await db`select sibling_discount_cents, discount_cents, amount_subtotal_cents from public.payments`
    expect(p).toEqual({ sibling_discount_cents: 5000, discount_cents: 5000, amount_subtotal_cents: 100000 })
  })

  it("a valid promo code reduces the price and is recorded; expired and over-used codes are rejected", async () => {
    await adminJson("promo-save", { code: "summer25", description: "Early families", kind: "amount", amount: 2500, scope: "session", campId: null, sessionId: week1, maxUses: 1, perCustomerLimit: null, startsAt: null, endsAt: null, active: true })
    const first = await campPay([{ name: "A B", age: 9, sessionIds: [week1, week2] }], { promoCode: " Summer25 " })
    expect(first.amount).toBe(47500 + 75000)
    const [p] = await db`select promo_code, promo_discount_cents from public.payments`
    expect(p).toEqual({ promo_code: "SUMMER25", promo_discount_cents: 2500 })

    expect((await campPay([{ name: "C D", age: 9, sessionIds: [week1] }], { promoCode: "SUMMER25" }, "other@example.test")).body).toMatchObject({ error: "promo_invalid", message: "That promo code has been fully used." })

    await adminJson("promo-save", { code: "OLD10", description: null, kind: "percent", amount: 10, scope: "all", campId: null, sessionId: null, maxUses: null, perCustomerLimit: null, startsAt: null, endsAt: new Date(Date.now() - 60_000).toISOString(), active: true })
    expect((await campPay([{ name: "E F", age: 9, sessionIds: [week1] }], { promoCode: "OLD10" })).body).toMatchObject({ error: "promo_invalid", message: "That promo code has expired." })
    expect((await campPay([{ name: "E F", age: 9, sessionIds: [week1] }], { promoCode: "NOPE" })).body).toMatchObject({ error: "promo_invalid" })
  })

  it("enforces per-family limits and scope", async () => {
    await adminJson("promo-save", { code: "MIAMI10", description: null, kind: "percent", amount: 10, scope: "miami", campId: null, sessionId: null, maxUses: null, perCustomerLimit: 1, startsAt: null, endsAt: null, active: true })
    expect((await campPay([{ name: "A B", age: 9, sessionIds: [week1] }], { promoCode: "MIAMI10" })).body).toMatchObject({ message: "That promo code doesn't apply to what you selected." })
    const miami = () => call(deps, miamiCheckout, post("/api/miami/checkout", { parent: miamiParent, shippingAddress: shipping, promoCode: "MIAMI10", players: [miamiPlayer("girl")] }))
    const ok = await miami()
    const id = sessionIdFrom(((await ok.json()) as { checkoutUrl: string }).checkoutUrl)
    expect(deps.payments.sessions.get(id)!.amountTotal).toBe(117000)
    await deliver(deps, deps.payments.complete(id))
    expect(await (await miami()).json()).toMatchObject({ message: "You've already used that promo code." })
  })
})

describe("waitlists (D9, acceptance #13)", () => {
  const family = (n: number) => ({ parentName: `Wait Family${n}`, email: `wait${n}@example.test`, phone: "617-555-0100", town: "Newton" })

  it("a freed spot is offered to the first family, held, and claimable with the link; an unused hold passes on", async () => {
    await db`update public.sessions set capacity = 1 where id = ${week1}`
    const paid = await campPay([{ name: "First Kid", age: 9, sessionIds: [week1] }])
    expect((await campPay([{ name: "Late Kid", age: 9, sessionIds: [week1] }])).body).toMatchObject({ error: "session_full" })
    await call(deps, joinWaitlist, post("/api/waitlist", { ...family(1), sessionId: week1 }))
    await call(deps, joinWaitlist, post("/api/waitlist", { ...family(2), sessionId: week1 }))

    await deliver(deps, deps.payments.refund(paid.id!, 50000))
    const offerMail = deps.mailer.sent.find((m) => m.subject.startsWith("A spot opened up"))!
    expect(offerMail.to).toBe("wait1@example.test")
    const tokenValue = offerMail.text.match(/waitlist=([\w-]+)/)![1]!

    expect((await campPay([{ name: "Someone Else", age: 9, sessionIds: [week1] }], {}, "x@example.test")).body).toMatchObject({ error: "session_full" })
    const offer = await (await call(deps, waitlistOffer, get(`/api/waitlist?token=${tokenValue}`))).json()
    expect(offer).toMatchObject({ valid: true, sessionId: week1, spots: 1, parent: { email: "wait1@example.test" } })

    await db`update public.waitlist_entries set offer_expires_at = now() - interval '1 minute' where email = 'wait1@example.test'`
    await waitlistCron(new Request("https://footyupp.test/api/cron/waitlist"), deps)
    expect(deps.mailer.sent.filter((m) => m.subject.startsWith("A spot opened up")).map((m) => m.to)).toEqual(["wait1@example.test", "wait2@example.test"])
    expect(((await (await call(deps, waitlistOffer, get(`/api/waitlist?token=${tokenValue}`))).json()) as any).valid).toBe(false)

    const second = deps.mailer.sent.at(-1)!.text.match(/waitlist=([\w-]+)/)![1]!
    const claimed = await campPay([{ name: "Wait Kid", age: 9, sessionIds: [week1] }], { waitlistToken: second }, "wait2@example.test")
    expect(claimed.res.status).toBe(200)
    const [entry] = await db`select status from public.waitlist_entries where email = 'wait2@example.test'`
    expect(entry!.status).toBe("converted")
  })

  it("manual notify-next and remove from the dashboard", async () => {
    await db`update public.sessions set capacity = 2 where id = ${week1}`
    await campPay([{ name: "A B", age: 9, sessionIds: [week1] }])
    await call(deps, joinWaitlist, post("/api/waitlist", { ...family(3), sessionId: week1 }))
    expect(await adminJson("waitlist-notify", { sessionId: week1 })).toMatchObject({ ok: true, notified: "wait3@example.test" })
    expect((await adminCall("waitlist-notify", { sessionId: week1 })).status).toBe(409)

    await call(deps, joinWaitlist, post("/api/waitlist", { ...family(4), sessionId: week1 }))
    const { waitlist } = await adminJson("waitlist")
    await adminJson("waitlist-remove", { id: waitlist.find((w: any) => w.email === "wait3@example.test").id })
    // Removing wait3 releases their held spot, which goes straight to the next family.
    expect(deps.mailer.sent.filter((m) => m.subject.startsWith("A spot opened up")).map((m) => m.to)).toEqual(["wait3@example.test", "wait4@example.test"])
  })
})

describe("analytics, revenue and rosters (D11, D12, D14; acceptance #15, #17)", () => {
  beforeEach(async () => {
    await campPay([{ name: "Alex Rivera", age: 10, sessionIds: [week1, week2] }])
    const refunded = await campPay([{ name: "Zoe Adams", age: 9, sessionIds: [week1] }], {}, "zoe@example.test")
    await deliver(deps, deps.payments.refund(refunded.id!, 20000))
    const miami = await call(deps, miamiCheckout, post("/api/miami/checkout", { parent: miamiParent, shippingAddress: shipping, players: [miamiPlayer("boy")] }))
    await deliver(deps, deps.payments.complete(sessionIdFrom(((await miami.json()) as { checkoutUrl: string }).checkoutUrl)))
  })

  it("analytics totals match the registrations table", async () => {
    const a = await adminJson("analytics")
    const [{ n }] = (await db`select count(*)::int as n from public.registrations r join public.payments p on p.id = r.payment_id where r.status = 'active' and p.status <> 'refunded'`) as any
    expect(a.totals.registrations).toBe(n)
    expect(a.byProgram.reduce((s: number, r: any) => s + r.registrations, 0)).toBe(n)
    expect(a.byTown.reduce((s: number, r: any) => s + r.registrations, 0)).toBe(n)
    expect(a.daily.reduce((s: number, r: any) => s + r.registrations, 0)).toBe(n)
    expect(a.miami.find((g: any) => g.grp === "boys").paid).toBe(1)
  })

  it("revenue reconciles: gross - discounts - refunds = net = collected - refunded, by program and in total", async () => {
    const r = await adminJson("revenue")
    expect(r.totals).toMatchObject({ gross_cents: 50000 + 75000 + 50000 + 130000, refund_cents: 20000, collected_cents: 305000, net_cents: 285000, payments: 3, refunded_payments: 1 })
    const sum = (k: string) => r.byProgram.reduce((s: number, x: any) => s + x[k], 0)
    expect(sum("net_cents")).toBe(r.totals.net_cents)
    expect(sum("refund_cents")).toBe(20000)
    expect(r.byProgram.find((x: any) => x.program.includes("July 12")).refund_cents).toBe(20000)
    expect(r.payments.find((p: any) => p.customer_email === "zoe@example.test")).toMatchObject({ status: "partially_refunded", refunded_cents: 20000 })
  })

  it("rosters are sorted by last name and never include height, weight or address", async () => {
    const list = await adminJson("rosters")
    expect(list.sessions.find((s: any) => s.id === week1)).toMatchObject({ players: 2, waivers_missing: 2, age_min: 6, age_max: 13 })
    const roster = await adminJson(`roster?session=${week1}`)
    expect(roster.players.map((p: any) => p.player_name)).toEqual(["Zoe Adams", "Alex Rivera"])
    const text = JSON.stringify(await adminJson("roster?group=boys"))
    expect(text).not.toContain("height")
    expect(text).not.toContain("weight")
    expect(text).not.toContain("Test Street")
  })

  it("cancelling a registration frees its spot and shows in revenue", async () => {
    const [reg] = await db`select id from public.registrations where player_name = 'Zoe Adams'`
    await adminJson("registration-cancel", { id: reg!.id, cancel: true, reason: "Family moved" })
    const r = await adminJson("revenue")
    expect(r.cancellations).toMatchObject([{ player_name: "Zoe Adams", cancel_reason: "Family moved" }])
    expect((await adminJson(`roster?session=${week1}`)).players.map((p: any) => p.player_name)).toEqual(["Alex Rivera"])
  })
})
