/**
 * Applies supabase/migrations/*.sql in order and records each one.
 *   pnpm db:migrate                 apply pending migrations
 *   pnpm db:reset                   LOCAL ONLY: wipe, add the Supabase shim, migrate, seed
 * Against a real Supabase project you can also use `supabase db push`.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { CampsFile, MiamiFile, upsertCamps, upsertMiami } from "../src/admin/config.js";
import { scriptDb } from "./_db.js";

const args = process.argv.slice(2);
const reset = args.includes("--reset");
const shim = args.includes("--shim") || reset;
const seed = args.includes("--seed") || reset;

const sql = scriptDb();
const url = new URL((process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL)!);
const isLocal = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);

if ((reset || shim) && !isLocal) {
  console.error("--reset and --shim only run against a local database.");
  process.exit(1);
}

try {
  if (reset) {
    await sql.unsafe("drop schema if exists public cascade; create schema public; drop schema if exists auth cascade;");
    console.log("Local database wiped.");
  }
  if (shim) {
    await sql.unsafe(await readFile("supabase/local/supabase-shim.sql", "utf8"));
    console.log("Applied local Supabase shim.");
  }

  await sql`create table if not exists public.app_migrations (name text primary key, applied_at timestamptz not null default now())`;
  await sql`alter table public.app_migrations enable row level security`;
  const applied = new Set((await sql<{ name: string }[]>`select name from public.app_migrations`).map((r) => r.name));

  const dir = "supabase/migrations";
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    if (applied.has(file)) continue;
    const body = await readFile(join(dir, file), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`insert into public.app_migrations (name) values (${file})`;
    });
    console.log(`Applied ${file}`);
  }

  if (seed) {
    const camps = CampsFile.parse(JSON.parse(await readFile("data/camps.json", "utf8")));
    const miami = MiamiFile.parse(JSON.parse(await readFile("data/miami.json", "utf8")));
    console.log((await upsertCamps(sql, camps)).map((l) => `Seeded ${l}`).join("\n"));
    await upsertMiami(sql, miami);
    console.log("Seeded Miami settings.");
  }
  console.log("Database is up to date.");
} finally {
  await sql.end();
}
