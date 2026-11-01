import { z } from "zod"
import { asAdmin, requireAdmin } from "../lib/admin-auth.js"
import type { Deps } from "../lib/deps.js"
import { GuardedEmailProvider } from "../lib/email-guard.js"
import { ApiError, json, parse, readJson } from "../lib/http.js"
import { DASHBOARD_SETTINGS, getSettings } from "../lib/settings.js"
import { CampaignDraft, resolveAudience, Segment, sendCampaign, senderHint, sendTestCampaign } from "../email/campaigns.js"
import { fileToText, parseContacts } from "../email/import.js"
import { checkDns } from "../email/links.js"
import { EmailNotConfigured } from "../email/provider.js"

type Handler = (req: Request, deps: Deps) => Promise<Response>

/** GET contacts: the master list (D6). */
const contacts: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const rows = await asAdmin(
    deps,
    user,
    (tx) => tx`
      select c.id, c.email, c.name, c.phone, c.town, c.sources, c.consent, c.unsubscribed, c.unsubscribed_at, c.bounced,
             c.created_at, c.updated_at, c.provider_synced_at,
             (select count(*)::int from public.registrations r where lower(r.parent_email) = c.email) as registrations
        from public.contacts c
       order by c.created_at desc`,
  )
  const imports = await asAdmin(
    deps,
    user,
    (tx) => tx`
      select i.id, i.created_at, i.created_by_email, i.filename, i.consent, i.found, i.imported, i.merged, i.duplicates, i.rejected_count,
             (select count(*)::int from public.contacts c where c.last_import_id = i.id and c.consent = 'unknown') as still_unknown
        from public.contact_imports i order by i.created_at desc limit 20`,
  )
  return json({ contacts: rows, imports })
}

const ContactUpdate = z.object({
  id: z.uuid(),
  consent: z.enum(["unknown", "granted", "denied"]).optional(),
  unsubscribed: z.boolean().optional(),
})

/** POST contact-update: change consent or unsubscribe/resubscribe one contact. */
const contactUpdate: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const body = parse(ContactUpdate, await readJson(req))
  const [row] = await asAdmin(
    deps,
    user,
    (tx) => tx<{ email: string; unsubscribed: boolean }[]>`
      update public.contacts set
        consent = coalesce(${body.consent ?? null}, consent),
        consent_updated_at = case when ${body.consent ?? null}::text is not null then now() else consent_updated_at end,
        unsubscribed = coalesce(${body.unsubscribed ?? null}, unsubscribed),
        unsubscribed_at = case when ${body.unsubscribed ?? null}::boolean is true then now()
                               when ${body.unsubscribed ?? null}::boolean is false then null else unsubscribed_at end
       where id = ${body.id}
      returning email, unsubscribed`,
  )
  if (!row) throw new ApiError(404, "not_found", "Contact not found.")
  if (body.unsubscribed !== undefined) await deps.email.setBlocked(row.email, body.unsubscribed).catch(() => {})
  return json({ ok: true })
}

const ImportRequest = z.object({
  filename: z.string().trim().max(200).default("pasted text"),
  /** File contents, base64. */
  data: z.string().max(5_500_000).optional(),
  /** Or pasted text. */
  text: z.string().max(2_000_000).optional(),
  consent: z.enum(["unknown", "granted"]).default("unknown"),
  dryRun: z.boolean().default(true),
})

