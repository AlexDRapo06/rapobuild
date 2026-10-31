import { before, describe, it } from "node:test";
import { expect } from "./expect.js";
import { admin } from "../src/handlers/admin.js";
import { campCheckout } from "../src/handlers/camp-checkout.js";
import { miamiCheckout } from "../src/handlers/miami.js";
import { privateTraining } from "../src/handlers/private-training.js";
import { asAdmin, signDevToken } from "../src/lib/admin-auth.js";
import { endpoint } from "../src/lib/http.js";
import { call, deliver, makeDeps, miamiParent, miamiPlayer, neutralMiami, parent, post, resetDb, seed, sessionBySlug, sessionIdFrom, shipping } from "./helpers.js";

const deps = makeDeps();
const { db } = deps;
let adminUser: { id: string; email: string };
let otherUser: { id: string; email: string };

const view = (name: string, token?: string, method = "GET", body?: unknown) =>
  call(
    deps,
    admin,
    new Request(`https://footyupp.test/api/admin/${name}`, {
      method,
      headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), "content-type": "application/json", "x-forwarded-for": "10.9.9.9" },
      body: body ? JSON.stringify(body) : undefined,
    }),
  );

before(async () => {
  await resetDb(db);
  await seed(db);
  await neutralMiami(db);

  const week1 = await sessionBySlug(db, "arlington-catholic", "week-of-july-12");
  const camp = await call(deps, campCheckout, post("/api/checkout/camp", { parent, players: [{ name: "Alex Rivera", age: 10, sessionIds: [week1] }] }));
  await deliver(deps, deps.payments.complete(sessionIdFrom(((await camp.json()) as { checkoutUrl: string }).checkoutUrl)));
  const miami = await call(deps, miamiCheckout, post("/api/miami/checkout", { parent: miamiParent, shippingAddress: shipping, players: [miamiPlayer("girl")] }));
  await deliver(deps, deps.payments.complete(sessionIdFrom(((await miami.json()) as { checkoutUrl: string }).checkoutUrl)));
  await call(deps, privateTraining, post("/api/private-training", { parentName: "A B", email: "a@example.test", phone: "6175550100", town: "Newton", playerName: "C", playerAge: 9 }));

  const [a] = await db`insert into auth.users (email) values ('alex@example.test') returning id, email`;
  const [o] = await db`insert into auth.users (email) values ('stranger@example.test') returning id, email`;
  adminUser = { id: a!.id, email: a!.email };
  otherUser = { id: o!.id, email: o!.email };
  await db`insert into public.admin_users (user_id, email) values (${adminUser.id}, ${adminUser.email})`;
});

describe("admin API", () => {
  it("reports the sign-in mode without exposing secrets", async () => {
    expect(await (await view("config")).json()).toEqual({ auth: "dev", supabaseUrl: null, supabaseAnonKey: null });
  });

  it("dev login works only for admins", async () => {
    expect((await view("dev-login", undefined, "POST", { email: "stranger@example.test" })).status).toBe(403);
    const res = await view("dev-login", undefined, "POST", { email: "ALEX@example.test" });
    expect(res.status).toBe(200);
    const { accessToken } = (await res.json()) as { accessToken: string };
    expect((await view("overview", accessToken)).status).toBe(200);
  });

  it("refuses missing, tampered and non-admin tokens", async () => {
    expect((await view("registrations")).status).toBe(401);
    const { token } = signDevToken(deps, adminUser);
    expect((await view("registrations", token.slice(0, -2) + "xx")).status).toBe(401);
    const stranger = signDevToken(deps, otherUser).token;
    expect((await view("registrations", stranger)).status).toBe(403);
    const expired = signDevToken(deps, adminUser, -10).token;
    expect((await view("registrations", expired)).status).toBe(401);
  });

  it("returns registrations with camp and Miami details for admins", async () => {
    const { token } = signDevToken(deps, adminUser);
    const { registrations } = (await (await view("registrations", token)).json()) as { registrations: Record<string, unknown>[] };
    expect(registrations).toHaveLength(2);
    const miami = registrations.find((r) => r.miami_group === "girls")!;
    expect(miami).toMatchObject({
      camp: "FOOTYUP x GOINGFORGOAT College Combine",
      player_first_name: "Test",
      player_club: "Test FC",
      emergency_phone: "617-555-0177",
      ship_line2: "Apt 2",
      payment_status: "paid",
    });
    expect(registrations.find((r) => r.session === "Week of July 12 (ages 6-13)")).toMatchObject({ parent_town: "Brookline" });
  });

  it("overview, requests and waitlist load for admins", async () => {
    const { token } = signDevToken(deps, adminUser);
    const overview = (await (await view("overview", token)).json()) as { totals: { registrations: number; new_requests: number }; miami: { grp: string; paid: number }[] };
    expect(overview.totals).toMatchObject({ registrations: 2, new_requests: 1 });
    expect(overview.miami.find((g) => g.grp === "girls")!.paid).toBe(1);
    expect(((await (await view("requests", token)).json()) as { requests: unknown[] }).requests).toHaveLength(1);
    expect((await view("waitlist", token)).status).toBe(200);
  });

  it("reads run under Row Level Security: a non-admin identity sees no rows even through the same code path", async () => {
    const rows = await asAdmin(deps, otherUser, (tx) => tx`select count(*)::int as n from public.registrations`);
    expect(rows[0]!.n).toBe(0);
    const adminRows = await asAdmin(deps, adminUser, (tx) => tx`select count(*)::int as n from public.registrations`);
    expect(adminRows[0]!.n).toBe(2);
    await expect(asAdmin(deps, adminUser, (tx) => tx`select * from public.rate_limits`)).rejects.toThrow(/permission denied/);
  });
});

describe("CORS for the public site", () => {
  it("answers preflights and tags responses only for allowed origins", async () => {
    process.env.CORS_ALLOWED_ORIGINS = "https://www.footyup.net, https://staging.footyup.net/";
    const handler = endpoint("t", async () => new Response("{}", { status: 200 }));
    const pre = await handler(new Request("https://api.test/api/miami/checkout", { method: "OPTIONS", headers: { origin: "https://staging.footyup.net" } }));
    expect(pre.status).toBe(204);
    expect(pre.headers.get("access-control-allow-origin")).toBe("https://staging.footyup.net");
    const other = await handler(new Request("https://api.test/api/miami", { headers: { origin: "https://evil.example" } }));
    expect(other.headers.get("access-control-allow-origin")).toBe(null);
    delete process.env.CORS_ALLOWED_ORIGINS;
  });
});
