/**
 * Server-side pricing (Brief D10): sibling discount on the 2nd+ child, then an
 * optional promo code. Prices come from the database at checkout time, so a
 * price changed in the dashboard applies to the next Stripe Checkout session.
 */
import type { Db } from "./db.js"
import { ApiError } from "./http.js"
import type { SiblingDiscount } from "./settings.js"

export interface PriceLine {
  lineNo: number
  /** 0 for the first child in the checkout, 1 for the second, ... */
  playerIndex: number
  unitCents: number
  campId: string
  sessionId: string | null
  miami: boolean
  /** What appears on the Stripe line. */
  label: string
}

export interface PricedLine extends PriceLine {
  siblingCents: number
  promoCents: number
  finalCents: number
}

export interface PromoRow {
  id: string
  code: string
  kind: "percent" | "amount"
  amount: number
  scope: "all" | "camp" | "session" | "miami"
  camp_id: string | null
  session_id: string | null
  max_uses: number | null
  per_customer_limit: number | null
  starts_at: Date | null
  ends_at: Date | null
  active: boolean
}

function discount(kind: "percent" | "amount", amount: number, unit: number) {
  return Math.min(unit, kind === "percent" ? Math.round((unit * amount) / 100) : amount)
}

function promoApplies(p: PromoRow, line: PriceLine) {
  if (p.scope === "all") return true
  if (p.scope === "miami") return line.miami
  if (p.scope === "camp") return !line.miami && line.campId === p.camp_id
  return line.sessionId === p.session_id
}

/** Looks up and validates a promo code for this checkout. Throws a parent-friendly error when it can't be used. */
export async function loadPromo(db: Db, code: string | undefined, email: string, lines: PriceLine[]): Promise<PromoRow | null> {
  if (!code?.trim()) return null
  const [promo] = await db<PromoRow[]>`
    select id, code, kind, amount, scope, camp_id, session_id, max_uses, per_customer_limit, starts_at, ends_at, active
      from public.promo_codes where code = ${code.trim().toUpperCase()}`
  const now = Date.now()
  if (!promo || !promo.active || (promo.starts_at && promo.starts_at.getTime() > now)) {
    throw new ApiError(422, "promo_invalid", "That promo code isn't valid.")
  }
  if (promo.ends_at && promo.ends_at.getTime() <= now) throw new ApiError(422, "promo_invalid", "That promo code has expired.")
  if (!lines.some((l) => promoApplies(promo, l))) throw new ApiError(422, "promo_invalid", "That promo code doesn't apply to what you selected.")
  const [usage] = await db<{ total: number; mine: number }[]>`
    select count(*)::int as total,
           count(*) filter (where lower(customer_email) = ${email.toLowerCase()})::int as mine
      from public.payments where promo_code_id = ${promo.id} and status <> 'refunded'`
  if (promo.max_uses !== null && usage!.total >= promo.max_uses) throw new ApiError(422, "promo_invalid", "That promo code has been fully used.")
  if (promo.per_customer_limit !== null && usage!.mine >= promo.per_customer_limit) {
    throw new ApiError(422, "promo_invalid", "You've already used that promo code.")
  }
  return promo
}

export function priceLines(lines: PriceLine[], sibling: SiblingDiscount, promo: PromoRow | null): PricedLine[] {
  return lines.map((line) => {
    const siblingEligible =
      sibling.kind !== "none" && sibling.amount > 0 && line.playerIndex > 0 &&
      (sibling.applies === "all" || (sibling.applies === "miami") === line.miami)
    const siblingCents = siblingEligible ? discount(sibling.kind as "percent" | "amount", sibling.amount, line.unitCents) : 0
    const afterSibling = line.unitCents - siblingCents
    const promoCents = promo && promoApplies(promo, line) ? discount(promo.kind, promo.amount, afterSibling) : 0
    return { ...line, siblingCents, promoCents, finalCents: afterSibling - promoCents }
  })
}

/** Groups identical lines into Stripe line items, labelling discounts so the parent sees them. */
export function stripeLines(priced: PricedLine[], promo: PromoRow | null) {
  const groups = new Map<string, { name: string; unitAmountCents: number; quantity: number }>()
  for (const l of priced) {
    const notes = [l.siblingCents ? "sibling discount" : null, l.promoCents && promo ? `code ${promo.code}` : null].filter(Boolean)
    const name = notes.length ? `${l.label} (${notes.join(", ")})` : l.label
    const key = `${name}|${l.finalCents}`
    const g = groups.get(key)
    if (g) g.quantity++
    else groups.set(key, { name, unitAmountCents: l.finalCents, quantity: 1 })
  }
  return [...groups.values()]
}

export function totals(priced: PricedLine[]) {
  const sum = (f: (l: PricedLine) => number) => priced.reduce((s, l) => s + f(l), 0)
  return { gross: sum((l) => l.unitCents), sibling: sum((l) => l.siblingCents), promo: sum((l) => l.promoCents), net: sum((l) => l.finalCents) }
}