/** POST contacts-import: preview (dryRun) or run an import. Safe to repeat. */
const contactsImport: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const body = parse(ImportRequest, await readJson(req, 7_500_000))
  if (!body.data && !body.text) throw new ApiError(400, "validation_failed", "Choose a file or paste the contact list.")
  let text: string
  try {
    text = body.text ?? fileToText(body.filename, Buffer.from(body.data!, "base64"))
  } catch (err) {
    throw new ApiError(400, "validation_failed", (err as Error).message)
  }
  const parsed = parseContacts(text)
  const emails = parsed.contacts.map((c) => c.email)
  const existing = new Set(
    (await deps.db<{ email: string }[]>`select email from public.contacts where email = any(${emails}::text[])`).map((r) => r.email),
  )
  const report = {
    found: parsed.contacts.length + parsed.duplicates,
    imported: parsed.contacts.filter((c) => !existing.has(c.email)).length,
    merged: parsed.contacts.filter((c) => existing.has(c.email)).length,
    duplicates: parsed.duplicates,
    rejected: parsed.rejected,
    sample: parsed.contacts.slice(0, 8),
  }
  if (body.dryRun || !parsed.contacts.length) return json({ dryRun: true, ...report })

  const importId = await deps.db.begin(async (tx) => {
    const [imp] = await tx<{ id: string }[]>`
      insert into public.contact_imports (created_by_email, filename, consent, found, imported, merged, duplicates, rejected_count, rejected)
      values (${user.email}, ${body.filename}, ${body.consent}, ${report.found}, ${report.imported}, ${report.merged}, ${report.duplicates},
              ${report.rejected.length}, ${tx.json(report.rejected.slice(0, 500))})
      returning id`
    await tx`
      insert into public.contacts as c (email, name, phone, town, sources, consent, consent_updated_at, last_import_id)
      select u.email, u.name, u.phone, u.town, array['imported'], ${body.consent},
             case when ${body.consent} = 'granted' then now() end, ${imp!.id}
        from unnest(${emails}::text[], ${parsed.contacts.map((c) => c.name)}::text[], ${parsed.contacts.map((c) => c.phone)}::text[],
                    ${parsed.contacts.map((c) => c.town)}::text[]) as u(email, name, phone, town)
      on conflict (email) do update set
        name = coalesce(c.name, excluded.name),
        phone = coalesce(c.phone, excluded.phone),
        town = coalesce(c.town, excluded.town),
        sources = case when 'imported' = any(c.sources) then c.sources else c.sources || 'imported'::text end,
        consent = case when excluded.consent = 'granted' and c.consent = 'unknown' then 'granted' else c.consent end,
        consent_updated_at = case when excluded.consent = 'granted' and c.consent = 'unknown' then now() else c.consent_updated_at end,
        last_import_id = excluded.last_import_id`
    return imp!.id
  })
  return json({ dryRun: false, importId, ...report })
}

/** POST contacts-consent: once the client confirms how an import's contacts agreed, mark that batch. */
const contactsConsent: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const body = parse(z.object({ importId: z.uuid(), consent: z.enum(["granted", "denied"]) }), await readJson(req))
  const rows = await asAdmin(
    deps,
    user,
    (tx) => tx`
      update public.contacts set consent = ${body.consent}, consent_updated_at = now()
       where last_import_id = ${body.importId} and consent = 'unknown'
      returning id`,
  )
  return json({ updated: rows.length })
}

/** GET email-options: what the segment picker can choose from. */
const emailOptions: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  return json(
    await asAdmin(deps, user, async (tx) => {
      const camps = await tx`
        with fam as (
          select r.camp_id, r.session_id, r.miami_group, lower(r.parent_email) as email
            from public.registrations r join public.payments p on p.id = r.payment_id
           where r.status = 'active' and p.status <> 'refunded'
        )
        select c.id, c.name, c.kind, c.active,
               (select count(distinct email)::int from fam where fam.camp_id = c.id) as families,
               coalesce(json_agg(json_build_object(
                 'id', s.id, 'name', s.name, 'starts_on', s.starts_on, 'ends_on', s.ends_on, 'age_min', s.age_min, 'age_max', s.age_max,
                 'families', (select count(distinct email) from fam where fam.session_id = s.id)
               ) order by s.sort_order, s.starts_on) filter (where s.id is not null), '[]') as sessions
          from public.camps c left join public.sessions s on s.camp_id = c.id
         where c.kind <> 'miami' and not c.info_only
         group by c.id order by c.sort_order, c.name`
      const groups = await tx`
        select g.grp, g.label, g.starts_on::text, g.ends_on::text,
               (select count(distinct lower(r.parent_email))::int from public.registrations r join public.payments p on p.id = r.payment_id
                 where r.miami_group = g.grp and r.status = 'active' and p.status <> 'refunded') as families
          from public.miami_groups g order by g.grp`
      const towns = await tx`
        select initcap(t) as town, count(*)::int as contacts from (
          select lower(btrim(town)) as t from public.contacts where town is not null and btrim(town) <> ''
        ) x group by t order by count(*) desc, t limit 300`
      const [miami] = await tx`select name from public.miami_event`
      return { camps, towns, miami: miami ? { name: miami.name, groups } : null }
    }).then(async (options) => {
      const settings = await getSettings(deps.db)
      return {
        ...options,
        me: user.email,
        testRecipients: deps.email instanceof GuardedEmailProvider ? (process.env.EMAIL_TEST_RECIPIENTS ?? "").split(/[,\s]+/).filter(Boolean) : null,
        mode: deps.email.mode,
        sender: { email: deps.env.emailFrom, name: deps.env.emailFromName },
        brand: { mailingAddress: settings.mailing_address, logoUrl: settings.email_logo_url, replyTo: settings.reply_to_email },
      }
    }),
  )
}

