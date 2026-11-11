/**
 * Dashboard management (Brief D5, D9-D14): settings that change without a
 * deploy, analytics, revenue, rosters, cancellations and waitlist actions.
 */
import { z } from "zod"
import { asAdmin, requireAdmin } from "../lib/admin-auth.js"
import type { Db } from "../lib/db.js"
import type { Deps } from "../lib/deps.js"
import { hashAccessCode } from "../lib/guards.js"
import { ApiError, json, parse, readJson } from "../lib/http.js"
import { getSettings } from "../lib/settings.js"
import { offerNext, processWaitlistsQuietly } from "../lib/waitlist.js"

type Handler = (req: Request, deps: Deps) => Promise<Response>

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const hhmm = z.string().regex(/^\d{2}:\d{2}$/)
const cents = z.int().min(0).max(10_000_000)
const nullableText = (max: number) => z.string().trim().max(max).nullable().transform((v) => (v ? v : null))

function slugify(name: string) {
  return name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "item"
}

const SiteId = z
  .string()
  .trim()
  .regex(/^[a-z0-9][a-z0-9_-]{0,79}$/, "Use lowercase letters, numbers, - or _ (e.g. dover_2027)")
  .optional()
  .or(z.literal("").transform(() => undefined))

/** A chosen id must match the live site's code exactly, so it is never renamed to make it unique. */
async function chosenSlug(tx: Db, slug: string, table: "camps" | "sessions", campId?: string) {
  const taken =
    table === "camps"
      ? await tx`select 1 from public.camps where slug = ${slug}`
      : await tx`select 1 from public.sessions where camp_id = ${campId!} and slug = ${slug}`
  if (taken.length) throw new ApiError(422, "validation_failed", `The id "${slug}" is already used.`)
  return slug
}

async function uniqueSlug(tx: Db, base: string, table: "camps" | "sessions", campId?: string) {
  for (let i = 0; i < 50; i++) {
    const slug = i ? `${base}-${i + 1}` : base
    const taken =
      table === "camps"
        ? await tx`select 1 from public.camps where slug = ${slug}`
        : await tx`select 1 from public.sessions where camp_id = ${campId!} and slug = ${slug}`
    if (!taken.length) return slug
  }
  return `${base}-${Date.now()}`
}

// ---------------------------------------------------------------------------
// Settings data
// ---------------------------------------------------------------------------

const settingsData: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const settings = await getSettings(deps.db)
  return json(
    await asAdmin(deps, user, async (tx) => {
      const camps = await tx`
        select c.id, c.slug, c.name, c.host, c.kind, c.info_only, c.active, c.description, c.info_url, c.sort_order, c.site_route,
               coalesce(json_agg(json_build_object(
                 'id', s.id, 'name', s.name, 'slug', s.slug, 'starts_on', s.starts_on, 'ends_on', s.ends_on,
                 'start_time', to_char(s.start_time, 'HH24:MI'), 'location', s.location, 'age_min', s.age_min, 'age_max', s.age_max,
                 'price_cents', s.price_cents, 'early_bird_price_cents', s.early_bird_price_cents, 'early_bird_until', s.early_bird_until,
                 'capacity', s.capacity, 'status', s.status, 'info_text', s.info_text, 'reminder_days', s.reminder_days, 'sort_order', s.sort_order,
                 'taken', public.session_taken(s.id), 'closes_at', s.closes_at
               ) order by s.sort_order, s.starts_on) filter (where s.id is not null), '[]') as sessions
          from public.camps c left join public.sessions s on s.camp_id = c.id
         where c.kind <> 'miami'
         group by c.id order by c.sort_order, c.name`
      const [event] = await tx`
        select name, location, info_text, opens_at, public_opens_at, closes_at, checkout_open, hold_minutes, waiver_required,
               reserved_total, reserved_until, positions, shirt_sizes, short_sizes, price_tiers, grad_years from public.miami_event`
      const groups = await tx`
        select g.grp, g.label, g.cap, g.starts_on, g.ends_on, to_char(g.daily_start_time, 'HH24:MI') as daily_start_time,
               to_char(g.daily_end_time, 'HH24:MI') as daily_end_time, g.reserved_for_code_holders, g.reserved_until,
               g.price_code_holder_cents, g.price_public_cents, g.open, g.age_min, g.age_max, a.code_taken + a.public_taken as taken
          from public.miami_groups g join public.miami_availability() a on a.grp = g.grp order by g.grp`
      const codes = await tx`select id, label, grp, active, ends_at, created_at from public.access_codes order by created_at desc`
      const waivers = await tx`select id, flow, version, title, body, url, active, created_at from public.waivers order by flow, version desc`
      const promos = await tx`
        select p.*, (select count(*)::int from public.payments x where x.promo_code_id = p.id and x.status <> 'refunded') as uses
          from public.promo_codes p order by p.created_at desc`
      return {
        camps,
        miami: event ? { event, groups } : null,
        codes,
        waivers,
        promos,
        pricing: {
          sibling_discount: settings.sibling_discount,
          waitlist_hold_hours: settings.waitlist_hold_hours,
          camp_waiver_required: settings.camp_waiver_required,
          camp_hold_minutes: settings.camp_hold_minutes,
          timezone: settings.timezone,
        },
        trainingPackages: settings.training_packages,
      }
    }),
  )
}

