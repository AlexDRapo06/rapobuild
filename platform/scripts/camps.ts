/**
 * Add or edit camps and sessions without a code change.
 *   pnpm camps:upsert                 load data/camps.json
 *   pnpm camps:upsert path/to.json    load another file
 */
import { readFile } from "node:fs/promises";
import { CampsFile, upsertCamps } from "../src/admin/config.js";
import { scriptDb } from "./_db.js";

const path = process.argv[2] ?? "data/camps.json";
const parsed = CampsFile.safeParse(JSON.parse(await readFile(path, "utf8")));
if (!parsed.success) {
  console.error(`${path} has problems:`);
  for (const issue of parsed.error.issues) console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  process.exit(1);
}

const sql = scriptDb();
try {
  for (const line of await upsertCamps(sql, parsed.data)) console.log(`Saved ${line}`);
} finally {
  await sql.end();
}