/** POST email-audience: who a segment reaches and who's excluded. */
const emailAudience: Handler = async (req, deps) => {
  await requireAdmin(req, deps)
  const segment = parse(Segment, await readJson(req))
  const audience = await resolveAudience(deps.db, segment)
  return json({
    matched: audience.matched,
    sendable: audience.recipients.length,
    excluded: audience.excluded,
    sample: audience.recipients.slice(0, 6).map((r) => ({ email: r.email, name: r.name, town: r.town, kids: r.kids, programs: r.programs })),
  })
}

/** POST email-test: send the draft to the signed-in admin only. */
const emailTest: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const body = await readJson(req)
  const draft = parse(CampaignDraft, body)
  const { to } = parse(z.object({ to: z.string().trim().toLowerCase().pipe(z.email({ error: "Enter a valid email address for the test." })).optional().or(z.literal("").transform(() => undefined)) }), body)
  const recipient = to ?? user.email
  try {
    await sendTestCampaign(deps, recipient, draft)
  } catch (err) {
    if (err instanceof EmailNotConfigured) throw new ApiError(503, "internal_error", err.message)
    if (err instanceof ApiError) throw err
    throw new ApiError(502, "email_provider_error", `The test didn't send: ${senderHint((err as Error).message)}`)
  }
  return json({ ok: true, to: recipient })
}

const SendRequest = z.object({ requestId: z.uuid(), segment: Segment, draft: CampaignDraft })

/** POST email-send */
const emailSend: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const body = parse(SendRequest, await readJson(req))
  if (deps.email.mode === "none") throw new ApiError(503, "internal_error", "Brevo isn't connected yet. Add BREVO_API_KEY to the server settings.")
  return json(await sendCampaign(deps, user, body))
}

/** GET email-history: campaigns, tests and automatic emails. */
const emailHistory: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  return json(
    await asAdmin(deps, user, async (tx) => {
      const campaigns = await tx`
        select id, created_at, status, sent_by_email, segment, subject, body, recipient_count, excluded, provider_campaign_id, error
          from public.email_log where kind = 'campaign' order by created_at desc limit 200`
      const automatic = await tx`
        select kind, template, status, count(*)::int as count, max(created_at) as last_sent
          from public.email_log where kind in ('confirmation', 'reminder')
         group by kind, template, status order by kind, template`
      return { campaigns, automatic }
    }),
  )
}

/** GET email-setup: everything needed to send safely, in one place. */
/** Where Brevo should report unsubscribes and bounces: this deployment's public address. */
const webhookTarget = (deps: Deps) =>
  deps.env.brevoWebhookSecret ? `${deps.env.apiUrl}/api/email/brevo-webhook?token=${encodeURIComponent(deps.env.brevoWebhookSecret)}` : null

