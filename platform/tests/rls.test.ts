import { before, describe, it } from "node:test";
import { expect } from "./expect.js";
import { campCheckout } from "../src/handlers/camp-checkout.js";
import { privateTraining } from "../src/handlers/private-training.js";
import type { Db } from "../src/lib/db.js";
import { call, deliver, makeDeps, parent, post, resetDb, seed, sessionBySlug, sessionIdFrom } from "./helpers.js";

const deps = makeDeps();
const { db } = deps;

const SENSITIVE = ["registrations", "contacts", "private_training_requests", "payments", "checkout_intents", "waitlist_entries"];
let adminId: string;
let otherUserId: string;

async function asRole<T>(role: "anon" | "authenticated", userId: string | null, fn: (tx: Db) => Promise<T>): Promise<T> {
  return db.begin(async (tx) => {
    await tx.unsafe(`set local role ${role}`);
    if (userId) await tx`select set_config('request.jwt.claim.sub', ${userId}, true)`;
    return fn(tx);
  }) as Promise<T>;
}

before(async () => {
  await resetDb(db);
  await seed(db);
  const week1 = await sessionBySlug(db, "arlington-catholic", "week-of-july-12");
  const res = await call(deps, campCheckout, post("/api/checkout/camp", { parent, players: [{ name: "Alex", age: 10, sessionIds: [week1] }] }));
  await deliver(deps, deps.payments.complete(sessionIdFrom(((await res.json()) as { checkoutUrl: string }).checkoutUrl)));
  await call(deps, privateTraining, post("/api/private-training", { parentName: "A", email: "a@example.test", phone: "6175550100", town: "X", playerName: "B", playerAge: 9 }));

  const [admin] = await db`insert into auth.users (email) values ('admin@example.test') returning id`;
  const [other] = await db`insert into auth.users (email) values ('someone@example.test') returning id`;
  adminId = admin!.id;
  otherUserId = other!.id;
  await db`insert into public.admin_users (user_id, email) values (${adminId}, 'admin@example.test')`;
});

describe("Row Level Security (acceptance #7)", () => {
  it("a logged-out visitor cannot read any table", async () => {
    const tables = await db<{ tablename: string }[]>`select tablename from pg_tables where schemaname = 'public'`;
    for (const { tablename } of tables) {
      await expect(asRole("anon", null, (tx) => tx.unsafe(`select * from public.${tablename} limit 1`)), tablename).rejects.toThrow(/permission denied/);
    }
  });

  it("a logged-in user who is not an admin sees nothing", async () => {
    for (const table of SENSITIVE) {
      const rows = await asRole("authenticated", otherUserId, (tx) => tx.unsafe(`select * from public.${table}`));
      expect(rows, table).toHaveLength(0);
    }
    await expect(asRole("authenticated", otherUserId, (tx) => tx`update public.camps set name = 'hacked'`)).resolves.toBeDefined();
    const [camp] = await db`select count(*)::int as n from public.camps where name = 'hacked'`;
    expect(camp!.n).toBe(0);
  });

  it("an admin can read registrations and requests", async () => {
    const regs = await asRole("authenticated", adminId, (tx) => tx`select parent_town from public.registrations`);
    expect(regs).toEqual([{ parent_town: "Brookline" }]);
    const reqs = await asRole("authenticated", adminId, (tx) => tx`select count(*)::int as n from public.private_training_requests`);
    expect(reqs[0]!.n).toBe(1);
  });

  it("nobody outside the server can call the capacity or rate-limit functions", async () => {
    await expect(
      asRole("authenticated", adminId, (tx) => tx`select public.reserve_miami(gen_random_uuid(), '{"boys":1}'::jsonb, true, now())`),
    ).rejects.toThrow(/permission denied/);
    await expect(asRole("anon", null, (tx) => tx`select public.rate_limit_hit('x', 1, 60)`)).rejects.toThrow(/permission denied/);
  });
});