// ---------------------------------------------------------------------------
// Camps and sessions (D2, D5)
// ---------------------------------------------------------------------------

const CampInput = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2).max(120),
  host: nullableText(120),
  kind: z.enum(["summer", "winter", "other"]),
  infoOnly: z.boolean(),
  active: z.boolean(),
  description: nullableText(2000),
  infoUrl: z.union([z.url(), z.literal(""), z.null()]).transform((v) => v || null),
  sortOrder: z.int().min(0).max(999).default(0),
  siteRoute: nullableText(120).optional(),
  slug: SiteId,
})

const campSave: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const c = parse(CampInput, await readJson(req))
  const id = await asAdmin(deps, user, async (tx) => {
    if (c.id) {
      const rows = await tx`
        update public.camps set name = ${c.name}, host = ${c.host}, kind = ${c.kind}, info_only = ${c.infoOnly}, active = ${c.active},
               description = ${c.description}, info_url = ${c.infoUrl}, sort_order = ${c.sortOrder}, site_route = ${c.siteRoute ?? null}
         where id = ${c.id} and kind <> 'miami' returning id`
      if (!rows.length) throw new ApiError(404, "not_found", "Camp not found.")
      return c.id
    }
    const slug = c.slug ? await chosenSlug(tx, c.slug, "camps") : await uniqueSlug(tx, slugify(c.name), "camps")
    const [row] = await tx`
      insert into public.camps (slug, name, host, kind, info_only, active, description, info_url, sort_order, site_route)
      values (${slug}, ${c.name}, ${c.host}, ${c.kind}, ${c.infoOnly}, ${c.active}, ${c.description}, ${c.infoUrl}, ${c.sortOrder}, ${c.siteRoute ?? null})
      returning id`
    return row!.id as string
  })
  return json({ ok: true, id })
}

const SessionInput = z
  .object({
    id: z.uuid().optional(),
    campId: z.uuid(),
    name: z.string().trim().min(2).max(120),
    startsOn: isoDate.nullable(),
    endsOn: isoDate.nullable(),
    startTime: hhmm.nullable(),
    location: nullableText(200),
    ageMin: z.int().min(0).max(25).nullable(),
    ageMax: z.int().min(0).max(25).nullable(),
    priceCents: cents,
    earlyBirdPriceCents: cents.nullable(),
    earlyBirdUntil: isoDate.nullable(),
    capacity: z.int().min(1).max(10_000).nullable(),
    status: z.enum(["open", "closed"]),
    infoText: nullableText(2000),
    reminderDays: z.array(z.int().min(0).max(60)).max(5),
    sortOrder: z.int().min(0).max(999).default(0),
    closesAt: z.iso.datetime({ offset: true }).nullable().default(null),
    slug: SiteId,
  })
  .refine((s) => !s.endsOn || !s.startsOn || s.endsOn >= s.startsOn, { message: "End date must be on or after the start date", path: ["endsOn"] })
  .refine((s) => s.ageMax === null || s.ageMin === null || s.ageMax >= s.ageMin, { message: "Max age must be at least the min age", path: ["ageMax"] })
  .refine((s) => (s.earlyBirdPriceCents === null) === (s.earlyBirdUntil === null), { message: "Set both the early-bird price and its end date, or neither", path: ["earlyBirdUntil"] })

