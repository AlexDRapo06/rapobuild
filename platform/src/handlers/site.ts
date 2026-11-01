/**
 * Adapter for the live footyup.net site (repo: rapobuild). The site's own
 * api/*.js functions forward their exact request bodies here when
 * PLATFORM_API_URL is set, so the site's pages don't change. Responses keep the
 * shapes the site's code already expects ({ url }, { error }, { success }).
 */
import { z } from "zod"
import { MiamiCheckoutRequest } from "../contract.js"
import { startCheckout } from "../lib/checkout.js"
import type { Db } from "../lib/db.js"
import type { Deps } from "../lib/deps.js"
import { enforceRateLimit } from "../lib/guards.js"
import { ApiError, json, logError, readJson } from "../lib/http.js"
import { getSettings } from "../lib/settings.js"
import { currentWaiver } from "../lib/waiver.js"
import { splitName } from "../lib/site-legacy.js"
import { runCampCheckout } from "./camp-checkout.js"
import { checkCode, codesActive, currentTier, isOpen, loadAvailability, loadEvent, phase, runMiamiCheckout } from "./miami.js"
import { notifyTrainingRequest } from "./private-training.js"
import { saveWaitlistEntries } from "./waitlist.js"

const s = (max: number) => z.string().trim().max(max)
const Email = z.string({ error: "Please enter a valid email address." }).trim().toLowerCase().pipe(z.email({ error: "Please enter a valid email address." }).max(254))
const Phone = z
  .string({ error: "Please enter a valid phone number." })
  .trim()
  .max(32, "Please enter a valid phone number.")
  .regex(/^[0-9+().\-\s]+$/, "Please enter a valid phone number.")
  .refine((v) => v.replace(/\D/g, "").length >= 10, "Please enter a valid phone number.")
const need = (max: number, label: string) => z.string({ error: `Please fill in ${label}.` }).trim().min(1, `Please fill in ${label}.`).max(max)

interface CampRow { id: string; kind: string; site_route: string | null; info_only: boolean }

async function campBySlug(db: Db, slug: unknown): Promise<CampRow | null> {
  if (typeof slug !== "string" || !/^[a-z0-9_-]{1,80}$/.test(slug)) return null
  const [row] = await db<CampRow[]>`select id, kind, site_route, info_only from public.camps where slug = ${slug}`
  return row ?? null
}

/** Errors in the { error: "message" } shape the site's forms display. */
function siteError(err: unknown): Response {
  if (err instanceof ApiError) {
    const issue = (err.details?.issues as { message: string }[] | undefined)?.[0]?.message
    const message = err.code === "validation_failed" && issue && err.message === "Some fields are missing or invalid" ? issue : err.message
    return json({ error: message, code: err.code }, err.status)
  }
  throw err
}

const blank = z.literal("").transform(() => undefined)
const optionalPhone = Phone.optional().or(blank)
/** Fields both forms may send: promo code, news opt-in, waiver acceptance. */
const Extras = {
  promoCode: s(40).optional(),
  marketingOptIn: z.boolean().optional(),
  waiverId: z.uuid().optional().or(blank),
  waiverAccepted: z.boolean().optional(),
}

function extrasFor(f: { promoCode?: string; marketingOptIn?: boolean; waiverId?: string; waiverAccepted?: boolean }, acceptedName: string) {
  return {
    promoCode: f.promoCode || undefined,
    marketingOptIn: f.marketingOptIn ?? false,
    waiver: f.waiverAccepted && f.waiverId ? { waiverId: f.waiverId, acceptedName } : undefined,
  }
}

function zodMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Please check the form and try again."
}

const SiteCamp = z.object({
  campId: z.string(),
  session: s(20),
  playerName: need(120, "the player's name"),
  parentName: need(120, "the parent's name"),
  playerAge: z.coerce.number({ error: "Please enter the player's age." }).int().min(3).max(25),
  parentEmail: Email,
  parentPhone: optionalPhone,
  town: need(80, "your town"),
  waitlistToken: s(80).optional(),
  ...Extras,
})

