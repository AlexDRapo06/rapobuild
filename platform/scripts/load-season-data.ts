/**
 * One-time data load that runs at the end of the production build (Vercel),
 * so the live database gets the Nov 10, 2026 camp changes without anyone
 * running pnpm camps:upsert / pnpm miami config by hand:
 *   - Sudbury winter camp and Brooks School added, Walpole hidden (other camps
 *     are left exactly as the dashboard has them)
 *   - the Miami combine becomes the Boston College Combine at Middlesex School
 *
 * Runs once: a marker in public.settings stops it running again, so later edits
 * in the dashboard are never overwritten by a redeploy. It refuses to touch the
 * combine if anyone already registered for (or holds a spot in) the old Miami
 * combine; the build then fails and Vercel keeps the current site live.
 *
 * Only runs when VERCEL_ENV=production (or LOAD_SEASON_DATA=1, for testing).
 */
import { readFile } from "node:fs/promises";
import { CampsFile, MiamiFile, upsertCamps, upsertMiami } from "../src/admin/config.js";
import { createSql } from "../src/lib/db.js";

const MARKER = "data_load:2026-11-10-boston-combine";
const DATES_MARKER = "data_load:2026-11-11-combine-june-dates";
// Only the camps that changed, so dashboard edits to the others are kept.
const CHANGED_CAMPS = ["winter_walpole", "winter_sudbury", "brooks_2027"];

if (process.env.VERCEL_ENV !== "production" && process.env.LOAD_SEASON_DATA !== "1") {
  console.log(`[season data] Skipped (not a production build).`);
  process.exit(0);
}

const url = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("[season data] DATABASE_URL is not set for this build, so the new camp data can't be loaded. Failing the build so the current site stays live.");
  process.exit(1);
}

const allCamps = CampsFile.parse(JSON.parse(await readFile("data/camps.json", "utf8")));
const camps = { camps: allCamps.camps.filter((c) => CHANGED_CAMPS.includes(c.slug)) };
if (camps.camps.length !== CHANGED_CAMPS.length) {
  console.error("[season data] data/camps.json is missing one of: " + CHANGED_CAMPS.join(", "));
  process.exit(1);
}
const miami = MiamiFile.parse(JSON.parse(await readFile("data/miami.json", "utf8")));

const sql = createSql(url, { max: 1 });
try {
  const [done] = await sql<{ value: unknown }[]>`select value from public.settings where key = ${MARKER}`;
  if (done) {
    console.log(`[season data] Already loaded (${JSON.stringify(done.value)}). Nothing to do.`);
  } else {
    const [usage] = await sql<{ regs: number; holds: number }[]>`
      select (select count(*)::int from public.registrations where miami_group is not null) as regs,
             (select count(*)::int from public.holds where miami_group is not null and status = 'active' and expires_at > now()) as holds`;
    if (usage!.regs > 0 || usage!.holds > 0) {
      console.error(
        `[season data] Stopped: the old Miami combine has ${usage!.regs} registration(s) and ${usage!.holds} active hold(s). ` +
          "Loading the Boston combine would move them to the new dates, so nothing was changed. Failing the build so the current site stays live.",
      );
      process.exit(1);
    }
    await sql.begin(async (tx) => {
      for (const line of await upsertCamps(tx, camps)) console.log(`[season data] Saved ${line}`);
      await upsertMiami(tx, miami);
      console.log("[season data] Saved the Boston College Combine settings.");
      await tx`insert into public.settings (key, value) values (${MARKER}, ${tx.json({ loadedAt: new Date().toISOString() })})`;
    });
    console.log("[season data] Done.");
  }

  // Nov 11, 2026: the combine is June 9–11, not July 9–11. Only the dates and
  // the closing time change, so any dashboard edits to the combine are kept.
  const [datesDone] = await sql<{ value: unknown }[]>`select value from public.settings where key = ${DATES_MARKER}`;
  if (datesDone) {
    console.log(`[season data] Combine dates already moved to June (${JSON.stringify(datesDone.value)}).`);
  } else {
    await sql.begin(async (tx) => {
      for (const g of miami.groups) {
        await tx`update public.miami_groups set starts_on = ${g.startsOn ?? null}, ends_on = ${g.endsOn ?? null} where grp = ${g.grp}`;
      }
      const days = miami.groups.flatMap((g) => [g.startsOn, g.endsOn]).filter((d): d is string => Boolean(d)).sort();
      await tx`update public.miami_event set starts_on = ${days[0] ?? null}, ends_on = ${days.at(-1) ?? null}, closes_at = ${miami.event.closesAt ?? null}`;
      await tx`insert into public.settings (key, value) values (${DATES_MARKER}, ${tx.json({ loadedAt: new Date().toISOString() })})`;
    });
    console.log(`[season data] Combine dates set to ${miami.groups[0]?.startsOn} – ${miami.groups[0]?.endsOn}, registration closes ${miami.event.closesAt}.`);
  }
} finally {
  await sql.end();
}