const sessionSave: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const s = parse(SessionInput, await readJson(req))
  const id = await asAdmin(deps, user, async (tx) => {
    if (s.capacity !== null && s.id) {
      const [t] = await tx`select public.session_taken(${s.id}) as taken`
      if (Number(t!.taken) > s.capacity) throw new ApiError(422, "validation_failed", `${t!.taken} spots are already taken; capacity can't be lower than that.`)
    }
    const values = {
      name: s.name, starts_on: s.startsOn, ends_on: s.endsOn, start_time: s.startTime, location: s.location, age_min: s.ageMin, age_max: s.ageMax,
      price_cents: s.priceCents, early_bird_price_cents: s.earlyBirdPriceCents, early_bird_until: s.earlyBirdUntil, capacity: s.capacity,
      status: s.status, info_text: s.infoText, reminder_days: s.reminderDays, sort_order: s.sortOrder,
    }
    if (s.id) {
      const rows = await tx`
        update public.sessions set name = ${values.name}, starts_on = ${values.starts_on}, ends_on = ${values.ends_on}, start_time = ${values.start_time},
               location = ${values.location}, age_min = ${values.age_min}, age_max = ${values.age_max}, price_cents = ${values.price_cents},
               early_bird_price_cents = ${values.early_bird_price_cents}, early_bird_until = ${values.early_bird_until}, capacity = ${values.capacity},
               status = ${values.status}, info_text = ${values.info_text}, reminder_days = ${values.reminder_days}, sort_order = ${values.sort_order},
               closes_at = ${s.closesAt}
         where id = ${s.id} and camp_id = ${s.campId} returning id`
      if (!rows.length) throw new ApiError(404, "not_found", "Session not found.")
      return s.id
    }
    const slug = s.slug ? await chosenSlug(tx, s.slug, "sessions", s.campId) : await uniqueSlug(tx, slugify(s.name), "sessions", s.campId)
    const [row] = await tx`
      insert into public.sessions (camp_id, slug, name, starts_on, ends_on, start_time, location, age_min, age_max, price_cents,
                                   early_bird_price_cents, early_bird_until, capacity, status, info_text, reminder_days, sort_order, closes_at)
      values (${s.campId}, ${slug}, ${values.name}, ${values.starts_on}, ${values.ends_on}, ${values.start_time}, ${values.location},
              ${values.age_min}, ${values.age_max}, ${values.price_cents}, ${values.early_bird_price_cents}, ${values.early_bird_until},
              ${values.capacity}, ${values.status}, ${values.info_text}, ${values.reminder_days}, ${values.sort_order}, ${s.closesAt})
      returning id`
    return row!.id as string
  })
  await processWaitlistsQuietly(deps)
  return json({ ok: true, id })
}

// ---------------------------------------------------------------------------
// Miami (D3, D5)
// ---------------------------------------------------------------------------

const datetime = z.iso.datetime({ offset: true }).nullable()
const MiamiInput = z.object({
  event: z.object({
    name: z.string().trim().min(2).max(160),
    location: nullableText(200),
    infoText: nullableText(5000),
    opensAt: datetime,
    publicOpensAt: datetime,
    closesAt: datetime,
    checkoutOpen: z.boolean(),
    waiverRequired: z.boolean(),
    reservedTotal: z.int().min(0).max(10_000),
    reservedUntil: datetime,
    positions: z.array(z.string().trim().min(1).max(40)).max(30),
    shirtSizes: z.array(z.string().trim().min(1).max(16)).max(30),
    shortSizes: z.array(z.string().trim().min(1).max(16)).max(30),
    gradYears: z.array(z.string().trim().min(1).max(8)).max(20).default([]),
    priceTiers: z.array(z.object({ until: datetime, cents })).max(6).default([]),
  }),
  groups: z
    .array(
      z.object({
        grp: z.enum(["boys", "girls"]),
        label: z.string().trim().min(1).max(40),
        cap: z.int().min(0).max(10_000),
        ageMin: z.int().min(0).max(25).nullable().default(null),
        ageMax: z.int().min(0).max(25).nullable().default(null),
        startsOn: isoDate.nullable(),
        endsOn: isoDate.nullable(),
        dailyStartTime: hhmm.nullable(),
        dailyEndTime: hhmm.nullable(),
        reservedForCodeHolders: z.int().min(0).max(10_000),
        reservedUntil: datetime,
        priceCodeHolderCents: cents.nullable(),
        pricePublicCents: cents.nullable(),
        open: z.boolean(),
      }),
    )
    .length(2),
})