const SiteMiami = z.object({
  campId: z.string(),
  session: z.enum(["boys", "girls"], { error: "Please choose the Boys or Girls combine." }),
  accessCode: s(64).optional(),
  // The form sends first and last names; older pages send one full name.
  playerName: s(120).optional(),
  playerFirstName: s(60).optional(),
  playerLastName: s(60).optional(),
  playerEmail: Email,
  playerAge: z.coerce.number().int().min(10).max(25),
  gradYear: s(4).optional(),
  heightFt: z.coerce.number().int().min(4).max(7),
  heightIn: z.coerce.number().int().min(0).max(11),
  weight: z.coerce.number().int().min(60).max(350),
  position: need(40, "the position"),
  club: need(120, "the club"),
  clothingSize: need(20, "the clothing size"),
  shortSize: s(20).optional(),
  parentName: s(120).optional(),
  parentFirstName: s(60).optional(),
  parentLastName: s(60).optional(),
  parentEmail: Email,
  parentPhone: Phone,
  emergencyPhone: optionalPhone,
  address1: need(150, "the street address"),
  address2: s(80).optional(),
  city: need(80, "the city"),
  state: need(20, "the state"),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Please enter a valid ZIP code."),
  waitlistToken: s(80).optional(),
  ...Extras,
})

function names(first: string | undefined, last: string | undefined, full: string | undefined) {
  if (first && last) return { first, last }
  const split = splitName(full || [first, last].filter(Boolean).join(" "))
  return split.first && split.last ? split : null
}

/** POST /api/site/checkout: the site's camp and Miami forms. */
async function checkout(req: Request, deps: Deps): Promise<Response> {
  await enforceRateLimit(deps.db, deps.env, req, "checkout")
  const raw = (await readJson(req)) as Record<string, unknown>
  const camp = await campBySlug(deps.db, raw.campId)
  if (!camp) return json({ error: "Please choose a camp session." }, 400)
  const cancelPath = `/cancel${camp.site_route ? `?camp=${encodeURIComponent(camp.site_route)}` : ""}`

  try {
    if (camp.kind === "miami") {
      const parsed = SiteMiami.safeParse(raw)
      if (!parsed.success) return json({ error: zodMessage(parsed.error) }, 400)
      const f = parsed.data
      const player = names(f.playerFirstName, f.playerLastName, f.playerName)
      if (!player) return json({ error: "Please fill in the player's first and last name." }, 400)
      const parent = names(f.parentFirstName, f.parentLastName, f.parentName)
      if (!parent) return json({ error: "Please fill in the parent's first and last name." }, 400)
      const event = await loadEvent(deps.db)
      if (event.grad_years.length && f.gradYear && !event.grad_years.includes(f.gradYear)) return json({ error: "Please choose a graduation year." }, 400)
      const shipping = { line1: f.address1, line2: f.address2 || undefined, city: f.city, state: f.state.toUpperCase(), postalCode: f.zip }
      const input = {
        ...extrasFor(f, `${parent.first} ${parent.last}`),
        accessCode: f.accessCode || undefined,
        waitlistToken: f.waitlistToken || undefined,
        parent: { firstName: parent.first, lastName: parent.last, email: f.parentEmail, phone: f.parentPhone, emergencyPhone: f.emergencyPhone || undefined, town: f.city },
        shippingAddress: shipping,
        players: [
          {
            firstName: player.first, lastName: player.last, age: f.playerAge, sex: f.session === "boys" ? ("boy" as const) : ("girl" as const),
            heightIn: f.heightFt * 12 + f.heightIn, weightLb: f.weight, position: f.position, club: f.club, email: f.playerEmail,
            shirtSize: f.clothingSize, shortSize: f.shortSize || undefined, extra: (f.gradYear ? { gradYear: f.gradYear } : {}) as Record<string, string>,
          },
        ],
      }
      // Same rules as the public contract for what the site does send.
      const shape = MiamiCheckoutRequest.shape
      const check = shape.shippingAddress.safeParse(input.shippingAddress)
      if (!check.success) return json({ error: "Please check the shipping address." }, 400)
      const result = await runMiamiCheckout(deps, input, { successPath: "/success", cancelPath, allowPromotionCodes: true })
      return json({ url: result.checkoutUrl })
    }

    if (camp.info_only) return json({ error: "This camp registers through the host school." }, 400)
    const parsed = SiteCamp.safeParse(raw)
    if (!parsed.success) return json({ error: zodMessage(parsed.error) }, 400)
    const f = parsed.data
    // The site sells Watertown's two weeks together as "both".
    const slugs = f.session === "both" ? ["week1", "week2"] : [f.session]
    const sessions = await deps.db<{ id: string; slug: string }[]>`
      select id, slug from public.sessions where camp_id = ${camp.id} and slug = any(${slugs}::text[])`
    if (sessions.length !== slugs.length) return json({ error: "Please choose a camp session." }, 400)
    const result = await runCampCheckout(
      deps,
      {
        ...extrasFor(f, f.parentName),
        waitlistToken: f.waitlistToken || undefined,
        parent: { name: f.parentName, email: f.parentEmail, phone: f.parentPhone, town: f.town },
        players: [{ name: f.playerName, age: f.playerAge, sessionIds: slugs.map((slug) => sessions.find((x) => x.slug === slug)!.id) }],
      },
      { successPath: "/success", cancelPath, collectPhone: !f.parentPhone, allowPromotionCodes: true },
    )
    return json({ url: result.checkoutUrl })
  } catch (err) {
    return siteError(err)
  }
}

