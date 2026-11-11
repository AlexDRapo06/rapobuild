/**
 * Segmented campaign sending (Brief D7): pick a segment, see who it reaches
 * and who is excluded and why, send a test, send, and keep a log.
 */
import { z } from "zod"
import type { Db } from "../lib/db.js"
import type { Deps } from "../lib/deps.js"
import { ApiError, logError } from "../lib/http.js"
import { getSettings } from "../lib/settings.js"
import type { CampaignContent, CampaignRecipient } from "./provider.js"
import { renderCampaign, unknownMergeTags } from "./templates.js"

const PROGRAM = /^(camp|session):[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$|^miami:(boys|girls)$/

export const Segment = z.object({
  /** OR within: "camp:<id>", "session:<id>" or "miami:boys|girls". Empty = everyone. */
  programs: z.array(z.string().regex(PROGRAM)).max(60).default([]),
  /** OR within; matches the contact's town or the town on any of their registrations. */
  towns: z.array(z.string().trim().min(1).max(80)).max(200).default([]),
  /** OR within: how the contact joined the list. */
  sources: z.array(z.enum(["registration", "imported", "private_training", "waitlist"])).max(4).default([]),
  /** Contacts whose consent hasn't been confirmed are excluded unless this is on. */
  includeUnknownConsent: z.boolean().default(false),
})
export type Segment = z.infer<typeof Segment>

export const CampaignDraft = z
  .object({
    subject: z.string().trim().min(1).max(150),
    preheader: z.string().trim().max(150).optional(),
    heading: z.string().trim().max(120).optional(),
    body: z.string().trim().min(1).max(20_000),
  })
  .superRefine((d, ctx) => {
    const unknown = unknownMergeTags([d.subject, d.preheader, d.heading, d.body].filter(Boolean).join("\n"))
    if (unknown.length) {
      ctx.addIssue({ code: "custom", path: ["body"], message: `${unknown.join(", ")} isn't a personalisation tag. Use the Insert buttons, or remove it.` })
    }
  })

export interface AudienceContact {
  id: string
  email: string
  name: string | null
  town: string | null
  consent: "unknown" | "granted" | "denied"
  unsubscribed: boolean
  bounced: boolean
  sources: string[]
  programs: string[]
  kids: string[]
}

export interface Audience {
  matched: number
  recipients: AudienceContact[]
  excluded: { unsubscribed: number; bounced: number; denied: number; unknown: number }
}

export async function resolveAudience(db: Db, segment: Segment): Promise<Audience> {
  const campIds = segment.programs.filter((p) => p.startsWith("camp:")).map((p) => p.slice(5))
  const sessionIds = segment.programs.filter((p) => p.startsWith("session:")).map((p) => p.slice(8))
  const groups = segment.programs.filter((p) => p.startsWith("miami:")).map((p) => p.slice(6))
  const towns = segment.towns.map((t) => t.toLowerCase())

  const rows = await db<AudienceContact[]>`
    with reg as (
      select lower(r.parent_email) as email, r.camp_id, r.session_id, r.miami_group, lower(btrim(r.parent_town)) as town,
             coalesce(nullif(btrim(r.player_first_name), ''), split_part(btrim(r.player_name), ' ', 1)) as kid,
             case when r.miami_group is not null then 'Combine ' || initcap(r.miami_group) else c.name || ' – ' || coalesce(s.name, '') end as program
        from public.registrations r
        join public.payments p on p.id = r.payment_id
        join public.camps c on c.id = r.camp_id
        left join public.sessions s on s.id = r.session_id
       where r.status = 'active' and p.status <> 'refunded'
    )
    select ct.id, ct.email, ct.name, ct.town, ct.consent, ct.unsubscribed, ct.bounced, ct.sources,
           coalesce((select array_agg(distinct reg.program) from reg where reg.email = ct.email), '{}') as programs,
           coalesce((select array_agg(distinct reg.kid) from reg where reg.email = ct.email and reg.kid <> ''), '{}') as kids
      from public.contacts ct
     where (cardinality(${campIds}::uuid[]) + cardinality(${sessionIds}::uuid[]) + cardinality(${groups}::text[]) = 0
            or exists (select 1 from reg where reg.email = ct.email
                         and (reg.camp_id = any(${campIds}::uuid[]) or reg.session_id = any(${sessionIds}::uuid[]) or reg.miami_group = any(${groups}::text[]))))
       and (cardinality(${towns}::text[]) = 0
            or lower(btrim(ct.town)) = any(${towns}::text[])
            or exists (select 1 from reg where reg.email = ct.email and reg.town = any(${towns}::text[])))
       and (cardinality(${segment.sources}::text[]) = 0 or ct.sources && ${segment.sources}::text[])
     order by ct.email`

  const excluded = { unsubscribed: 0, bounced: 0, denied: 0, unknown: 0 }
  const recipients: AudienceContact[] = []
  for (const c of rows) {
    if (c.unsubscribed) excluded.unsubscribed++
    else if (c.bounced) excluded.bounced++
    else if (c.consent === "denied") excluded.denied++
    else if (c.consent === "unknown" && !segment.includeUnknownConsent) excluded.unknown++
    else recipients.push(c)
  }
  return { matched: rows.length, recipients, excluded }
}

function splitName(name: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean)
  return { firstName: parts[0] ?? null, lastName: parts.length > 1 ? parts.slice(1).join(" ") : null }
}