const miamiSave: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const { event: e, groups } = parse(MiamiInput, await readJson(req))
  await asAdmin(deps, user, async (tx) => {
    const taken = await tx<{ grp: string; taken: number }[]>`select grp, (code_taken + public_taken)::int as taken from public.miami_availability()`
    for (const g of groups) {
      const t = taken.find((x) => x.grp === g.grp)?.taken ?? 0
      if (g.cap < t) throw new ApiError(422, "validation_failed", `${t} ${g.label.toLowerCase()} spots are already taken; the limit can't be lower than that.`)
      if (g.reservedForCodeHolders > g.cap) throw new ApiError(422, "validation_failed", `${g.label}: reserved spots can't exceed the limit.`)
    }
    if (e.reservedTotal > groups.reduce((s, g) => s + g.cap, 0)) throw new ApiError(422, "validation_failed", "Reserved spots can't exceed the total of both limits.")
    const dates = groups.flatMap((g) => [g.startsOn, g.endsOn]).filter((d): d is string => Boolean(d)).sort()
    await tx`
      update public.miami_event set name = ${e.name}, location = ${e.location}, info_text = ${e.infoText}, opens_at = ${e.opensAt},
             public_opens_at = ${e.publicOpensAt}, closes_at = ${e.closesAt}, checkout_open = ${e.checkoutOpen}, waiver_required = ${e.waiverRequired},
             reserved_total = ${e.reservedTotal}, reserved_until = ${e.reservedUntil}, positions = ${e.positions},
             shirt_sizes = ${e.shirtSizes}, short_sizes = ${e.shortSizes}, starts_on = ${dates[0] ?? null}, ends_on = ${dates.at(-1) ?? null},
             price_tiers = ${tx.json(e.priceTiers)}, grad_years = ${e.gradYears}`
    for (const g of groups) {
      await tx`
        update public.miami_groups set label = ${g.label}, cap = ${g.cap}, starts_on = ${g.startsOn}, ends_on = ${g.endsOn},
               daily_start_time = ${g.dailyStartTime}, daily_end_time = ${g.dailyEndTime}, reserved_for_code_holders = ${g.reservedForCodeHolders},
               reserved_until = ${g.reservedUntil}, price_code_holder_cents = ${g.priceCodeHolderCents}, price_public_cents = ${g.pricePublicCents},
               open = ${g.open}, age_min = ${g.ageMin}, age_max = ${g.ageMax}
         where grp = ${g.grp}`
    }
  })
  await processWaitlistsQuietly(deps)
  return json({ ok: true })
}

const AccessCodeInput = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("add"),
    code: z.string().trim().min(4).max(64),
    label: nullableText(80),
    group: z.enum(["boys", "girls"]).nullable(),
    endsAt: datetime,
  }),
  z.object({ action: z.literal("update"), id: z.uuid(), active: z.boolean(), endsAt: datetime }),
])

/** The code itself is hashed immediately; nobody can read it back, including admins. */
const accessCode: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const body = parse(AccessCodeInput, await readJson(req))
  await asAdmin(deps, user, async (tx) => {
    if (body.action === "add") {
      await tx`
        insert into public.access_codes (code_hash, label, grp, ends_at) values (${hashAccessCode(body.code)}, ${body.label}, ${body.group}, ${body.endsAt})
        on conflict (code_hash) do update set active = true, label = excluded.label, grp = excluded.grp, ends_at = excluded.ends_at`
    } else {
      await tx`update public.access_codes set active = ${body.active}, ends_at = ${body.endsAt} where id = ${body.id}`
    }
  })
  return json({ ok: true })
}

// ---------------------------------------------------------------------------
// Waivers (D13), discounts and promo codes (D10)
// ---------------------------------------------------------------------------

const waiverPublish: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const w = parse(
    z.object({ flow: z.enum(["camp", "miami", "all"]), title: z.string().trim().min(2).max(160), body: z.string().trim().min(20).max(50_000), url: z.union([z.url(), z.literal(""), z.null()]).transform((v) => v || null) }),
    await readJson(req, 200_000),
  )
  const version = await asAdmin(deps, user, async (tx) => {
    const [latest] = await tx`select coalesce(max(version), 0) + 1 as next from public.waivers where flow = ${w.flow}`
    await tx`update public.waivers set active = false where flow = ${w.flow} and active`
    await tx`insert into public.waivers (flow, version, title, body, url, active) values (${w.flow}, ${latest!.next}, ${w.title}, ${w.body}, ${w.url}, true)`
    return latest!.next as number
  })
  return json({ ok: true, version })
}

