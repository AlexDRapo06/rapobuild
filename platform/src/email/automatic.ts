/**
 * Automatic parent emails (Brief D8). Transactional: sent regardless of
 * marketing unsubscribes, with a reply-to. Each registration gets one
 * confirmation and one reminder per configured offset, never twice: a row in
 * email_log claims the send before it happens (unique per registration and template).
 */
import type { Db } from "../lib/db.js"
import type { Deps } from "../lib/deps.js"
import { logError } from "../lib/http.js"
import { getSettings } from "../lib/settings.js"
import { renderConfirmation, renderReminder, type ProgramItem } from "./templates.js"

interface DetailRow {
  registration_id: string
  payment_id: string
  parent_email: string
  parent_first_name: string | null
  parent_name: string
  player_name: string
  miami_group: string | null
  camp_name: string
  session_name: string | null
  starts_on: string | null
  ends_on: string | null
  start_time: string | null
  end_time: string | null
  location: string | null
  info_text: string | null
  ship: string | null
  amount_total_cents: number
}

function dateRange(start: string | null, end: string | null) {
  if (!start) return "Dates to be confirmed"
  const fmt = (d: string, opts: Intl.DateTimeFormatOptions) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", ...opts })
  if (!end || end === start) return fmt(start, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
  return `${fmt(start, { month: "long", day: "numeric" })} – ${fmt(end, { month: "long", day: "numeric", year: "numeric" })}`
}

function clock(t: string | null) {
  if (!t) return null
  const [h, m] = t.split(":").map(Number)
  return new Date(Date.UTC(2000, 0, 1, h, m)).toLocaleTimeString("en-US", { timeZone: "UTC", hour: "numeric", minute: "2-digit" })
}

async function details(db: Db, registrationIds: string[]): Promise<DetailRow[]> {
  return db<DetailRow[]>`
    select r.id as registration_id, r.payment_id, r.parent_email, r.parent_first_name, r.parent_name, r.player_name, r.miami_group,
           case when r.miami_group is not null then e.name else c.name end as camp_name,
           case when r.miami_group is not null then g.label else s.name end as session_name,
           coalesce(s.starts_on, g.starts_on)::text as starts_on,
           coalesce(s.ends_on, g.ends_on)::text as ends_on,
           to_char(coalesce(s.start_time, g.daily_start_time), 'HH24:MI') as start_time,
           to_char(g.daily_end_time, 'HH24:MI') as end_time,
           coalesce(s.location, e.location) as location,
           s.info_text,
           case when r.ship_line1 is not null then concat_ws(', ', r.ship_line1, r.ship_line2, r.ship_city, r.ship_state || ' ' || r.ship_postal_code) end as ship,
           p.amount_total_cents
      from public.registrations r
      join public.payments p on p.id = r.payment_id
      join public.camps c on c.id = r.camp_id
      left join public.sessions s on s.id = r.session_id
      left join public.miami_groups g on g.grp = r.miami_group
      left join public.miami_event e on r.miami_group is not null
     where r.id = any(${registrationIds}::uuid[])
     order by r.line_no`
}

function toItems(rows: DetailRow[], miamiNote: string | null): ProgramItem[] {
  return rows.map((r) => {
    const time = r.start_time ? [clock(r.start_time), clock(r.end_time)].filter(Boolean).join(" – ") : null
    const info = r.miami_group
      ? [miamiNote, r.ship ? `Your GOINGFORGOAT x FOOTYUP package ships to: ${r.ship}` : null].filter(Boolean).join("\n") || null
      : r.info_text
    return { player: r.player_name, program: `${r.camp_name}${r.session_name ? ` – ${r.session_name}` : ""}`, dates: dateRange(r.starts_on, r.ends_on), time, location: r.location, info }
  })
}

const firstName = (r: DetailRow) => r.parent_first_name || r.parent_name.split(/\s+/)[0] || "there"
const money = (cents: number) => (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })

function groupBy<T>(rows: T[], key: (r: T) => string) {
  const map = new Map<string, T[]>()
  for (const r of rows) map.set(key(r), [...(map.get(key(r)) ?? []), r])
  return map
}

