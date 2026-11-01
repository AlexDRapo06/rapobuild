import type { CampsResponse, PublicCamp, PublicSession } from "../contract.js";
import type { Deps } from "../lib/deps.js";
import { json } from "../lib/http.js";
import { getSettings } from "../lib/settings.js";
import { currentWaiver } from "../lib/waiver.js";

interface SessionRow {
  id: string;
  camp_id: string;
  slug: string;
  name: string;
  starts_on: string | null;
  ends_on: string | null;
  start_time: string | null;
  location: string | null;
  age_min: number | null;
  age_max: number | null;
  price_cents: number;
  current_price_cents: number;
  early_bird_until: string | null;
  status: "open" | "closed";
  capacity: number | null;
  taken: number;
  info_text: string | null;
}

/** GET /api/camps: every active camp (Miami excluded) with its sessions. */
export async function listCamps(_req: Request, deps: Deps): Promise<Response> {
  const { db } = deps;
  const camps = await db<
    { id: string; slug: string; name: string; host: string | null; kind: PublicCamp["kind"]; info_only: boolean; description: string | null; info_url: string | null }[]
  >`
    select id, slug, name, host, kind, info_only, description, info_url
      from public.camps
     where active and kind <> 'miami'
     order by sort_order, name`;

  const sessions = camps.length
    ? await db<SessionRow[]>`
        select s.id, s.camp_id, s.slug, s.name,
               s.starts_on::text, s.ends_on::text, to_char(s.start_time, 'HH24:MI') as start_time,
               s.location, s.age_min, s.age_max, s.price_cents,
               public.session_price_cents(s) as current_price_cents,
               case when s.early_bird_price_cents is not null and public.app_today() <= s.early_bird_until
                    then s.early_bird_until::text end as early_bird_until,
               s.status, s.capacity,
               case when s.capacity is null then 0 else public.session_taken(s.id) end as taken,
               s.info_text
          from public.sessions s
         where s.camp_id = any(${camps.map((c) => c.id)}::uuid[])
         order by s.sort_order, s.starts_on nulls last, s.name`
    : [];

  const toSession = (s: SessionRow): PublicSession => {
    const spotsLeft = s.capacity === null ? null : Math.max(s.capacity - s.taken, 0);
    return {
      id: s.id,
      slug: s.slug,
      name: s.name,
      startsOn: s.starts_on,
      endsOn: s.ends_on,
      startTime: s.start_time,
      location: s.location,
      ageMin: s.age_min,
      ageMax: s.age_max,
      priceCents: s.current_price_cents,
      regularPriceCents: s.price_cents,
      earlyBirdUntil: s.early_bird_until,
      status: s.status === "closed" ? "closed" : spotsLeft === 0 ? "full" : "open",
      spotsLeft,
      infoText: s.info_text,
    };
  };

  const [settings, waiver] = await Promise.all([getSettings(db), currentWaiver(db, "camp")]);

  const body: CampsResponse = {
    camps: camps.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      host: c.host,
      kind: c.kind,
      infoOnly: c.info_only,
      description: c.description,
      infoUrl: c.info_url,
      sessions: c.info_only ? [] : sessions.filter((s) => s.camp_id === c.id).map(toSession),
    })),
    waiver,
    waiverRequired: Boolean(waiver) && settings.camp_waiver_required,
  };
  return json(body, 200, { "cache-control": "public, s-maxage=15, stale-while-revalidate=30" });
}