export function toRecipient(c: AudienceContact): CampaignRecipient {
  return { email: c.email, ...splitName(c.name), town: c.town, sources: c.sources, programs: c.programs, kids: c.kids }
}

async function content(deps: Deps, draft: z.infer<typeof CampaignDraft>): Promise<CampaignContent> {
  const settings = await getSettings(deps.db)
  if (!settings.mailing_address) {
    throw new ApiError(422, "validation_failed", "Add your business mailing address in Email setup first. Every marketing email must include it.")
  }
  const rendered = renderCampaign({ ...draft, mailingAddress: settings.mailing_address, logoUrl: settings.email_logo_url })
  const date = new Date().toLocaleDateString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric" })
  return {
    name: `${draft.subject} · ${date}`,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    preheader: draft.preheader,
    sender: { email: deps.env.emailFrom, name: deps.env.emailFromName },
    replyTo: settings.reply_to_email,
  }
}

/** Brevo's "sender invalid" error, explained for the dashboard. */
export function senderHint(message: string) {
  return /sender is invalid|inactive/i.test(message)
    ? `${message}. The From address (EMAIL_FROM) isn't an active sender in Brevo: verify it under Senders, Domains & Dedicated IPs, or authenticate its domain.`
    : message
}

export async function sendTestCampaign(deps: Deps, to: string, draft: z.infer<typeof CampaignDraft>) {
  const c = await content(deps, draft)
  await deps.email.sendTest(c, to)
  await deps.db`
    insert into public.email_log (kind, status, sent_by_email, template, subject, body, recipient_count, recipient_email)
    values ('campaign', 'test', ${to}, 'campaign', ${draft.subject}, ${draft.body}, 1, ${to})`
}

export async function sendCampaign(
  deps: Deps,
  admin: { id: string; email: string },
  input: { requestId: string; segment: Segment; draft: z.infer<typeof CampaignDraft> },
) {
  const c = await content(deps, input.draft)
  const audience = await resolveAudience(deps.db, input.segment)
  if (!audience.recipients.length) {
    throw new ApiError(422, "validation_failed", "Nobody in this segment can be emailed. Check the exclusions or widen the segment.")
  }

  const [log] = await deps.db<{ id: string }[]>`
    insert into public.email_log (kind, status, request_id, sent_by, sent_by_email, segment, template, subject, body, recipient_count, excluded)
    values ('campaign', 'sending', ${input.requestId}, ${admin.id}, ${admin.email}, ${deps.db.json(input.segment)}, 'campaign',
            ${input.draft.subject}, ${input.draft.body}, ${audience.recipients.length}, ${deps.db.json(audience.excluded)})
    on conflict (request_id) do nothing
    returning id`
  if (!log) {
    const [existing] = await deps.db`select id, status, recipient_count from public.email_log where request_id = ${input.requestId}`
    return { logId: existing!.id as string, status: existing!.status as string, recipients: existing!.recipient_count as number, duplicate: true }
  }

  try {
    const { campaignId } = await deps.email.sendCampaign(c, audience.recipients.map(toRecipient))
    await deps.db`update public.email_log set status = 'sent', provider_campaign_id = ${campaignId} where id = ${log.id}`
    await deps.db`update public.contacts set provider_synced_at = now() where id = any(${audience.recipients.map((r) => r.id)}::uuid[])`
    return { logId: log.id, status: "sent", recipients: audience.recipients.length, excluded: audience.excluded, duplicate: false }
  } catch (err) {
    logError("email.campaign", err)
    await deps.db`update public.email_log set status = 'failed', error = ${(err as Error).message.slice(0, 500)} where id = ${log.id}`
    throw new ApiError(502, "email_provider_error", `The email provider rejected the send: ${senderHint((err as Error).message)}`)
  }
}
