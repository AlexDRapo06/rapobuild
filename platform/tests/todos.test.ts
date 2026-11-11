import { readFileSync } from "node:fs"
import { beforeEach, describe, it } from "node:test"
import { expect } from "./expect.js"
import { CampsFile, MiamiFile, upsertCamps, upsertMiami } from "../src/admin/config.js"
import { admin } from "../src/handlers/admin.js"
import { site } from "../src/handlers/site.js"
import { signDevToken } from "../src/lib/admin-auth.js"
import { addAccessCode, call, makeDeps, post, resetDb, sessionIdFrom } from "./helpers.js"

const deps = makeDeps()
const { db } = deps
let token: string

const adminCall = (view: string, body?: unknown) =>
  call(deps, admin, new Request(`https://footyupp.test/api/admin/${view}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }))
type Todo = { key: string; done: boolean; confirmed: { by: string; option?: string } | null; options?: { id: string; current: boolean }[] }
const todos = async () => ((await (await adminCall("todos")).json()) as { todos: Todo[]; open: number; blockers: number })
const item = async (key: string) => (await todos()).todos.find((t) => t.key === key)!
const current = (t: Todo) => t.options?.find((o) => o.current)?.id

beforeEach(async () => {
  await resetDb(db)
  await upsertCamps(db, CampsFile.parse(JSON.parse(readFileSync("data/camps.json", "utf8"))))
  await upsertMiami(db, MiamiFile.parse(JSON.parse(readFileSync("data/miami.json", "utf8"))))
  const [a] = await db`insert into auth.users (email) values ('alex@example.test') returning id`
  await db`insert into public.admin_users (user_id, email) values (${a!.id}, 'alex@example.test')`
  token = signDevToken(deps, { id: a!.id, email: "alex@example.test" }).token
})

describe("Settings → To do", () => {
  it("lists where the live site and the Kickoff Form disagree, with the site's values in use", async () => {
    const list = await todos()
    expect(current(list.todos.find((t) => t.key === "watertown_price")!)).toBe("site")
    // The old Miami decisions would overwrite the Boston combine's settings.
    for (const key of ["miami_opening", "miami_price", "miami_caps", "miami_reserved", "miami_venue", "miami_on_site"]) {
      expect(list.todos.some((t) => t.key === key)).toBe(false)
    }
  })

  it("applying the Kickoff Form's answer changes what checkout charges, and confirming closes the item", async () => {
    expect((await adminCall("todo-apply", { key: "watertown_price", option: "kickoff" })).status).toBe(200)
    expect(current(await item("watertown_price"))).toBe("kickoff")
    const res = await call(deps, site, post("/api/site/checkout", {
      campId: "watertown_2027", session: "both", playerName: "Sam Rivera", playerAge: "9", parentName: "Jamie Rivera", parentEmail: "jamie@example.test", town: "Watertown",
    }))
    const { url } = (await res.json()) as { url: string }
    expect(deps.payments.sessions.get(sessionIdFrom(url))!.amountTotal).toBe(85000)

    expect((await adminCall("todo-apply", { key: "miami_price", option: "kickoff" })).status).toBe(404)

    const before = (await todos()).open
    expect((await adminCall("todo-confirm", { key: "watertown_price" })).status).toBe(200)
    expect((await item("watertown_price")).confirmed).toMatchObject({ by: "alex@example.test", option: "kickoff" })
    expect((await todos()).open).toBe(before - 1)
    await adminCall("todo-confirm", { key: "watertown_price", reopen: true })
    expect((await item("watertown_price")).confirmed).toBeNull()
  })

  it("setup checks clear themselves once fixed and can't just be ticked off", async () => {
    // The combine opens to everyone at once, so no access code is needed.
    expect((await todos()).todos.some((t) => t.key === "access_code")).toBe(false)
    await db`update public.miami_event set public_opens_at = opens_at + interval '7 days'`
    expect((await item("access_code")).done).toBe(false)
    expect((await adminCall("todo-confirm", { key: "access_code" })).status).toBe(422)
    await addAccessCode(db, "TEST-CODE-123")
    expect((await item("access_code")).done).toBe(true)

    expect((await item("mailing_address")).done).toBe(false)
    await db`insert into public.settings (key, value) values ('mailing_address', '"Footy Up, 1 Example St, Arlington, MA"')`
    expect((await item("mailing_address")).done).toBe(true)
    expect((await adminCall("todo-apply", { key: "miami_caps", option: "nope" })).status).toBe(404)
  })

  it("training packages are editable and drive the site's checkout", async () => {
    const res = await adminCall("training-packages-save", { packages: [{ id: "individual_5", name: "Individual — 5 Sessions", cents: 60000 }, { id: "group3_5", name: "Group of 3 — 5 Sessions", cents: 120000 }] })
    expect(res.status).toBe(200)
    const checkout = await call(deps, site, post("/api/site/checkout-training", { packageId: "group3_5" }))
    const { url } = (await checkout.json()) as { url: string }
    expect(deps.payments.sessions.get(sessionIdFrom(url))!.amountTotal).toBe(120000)
    expect((await adminCall("training-packages-save", { packages: [{ id: "a b", name: "Bad", cents: 100 }] })).status).toBe(400)
  })
})

describe("Settings → To do: mailing address", () => {
  it("stays open while the [TEST] placeholder is in use", async () => {
    expect((await item("mailing_address")).done).toBe(false)
    await db`insert into public.settings (key, value) values ('mailing_address', '"[TEST] Footy Up, real address to come"') on conflict (key) do update set value = excluded.value`
    expect((await item("mailing_address")).done).toBe(false)
    await db`update public.settings set value = '"Footy Up, 1 Example St, Arlington, MA 02474"' where key = 'mailing_address'`
    expect((await item("mailing_address")).done).toBe(true)
  })
})
