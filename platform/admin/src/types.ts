export interface MiamiGroupRow {
  grp: "boys" | "girls";
  label: string;
  cap: number;
  paid: number;
  held: number;
  code_taken: number;
  public_taken: number;
  reserved_effective: number;
  left_for_code_holders: number;
  left_for_public: number;
  price_code_holder_cents: number | null;
  price_public_cents: number | null;
  starts_on: string | null;
  ends_on: string | null;
}

export interface Overview {
  me: { email: string };
  event: {
    name: string;
    opens_at: string | null;
    public_opens_at: string | null;
    closes_at: string | null;
    checkout_open: boolean;
    reserved_total: number;
    reserved_until: string | null;
  } | null;
  codes: { active: boolean; required: boolean };
  miami: MiamiGroupRow[];
  byCamp: { camp: string; kind: string; session: string; registrations: number }[];
  totals: { registrations: number; net_cents: number; new_requests: number; waiting: number; legacy_payments: number };
  daily: { day: string; registrations: number }[];
  recent: { id: string; created_at: string; player_name: string; parent_town: string; camp: string; session: string | null; miami_group: string | null }[];
}

export interface Registration {
  id: string;
  created_at: string;
  camp: string;
  camp_kind: string;
  session: string | null;
  session_id: string | null;
  miami_group: "boys" | "girls" | null;
  via_access_code: boolean;
  status: string;
  parent_name: string;
  parent_first_name: string | null;
  parent_last_name: string | null;
  parent_email: string;
  parent_phone: string | null;
  emergency_phone: string | null;
  parent_town: string;
  player_name: string;
  player_first_name: string | null;
  player_last_name: string | null;
  player_age: number;
  player_sex: string | null;
  player_email: string | null;
  player_height_in: number | null;
  player_weight_lb: number | null;
  player_position: string | null;
  player_club: string | null;
  shirt_size: string | null;
  short_size: string | null;
  ship_line1: string | null;
  ship_line2: string | null;
  ship_city: string | null;
  ship_state: string | null;
  ship_postal_code: string | null;
  extra: Record<string, unknown>;
  waiver_status: string;
  waiver_version: number | null;
  waiver_accepted_at: string | null;
  waiver_accepted_name: string | null;
  payment_status: string;
  checkout_total_cents: number;
  discount_cents: number;
  refunded_cents: number;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string;
  price_cents: number | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  promo_code: string | null;
}

export interface TrainingRequest {
  id: string;
  created_at: string;
  parent_name: string;
  email: string;
  phone: string;
  town: string | null;
  player_name: string | null;
  player_age: number | null;
  message: string | null;
  preferred_times: string | null;
  status: string;
  players: string | null;
  bundle: string | null;
  player_ages: string | null;
}

export interface TrainingPurchase {
  id: string;
  created_at: string;
  package_id: string;
  package_name: string;
  parent_name: string | null;
  email: string | null;
  phone: string | null;
  player_name: string | null;
  player_age: string | null;
  status: string;
  amount_total_cents: number;
  refunded_cents: number;
  payment_status: string;
}

export interface WaitlistEntry {
  id: string;
  created_at: string;
  camp: string;
  session: string | null;
  miami_group: string | null;
  parent_name: string;
  email: string;
  phone: string;
  town: string;
  spots: number;
  status: string;
}

export const programOf = (r: { camp_kind?: string; camp: string; session: string | null; miami_group: string | null }) =>
  r.miami_group ? `Miami – ${r.miami_group === "boys" ? "Boys" : "Girls"}` : `${r.camp} – ${r.session ?? ""}`;

export interface Contact {
  id: string
  email: string
  name: string | null
  phone: string | null
  town: string | null
  sources: string[]
  consent: "unknown" | "granted" | "denied"
  unsubscribed: boolean
  unsubscribed_at: string | null
  bounced: boolean
  created_at: string
  updated_at: string
  provider_synced_at: string | null
  registrations: number
}

export interface ContactImport {
  id: string
  created_at: string
  created_by_email: string | null
  filename: string | null
  consent: "unknown" | "granted"
  found: number
  imported: number
  merged: number
  duplicates: number
  rejected_count: number
  still_unknown: number
}

export interface ImportReport {
  dryRun: boolean
  importId?: string
  found: number
  imported: number
  merged: number
  duplicates: number
  rejected: { value: string; reason: string }[]
  sample: { email: string; name: string | null; town: string | null; kids: string[]; programs: string[] }[]
}

export interface Segment {
  programs: string[]
  towns: string[]
  sources: ("registration" | "imported" | "private_training" | "waitlist")[]
  includeUnknownConsent: boolean
}

export interface EmailSessionOption { id: string; name: string; starts_on: string | null; ends_on: string | null; age_min: number | null; age_max: number | null; families: number }
export interface EmailOptions {
  camps: { id: string; name: string; kind: string; active: boolean; families: number; sessions: EmailSessionOption[] }[]
  towns: { town: string; contacts: number }[]
  miami: { name: string; groups: { grp: "boys" | "girls"; label: string; starts_on: string | null; ends_on: string | null; families: number }[] } | null
  mode: "brevo" | "mock" | "none"
  me: string
  /** Test mode: the only addresses that can receive real email. */
  testRecipients: string[] | null
  sender: { email: string; name: string }
  brand: { mailingAddress: string | null; logoUrl: string | null; replyTo: string | null }
}

export interface AudienceSummary {
  matched: number
  sendable: number
  excluded: { unsubscribed: number; bounced: number; denied: number; unknown: number }
  sample: { email: string; name: string | null; town: string | null; kids: string[]; programs: string[] }[]
}

export interface CampaignLog {
  id: string
  created_at: string
  status: "sending" | "sent" | "failed" | "test"
  sent_by_email: string | null
  segment: Segment | null
  subject: string
  body: string | null
  recipient_count: number
  excluded: AudienceSummary["excluded"] | null
  provider_campaign_id: string | null
  error: string | null
}

export interface EmailSetup {
  mode: "brevo" | "mock" | "none"
  /** Set when a real Brevo key is used outside production: only these addresses get real email. */
  testRecipients: string[] | null
  sender: { email: string; name: string }
  domain: string
  webhookUrl: string
  webhookConfigured: boolean
  /** Brevo's unsubscribe/bounce webhooks vs this deployment's address (null when Brevo isn't connected). */
  webhook: { connected: boolean; address: string; types: { type: "marketing" | "transactional"; connected: boolean; pointsAt: string | null }[] } | null
  siteUrl: string
  adminUrl: string | null
  provider: {
    connected: boolean
    account?: { email: string | null; company: string | null; plan: string | null; credits: number | null }
    senderVerified?: boolean | null
    domain?: { name: string; exists: boolean; authenticated: boolean; verified: boolean; records: { label: string; type: string; host: string; value: string; status: string }[] } | null
    error?: string
  }
  dns: { name: string; host: string; found: string | null; ok: boolean; hint: string }[]
  contacts: { total: number; consented: number; unknown: number; unsubscribed: number; bounced: number }
  settings: {
    notify_email: string | null
    reply_to_email: string | null
    mailing_address: string | null
    email_logo_url: string | null
    auto_confirmations: boolean
    auto_reminders: boolean
    reminder_note: string | null
    miami_confirmation_note: string | null
  }
}