const waiverRequired: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const body = parse(z.object({ camp: z.boolean(), miami: z.boolean() }), await readJson(req))
  await asAdmin(deps, user, async (tx) => {
    await tx`update public.miami_event set waiver_required = ${body.miami}`
    await tx`insert into public.settings (key, value) values ('camp_waiver_required', ${tx.json(body.camp)})
             on conflict (key) do update set value = excluded.value, updated_at = now()`
  })
  return json({ ok: true })
}

const PromoInput = z
  .object({
    id: z.uuid().optional(),
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "3-30 letters, numbers, - or _"),
    description: nullableText(200),
    kind: z.enum(["percent", "amount"]),
    amount: z.int().min(1).max(10_000_000),
    scope: z.enum(["all", "camp", "session", "miami"]),
    campId: z.uuid().nullable(),
    sessionId: z.uuid().nullable(),
    maxUses: z.int().min(1).nullable(),
    perCustomerLimit: z.int().min(1).nullable(),
    startsAt: datetime,
    endsAt: datetime,
    active: z.boolean(),
  })
  .refine((p) => p.kind !== "percent" || p.amount <= 100, { message: "A percent discount can't exceed 100", path: ["amount"] })
  .refine((p) => p.scope !== "camp" || p.campId, { message: "Choose the camp", path: ["campId"] })
  .refine((p) => p.scope !== "session" || p.sessionId, { message: "Choose the session", path: ["sessionId"] })

const promoSave: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const p = parse(PromoInput, await readJson(req))
  const campId = p.scope === "camp" ? p.campId : null
  const sessionId = p.scope === "session" ? p.sessionId : null
  await asAdmin(deps, user, async (tx) => {
    try {
      if (p.id) {
        await tx`
          update public.promo_codes set code = ${p.code}, description = ${p.description}, kind = ${p.kind}, amount = ${p.amount}, scope = ${p.scope},
                 camp_id = ${campId}, session_id = ${sessionId}, max_uses = ${p.maxUses}, per_customer_limit = ${p.perCustomerLimit},
                 starts_at = ${p.startsAt}, ends_at = ${p.endsAt}, active = ${p.active}
           where id = ${p.id}`
      } else {
        await tx`
          insert into public.promo_codes (code, description, kind, amount, scope, camp_id, session_id, max_uses, per_customer_limit, starts_at, ends_at, active)
          values (${p.code}, ${p.description}, ${p.kind}, ${p.amount}, ${p.scope}, ${campId}, ${sessionId}, ${p.maxUses}, ${p.perCustomerLimit},
                  ${p.startsAt}, ${p.endsAt}, ${p.active})`
      }
    } catch (err) {
      if ((err as { code?: string }).code === "23505") throw new ApiError(422, "validation_failed", `The code ${p.code} already exists.`)
      throw err
    }
  })
  return json({ ok: true })
}

const PricingInput = z.object({
  sibling_discount: z
    .object({ kind: z.enum(["none", "percent", "amount"]), amount: z.int().min(0).max(10_000_000), applies: z.enum(["camps", "miami", "all"]) })
    .refine((s) => s.kind !== "percent" || s.amount <= 100, { message: "A percent discount can't exceed 100" }),
  waitlist_hold_hours: z.int().min(1).max(336),
})

const pricingSettings: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const body = parse(PricingInput, await readJson(req))
  await asAdmin(deps, user, async (tx) => {
    for (const [key, value] of Object.entries(body)) {
      await tx`insert into public.settings (key, value) values (${key}, ${tx.json(value as never)})
               on conflict (key) do update set value = excluded.value, updated_at = now()`
    }
  })
  return json({ ok: true })
}

// ---------------------------------------------------------------------------
// Analytics (D11) and revenue (D12)
// ---------------------------------------------------------------------------

function range(req: Request) {
  const url = new URL(req.url)
  const from = url.searchParams.get("from")
  const to = url.searchParams.get("to")
  const ok = (d: string | null) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null)
  return { from: ok(from), to: ok(to) }
}