/** GET/POST /api/site/camp-access: the Miami page's gate (same shape as the site's old endpoint). */
async function campAccess(req: Request, deps: Deps): Promise<Response> {
  const url = new URL(req.url)
  const body = req.method === "POST" ? ((await readJson(req)) as Record<string, unknown>) : {}
  const camp = await campBySlug(deps.db, req.method === "GET" ? url.searchParams.get("campId") : body.campId)
  if (!camp) return json({ error: "Unknown camp." }, 404)

  let status: { open: boolean; closed: boolean; gated: boolean; opensAt: string | null; closesAt: string | null; gatedUntil: string | null }
  if (camp.kind === "miami") {
    const event = await loadEvent(deps.db)
    const { codeRequired } = phase(event, await codesActive(deps.db))
    const closed = Boolean(event.closes_at && event.closes_at.getTime() <= Date.now())
    status = {
      open: isOpen(event),
      closed,
      gated: codeRequired,
      opensAt: event.opens_at?.toISOString() ?? null,
      closesAt: event.closes_at?.toISOString() ?? null,
      gatedUntil: event.public_opens_at?.toISOString() ?? null,
    }
  } else {
    const [row] = await deps.db<{ open: boolean; closes_at: Date | null }[]>`
      select bool_or(status = 'open' and (closes_at is null or closes_at > now())) as open, max(closes_at) as closes_at
        from public.sessions where camp_id = ${camp.id}`
    status = { open: Boolean(row?.open), closed: !row?.open, gated: false, opensAt: null, closesAt: row?.closes_at?.toISOString() ?? null, gatedUntil: null }
  }

  const headers = { "cache-control": "no-store" }
  if (req.method === "GET") return json(status, 200, headers)
  await enforceRateLimit(deps.db, deps.env, req, "verifyCode")
  if (!status.open) return json({ ...status, error: status.closed ? "Registration has closed." : "Registration has not opened yet." }, 403, headers)
  if (status.gated) {
    const code = typeof body.code === "string" ? body.code : ""
    if (!code.trim() || !(await checkCode(deps.db, code))) {
      return json({ ...status, error: "That access code is not valid. Please check it and try again." }, 403, headers)
    }
  }
  return json({ ...status, ok: true }, 200, headers)
}

