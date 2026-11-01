/**
 * Miami combine settings and access codes, without a deploy.
 *
 *   pnpm miami status                       caps, spots left, prices, gate state
 *   pnpm miami config [data/miami.json]     load event + group settings (caps, reserved spots, prices, dates)
 *   pnpm miami code add <code> [--label "Host families"] [--group boys|girls] [--ends-at 2026-11-08T00:00:00-05:00]
 *   pnpm miami code list
 *   pnpm miami code end-at <ISO time>       every active code stops working at that time (public opens then)
 *   pnpm miami code off [--id <uuid>]       turn codes off now; with no active codes, checkout is public
 *
 * Codes are stored as SHA-256 hashes. Nobody can read a code back out of the
 * database, so keep the value somewhere safe when you add it.
 */
import { readFile } from "node:fs/promises";
import { MiamiFile, upsertMiami } from "../src/admin/config.js";
import { hashAccessCode } from "../src/lib/guards.js";
import { flag, scriptDb } from "./_db.js";

const [command, sub, ...rest] = process.argv.slice(2);
const sql = scriptDb();

function usage(): never {
  console.error("Usage: pnpm miami status | config [file] | code add|list|end-at|off ...");
  process.exit(1);
}

try {
  if (command === "status") {
    const [gate] = await sql<{ active: boolean }[]>`select public.miami_gate_active() as active`;
    const [event] = await sql`select name, starts_on::text, ends_on::text, opens_at, checkout_open, waiver_required from public.miami_event`;
    console.log(event ? event : "Miami event not configured. Run: pnpm miami config");
    console.log(`Access code required: ${gate?.active ? "yes" : "no (public)"}`);
    console.table(await sql`select * from public.miami_availability()`);
  } else if (command === "config") {
    const path = sub ?? "data/miami.json";
    const parsed = MiamiFile.safeParse(JSON.parse(await readFile(path, "utf8")));
    if (!parsed.success) {
      for (const issue of parsed.error.issues) console.error(`  ${issue.path.join(".")}: ${issue.message}`);
      process.exit(1);
    }
    await upsertMiami(sql, parsed.data);
    console.log(`Miami settings saved from ${path}.`);
  } else if (command === "code" && sub === "add") {
    const code = rest[0];
    if (!code || code.startsWith("--")) usage();
    const group = flag(rest, "group") ?? null;
    if (group && group !== "boys" && group !== "girls") usage();
    await sql`
      insert into public.access_codes (code_hash, label, grp, ends_at)
      values (${hashAccessCode(code)}, ${flag(rest, "label") ?? null}, ${group}, ${flag(rest, "ends-at") ?? null})
      on conflict (code_hash) do update set active = true, label = excluded.label, grp = excluded.grp, ends_at = excluded.ends_at`;
    console.log("Access code saved and active. Checkout now requires a code.");
  } else if (command === "code" && sub === "list") {
    console.table(await sql`select id, label, grp, active, ends_at, created_at from public.access_codes order by created_at`);
  } else if (command === "code" && sub === "end-at") {
    const when = rest[0];
    if (!when) usage();
    const rows = await sql`update public.access_codes set ends_at = ${when} where active returning id`;
    console.log(`${rows.length} active code(s) will stop working at ${when}. Checkout opens to the public then.`);
  } else if (command === "code" && sub === "off") {
    const id = flag(rest, "id");
    const rows = id
      ? await sql`update public.access_codes set active = false where id = ${id} returning id`
      : await sql`update public.access_codes set active = false where active returning id`;
    const [gate] = await sql<{ active: boolean }[]>`select public.miami_gate_active() as active`;
    console.log(`${rows.length} code(s) turned off. Access code required: ${gate?.active ? "yes" : "no (public)"}.`);
  } else {
    usage();
  }
} finally {
  await sql.end();
}
