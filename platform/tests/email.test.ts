import { beforeEach, describe, it } from "node:test"
import { crc32 } from "node:zlib"
import { expect } from "./expect.js"
import { admin } from "../src/handlers/admin.js"
import { campCheckout } from "../src/handlers/camp-checkout.js"
import { emailPublic } from "../src/handlers/email-public.js"
import { emailsCron } from "../src/handlers/cleanup.js"
import { miamiCheckout } from "../src/handlers/miami.js"
import { signDevToken } from "../src/lib/admin-auth.js"
import { renderCampaign, renderConfirmation } from "../src/email/templates.js"
import { call, deliver, makeDeps, miamiParent, miamiPlayer, neutralMiami, parent, post, resetDb, seed, sessionBySlug, sessionIdFrom, shipping } from "./helpers.js"

const deps = makeDeps()
const { db } = deps
deps.env.brevoWebhookSecret = "test-webhook-secret"
let token: string

const adminCall = (view: string, body?: unknown) =>
  call(
    deps,
    admin,
    new Request(`https://footyupp.test/api/admin/${view}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  )
const adminJson = async (view: string, body?: unknown) => (await adminCall(view, body)).json() as Promise<any>

const publicCall = (path: string, init: RequestInit = {}) => call(deps, emailPublic, new Request(`https://footyupp.test${path}`, init))

/** Smallest valid .docx-like zip: one stored entry, word/document.xml. */
function docx(paragraphs: string[]): Buffer {
  const xml = Buffer.from(`<?xml version="1.0"?><w:document xmlns:w="w"><w:body>${paragraphs.map((p) => `<w:p><w:r><w:t>${p}</w:t></w:r></w:p>`).join("")}</w:body></w:document>`)
  const name = Buffer.from("word/document.xml")
  const crc = crc32(xml)
  const local = Buffer.alloc(30)
  local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt32LE(crc, 14)
  local.writeUInt32LE(xml.length, 18); local.writeUInt32LE(xml.length, 22); local.writeUInt16LE(name.length, 26)
  const central = Buffer.alloc(46)
  central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt32LE(crc, 16)
  central.writeUInt32LE(xml.length, 20); central.writeUInt32LE(xml.length, 24); central.writeUInt16LE(name.length, 28)
  const cdOffset = local.length + name.length + xml.length
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(1, 8); end.writeUInt16LE(1, 10)
  end.writeUInt32LE(central.length + name.length, 12); end.writeUInt32LE(cdOffset, 16)
  return Buffer.concat([local, name, xml, central, name, end])
}

async function registerCamp(email: string, town: string, slug = "week-of-july-12", optIn = true) {
  const session = await sessionBySlug(db, "arlington-catholic", slug)
  const res = await call(deps, campCheckout, post("/api/checkout/camp", { parent: { ...parent, email, town }, players: [{ name: "Kid " + email, age: 10, sessionIds: [session] }], marketingOptIn: optIn }))
  const sessionId = sessionIdFrom(((await res.json()) as { checkoutUrl: string }).checkoutUrl)
  await deliver(deps, deps.payments.complete(sessionId))
  return sessionId
}

const draft = { subject: "Summer camp spots are open, {{first_name}}", body: "Hi {{first_name}},\n\nRegistration is open.\n\n- Week of July 12\n- Week of July 19\n\nhttps://www.footyup.net" }

beforeEach(async () => {
  await resetDb(db)
  await seed(db)
  await neutralMiami(db)
  deps.email.sends.length = 0
  deps.email.blocked.clear()
  deps.mailer.sent.length = 0
  const [a] = await db`insert into auth.users (email) values ('alex@example.test') returning id`
  await db`insert into public.admin_users (user_id, email) values (${a!.id}, 'alex@example.test')`
  token = signDevToken(deps, { id: a!.id, email: "alex@example.test" }).token
  await db`insert into public.settings (key, value) values ('mailing_address', '"Footy Up, 1 Example St, Arlington, MA 02474"')`
})

describe("contact import (D6, acceptance #9)", () => {
  const csv = "Name,Email,Town\nAnn Lee, ANN@Example.test ,Newton\nBo Park,bo@example.test,Belmont\nAnn again,ann@example.test,\nBad Row,not-an-email,Arlington\n"

  it("previews without writing, then imports with correct counts", async () => {
    const preview = await adminJson("contacts-import", { filename: "list.csv", text: csv, dryRun: true })
    expect(preview).toMatchObject({ dryRun: true, found: 3, imported: 2, merged: 0, duplicates: 1, rejected: [{ value: "not-an-email", reason: "Not a valid email address" }] })
    expect((await db`select count(*)::int as n from public.contacts`)[0]!.n).toBe(0)

    const run = await adminJson("contacts-import", { filename: "list.csv", text: csv, dryRun: false })
    expect(run).toMatchObject({ dryRun: false, imported: 2, merged: 0, duplicates: 1 })
    const rows = await db`select email, name, town, sources, consent from public.contacts order by email`
    expect(rows).toEqual([
      { email: "ann@example.test", name: "Ann Lee", town: "Newton", sources: ["imported"], consent: "unknown" },
      { email: "bo@example.test", name: "Bo Park", town: "Belmont", sources: ["imported"], consent: "unknown" },
    ])
  })

  it("re-running the same import creates no duplicates and merges with registrants", async () => {
    await registerCamp("bo@example.test", "Belmont")
    await adminJson("contacts-import", { filename: "list.csv", text: csv, dryRun: false })
    const again = await adminJson("contacts-import", { filename: "list.csv", text: csv, dryRun: false })
    expect(again).toMatchObject({ imported: 0, merged: 2 })
    expect((await db`select count(*)::int as n from public.contacts`)[0]!.n).toBe(2)
    const [bo] = await db`select sources, consent from public.contacts where email = 'bo@example.test'`
    expect(bo).toEqual({ sources: ["registration", "imported"], consent: "granted" })
  })

  it("reads the client's Word document (.docx)", async () => {
    const file = docx(["Footy Up parents", "Maria Gomez - maria.gomez@example.test", "tom@example.test, Tom Reed", "Call Sam: 617-555-0100 (no email)"])
    const res = await adminJson("contacts-import", { filename: "Contacts.docx", data: file.toString("base64"), dryRun: false })
    expect(res).toMatchObject({ imported: 2, rejected: [] })
    const rows = await db`select email, name from public.contacts order by email`
    expect(rows).toEqual([{ email: "maria.gomez@example.test", name: "Maria Gomez" }, { email: "tom@example.test", name: "Tom Reed" }])
  })

  it("marks an import's contacts as consented once the client confirms how they agreed", async () => {
    const { importId } = await adminJson("contacts-import", { filename: "list.csv", text: csv, dryRun: false })
    expect(await adminJson("contacts-consent", { importId, consent: "granted" })).toEqual({ updated: 2 })
    expect((await db`select count(*)::int as n from public.contacts where consent = 'granted'`)[0]!.n).toBe(2)
  })
})

describe("segmented sending (D7, acceptance #10)", () => {
  beforeEach(async () => {
    await registerCamp("brookline1@example.test", "Brookline")
    await registerCamp("brookline2@example.test", "Brookline", "week-of-july-19")
    await registerCamp("newton@example.test", "Newton")
    await registerCamp("noconsent@example.test", "Brookline", "week-of-july-12", false)
    await adminJson("contacts-import", { filename: "x.txt", text: "imported@example.test", dryRun: false })
  })

  it("counts recipients and explains exclusions", async () => {
    const week1 = await sessionBySlug(db, "arlington-catholic", "week-of-july-12")
    const res = await adminJson("email-audience", { programs: [`session:${week1}`], towns: ["brookline"] })
    expect(res).toMatchObject({ matched: 2, sendable: 1, excluded: { unknown: 1, unsubscribed: 0 } })
    const everyone = await adminJson("email-audience", {})
    expect(everyone).toMatchObject({ matched: 5, sendable: 3, excluded: { unknown: 2 } })
    expect((await adminJson("email-audience", { includeUnknownConsent: true })).sendable).toBe(5)
  })

  it("a campaign to a small segment reaches only that segment, with the unsubscribe link and mailing address", async () => {
    const [camp] = await db`select id from public.camps where slug = 'arlington-catholic'`
    const res = await adminJson("email-send", { requestId: crypto.randomUUID(), segment: { programs: [`camp:${camp!.id}`], towns: ["Brookline"] }, draft })
    expect(res).toMatchObject({ status: "sent", recipients: 2 })
    const send = deps.email.sends[0]!
    expect(send.messages.map((m) => m.to).sort()).toEqual(["brookline1@example.test", "brookline2@example.test"])
    const msg = send.messages[0]!
    expect(msg.subject).toBe("Summer camp spots are open, Jamie")
    expect(msg.html).toContain("/api/email/unsubscribe?e=")
    expect(msg.html).toContain("1 Example St, Arlington, MA 02474")
    expect(msg.html).toContain("<li")

    const [log] = await db`select status, recipient_count, excluded, sent_by_email, subject from public.email_log where kind = 'campaign'`
    expect(log).toMatchObject({ status: "sent", recipient_count: 2, excluded: { unknown: 1 }, sent_by_email: "alex@example.test" })
  })

  it("fills every personalisation tag per person, with fallbacks, and refuses unknown tags", async () => {
    const [session] = await db`select id from public.sessions where slug = 'week-of-july-12'`
    const personal = { subject: "{{first_name}} {{last_name}}, a note for {{full_name}}", body: "For {{kids}} at {{registered_for}} in {{town}}." }
    const res = await adminJson("email-send", { requestId: crypto.randomUUID(), segment: { programs: [`session:${session!.id}`], towns: ["Brookline"] }, draft: personal })
    expect(res).toMatchObject({ status: "sent", recipients: 1 })
    const msg = deps.email.sends[0]!.messages[0]!
    expect(msg.subject).toBe("Jamie Rivera, a note for Jamie Rivera")
    expect(msg.html).toContain("For Kid at Arlington Catholic Summer Camp – Week of July 12 (ages 6-13) in Brookline.")

    await adminJson("email-test", personal)
    expect(deps.email.sends[0]!.messages[0]!.html).toContain("For your player at Footy Up in your area.")

    const typo = await adminCall("email-send", { requestId: crypto.randomUUID(), segment: { towns: ["Brookline"] }, draft: { subject: "Hi", body: "Hi {{kid}}" } })
    expect(typo.status).toBe(400)
    expect(JSON.stringify(await typo.json())).toContain("{{kid}} isn't a personalisation tag")
  })

  it("a contact who unsubscribes through the link is skipped on the next send", async () => {
    await adminJson("email-send", { requestId: crypto.randomUUID(), segment: { towns: ["Brookline"] }, draft })
    const link = new URL(deps.email.sends[0]!.messages.find((m) => m.to === "brookline1@example.test")!.html.match(/href="([^"]*unsubscribe[^"]*)"/)![1]!.replaceAll("&amp;", "&"))
    const confirmPage = await publicCall(link.pathname + link.search)
    expect(await confirmPage.text()).toContain("Unsubscribe?")
    expect(await (await publicCall(link.pathname + link.search, { method: "POST" })).text()).toContain("You're unsubscribed")
    expect(deps.email.blocked.has("brookline1@example.test")).toBe(true)

    const second = await adminJson("email-send", { requestId: crypto.randomUUID(), segment: { towns: ["Brookline"] }, draft })
    expect(second).toMatchObject({ recipients: 1, excluded: { unsubscribed: 1 } })
    expect(deps.email.sends[0]!.messages.map((m) => m.to)).toEqual(["brookline2@example.test"])
  })

  it("rejects tampered unsubscribe links", async () => {
    const res = await publicCall(`/api/email/unsubscribe?e=${Buffer.from("x@example.test").toString("base64url")}&t=forged`, { method: "POST" })
    expect(await res.text()).toContain("Link not valid")
    expect((await db`select count(*)::int as n from public.contacts where unsubscribed`)[0]!.n).toBe(0)
  })

  it("test sends can go to a chosen address", async () => {
    expect(await adminJson("email-test", { subject: "Hi", body: "Test", to: " Coach@Example.test " })).toMatchObject({ ok: true, to: "coach@example.test" })
    expect(deps.email.sends[0]!.messages[0]!.to).toBe("coach@example.test")
    expect((await adminCall("email-test", { subject: "Hi", body: "Test", to: "not-an-email" })).status).toBe(400)
  })

  it("Connect points Brevo's webhooks at this deployment, and Reconnect follows a domain change", async () => {
    let setup = await adminJson("email-setup")
    expect(setup.webhook).toMatchObject({ connected: false })
    expect(await adminJson("email-webhook", {})).toMatchObject({ ok: true, webhook: { connected: true } })
    expect(deps.email.webhookUrl).toBe(`${deps.env.apiUrl}/api/email/brevo-webhook?token=test-webhook-secret`)
    setup = await adminJson("email-setup")
    expect(setup.webhook).toMatchObject({ connected: true, address: `${deps.env.apiUrl}/api/email/brevo-webhook` })
    expect(JSON.stringify(setup)).not.toContain("test-webhook-secret")

    const before = deps.env.apiUrl
    deps.env.apiUrl = "https://footyupp.example"
    try {
      expect((await adminJson("email-setup")).webhook).toMatchObject({ connected: false, types: [{ pointsAt: `${before}/api/email/brevo-webhook` }, {}] })
      expect(await adminJson("email-webhook", {})).toMatchObject({ webhook: { connected: true } })
      expect(deps.email.webhookUrl).toContain("https://footyupp.example/api/email/brevo-webhook")
    } finally {
      deps.env.apiUrl = before
      deps.email.webhookUrl = null
    }
  })

  it("Brevo webhooks sync unsubscribes and bounces back, and require the secret", async () => {
    const hook = (token: string, body: unknown) => publicCall(`/api/email/brevo-webhook?token=${token}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
    expect((await hook("wrong", { event: "unsubscribed", email: "newton@example.test" })).status).toBe(401)
    expect(await (await hook("test-webhook-secret", [{ event: "unsubscribed", email: "NEWTON@example.test" }, { event: "hard_bounce", email: "brookline2@example.test" }])).json()).toEqual({ ok: true, processed: 2 })
    const audience = await adminJson("email-audience", {})
    expect(audience).toMatchObject({ sendable: 1, excluded: { unsubscribed: 1, bounced: 1 } })
  })

  it("requires a mailing address, is idempotent per request, and sends tests only to the admin", async () => {
    const requestId = crypto.randomUUID()
    await db`delete from public.settings where key = 'mailing_address'`
    expect((await adminCall("email-send", { requestId, segment: {}, draft })).status).toBe(422)
    await db`insert into public.settings (key, value) values ('mailing_address', '"1 Example St, Arlington, MA"')`
    await adminJson("email-send", { requestId, segment: {}, draft })
    const dup = await adminJson("email-send", { requestId, segment: {}, draft })
    expect(dup.duplicate).toBe(true)
    expect(deps.email.sends.filter((s) => s.kind === "campaign")).toHaveLength(1)

    expect(await adminJson("email-test", draft)).toEqual({ ok: true, to: "alex@example.test" })
    expect(deps.email.sends[0]).toMatchObject({ kind: "test", messages: [{ to: "alex@example.test", subject: "[Test] Summer camp spots are open, there" }] })
  })

  it("refuses to send to an empty segment", async () => {
    const res = await adminCall("email-send", { requestId: crypto.randomUUID(), segment: { towns: ["Nowhere"] }, draft })
    expect(res.status).toBe(422)
  })

  it("email history and setup load for admins", async () => {
    await adminJson("email-send", { requestId: crypto.randomUUID(), segment: {}, draft })
    const history = await adminJson("email-history")
    expect(history.campaigns).toHaveLength(1)
    const setup = await adminJson("email-setup")
    expect(setup).toMatchObject({ mode: "mock", webhookConfigured: true, contacts: { total: 5 }, settings: { mailing_address: "Footy Up, 1 Example St, Arlington, MA 02474" } })
    await adminJson("email-settings", { reply_to_email: "hello@footyup.net", auto_reminders: false })
    expect((await adminJson("email-setup")).settings).toMatchObject({ reply_to_email: "hello@footyup.net", auto_reminders: false })
  })
})

describe("automatic parent emails (D8, acceptance #12)", () => {
  it("sends one confirmation right after payment, with the camp details, even if Stripe retries", async () => {
    await db`update public.sessions set location = 'Arlington Catholic Field', info_text = 'Drop-off at the main gate.' where slug = 'week-of-july-12'`
    const sessionId = await registerCamp("family@example.test", "Arlington")
    await deliver(deps, deps.payments.complete(sessionId))
    const confirmations = deps.mailer.sent.filter((m) => m.subject.startsWith("You're registered"))
    expect(confirmations).toHaveLength(1)
    const mail = confirmations[0]!
    expect(mail.to).toBe("family@example.test")
    expect(mail.subject).toBe("You're registered: Arlington Catholic Summer Camp – Week of July 12 (ages 6-13)")
    expect(mail.text).toContain("July 12 – July 16, 2027, 9:00 AM")
    expect(mail.text).toContain("Arlington Catholic Field")
    expect(mail.text).toContain("Drop-off at the main gate.")
    expect(await emailsCron(new Request("https://footyupp.test/api/cron/emails"), deps).then((r) => r.json())).toMatchObject({ confirmations: 0 })
  })

  it("Miami confirmations include the group's dates, times and shipping address", async () => {
    const res = await call(deps, miamiCheckout, post("/api/miami/checkout", { parent: miamiParent, shippingAddress: shipping, players: [miamiPlayer("girl")] }))
    await deliver(deps, deps.payments.complete(sessionIdFrom(((await res.json()) as { checkoutUrl: string }).checkoutUrl)))
    const mail = deps.mailer.sent.find((m) => m.subject.startsWith("You're registered"))!
    expect(mail.text).toContain("May 24 – May 26, 2027, 4:30 PM – 8:30 PM")
    expect(mail.text).toContain("package ships to: 1 Test Street, Apt 2, Brookline, MA 02445")
  })

  it("reminders send once on schedule and skip refunded registrations", async () => {
    await db`update public.sessions set starts_on = public.app_today() + 7, ends_on = public.app_today() + 11`
    await registerCamp("keep@example.test", "Newton")
    const refunded = await registerCamp("refund@example.test", "Newton")
    await deliver(deps, deps.payments.refund(refunded, 50000))
    deps.mailer.sent.length = 0

    const run = () => emailsCron(new Request("https://footyupp.test/api/cron/emails"), deps).then((r) => r.json() as Promise<{ reminders: number }>)
    expect((await run()).reminders).toBe(1)
    expect((await run()).reminders).toBe(0)
    const reminders = deps.mailer.sent.filter((m) => m.subject.startsWith("Reminder"))
    expect(reminders.map((m) => m.to)).toEqual(["keep@example.test"])
    expect(reminders[0]!.subject).toBe("Reminder: Arlington Catholic Summer Camp – Week of July 12 (ages 6-13) starts in 7 days")
  })

  it("can be switched off in settings", async () => {
    await db`insert into public.settings (key, value) values ('auto_confirmations', 'false')`
    await registerCamp("quiet@example.test", "Newton")
    expect(deps.mailer.sent.filter((m) => m.subject.startsWith("You're registered"))).toHaveLength(0)
  })
})

describe("templates (D15)", () => {
  it("render HTML and plain-text versions with footer details", () => {
    const c = renderCampaign({ subject: "Hello", body: "Line one **bold**\n\n- a\n- b", mailingAddress: "1 Example St", unsubscribeUrl: "https://x/unsub" })
    expect(c.html).toContain("<strong>bold</strong>")
    expect(c.html).toContain('href="https://x/unsub"')
    expect(c.text).toContain("Unsubscribe: https://x/unsub")
    expect(c.text).toContain("1 Example St")
    const conf = renderConfirmation({ parentFirstName: "Jamie", items: [{ player: "<Kid>", program: "Camp", dates: "July 12" }], replyTo: "hi@footyup.net" })
    expect(conf.html).toContain("&lt;Kid&gt;")
    expect(conf.text).toContain("hi@footyup.net")
  })
})
