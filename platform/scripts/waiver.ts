/**
 * Publish a new waiver version. Old versions are kept unchanged, so every past
 * registration still points at the exact text the parent accepted.
 *
 *   pnpm waiver add --flow miami|camp|all --title "Participant waiver" --file waiver.txt [--url https://...]
 *   pnpm waiver list
 */
import { readFile } from "node:fs/promises";
import { flag, scriptDb } from "./_db.js";

const [command, ...rest] = process.argv.slice(2);
const sql = scriptDb();

try {
  if (command === "add") {
    const flow = flag(rest, "flow");
    const title = flag(rest, "title");
    const file = flag(rest, "file");
    if (!flow || !["miami", "camp", "all"].includes(flow) || !title || !file) {
      console.error('Usage: pnpm waiver add --flow miami|camp|all --title "..." --file waiver.txt [--url ...]');
      process.exit(1);
    }
    const body = (await readFile(file, "utf8")).trim();
    const row = await sql.begin(async (tx) => {
      const [latest] = await tx<{ next: number }[]>`
        select coalesce(max(version), 0) + 1 as next from public.waivers where flow = ${flow}`;
      await tx`update public.waivers set active = false where flow = ${flow} and active`;
      const [inserted] = await tx`
        insert into public.waivers (flow, version, title, body, url, active)
        values (${flow}, ${latest!.next}, ${title}, ${body}, ${flag(rest, "url") ?? null}, true)
        returning id, flow, version`;
      return inserted;
    });
    console.log(`Published waiver ${row!.flow} v${row!.version} (${row!.id}).`);
  } else if (command === "list") {
    console.table(await sql`select id, flow, version, title, active, created_at from public.waivers order by flow, version`);
  } else {
    console.error("Usage: pnpm waiver add ... | list");
    process.exit(1);
  }
} finally {
  await sql.end();
}