const SiteInquiry = z.object({
  name: need(120, "your name"),
  email: Email,
  phone: Phone,
  town: s(80).optional(),
  playerNames: s(200).optional(),
  players: s(10).optional(),
  bundle: s(120).optional(),
  ages: s(60).optional(),
  notes: s(2000).optional(),
  website: z.string().max(500).optional(),
})

/** POST /api/site/inquiry: the private training inquiry form (replaces Telegram). */
async function inquiry(req: Request, deps: Deps): Promise<Response> {
  await enforceRateLimit(deps.db, deps.env, req, "privateTraining")
  const parsed = SiteInquiry.safeParse(await readJson(req))
  if (!parsed.success) return json({ error: zodMessage(parsed.error) }, 400)
  const f = parsed.data
  if (f.website) return json({ success: true })
  await deps.db.begin(async (tx) => {
    await tx`
      insert into public.private_training_requests (parent_name, email, phone, town, player_name, players, bundle, player_ages, message)
      values (${f.name}, ${f.email}, ${f.phone}, ${f.town || null}, ${f.playerNames || null}, ${f.players ?? null}, ${f.bundle ?? null}, ${f.ages ?? null}, ${f.notes ?? null})`
    await tx`select public.upsert_contact(${f.email}, ${f.name}, ${f.phone}, ${f.town || null}, 'private_training', null)`
  })
  await notifyTrainingRequest(deps, f.email, [
    `Parent: ${f.name}`,
    `Email: ${f.email}`,
    `Phone: ${f.phone}`,
    f.town ? `Town: ${f.town}` : null,
    f.playerNames ? `Player name(s): ${f.playerNames}` : null,
    f.players ? `Players: ${f.players}` : null,
    f.bundle ? `Bundle: ${f.bundle}` : null,
    f.ages ? `Player ages: ${f.ages}` : null,
    f.notes ? `\nNotes:\n${f.notes}` : null,
  ])
  return json({ success: true })
}

const SiteWaitlist = z.object({
  campId: z.string(),
  session: s(20),
  parentName: need(120, "your name"),
  email: Email,
  phone: Phone,
  town: need(80, "your town"),
  spots: z.coerce.number({ error: "Please choose how many spots you need." }).int().min(1).max(10).default(1),
  website: z.string().max(500).optional(),
})

/**
 * POST /api/site/waitlist: the form shown when a session or Miami group is full (D9).
 * GET  /api/site/waitlist?token=: what an offer link holds, in the site's own ids.
 */
async function waitlist(req: Request, deps: Deps): Promise<Response> {
  if (req.method === "GET") {
    const token = new URL(req.url).searchParams.get("token") ?? ""
    if (token.length < 10 || token.length > 80) return json({ valid: false })
    const [row] = await deps.db<{ camp: string; session: string | null; miami_group: string | null; spots: number; parent_name: string; email: string; phone: string; town: string; offer_expires_at: Date }[]>`
      select c.slug as camp, s.slug as session, w.miami_group, w.spots, w.parent_name, w.email, w.phone, w.town, w.offer_expires_at
        from public.waitlist_entries w
        join public.camps c on c.id = w.camp_id
        left join public.sessions s on s.id = w.session_id
       where w.offer_token = ${token} and w.status = 'notified' and w.offer_expires_at > now()`
    if (!row) return json({ valid: false }, 200, { "cache-control": "no-store" })
    return json(
      {
        valid: true, campId: row.camp, session: row.miami_group ?? row.session, spots: row.spots, expiresAt: row.offer_expires_at.toISOString(),
        parent: { name: row.parent_name, email: row.email, phone: row.phone, town: row.town },
      },
      200,
      { "cache-control": "no-store" },
    )
  }

  await enforceRateLimit(deps.db, deps.env, req, "waitlist")
  const parsed = SiteWaitlist.safeParse(await readJson(req))
  if (!parsed.success) return json({ error: zodMessage(parsed.error) }, 400)
  const f = parsed.data
  if (f.website) return json({ success: true })
  const camp = await campBySlug(deps.db, f.campId)
  if (!camp || camp.info_only) return json({ error: "Please choose a camp session." }, 400)
  const entry = { parentName: f.parentName, email: f.email, phone: f.phone, town: f.town, spots: f.spots }
  if (camp.kind === "miami") {
    if (f.session !== "boys" && f.session !== "girls") return json({ error: "Please choose the Boys or Girls combine." }, 400)
    await saveWaitlistEntries(deps.db, camp.id, [null], { ...entry, miamiGroup: f.session })
    return json({ success: true })
  }
  // The site sells Watertown's two weeks together as "both": wait for either week.
  const slugs = f.session === "both" ? ["week1", "week2"] : [f.session]
  const sessions = await deps.db<{ id: string }[]>`
    select id from public.sessions where camp_id = ${camp.id} and slug = any(${slugs}::text[])`
  if (sessions.length !== slugs.length) return json({ error: "Please choose a camp session." }, 400)
  await saveWaitlistEntries(deps.db, camp.id, sessions.map((x) => x.id), entry)
  return json({ success: true })
}

