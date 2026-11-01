/**
 *   pnpm settings list
 *   pnpm settings set notify_email '"coach@example.com"'     (value is JSON)
 *   pnpm settings set camp_waiver_required true
 */
import { isSettingKey, SETTING_DEFAULTS } from "../src/lib/settings.js";
import { scriptDb } from "./_db.js";

const [command, key, raw] = process.argv.slice(2);
const sql = scriptDb();

try {
  if (command === "list") {
    const rows = await sql<{ key: string; value: unknown }[]>`select key, value from public.settings`;
    const stored = new Map(rows.map((r) => [r.key, r.value]));
    console.table(
      Object.entries(SETTING_DEFAULTS).map(([k, def]) => ({
        key: k,
        value: JSON.stringify(stored.has(k) ? stored.get(k) : def),
        source: stored.has(k) ? "database" : "default",
      })),
    );
  } else if (command === "set" && key && raw !== undefined) {
    if (!isSettingKey(key)) {
      console.error(`Unknown setting "${key}". Known: ${Object.keys(SETTING_DEFAULTS).join(", ")}`);
      process.exit(1);
    }
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      console.error(`Value must be JSON, e.g. '"text"', true, 35`);
      process.exit(1);
    }
    await sql`
      insert into public.settings (key, value) values (${key}, ${sql.json(value as never)})
      on conflict (key) do update set value = excluded.value, updated_at = now()`;
    console.log(`${key} = ${JSON.stringify(value)}`);
  } else {
    console.error("Usage: pnpm settings list | set <key> <json>");
    process.exit(1);
  }
} finally {
  await sql.end();
}
