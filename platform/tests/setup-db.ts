/** Creates a throwaway test database and applies the real migrations. Run by `pnpm test`. */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createSql } from "../src/lib/db.js";
import { adminUrl, TEST_DB, testUrl } from "./db-url.js";

const admin = createSql(adminUrl(), { max: 1 });
await admin.unsafe(`drop database if exists ${TEST_DB} with (force)`);
await admin.unsafe(`create database ${TEST_DB}`);
await admin.end();

const db = createSql(testUrl(), { max: 1 });
await db.unsafe(await readFile("supabase/local/supabase-shim.sql", "utf8"));
const dir = "supabase/migrations";
for (const file of (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort()) {
  await db.unsafe(await readFile(join(dir, file), "utf8"));
}
await db.end();
console.log(`Test database ${TEST_DB} ready.`);