const analytics: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const { from, to } = range(req)
  return json(
    await asAdmin(deps, user, async (tx) => {
      const filter = (alias: string) => `
        ${alias}.status = 'active' and p.status <> 'refunded'
        and ($1::date is null or (${alias}.created_at at time zone 'America/New_York')::date >= $1::date)
        and ($2::date is null or (${alias}.created_at at time zone 'America/New_York')::date <= $2::date)`
      const params = [from, to]
      const [totals] = await tx.unsafe(
        `select count(*)::int as registrations, count(distinct lower(r.parent_email))::int as families,
                coalesce(sum(coalesce(r.price_cents, 0)), 0)::int as revenue_cents
           from public.registrations r join public.payments p on p.id = r.payment_id where ${filter("r")}`,
        params,
      )
      const daily = await tx.unsafe(
        `with bounds as (
           select coalesce($1::date, (select min((created_at at time zone 'America/New_York')::date) from public.registrations), public.app_today()) as lo,
                  coalesce($2::date, public.app_today()) as hi
         )
         select to_char(d, 'YYYY-MM-DD') as day,
                (select count(*)::int from public.registrations r join public.payments p on p.id = r.payment_id
                  where ${filter("r")} and (r.created_at at time zone 'America/New_York')::date = d::date) as registrations
           from bounds, generate_series(greatest(bounds.lo, bounds.hi - 365), bounds.hi, interval '1 day') as d order by d`,
        params,
      )
      const byProgram = await tx.unsafe(
        `select case when r.miami_group is not null then 'Combine – ' || initcap(r.miami_group) else c.name || ' – ' || coalesce(s.name, '') end as program,
                r.session_id, r.miami_group, count(*)::int as registrations
           from public.registrations r join public.payments p on p.id = r.payment_id join public.camps c on c.id = r.camp_id
           left join public.sessions s on s.id = r.session_id
          where ${filter("r")} group by 1, 2, 3 order by registrations desc`,
        params,
      )
      const byTown = await tx.unsafe(
        `select initcap(lower(btrim(r.parent_town))) as town, count(*)::int as registrations
           from public.registrations r join public.payments p on p.id = r.payment_id
          where ${filter("r")} group by 1 order by registrations desc, town limit 20`,
        params,
      )
      const miami = await tx`
        select a.grp, a.label, a.cap, (select count(*)::int from public.registrations r join public.payments p on p.id = r.payment_id
                                         where r.miami_group = a.grp and r.status = 'active' and p.status <> 'refunded') as paid
          from public.miami_availability() a order by a.grp`
      return { from, to, totals, daily, byProgram, byTown, miami }
    }),
  )
}

