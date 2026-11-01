import { describe, it } from "node:test"
import { expect } from "./expect.js"
import { createDeps } from "../src/lib/deps.js"
import { GuardedEmailProvider, GuardedMailer, recipientAllowList } from "../src/lib/email-guard.js"
import { MemoryMailer } from "../src/lib/email.js"
import { MockEmailProvider, type CampaignRecipient } from "../src/email/provider.js"
import { loadEnv } from "../src/lib/env.js"
import { testUrl } from "./db-url.js"

const content = { name: "n", subject: "Hi", html: "<p>Hi</p>", text: "Hi", sender: { email: "no-reply@footyup.net", name: "Footy Up" } }
const person = (email: string): CampaignRecipient => ({ email, firstName: null, lastName: null, town: null, sources: [], programs: [], kids: [] })

describe("test-recipient guard for a real Brevo key outside production", () => {
  it("matches exact addresses and @domains, case-insensitively", () => {
    const allowed = recipientAllowList(" Reed@Gmail.com, @footyup.net ")
    expect([allowed("reed@gmail.com"), allowed("coach@FootyUp.net"), allowed("jamie@example.test"), recipientAllowList(undefined)("a@b.c")]).toEqual([true, true, false, false])
  })

  it("skips automatic emails and refuses campaigns and tests to anyone else", async () => {
    const allowed = recipientAllowList("reed@gmail.com")
    const inner = new MemoryMailer()
    const mailer = new GuardedMailer(inner, allowed)
    expect(await mailer.send({ to: "jamie@example.test", subject: "s", text: "t" })).toBe("skipped")
    expect(await mailer.send({ to: "reed@gmail.com", subject: "s", text: "t" })).toBe("sent")
    expect(inner.sent.map((m) => m.to)).toEqual(["reed@gmail.com"])

    const provider = new MockEmailProvider(() => "https://x/unsub")
    const guarded = new GuardedEmailProvider(provider, allowed)
    await expect(guarded.sendCampaign(content, [person("reed@gmail.com"), person("jamie@example.test")])).rejects.toThrow(/1 of 2 recipients aren't on the test list/)
    await expect(guarded.sendTest(content, "reed@example.test")).rejects.toThrow(/isn't on the test list/)
    await guarded.sendCampaign(content, [person("reed@gmail.com")])
    expect(provider.sends[0]!.messages.map((m) => m.to)).toEqual(["reed@gmail.com"])
  })

  it("is on with a Brevo key in development and off in production", () => {
    const base = { DATABASE_URL: testUrl(), BREVO_API_KEY: "xkeysib-test-not-real", EMAIL_TEST_RECIPIENTS: "reed@gmail.com" }
    expect(createDeps(loadEnv(base), base).mailer instanceof GuardedMailer).toBe(true)
    const prod = { ...base, VERCEL_ENV: "production", STRIPE_SECRET_KEY: "sk_test_x", STRIPE_WEBHOOK_SECRET: "whsec_x", RATE_LIMIT_SALT: "s" }
    expect(createDeps(loadEnv(prod), prod).mailer instanceof GuardedMailer).toBe(false)
  })
})

describe("automatic emails the guard skips", () => {
  it("are logged as skipped, not sent", async () => {
    const { makeDeps, resetDb, seed, call, post, deliver, parent, sessionBySlug, sessionIdFrom } = await import("./helpers.js")
    const { campCheckout } = await import("../src/handlers/camp-checkout.js")
    const deps = makeDeps()
    Object.assign(deps, { mailer: new GuardedMailer(new MemoryMailer(), recipientAllowList("someone-else@example.test")) })
    await resetDb(deps.db)
    await seed(deps.db)
    const week1 = await sessionBySlug(deps.db, "arlington-catholic", "week-of-july-12")
    const res = await call(deps, campCheckout, post("/api/checkout/camp", { parent, players: [{ name: "A B", age: 9, sessionIds: [week1] }] }))
    const { checkoutUrl } = (await res.json()) as { checkoutUrl: string }
    await deliver(deps, deps.payments.complete(sessionIdFrom(checkoutUrl)))
    const [log] = await deps.db`select status from public.email_log where kind = 'confirmation'`
    expect(log).toMatchObject({ status: "skipped" })
  })
})

describe("FOOTYUP_STAGING", () => {
  it("keeps a Vercel production deployment in test mode until launch", () => {
    const base = { DATABASE_URL: testUrl(), VERCEL_ENV: "production", BREVO_API_KEY: "xkeysib-test-not-real", RATE_LIMIT_SALT: "s" }
    const staging = loadEnv({ ...base, FOOTYUP_STAGING: "true", PAYMENTS_MODE: "mock" })
    expect([staging.isProduction, staging.paymentsMode]).toEqual([false, "mock"])
    expect(createDeps(staging, { ...base, FOOTYUP_STAGING: "true" }).mailer instanceof GuardedMailer).toBe(true)
    let error = ""
    try {
      loadEnv({ ...base, PAYMENTS_MODE: "mock" })
    } catch (err) {
      error = (err as Error).message
    }
    expect(error).toContain("Mock payments are not allowed in production")
  })
})