/** POST /api/site/checkout-training: private-training package "Buy" buttons. */
async function checkoutTraining(req: Request, deps: Deps): Promise<Response> {
  await enforceRateLimit(deps.db, deps.env, req, "checkout")
  const { packageId } = ((await readJson(req)) ?? {}) as { packageId?: string }
  const settings = await getSettings(deps.db)
  const pkg = settings.training_packages.find((p) => p.id === packageId)
  if (!pkg) return json({ error: "Invalid package" }, 400)
  const customFields = [
    { key: "player_name", label: "Player's Full Name" },
    { key: "player_age", label: "Player's Age" },
  ]
  try {
    const result = await startCheckout(deps, {
      flow: "training",
      viaAccessCode: false,
      payload: { packageId: pkg.id, packageName: pkg.name, customFields },
      lines: [{ name: pkg.name, unitAmountCents: pkg.cents, quantity: 1 }],
      collectPhone: true,
      allowPromotionCodes: true,
      customFields,
      holdMinutes: 60,
      successPath: "/success",
      cancelPath: "/cancel?camp=privateTraining",
      reserve: async () => {},
    })
    return json({ url: result.checkoutUrl })
  } catch (err) {
    return siteError(err)
  }
}

/**
 * GET /api/site/catalog: live prices, spots and open/closed state in the
 * site's own ids, so the pages show what the dashboard says (and what Stripe charges).
 */
