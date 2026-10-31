export interface SessionRow {
  id: string
  name: string
  slug: string
  starts_on: string | null
  ends_on: string | null
  start_time: string | null
  location: string | null
  age_min: number | null
  age_max: number | null
  price_cents: number
  early_bird_price_cents: number | null
  early_bird_until: string | null
  capacity: number | null
  status: "open" | "closed"
  closes_at: string | null
  info_text: string | null
  reminder_days: number[]
  sort_order: number
  taken: number
}

export interface CampRow {
  id: string
  slug: string
  name: string
  host: string | null
  kind: "summer" | "winter" | "other"
  info_only: boolean
  active: boolean
  description: string | null
  info_url: string | null
  site_route: string | null
  sort_order: number
  sessions: SessionRow[]
}

export interface MiamiGroupRow {
  grp: "boys" | "girls"
  label: string
  cap: number
  starts_on: string | null
  ends_on: string | null
  daily_start_time: string | null
  daily_end_time: string | null
  reserved_for_code_holders: number
  reserved_until: string | null
  price_code_holder_cents: number | null
  price_public_cents: number | null
  age_min: number | null
  age_max: number | null
  open: boolean
  taken: number
}

export interface MiamiEventRow {
  name: string
  location: string | null
  info_text: string | null
  opens_at: string | null
  public_opens_at: string | null
  closes_at: string | null
  checkout_open: boolean
  hold_minutes: number
  waiver_required: boolean
  reserved_total: number
  reserved_until: string | null
  positions: string[]
  shirt_sizes: string[]
  short_sizes: string[]
  price_tiers: { until: string | null; cents: number }[]
  grad_years: string[]
}

export interface PromoRow {
  id: string
  code: string
  description: string | null
  kind: "percent" | "amount"
  amount: number
  scope: "all" | "camp" | "session" | "miami"
  camp_id: string | null
  session_id: string | null
  max_uses: number | null
  per_customer_limit: number | null
  starts_at: string | null
  ends_at: string | null
  active: boolean
  uses: number
}

export interface SettingsData {
  camps: CampRow[]
  miami: { event: MiamiEventRow; groups: MiamiGroupRow[] } | null
  codes: { id: string; label: string | null; grp: string | null; active: boolean; ends_at: string | null; created_at: string }[]
  waivers: { id: string; flow: "camp" | "miami" | "all"; version: number; title: string; body: string; url: string | null; active: boolean; created_at: string }[]
  promos: PromoRow[]
  pricing: {
    sibling_discount: { kind: "none" | "percent" | "amount"; amount: number; applies: "camps" | "miami" | "all" }
    waitlist_hold_hours: number
    camp_waiver_required: boolean
    camp_hold_minutes: number
  }
  trainingPackages: { id: string; name: string; cents: number }[]
}
