import { WaitlistRequest, type OkResponse, type WaitlistOfferResponse } from "../contract.js";
import type { Deps } from "../lib/deps.js";
import { enforceRateLimit } from "../lib/guards.js";
import { ApiError, json, parse, readJson } from "../lib/http.js";

/**
 * POST /api/waitlist: saves a waitlist entry in arrival order. Notifying the
 * next family when a spot frees up is Stage 3 (D9).
 */
export async function joinWaitlist(req: Request, deps: Deps): Promise<Response> {
  const { db, env } = deps;
  await enforceRateLimit(db, env, req, "waitlist");
  const body = parse(WaitlistRequest, await readJson(req));
  if (body.website) return json({ ok: true } satisfies OkResponse, 201);

  const [target] = body.sessionId
    ? await db<{ camp_id: string }[]>`
        select s.camp_id from public.sessions s join public.camps c on c.id = s.camp_id
         where s.id = ${body.sessionId} and c.kind <> 'miami'`
    : await db<{ camp_id: string }[]>`select camp_id from public.miami_event`;
  if (!target) throw new ApiError(404, "not_found", "That session or group doesn't exist.");

  await saveWaitlistEntries(db, target.camp_id, body.sessionId ? [body.sessionId] : [null], body);
  return json({ ok: true } satisfies OkResponse, 201);
}

/** One entry per session (null = the Miami group), plus the contact, in arrival order. */
export async function saveWaitlistEntries(
  db: Deps["db"],
  campId: string,
  sessionIds: (string | null)[],
  body: Pick<WaitlistRequest, "miamiGroup" | "parentName" | "email" | "phone" | "town" | "spots" | "marketingOptIn">,
) {
  await db.begin(async (tx) => {
    for (const sessionId of sessionIds) {
      await tx`
        insert into public.waitlist_entries (camp_id, session_id, miami_group, parent_name, email, phone, town, spots)
        values (${campId}, ${sessionId}, ${body.miamiGroup ?? null},
                ${body.parentName}, ${body.email}, ${body.phone}, ${body.town}, ${body.spots})`;
    }
    await tx`select public.upsert_contact(${body.email}, ${body.parentName}, ${body.phone}, ${body.town},
                                          'waitlist', ${body.marketingOptIn ? "granted" : null})`;
  });
}

/** GET /api/waitlist?token=...: what a waitlist offer link holds, so the page can prefill checkout. */
export async function waitlistOffer(req: Request, deps: Deps): Promise<Response> {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (token.length < 10) return json({ valid: false } satisfies WaitlistOfferResponse);
  const [row] = await deps.db<{ status: string; offer_expires_at: Date | null; session_id: string | null; miami_group: "boys" | "girls" | null; spots: number; parent_name: string; email: string; phone: string; town: string; program: string }[]>`
    select w.status, w.offer_expires_at, w.session_id, w.miami_group, w.spots, w.parent_name, w.email, w.phone, w.town,
           case when w.miami_group is not null then c.name || ' – ' || initcap(w.miami_group) else c.name || ' – ' || coalesce(s.name, '') end as program
      from public.waitlist_entries w
      join public.camps c on c.id = w.camp_id
      left join public.sessions s on s.id = w.session_id
     where w.offer_token = ${token}`;
  if (!row || row.status !== "notified" || !row.offer_expires_at || row.offer_expires_at.getTime() <= Date.now()) {
    return json({ valid: false } satisfies WaitlistOfferResponse);
  }
  return json({
    valid: true,
    program: row.program,
    sessionId: row.session_id,
    miamiGroup: row.miami_group,
    spots: row.spots,
    expiresAt: row.offer_expires_at.toISOString(),
    parent: { name: row.parent_name, email: row.email, phone: row.phone, town: row.town },
  } satisfies WaitlistOfferResponse);
}