async function catalog(_req: Request, deps: Deps): Promise<Response> {
  const rows = await deps.db<{ camp: string; kind: string; session: string; price_cents: number; age_min: number | null; age_max: number | null; capacity: number | null; taken: number; open: boolean; closes_at: Date | null }[]>`
    select c.slug as camp, c.kind, s.slug as session, public.session_price_cents(s) as price_cents, s.age_min, s.age_max, s.capacity, s.closes_at,
           case when s.capacity is null then 0 else public.session_taken(s.id) end as taken,
           (s.status = 'open' and c.active and (s.closes_at is null or s.closes_at > now())) as open
      from public.sessions s join public.camps c on c.id = s.camp_id
     where c.kind <> 'miami'`
  const camps: Record<string, { sessions: Record<string, { price: number; priceCents: number; minAge: number | null; maxAge: number | null; spotsLeft: number | null; open: boolean; closesAt: string | null }> }> = {}
  for (const r of rows) {
    camps[r.camp] ??= { sessions: {} }
    camps[r.camp]!.sessions[r.session] = {
      price: r.price_cents / 100, priceCents: r.price_cents, minAge: r.age_min, maxAge: r.age_max,
      spotsLeft: r.capacity === null ? null : Math.max(r.capacity - r.taken, 0), open: r.open, closesAt: r.closes_at?.toISOString() ?? null,
    }
  }
  const watertown = camps.watertown_2027?.sessions
  if (watertown?.week1 && watertown.week2) {
    const left = [watertown.week1.spotsLeft, watertown.week2.spotsLeft].filter((v): v is number => v !== null)
    watertown.both = {
      price: watertown.week1.price + watertown.week2.price, priceCents: watertown.week1.priceCents + watertown.week2.priceCents,
      minAge: watertown.week1.minAge, maxAge: watertown.week1.maxAge, spotsLeft: left.length ? Math.min(...left) : null,
      open: watertown.week1.open && watertown.week2.open, closesAt: watertown.week1.closesAt,
    }
  }

  let miami = null
  try {
    const [event, groups] = await Promise.all([loadEvent(deps.db), loadAvailability(deps.db)])
    const { codeRequired } = phase(event, await codesActive(deps.db))
    const [miamiCamp] = await deps.db<{ slug: string }[]>`select slug from public.camps where id = ${event.camp_id}`
    const tier = currentTier(event)
    miami = {
      id: miamiCamp?.slug ?? null,
      open: isOpen(event),
      gated: codeRequired,
      price: (tier?.cents ?? groups[0]?.price_public_cents ?? 0) / 100,
      priceTiers: event.price_tiers.map((t) => ({ until: t.until, price: t.cents / 100 })),
      sessions: Object.fromEntries(groups.map((g) => [g.grp, { spotsLeft: codeRequired ? g.left_for_code_holders : g.left_for_public, open: g.open, minAge: g.age_min, maxAge: g.age_max }])),
      options: { positions: event.positions, clothingSizes: event.shirt_sizes, shortSizes: event.short_sizes, gradYears: event.grad_years },
      waiverRequired: event.waiver_required,
    }
  } catch (err) {
    logError("site.catalog.miami", err)
  }
  const settings = await getSettings(deps.db)
  const [campWaiver, miamiWaiver, promos] = await Promise.all([
    currentWaiver(deps.db, "camp"),
    currentWaiver(deps.db, "miami"),
    deps.db<{ camp: boolean; miami: boolean }[]>`
      select coalesce(bool_or(scope in ('all', 'camp', 'session')), false) as camp, coalesce(bool_or(scope in ('all', 'miami')), false) as miami
        from public.promo_codes
       where active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())`,
  ])
  // What the site's forms show: the waiver to accept, and a promo box only when a code could work.
  const forms = {
    camp: { waiver: campWaiver, waiverRequired: Boolean(campWaiver && settings.camp_waiver_required), promoCodes: Boolean(promos[0]?.camp) },
    miami: { waiver: miamiWaiver, waiverRequired: Boolean(miamiWaiver && miami?.waiverRequired), promoCodes: Boolean(promos[0]?.miami) },
  }
  return json(
    { camps, miami, forms, trainingPackages: Object.fromEntries(settings.training_packages.map((p) => [p.id, { name: p.name, price: p.cents / 100 }])) },
    200,
    { "cache-control": "public, s-maxage=30, stale-while-revalidate=60" },
  )
}

/** /api/site/<action> */
export async function site(req: Request, deps: Deps): Promise<Response> {
  const action = new URL(req.url).pathname.split("/").filter(Boolean).at(-1)
  try {
    if (action === "checkout" && req.method === "POST") return await checkout(req, deps)
    if (action === "camp-access" && (req.method === "GET" || req.method === "POST")) return await campAccess(req, deps)
    if (action === "inquiry" && req.method === "POST") return await inquiry(req, deps)
    if (action === "checkout-training" && req.method === "POST") return await checkoutTraining(req, deps)
    if (action === "waitlist" && (req.method === "GET" || req.method === "POST")) return await waitlist(req, deps)
    if (action === "catalog" && req.method === "GET") return await catalog(req, deps)
    throw new ApiError(404, "not_found", "Not found")
  } catch (err) {
    return siteError(err)
  }
}
