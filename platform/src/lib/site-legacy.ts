/**
 * Payments made through the site's original api/checkout.js put the whole form
 * into Stripe metadata (camp_id, session_id, player_name, parent_email, ...).
 * This turns that metadata into registrations, so every payment lands in the
 * dashboard even before the site is switched to the platform, and so past
 * payments can be backfilled (scripts/stripe-backfill.ts).
 */
import type { IntentPayload } from "../handlers/stripe-webhook.js"
import type { Db } from "./db.js"

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null)

/** "Jamie Lee Rivera" -> { first: "Jamie Lee", last: "Rivera" } */
export function splitName(name: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean)
  if (parts.length < 2) return { first: parts[0] ?? "", last: "" }
  return { first: parts.slice(0, -1).join(" "), last: parts.at(-1)! }
}

/** "5' 10\"" -> 70 */
function inches(height: string | null): number | null {
  const m = /(\d+)\s*'\s*(\d{1,2})?/.exec(height ?? "")
  return m ? Number(m[1]) * 12 + Number(m[2] ?? 0) : null
}

const NO_WAIVER = { status: "not_collected" as const, waiverId: null, acceptedName: null, acceptedAt: null }

export async function legacyRegistration(
  tx: Db,
  session: Record<string, any>,
): Promise<{ flow: "camp" | "miami"; viaCode: boolean; payload: IntentPayload } | null> {
  const md = (session.metadata ?? {}) as Record<string, string>
  const campSlug = str(md.camp_id)
  const sessionSlug = str(md.session_id)
  if (!campSlug || !sessionSlug) return null
  const [camp] = await tx<{ id: string; kind: string }[]>`select id, kind from public.camps where slug = ${campSlug}`
  if (!camp) return null

  // Gross price; insertRegistrations spreads Stripe's discount over the lines.
  const total = Number(session.amount_subtotal ?? session.amount_total ?? 0)
  const email = str(md.parent_email) ?? str(session.customer_details?.email) ?? ""
  const parentName = str(md.parent_name) ?? str(session.customer_details?.name) ?? ""
  const pn = splitName(parentName)
  const player = str(md.player_name) ?? "Unknown player"
  const kn = splitName(player)
  const age = Number(md.player_age) || 0

  if (camp.kind === "miami") {
    if (sessionSlug !== "boys" && sessionSlug !== "girls") return null
    const payload: IntentPayload = {
      parent: {
        name: parentName, firstName: pn.first, lastName: pn.last, email,
        phone: str(md.parent_phone) ?? str(session.customer_details?.phone), emergencyPhone: null,
        town: str(md.town) ?? str(md.address_city) ?? "",
      },
      marketingOptIn: false,
      extra: { source: "site_checkout" },
      waiver: NO_WAIVER,
      lines: [
        {
          lineNo: 1,
          campId: camp.id,
          miamiGroup: sessionSlug,
          priceCents: total,
          discountCents: 0,
          player: {
            name: player, firstName: kn.first, lastName: kn.last, age, sex: sessionSlug === "boys" ? "boy" : "girl",
            email: str(md.player_email) ?? undefined,
            heightIn: inches(str(md.player_height)) ?? undefined,
            weightLb: Number(md.player_weight_lb) || undefined,
            position: str(md.position) ?? undefined,
            club: str(md.club) ?? undefined,
            shirtSize: str(md.clothing_size) ?? undefined,
            shortSize: null,
            shippingAddress: str(md.address_line1)
              ? { line1: md.address_line1!, line2: str(md.address_line2) ?? undefined, city: md.address_city ?? "", state: md.address_state ?? "", postalCode: md.address_zip ?? "" }
              : undefined,
            extra: str(md.grad_year) ? { gradYear: md.grad_year } : {},
          },
        },
      ],
    }
    return { flow: "miami", viaCode: md.access_code === "verified", payload }
  }

  // Watertown's "both weeks" option is one Stripe line but two camp weeks.
  const slugs = sessionSlug === "both" ? ["week1", "week2"] : [sessionSlug]
  const sessions = await tx<{ id: string; slug: string }[]>`
    select id, slug from public.sessions where camp_id = ${camp.id} and slug = any(${slugs}::text[])`
  if (sessions.length !== slugs.length) return null
  const ordered = slugs.map((slug) => sessions.find((s) => s.slug === slug)!)
  const each = Math.floor(total / ordered.length)

  const payload: IntentPayload = {
    parent: { name: parentName, email, phone: str(session.customer_details?.phone), town: str(md.town) ?? "" },
    marketingOptIn: false,
    extra: { source: "site_checkout" },
    waiver: NO_WAIVER,
    lines: ordered.map((s, i) => ({
      lineNo: i + 1,
      campId: camp.id,
      sessionId: s.id,
      priceCents: i === ordered.length - 1 ? total - each * (ordered.length - 1) : each,
      discountCents: 0,
      player: { name: player, firstName: kn.first, lastName: kn.last, age, sex: null, extra: {} },
    })),
  }
  return { flow: "camp", viaCode: false, payload }
}