const revenue: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const { from, to } = range(req)
  return json(
    await asAdmin(deps, user, async (tx) => {
      const params = [from, to]
      const where = `($1::date is null or (p.created_at at time zone 'America/New_York')::date >= $1::date)
                 and ($2::date is null or (p.created_at at time zone 'America/New_York')::date <= $2::date)`
      // Registration-level amounts: net = price paid, gross = net + discount. Refunds are
      // allocated across a payment's registrations in proportion to what each one cost.
      const lines = `
        with reg as (
          select r.id, r.payment_id, r.session_id, r.miami_group, r.camp_id,
                 coalesce(r.price_cents, p.amount_total_cents / count(*) over (partition by r.payment_id))::bigint as net,
                 r.discount_cents::bigint as discount
            from public.registrations r join public.payments p on p.id = r.payment_id
           where ${where}
        ), alloc as (
          select reg.*, sum(net) over (partition by payment_id) as payment_net from reg
        )
        select alloc.*, p.refunded_cents, p.status,
               round(p.refunded_cents::numeric * alloc.net / nullif(alloc.payment_net, 0))::bigint as refund
          from alloc join public.payments p on p.id = alloc.payment_id`
      const byProgram = await tx.unsafe(
        `with l as (${lines})
         select case when l.miami_group is not null then 'Combine – ' || initcap(l.miami_group) else c.name || ' – ' || coalesce(s.name, '') end as program,
                l.session_id, l.miami_group, count(*)::int as registrations,
                sum(l.net + l.discount)::int as gross_cents, sum(l.discount)::int as discount_cents,
                sum(l.refund)::int as refund_cents, sum(l.net - l.refund)::int as net_cents
           from l join public.camps c on c.id = l.camp_id left join public.sessions s on s.id = l.session_id
          group by 1, 2, 3
         union all
         select 'Private training – ' || t.package_name, null, null, count(*)::int,
                sum(p.amount_subtotal_cents)::int, sum(p.discount_cents)::int, sum(p.refunded_cents)::int,
                sum(p.amount_total_cents - p.refunded_cents)::int
           from public.training_purchases t join public.payments p on p.id = t.payment_id
          where ${where}
          group by t.package_name
         order by 8 desc`,
        params,
      )
      const payments = await tx.unsafe(
        `select p.id, p.created_at, p.customer_email, p.status, p.amount_subtotal_cents, p.amount_total_cents, p.discount_cents,
                p.sibling_discount_cents, p.promo_discount_cents, p.promo_code, p.refunded_cents, p.stripe_payment_intent_id,
                p.stripe_checkout_session_id, p.intent_id is null as legacy,
                coalesce((select json_agg(json_build_object('player', r.player_name, 'program',
                   case when r.miami_group is not null then 'Combine – ' || initcap(r.miami_group) else c.name || ' – ' || coalesce(s.name, '') end,
                   'price_cents', r.price_cents, 'discount_cents', r.discount_cents, 'status', r.status) order by r.line_no)
                   from public.registrations r join public.camps c on c.id = r.camp_id left join public.sessions s on s.id = r.session_id
                  where r.payment_id = p.id), '[]') as registrations,
                coalesce((select min(r.parent_name) from public.registrations r where r.payment_id = p.id),
                         (select t.parent_name || ' (private training)' from public.training_purchases t where t.payment_id = p.id)) as family
           from public.payments p where ${where} order by p.created_at desc limit 2000`,
        params,
      )
      const [totals] = await tx.unsafe(
        `select coalesce(sum(case when intent_id is null then amount_total_cents else amount_subtotal_cents end), 0)::int as gross_cents,
                coalesce(sum(discount_cents), 0)::int as discount_cents,
                coalesce(sum(refunded_cents), 0)::int as refund_cents,
                coalesce(sum(amount_total_cents - refunded_cents), 0)::int as net_cents,
                coalesce(sum(amount_total_cents), 0)::int as collected_cents,
                count(*)::int as payments,
                count(*) filter (where refunded_cents > 0)::int as refunded_payments
           from public.payments p where ${where}`,
        params,
      )
      const cancellations = await tx.unsafe(
        `select r.id, r.cancelled_at, r.cancel_reason, r.player_name, r.parent_name, r.parent_email,
                case when r.miami_group is not null then 'Combine – ' || initcap(r.miami_group) else c.name || ' – ' || coalesce(s.name, '') end as program,
                p.status as payment_status, p.refunded_cents
           from public.registrations r join public.payments p on p.id = r.payment_id join public.camps c on c.id = r.camp_id
           left join public.sessions s on s.id = r.session_id
          where r.status = 'cancelled' and ${where} order by r.cancelled_at desc nulls last`,
        params,
      )
      return { from, to, totals, byProgram, payments, cancellations }
    }),
  )
}

// ---------------------------------------------------------------------------
// Rosters (D14). Never includes height, weight or home address.
// ---------------------------------------------------------------------------

const rosters: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  return json(
    await asAdmin(deps, user, async (tx) => {
      const sessions = await tx`
        select s.id, c.id as camp_id, c.name as camp, s.name as session, s.starts_on::text, s.ends_on::text, s.location,
               to_char(s.start_time, 'HH24:MI') as start_time, s.age_min, s.age_max, s.capacity, s.status, c.active,
               coalesce(x.players, 0) as players, coalesce(x.waivers_missing, 0) as waivers_missing
          from public.sessions s join public.camps c on c.id = s.camp_id
          left join lateral (
            select count(*)::int as players, (count(*) filter (where r.waiver_status <> 'accepted'))::int as waivers_missing
              from public.registrations r join public.payments p on p.id = r.payment_id
             where r.session_id = s.id and r.status = 'active' and p.status <> 'refunded') x on true
         where not c.info_only order by c.sort_order, c.name, s.sort_order, s.starts_on`
      const groups = await tx`
        select g.grp, e.name as camp, g.label as session, g.starts_on::text, g.ends_on::text, e.location,
               to_char(g.daily_start_time, 'HH24:MI') as start_time, g.age_min, g.age_max, g.cap as capacity,
               coalesce(x.players, 0) as players, coalesce(x.waivers_missing, 0) as waivers_missing
          from public.miami_groups g cross join public.miami_event e
          left join lateral (
            select count(*)::int as players, (count(*) filter (where r.waiver_status <> 'accepted'))::int as waivers_missing
              from public.registrations r join public.payments p on p.id = r.payment_id
             where r.miami_group = g.grp and r.status = 'active' and p.status <> 'refunded') x on true
         order by g.grp`
      return { sessions, groups }
    }),
  )
}

