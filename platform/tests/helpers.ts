import { readFileSync } from "node:fs";
import { randomInt } from "node:crypto";
import { CampsFile, MiamiFile, upsertCamps, upsertMiami } from "../src/admin/config.js";
import { getSql, type Sql } from "../src/lib/db.js";
import type { Deps } from "../src/lib/deps.js";
import { MemoryMailer } from "../src/lib/email.js";
import { loadEnv } from "../src/lib/env.js";
import { endpoint } from "../src/lib/http.js";
import { MockGateway } from "../src/lib/payments.js";
import { MockEmailProvider } from "../src/email/provider.js";
import { unsubscribeUrl } from "../src/email/links.js";
import { hashAccessCode } from "../src/lib/guards.js";
import { stripeWebhook } from "../src/handlers/stripe-webhook.js";
import { testUrl } from "./db-url.js";

export interface TestDeps extends Deps {
  payments: MockGateway;
  mailer: MemoryMailer;
  email: MockEmailProvider;
}

export function makeDeps(): TestDeps {
  const env = loadEnv({ DATABASE_URL: testUrl(), PAYMENTS_MODE: "mock", PUBLIC_SITE_URL: "https://footyupp.test" });
  return {
    db: getSql(env.databaseUrl, { max: 25 }),
    env,
    payments: new MockGateway(env.siteUrl, env.stripeWebhookSecret),
    mailer: new MemoryMailer(),
    email: new MockEmailProvider((address) => unsubscribeUrl(env, address)),
  };
}

export async function resetDb(db: Sql) {
  const tables = await db<{ tablename: string }[]>`select tablename from pg_tables where schemaname = 'public'`;
  await db.unsafe(`truncate ${tables.map((t) => `public.${t.tablename}`).join(", ")} restart identity cascade`);
  await db`delete from auth.users`;
}

export async function seed(db: Sql) {
  await upsertCamps(db, CampsFile.parse(JSON.parse(readFileSync("tests/fixtures/camps.json", "utf8"))));
  await upsertMiami(db, MiamiFile.parse(JSON.parse(readFileSync("tests/fixtures/miami.json", "utf8"))));
}

export async function countRows(db: Sql, table: string) {
  const [row] = await db.unsafe<{ n: number }[]>(`select count(*)::int as n from public.${table}`);
  return row!.n;
}

export function randomIp() {
  return `10.${randomInt(255)}.${randomInt(255)}.${randomInt(255)}`;
}

export function post(path: string, body: unknown, ip = randomIp()) {
  return new Request(`https://footyupp.test${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

export function get(path: string) {
  return new Request(`https://footyupp.test${path}`, { headers: { "x-forwarded-for": randomIp() } });
}

/** Runs a handler through the same error wrapper the Vercel functions use. */
export function call(deps: Deps, handler: (req: Request, deps: Deps) => Promise<Response>, req: Request) {
  return endpoint("test", (r) => handler(r, deps))(req);
}

export async function deliver(deps: TestDeps, delivery: { body: string; signature: string }) {
  const req = new Request("https://footyupp.test/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": delivery.signature, "content-type": "application/json" },
    body: delivery.body,
  });
  return call(deps, stripeWebhook, req);
}

export function sessionIdFrom(checkoutUrl: string) {
  return checkoutUrl.split("/").pop()!;
}

export async function sessionBySlug(db: Sql, campSlug: string, sessionSlug: string) {
  const [row] = await db<{ id: string }[]>`
    select s.id from public.sessions s join public.camps c on c.id = s.camp_id
     where c.slug = ${campSlug} and s.slug = ${sessionSlug}`;
  return row!.id;
}

export async function addAccessCode(db: Sql, code: string, opts: { grp?: "boys" | "girls"; endsAt?: Date } = {}) {
  await db`insert into public.access_codes (code_hash, grp, ends_at) values (${hashAccessCode(code)}, ${opts.grp ?? null}, ${opts.endsAt ?? null})`;
}

/** Inserts n paid Miami registrations for a group directly, to get near the cap quickly. */
export async function fillMiami(db: Sql, grp: "boys" | "girls", n: number, viaCode = false) {
  const [event] = await db<{ camp_id: string }[]>`select camp_id from public.miami_event`;
  const [intent] = await db<{ id: string }[]>`
    insert into public.checkout_intents (flow, status, amount_cents, expires_at, via_access_code)
    values ('miami', 'completed', 0, now(), ${viaCode}) returning id`;
  const [payment] = await db<{ id: string }[]>`
    insert into public.payments (intent_id, stripe_checkout_session_id, amount_total_cents)
    values (${intent!.id}, ${"cs_fill_" + intent!.id}, 0) returning id`;
  await db`
    insert into public.registrations
      (intent_id, line_no, payment_id, camp_id, miami_group, via_access_code,
       parent_name, parent_email, parent_phone, parent_town, player_name, player_age, player_sex)
    select ${intent!.id}, g, ${payment!.id}, ${event!.camp_id}, ${grp}, ${viaCode},
           'Test Parent', 'parent' || g || '@example.test', '555-0100', 'Testville', 'Player ' || g, 16,
           ${grp === "boys" ? "boy" : "girl"}
      from generate_series(1, ${n}) g`;
}

export const parent = { name: "Jamie Rivera", email: "Jamie.Rivera@Example.test ", phone: "(617) 555-0142", town: "Brookline" };

export const miamiParent = {
  firstName: "Jamie",
  lastName: "Rivera",
  email: "Jamie.Rivera@Example.test ",
  phone: "(617) 555-0142",
  emergencyPhone: "617-555-0177",
};

export const shipping = { line1: "1 Test Street", line2: "Apt 2", city: "Brookline", state: "MA", postalCode: "02445" };

export function miamiPlayer(sex: "boy" | "girl", n = 1) {
  return {
    firstName: "Test",
    lastName: `Player ${n}`,
    age: 16,
    sex,
    heightIn: 70,
    weightLb: 150,
    position: "Midfielder",
    club: "Test FC",
    email: `player${n}@example.test`,
    shirtSize: "M",
    shortSize: "L",
  };
}

/**
 * A neutral Miami baseline for tests that aren't about the kickoff-form
 * schedule: open now, no public phase, 200 per group, no reservations, and two
 * different prices so code-holder pricing is visible.
 */
export async function neutralMiami(db: Sql) {
  await db`update public.miami_event set opens_at = null, public_opens_at = null, closes_at = null, reserved_total = 0`;
  await db`update public.miami_groups set cap = 200, reserved_for_code_holders = 0, price_code_holder_cents = 157500, price_public_cents = 130000`;
}
