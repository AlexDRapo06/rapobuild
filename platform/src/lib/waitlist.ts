/**
 * Waitlists (Brief D9). When a spot frees up (refund, cancellation, expired
 * hold, or a capacity increase), the next family in line gets an email with a
 * link, and the spot is held for them for `waitlist_hold_hours`. An unused
 * offer lapses and passes to the next family.
 */
import { randomBytes } from "node:crypto"
import { renderCampaign } from "../email/templates.js"
import { unsubscribeUrl } from "../email/links.js"
import type { Db } from "./db.js"
import type { Deps } from "./deps.js"
import { ApiError, logError } from "./http.js"
import { getSettings } from "./settings.js"

export type WaitTarget = { sessionId: string } | { miamiGroup: "boys" | "girls" }

interface OfferRow {
  id: string
  parent_name: string
  email: string
  spots: number
  offer_token: string
  offer_expires_at: Date
  program: string
  session_id: string | null
  miami_group: string | null
}

async function available(tx: Db, target: WaitTarget): Promise<number> {
  if ("sessionId" in target) {
    const [s] = await tx<{ capacity: number | null; taken: number }[]>`
      select capacity, public.session_taken(id) as taken from public.sessions where id = ${target.sessionId} for update`
    if (!s || s.capacity === null) return 0
    return Math.max(s.capacity - s.taken, 0)
  }
  await tx`select 1 from public.miami_groups order by grp for update`
  const [a] = await tx<{ left_for_public: number }[]>`select left_for_public from public.miami_availability() where grp = ${target.miamiGroup}`
  return a?.left_for_public ?? 0
}

/** Offers the first waiting family a held spot, if one is free. Returns null when nobody can be offered one. */
export async function offerNext(deps: Deps, target: WaitTarget): Promise<OfferRow | null> {
  const settings = await getSettings(deps.db)
  const hours = Math.max(1, Number(settings.waitlist_hold_hours) || 48)
  const offer = await deps.db.begin(async (tx) => {
    const free = await available(tx, target)
    const [entry] =
      "sessionId" in target
        ? await tx<{ id: string; spots: number }[]>`
            select id, spots from public.waitlist_entries where session_id = ${target.sessionId} and status = 'waiting'
             order by created_at limit 1 for update skip locked`
        : await tx<{ id: string; spots: number }[]>`
            select id, spots from public.waitlist_entries where miami_group = ${target.miamiGroup} and status = 'waiting'
             order by created_at limit 1 for update skip locked`
    if (!entry || entry.spots > free) return null
    const token = randomBytes(24).toString("base64url")
    await tx`
      insert into public.holds (waitlist_entry_id, session_id, miami_group, quantity, expires_at)
      values (${entry.id}, ${"sessionId" in target ? target.sessionId : null}, ${"miamiGroup" in target ? target.miamiGroup : null},
              ${entry.spots}, now() + make_interval(hours => ${hours}))`
    const [row] = await tx<OfferRow[]>`
      update public.waitlist_entries w set status = 'notified', notified_at = now(),
             offer_expires_at = now() + make_interval(hours => ${hours}), offer_token = ${token}
        from public.camps c
        left join public.sessions s on s.id = ${"sessionId" in target ? target.sessionId : null}
       where w.id = ${entry.id} and c.id = w.camp_id
      returning w.id, w.parent_name, w.email, w.spots, w.offer_token, w.offer_expires_at, w.session_id, w.miami_group,
                case when w.miami_group is not null then c.name || ' – ' || initcap(w.miami_group) else c.name || ' – ' || coalesce(s.name, '') end as program`
    return row ?? null
  })
  if (offer) await sendOfferEmail(deps, offer).catch((err) => logError("waitlist.email", err))
  return offer
}

async function sendOfferEmail(deps: Deps, offer: OfferRow) {
  const settings = await getSettings(deps.db)
  const path = offer.miami_group ? settings.waitlist_miami_path : settings.waitlist_session_path
  const link = `${deps.env.siteUrl}${path}?waitlist=${offer.offer_token}`
  const until = offer.offer_expires_at.toLocaleString("en-US", { timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })
  const first = offer.parent_name.split(/\s+/)[0] || "there"
  const email = renderCampaign({
    subject: `A spot opened up: ${offer.program}`,
    heading: "Good news: a spot opened up",
    body: `Hi ${first},\n\nYou're next on the waitlist for **${offer.program}**, and we're holding ${offer.spots === 1 ? "a spot" : `${offer.spots} spots`} for you until **${until} ET**.\n\nComplete your registration here:\n${link}\n\nIf you no longer need the spot, you don't need to do anything. It will go to the next family when the hold ends.`,
    mailingAddress: settings.mailing_address,
    logoUrl: settings.email_logo_url,
    unsubscribeUrl: unsubscribeUrl(deps.env, offer.email),
  })
  await deps.mailer.send({ to: offer.email, subject: email.subject, html: email.html, text: email.text, replyTo: settings.reply_to_email ?? undefined })
  await deps.db`insert into public.email_log (kind, status, template, subject, recipient_count, recipient_email) values ('waitlist', 'sent', 'waitlist-offer', ${email.subject}, 1, ${offer.email})`
}

/** Lapses expired offers, then offers every free spot to the next family in line. */
export async function processWaitlists(deps: Deps): Promise<{ lapsed: number; offered: number }> {
  const lapsed = await deps.db<{ id: string }[]>`
    update public.waitlist_entries set status = 'lapsed', offer_token = null
     where status = 'notified' and offer_expires_at < now() returning id`
  if (lapsed.length) {
    await deps.db`update public.holds set status = 'released' where waitlist_entry_id = any(${lapsed.map((l) => l.id)}::uuid[]) and status = 'active'`
  }
  const targets = await deps.db<{ session_id: string | null; miami_group: "boys" | "girls" | null }[]>`
    select distinct session_id, miami_group from public.waitlist_entries where status = 'waiting'`
  let offered = 0
  for (const t of targets) {
    const target: WaitTarget = t.session_id ? { sessionId: t.session_id } : { miamiGroup: t.miami_group! }
    for (let i = 0; i < 25 && (await offerNext(deps, target)); i++) offered++
  }
  return { lapsed: lapsed.length, offered }
}

export async function processWaitlistsQuietly(deps: Deps) {
  await processWaitlists(deps).catch((err) => logError("waitlist.process", err))
}

/**
 * Inside a checkout transaction: validates a waitlist token and releases its
 * hold so the normal capacity check (under the same row locks) can re-take it.
 */
export async function claimOffer(tx: Db, token: string, target: { sessionIds: string[] } | { miamiGroups: string[] }, players: number): Promise<string> {
  const [entry] = await tx<{ id: string; status: string; offer_expires_at: Date | null; session_id: string | null; miami_group: string | null; spots: number }[]>`
    select id, status, offer_expires_at, session_id, miami_group, spots from public.waitlist_entries where offer_token = ${token} for update`
  const matches = entry && ("sessionIds" in target ? target.sessionIds.includes(entry.session_id ?? "") : target.miamiGroups.includes(entry.miami_group ?? ""))
  if (!entry || entry.status !== "notified" || !entry.offer_expires_at || entry.offer_expires_at.getTime() <= Date.now() || !matches) {
    throw new ApiError(409, "waitlist_offer_invalid", "This waitlist offer has expired or doesn't match. Please contact us.")
  }
  if (players > entry.spots) throw new ApiError(409, "waitlist_offer_invalid", `This offer holds ${entry.spots} spot(s).`)
  await tx`update public.holds set status = 'released' where waitlist_entry_id = ${entry.id} and status = 'active'`
  return entry.id
}