const emailSetup: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const settings = await getSettings(deps.db)
  const target = webhookTarget(deps)
  const [provider, dns, counts, webhook] = await Promise.all([
    deps.email.status(deps.env.emailDomain, deps.env.emailFrom),
    checkDns(deps.env.emailDomain).catch(() => []),
    asAdmin(
      deps,
      user,
      (tx) => tx`
        select count(*)::int as total,
               count(*) filter (where not unsubscribed and not bounced and consent = 'granted')::int as consented,
               count(*) filter (where not unsubscribed and not bounced and consent = 'unknown')::int as unknown,
               count(*) filter (where unsubscribed)::int as unsubscribed,
               count(*) filter (where bounced)::int as bounced
          from public.contacts`,
    ),
    target && deps.email.mode !== "none" ? deps.email.webhookStatus(target).catch(() => null) : Promise.resolve(null),
  ])
  const guarded = deps.email instanceof GuardedEmailProvider
  return json({
    mode: deps.email.mode,
    testRecipients: guarded ? (process.env.EMAIL_TEST_RECIPIENTS ?? "").split(/[,\s]+/).filter(Boolean) : null,
    sender: { email: deps.env.emailFrom, name: deps.env.emailFromName },
    domain: deps.env.emailDomain,
    webhookUrl: `${deps.env.apiUrl}/api/email/brevo-webhook?token=${deps.env.brevoWebhookSecret ? "<BREVO_WEBHOOK_SECRET>" : "<set BREVO_WEBHOOK_SECRET first>"}`,
    webhookConfigured: Boolean(deps.env.brevoWebhookSecret),
    webhook: webhook ? { ...webhook, address: `${deps.env.apiUrl}/api/email/brevo-webhook` } : null,
    siteUrl: deps.env.siteUrl,
    adminUrl: deps.env.adminUrl ?? null,
    provider,
    dns,
    contacts: counts[0],
    settings: Object.fromEntries(DASHBOARD_SETTINGS.map((k) => [k, settings[k]])),
  })
}

const SettingsUpdate = z
  .object({
    notify_email: z.email().nullable(),
    reply_to_email: z.email().nullable(),
    mailing_address: z.string().trim().min(10).max(300).nullable(),
    email_logo_url: z.url().startsWith("https://").nullable(),
    auto_confirmations: z.boolean(),
    auto_reminders: z.boolean(),
    reminder_note: z.string().trim().max(1000).nullable(),
    miami_confirmation_note: z.string().trim().max(1000).nullable(),
  })
  .partial()

/** POST email-settings */
const emailSettings: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const body = parse(SettingsUpdate, await readJson(req))
  await asAdmin(deps, user, async (tx) => {
    for (const [key, value] of Object.entries(body)) {
      const v = typeof value === "string" && !value.trim() ? null : value
      await tx`insert into public.settings (key, value) values (${key}, ${tx.json(v as never)})
               on conflict (key) do update set value = excluded.value, updated_at = now()`
    }
  })
  return json({ ok: true })
}

/** POST email-webhook: point Brevo's unsubscribe/bounce webhooks at this deployment (repeat after a domain change). */
const emailWebhook: Handler = async (req, deps) => {
  await requireAdmin(req, deps)
  const target = webhookTarget(deps)
  if (!target) throw new ApiError(422, "validation_failed", "Set BREVO_WEBHOOK_SECRET on the server first.")
  try {
    return json({ ok: true, webhook: await deps.email.connectWebhooks(target) })
  } catch (err) {
    throw new ApiError(502, "email_provider_error", (err as Error).message)
  }
}

/** POST email-domain: add the sending domain to Brevo, or ask Brevo to re-check its DNS. */
const emailDomain: Handler = async (req, deps) => {
  await requireAdmin(req, deps)
  const { action } = parse(z.object({ action: z.enum(["add", "authenticate"]) }), await readJson(req))
  try {
    if (action === "add") await deps.email.addDomain(deps.env.emailDomain)
    else await deps.email.authenticateDomain(deps.env.emailDomain)
  } catch (err) {
    throw new ApiError(502, "email_provider_error", (err as Error).message)
  }
  return json({ ok: true })
}

export const EMAIL_GET: Record<string, Handler> = {
  contacts,
  "email-options": emailOptions,
  "email-history": emailHistory,
  "email-setup": emailSetup,
}

export const EMAIL_POST: Record<string, Handler> = {
  "contact-update": contactUpdate,
  "contacts-import": contactsImport,
  "contacts-consent": contactsConsent,
  "email-audience": emailAudience,
  "email-test": emailTest,
  "email-send": emailSend,
  "email-settings": emailSettings,
  "email-domain": emailDomain,
  "email-webhook": emailWebhook,
}