const roster: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const url = new URL(req.url)
  const sessionId = url.searchParams.get("session")
  const group = url.searchParams.get("group")
  if (!sessionId && group !== "boys" && group !== "girls") throw new ApiError(400, "validation_failed", "Choose a session or Combine group.")
  if (sessionId && !/^[0-9a-f-]{36}$/.test(sessionId)) throw new ApiError(400, "validation_failed", "Invalid session.")
  return json(
    await asAdmin(deps, user, async (tx) => {
      const [header] = sessionId
        ? await tx`select c.name as camp, s.name as session, s.starts_on::text, s.ends_on::text, to_char(s.start_time, 'HH24:MI') as start_time, s.location
                     from public.sessions s join public.camps c on c.id = s.camp_id where s.id = ${sessionId}`
        : await tx`select e.name as camp, g.label as session, g.starts_on::text, g.ends_on::text, to_char(g.daily_start_time, 'HH24:MI') as start_time, e.location
                     from public.miami_groups g cross join public.miami_event e where g.grp = ${group}`
      if (!header) throw new ApiError(404, "not_found", "Not found.")
      const players = await tx.unsafe(
        `select r.id, r.player_name, r.player_age, r.player_sex, r.parent_name, r.parent_phone, r.emergency_phone, r.waiver_status, p.status as payment_status,
                r.shirt_size, r.short_size
           from public.registrations r join public.payments p on p.id = r.payment_id
          where r.status = 'active' and p.status <> 'refunded' and ${sessionId ? "r.session_id = $1::uuid" : "r.miami_group = $1"}
          order by lower(coalesce(r.player_last_name, regexp_replace(r.player_name, '^.*\\s', ''))), lower(r.player_name)`,
        [sessionId ?? group],
      )
      return { header, players }
    }),
  )
}

// ---------------------------------------------------------------------------
// Registration cancellations and waitlist actions
// ---------------------------------------------------------------------------

const registrationCancel: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const body = parse(z.object({ id: z.uuid(), cancel: z.boolean(), reason: nullableText(300).optional() }), await readJson(req))
  const rows = await asAdmin(
    deps,
    user,
    (tx) => tx`
      update public.registrations set status = ${body.cancel ? "cancelled" : "active"},
             cancelled_at = ${body.cancel ? new Date() : null}, cancel_reason = ${body.cancel ? (body.reason ?? null) : null}
       where id = ${body.id} returning id`,
  )
  if (!rows.length) throw new ApiError(404, "not_found", "Registration not found.")
  if (body.cancel) await processWaitlistsQuietly(deps)
  return json({ ok: true })
}

const waitlistNotify: Handler = async (req, deps) => {
  await requireAdmin(req, deps)
  const body = parse(z.object({ sessionId: z.uuid().optional(), miamiGroup: z.enum(["boys", "girls"]).optional() }), await readJson(req))
  const target = body.sessionId ? { sessionId: body.sessionId } : body.miamiGroup ? { miamiGroup: body.miamiGroup } : null
  if (!target) throw new ApiError(400, "validation_failed", "Choose a session or Combine group.")
  const offer = await offerNext(deps, target)
  if (!offer) {
    throw new ApiError(409, "session_full", "No spot is free for the next family yet. Raise the limit or wait for a cancellation, and they'll be emailed automatically.")
  }
  return json({ ok: true, notified: offer.email, until: offer.offer_expires_at })
}

const waitlistRemove: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const { id } = parse(z.object({ id: z.uuid() }), await readJson(req))
  await asAdmin(deps, user, (tx) => tx`update public.waitlist_entries set status = 'removed', offer_token = null where id = ${id}`)
  await deps.db`update public.holds set status = 'released' where waitlist_entry_id = ${id} and status = 'active'`
  await processWaitlistsQuietly(deps)
  return json({ ok: true })
}

export const MANAGE_GET: Record<string, Handler> = { "settings-data": settingsData, analytics, revenue, rosters, roster }

export const MANAGE_POST: Record<string, Handler> = {
  "camp-save": campSave,
  "session-save": sessionSave,
  "miami-save": miamiSave,
  "access-code": accessCode,
  "waiver-publish": waiverPublish,
  "waiver-required": waiverRequired,
  "promo-save": promoSave,
  "pricing-settings": pricingSettings,
  "registration-cancel": registrationCancel,
  "waitlist-notify": waitlistNotify,
  "waitlist-remove": waitlistRemove,
}
