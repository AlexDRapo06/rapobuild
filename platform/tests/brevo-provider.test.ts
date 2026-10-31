import { afterEach, describe, it } from "node:test"
import { expect } from "./expect.js"
import { BrevoProvider } from "../src/email/provider.js"

const content = { name: "Hello · Oct 30, 2026", subject: "Hi {{first_name}}", html: "<p>Hi {{first_name}}</p>", text: "Hi", sender: { email: "reed@example.test", name: "Footy Up" } }

describe("Brevo test sends", () => {
  const realFetch = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = realFetch
  })

  it("puts the test address in a test list first, because Brevo only sends tests to listed contacts", async () => {
    const calls: { method: string; path: string; body?: any }[] = []
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      const path = String(input).replace("https://api.brevo.com/v3", "")
      calls.push({ method: init?.method ?? "GET", path, body: init?.body ? JSON.parse(String(init.body)) : undefined })
      if (path.startsWith("/contacts/folders?")) return Response.json({ folders: [{ id: 7, name: "Footy Up sends" }] })
      if (path.startsWith("/contacts/folders/7/lists")) return Response.json({ lists: [] })
      if (path === "/contacts/lists") return Response.json({ id: 42 })
      if (path === "/emailCampaigns") return Response.json({ id: 9 })
      return new Response(null, { status: 204 })
    }) as typeof fetch

    await new BrevoProvider("xkeysib-test-not-real").sendTest(content, "reed@example.test")
    const at = (method: string, path: string) => calls.findIndex((c) => c.method === method && c.path === path)
    expect(calls[at("POST", "/contacts/lists")]!.body).toEqual({ name: "Footy Up test recipients", folderId: 7 })
    expect(calls[at("POST", "/contacts")]!.body).toMatchObject({ email: "reed@example.test", listIds: [42] })
    expect(calls[at("POST", "/contacts/lists/42/contacts/add")]!.body).toEqual({ emails: ["reed@example.test"] })
    expect(at("POST", "/contacts/lists/42/contacts/add") < at("POST", "/emailCampaigns/9/sendTest")).toBe(true)
    expect(calls[at("POST", "/emailCampaigns")]!.body.subject).toBe('[Test] Hi {{ contact.FIRSTNAME | default : "there" }}')
  })
})

describe("Brevo unsubscribe webhooks", () => {
  const realFetch = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = realFetch
  })

  it("creates both webhooks on an account that has none yet, then updates them in place", async () => {
    const hooks: { id: number; type: string; url: string; description: string }[] = []
    const calls: string[] = []
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      const path = String(input).replace("https://api.brevo.com/v3", "")
      const method = init?.method ?? "GET"
      calls.push(`${method} ${path}`)
      const body = init?.body ? JSON.parse(String(init.body)) : undefined
      if (method === "GET" && path.startsWith("/webhooks?type=")) {
        const type = path.split("=")[1]!
        const list = hooks.filter((h) => h.type === type)
        return list.length ? Response.json({ webhooks: list }) : Response.json({ code: "document_not_found", message: "Webhook record does not exist" }, { status: 400 })
      }
      if (method === "POST" && path === "/webhooks") {
        hooks.push({ id: hooks.length + 1, ...body })
        return Response.json({ id: hooks.length }, { status: 201 })
      }
      if (method === "PUT" && path.startsWith("/webhooks/")) {
        Object.assign(hooks.find((h) => h.id === Number(path.split("/")[2]))!, body)
        return new Response(null, { status: 204 })
      }
      return new Response(null, { status: 404 })
    }) as typeof fetch

    const brevo = new BrevoProvider("xkeysib-test-not-real")
    expect((await brevo.webhookStatus("https://a.test/api/email/brevo-webhook?token=s")).connected).toBe(false)
    expect((await brevo.connectWebhooks("https://a.test/api/email/brevo-webhook?token=s")).connected).toBe(true)
    expect(hooks.map((h) => h.type).sort()).toEqual(["marketing", "transactional"])

    const moved = await brevo.webhookStatus("https://b.test/api/email/brevo-webhook?token=s")
    expect(moved.types.map((t) => t.pointsAt)).toEqual(["https://a.test/api/email/brevo-webhook", "https://a.test/api/email/brevo-webhook"])
    expect((await brevo.connectWebhooks("https://b.test/api/email/brevo-webhook?token=s")).connected).toBe(true)
    expect(hooks).toHaveLength(2)
    expect(calls.filter((c) => c.startsWith("PUT")).length).toBe(2)
  })
})
