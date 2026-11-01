import { afterEach, beforeEach, describe, it } from "node:test"
import { expect } from "./expect.js"
import { admin } from "../src/handlers/admin.js"
import { signDevToken } from "../src/lib/admin-auth.js"
import { grantAdmin, inviteMode } from "../src/lib/admins.js"
import { call, makeDeps, resetDb } from "./helpers.js"

const deps = makeDeps()
const { db } = deps
let alexId: string

const as = (token: string) => (view: string, body?: unknown) =>
  call(deps, admin, new Request(`https://footyupp.test/api/admin/${view}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }))
let alex: ReturnType<typeof as>

beforeEach(async () => {
  await resetDb(db)
  const [a] = await db`insert into auth.users (email) values ('alex@example.test') returning id`
  alexId = a!.id
  await db`insert into public.admin_users (user_id, email) values (${alexId}, 'alex@example.test')`
  alex = as(signDevToken(deps, { id: alexId, email: "alex@example.test" }).token)
})

describe("Settings → Admins", () => {
  it("an admin adds another admin, who can then sign in to the dashboard", async () => {
    const res = await alex("admin-add", { email: " Chris@Example.test " })
    expect(await res.json()).toEqual({ email: "chris@example.test", result: "local" })

    const list = (await (await alex("admins")).json()) as { admins: { email: string; invitedBy: string | null }[]; you: string; inviteMode: string }
    expect(list.admins.map((a) => [a.email, a.invitedBy])).toEqual([["alex@example.test", null], ["chris@example.test", "alex@example.test"]])
    expect(list).toMatchObject({ you: alexId, inviteMode: "local" })

    const [chris] = await db`select user_id from public.admin_users where email = 'chris@example.test'`
    const chrisCall = as(signDevToken(deps, { id: chris!.user_id, email: "chris@example.test" }).token)
    expect((await chrisCall("admins")).status).toBe(200)
    expect(await (await alex("admin-add", { email: "chris@example.test" })).json()).toMatchObject({ result: "already_admin" })
  })

  it("removing an admin cuts access immediately; nobody can remove themselves or the last admin", async () => {
    expect((await alex("admin-remove", { userId: alexId })).status).toBe(422)

    await alex("admin-add", { email: "chris@example.test" })
    const [chris] = await db`select user_id from public.admin_users where email = 'chris@example.test'`
    const chrisCall = as(signDevToken(deps, { id: chris!.user_id, email: "chris@example.test" }).token)
    expect(await (await chrisCall("admin-remove", { userId: chris!.user_id })).json()).toMatchObject({ message: "You can't remove your own access. Ask another admin to do it." })

    expect(await (await alex("admin-remove", { userId: chris!.user_id })).json()).toEqual({ ok: true, email: "chris@example.test" })
    expect((await chrisCall("admins")).status).toBe(403)
    const [login] = await db`select 1 from auth.users where email = 'chris@example.test'`
    expect(Boolean(login)).toBe(true)
  })

  it("refuses non-admins and bad emails", async () => {
    const [stranger] = await db`insert into auth.users (email) values ('stranger@example.test') returning id`
    const strangerCall = as(signDevToken(deps, { id: stranger!.id, email: "stranger@example.test" }).token)
    expect((await strangerCall("admin-add", { email: "friend@example.test" })).status).toBe(403)
    expect((await alex("admin-add", { email: "not-an-email" })).status).toBe(400)
  })
})

describe("Supabase invites", () => {
  const realFetch = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = realFetch
  })
  const env = { supabaseUrl: "https://proj.supabase.test", supabaseServiceRoleKey: "service-key", databaseUrl: "postgres://db.supabase.test/postgres", adminUrl: "https://admin.footyupp.test/admin/" }

  it("needs the service role key on a real Supabase project", async () => {
    expect(inviteMode({ ...env, supabaseServiceRoleKey: undefined })).toBe("unavailable")
    await expect(grantAdmin(db, { ...env, supabaseServiceRoleKey: undefined }, "chris@example.test", "alex@example.test")).rejects.toThrow(/SUPABASE_SERVICE_ROLE_KEY/)
  })

  it("sends Supabase's invite email with the dashboard link, or grants an existing login", async () => {
    const calls: { url: string; auth: string | null; body?: string }[] = []
    const [chrisLogin] = await db`insert into auth.users (email) values ('chris@example.test') returning id`
    const [existingLogin] = await db`insert into auth.users (email) values ('viraj@example.test') returning id`
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input)
      calls.push({ url, auth: new Headers(init?.headers).get("authorization"), body: init?.body as string | undefined })
      if (url.includes("/auth/v1/invite")) {
        const { email } = JSON.parse(init!.body as string) as { email: string }
        return email === "chris@example.test"
          ? Response.json({ id: chrisLogin!.id, email })
          : Response.json({ msg: "A user with this email address has already been registered" }, { status: 422 })
      }
      return Response.json({ users: [{ id: existingLogin!.id, email: "viraj@example.test", last_sign_in_at: "2026-10-20T12:00:00Z" }] })
    }) as typeof fetch

    expect(await grantAdmin(db, env, "chris@example.test", "alex@example.test")).toEqual({ email: "chris@example.test", result: "invited" })
    expect(calls[0]).toMatchObject({ url: "https://proj.supabase.test/auth/v1/invite?redirect_to=https%3A%2F%2Fadmin.footyupp.test%2Fadmin%2F", auth: "Bearer service-key" })
    expect(await grantAdmin(db, env, "viraj@example.test", "alex@example.test")).toEqual({ email: "viraj@example.test", result: "existing_login" })
    const rows = await db`select email, invited_by from public.admin_users where email <> 'alex@example.test' order by email`
    expect(rows.map((r) => [r.email, r.invited_by])).toEqual([["chris@example.test", "alex@example.test"], ["viraj@example.test", "alex@example.test"]])
  })
})