/** Sends any confirmations not yet sent (optionally for one payment). Safe to call repeatedly and concurrently. */
export async function sendConfirmations(deps: Deps, opts: { paymentId?: string } = {}): Promise<number> {
  const settings = await getSettings(deps.db)
  if (!settings.auto_confirmations) return 0
  const claimed = await deps.db<{ registration_id: string }[]>`
    insert into public.email_log (kind, status, template, registration_id, payment_id, recipient_email)
    select 'confirmation', 'sending', 'confirmation', r.id, r.payment_id, r.parent_email
      from public.registrations r
      join public.payments p on p.id = r.payment_id
     where r.status = 'active' and p.status <> 'refunded'
       and r.created_at > now() - interval '3 days'
       and (${opts.paymentId ?? null}::uuid is null or r.payment_id = ${opts.paymentId ?? null}::uuid)
    on conflict do nothing
    returning registration_id`
  if (!claimed.length) return 0

  let sent = 0
  const rows = await details(deps.db, claimed.map((c) => c.registration_id))
  for (const [, group] of groupBy(rows, (r) => r.payment_id)) {
    const ids = group.map((r) => r.registration_id)
    try {
      const email = renderConfirmation({
        parentFirstName: firstName(group[0]!),
        items: toItems(group, settings.miami_confirmation_note),
        totalPaid: money(group[0]!.amount_total_cents),
        replyTo: settings.reply_to_email,
        mailingAddress: settings.mailing_address,
        logoUrl: settings.email_logo_url,
      })
      const outcome = await deps.mailer.send({ to: group[0]!.parent_email, subject: email.subject, html: email.html, text: email.text, replyTo: settings.reply_to_email ?? undefined })
      await deps.db`update public.email_log set status = ${outcome} where kind = 'confirmation' and registration_id = any(${ids}::uuid[])`
      if (outcome === "sent") sent++
    } catch (err) {
      logError("email.confirmation", err)
      // Release the claim so the next cron run retries.
      await deps.db`delete from public.email_log where kind = 'confirmation' and status = 'sending' and registration_id = any(${ids}::uuid[])`
    }
  }
  return sent
}

/** Sends reminders due today (per-session `reminder_days`, Miami uses the `miami_reminder_days` setting). */
export async function sendReminders(deps: Deps): Promise<number> {
  const settings = await getSettings(deps.db)
  if (!settings.auto_reminders) return 0
  const claimed = await deps.db<{ registration_id: string; template: string }[]>`
    insert into public.email_log (kind, status, template, registration_id, payment_id, recipient_email)
    select 'reminder', 'sending', 'reminder-' || d, r.id, r.payment_id, r.parent_email
      from public.registrations r
      join public.payments p on p.id = r.payment_id
      left join public.sessions s on s.id = r.session_id
      left join public.miami_groups g on g.grp = r.miami_group
     cross join lateral unnest(case when r.session_id is not null then s.reminder_days else ${settings.miami_reminder_days}::int[] end) as d
     where r.status = 'active' and p.status <> 'refunded'
       and coalesce(s.starts_on, g.starts_on) = public.app_today() + d
    on conflict do nothing
    returning registration_id, template`
  if (!claimed.length) return 0

  const daysOf = new Map(claimed.map((c) => [c.registration_id, Number(c.template.slice(9))]))
  const rows = await details(deps.db, claimed.map((c) => c.registration_id))
  let sent = 0
  for (const [, group] of groupBy(rows, (r) => `${r.payment_id}:${daysOf.get(r.registration_id)}`)) {
    const days = daysOf.get(group[0]!.registration_id)!
    const ids = group.map((r) => r.registration_id)
    try {
      const email = renderReminder({
        parentFirstName: firstName(group[0]!),
        daysBefore: days,
        items: toItems(group, null),
        note: settings.reminder_note,
        replyTo: settings.reply_to_email,
        mailingAddress: settings.mailing_address,
        logoUrl: settings.email_logo_url,
      })
      const outcome = await deps.mailer.send({ to: group[0]!.parent_email, subject: email.subject, html: email.html, text: email.text, replyTo: settings.reply_to_email ?? undefined })
      await deps.db`update public.email_log set status = ${outcome} where kind = 'reminder' and template = ${`reminder-${days}`} and registration_id = any(${ids}::uuid[])`
      if (outcome === "sent") sent++
    } catch (err) {
      logError("email.reminder", err)
      await deps.db`delete from public.email_log where kind = 'reminder' and status = 'sending' and template = ${`reminder-${days}`} and registration_id = any(${ids}::uuid[])`
    }
  }
  return sent
}
