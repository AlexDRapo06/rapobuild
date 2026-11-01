import { readFileSync } from "node:fs"
import { beforeEach, describe, it } from "node:test"
import { expect } from "./expect.js"
import { CampsFile, MiamiFile, upsertCamps, upsertMiami } from "../src/admin/config.js"
import { site } from "../src/handlers/site.js"
import { testCheckout } from "../src/handlers/test-checkout.js"
import { StagingGateway } from "../src/lib/payments.js"
import { call, makeDeps, post, resetDb } from "./helpers.js"

const base = makeDeps()
const deps = { ...base, payments: new StagingGateway("https://platform.test", "test-secret") }
const { db } = deps

beforeEach(async () => {
  await resetDb(db)
  await upsertCamps(db, CampsFile.parse(JSON.parse(readFileSync("data/camps.json", "utf8"))))
  await upsertMiami(db, MiamiFile.parse(JSON.parse(readFileSync("data/miami.json", "utf8"))))
  base.mailer.sent.length = 0
})

const campForm = { campId: "rivier_2027", session: "full", playerName: "Alex Rivera", parentName: "Jamie Rivera", playerAge: "10", parentEmail: "jamie@example.test", town: "Nashua" }

async function start() {
  const res = await call(deps, site, post("/api/site/checkout", campForm))
  return new URL(((await res.json()) as { url: string }).url)
}
const open = (u: URL, init?: RequestInit) => call(deps, testCheckout, new Request(u, init))

describe("staging test checkout (no Stripe keys yet)", () => {
  it("shows the order, and paying saves the registration and sends the confirmation", async () => {
    const link = await start()
    expect(link.pathname).toBe("/api/test-checkout")
    const page = await (await open(link)).text()
    expect(page).toContain("$400.00")
    expect(page).toContain("Alex Rivera")

    const form = new FormData()
    form.set("action", "pay")
    form.set("phone", "617-555-0142")
    const paid = await open(link, { method: "POST", body: form })
    expect(paid.status).toBe(303)
    expect(paid.headers.get("location")!).toContain("/success?session_id=cs_test_staging_")

    const [reg] = await db`select player_name, parent_phone, status from public.registrations`
    expect(reg).toMatchObject({ player_name: "Alex Rivera", parent_phone: "617-555-0142", status: "active" })
    expect(base.mailer.sent.map((m) => m.to)).toEqual(["jamie@example.test"])
    expect((await open(link)).status).toBe(200)
    expect(await (await open(link)).text()).toContain("already completed")
  })

  it("cancel releases the held spot, and tampered links are refused", async () => {
    const link = await start()
    const form = new FormData()
    form.set("action", "cancel")
    expect((await open(link, { method: "POST", body: form })).headers.get("location")).toContain("/cancel?camp=")
    const [hold] = await db`select status from public.holds`
    expect(hold ?? { status: "released" }).toMatchObject({ status: "released" })

    const bad = new URL(link)
    bad.searchParams.set("ok", "https://evil.example/")
    expect((await open(bad)).status).toBe(400)
  })
})
