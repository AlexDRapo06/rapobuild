import type { Db } from "./db.js";

/**
 * Runtime settings stored in the `settings` table, so the client's pending
 * decisions can be changed without a deploy. Missing rows fall back to these
 * defaults. Change them with `pnpm settings set <key> <json>`.
 */
export const SETTING_DEFAULTS = {
  /** Who receives private training notifications. */
  notify_email: null as string | null,
  /** Reply-to on parent emails (Stage 3). */
  reply_to_email: null as string | null,
  /** Postal address required in marketing email footers (Stage 2). */
  mailing_address: null as string | null,
  timezone: "America/New_York",
  /** Require waiver acceptance on camp checkouts once a camp waiver exists. */
  camp_waiver_required: false,
  /** Minutes a camp spot is held during Stripe Checkout (Stripe minimum is 30). */
  camp_hold_minutes: 35,
  default_success_path: "/registration/success",
  default_cancel_path: "/registration/cancelled",
  /** Optional hosted logo for email headers (the wordmark is used until the client's logo arrives). */
  email_logo_url: null as string | null,
  /** Confirmation email right after a registration is saved (Brief D8). */
  auto_confirmations: true,
  /** Reminder emails before the first day; per-session offsets live on sessions.reminder_days. */
  auto_reminders: true,
  miami_reminder_days: [7, 1] as number[],
  /** Extra paragraph in every reminder, e.g. what to bring. */
  reminder_note: null as string | null,
  /** Extra paragraph in Miami confirmations. */
  miami_confirmation_note: null as string | null,
  /** Automatic discount on the 2nd and later child in one checkout (Brief D10; amount TBC by the client). */
  sibling_discount: { kind: "none", amount: 0, applies: "camps" } as SiblingDiscount,
  /** How long a waitlist offer holds its spot (Brief D9 proposes 48 hours). */
  waitlist_hold_hours: 48,
  /** Site pages that read ?waitlist=<token> and start checkout for the held spot. */
  waitlist_session_path: "/",
  waitlist_miami_path: "/",
  /** Private-training packages sold by the site's "Buy" buttons (ids match the site). */
  training_packages: [
    { id: "individual_5", name: "Individual — 5 Sessions (1 hr 30 min each)", cents: 55000 },
    { id: "individual_7", name: "Individual — 7 Sessions (1 hr 30 min each)", cents: 64000 },
    { id: "individual_10", name: "Individual — 10 Sessions (1 hr 30 min each)", cents: 91000 },
    { id: "group2_5", name: "Group of 2 — 5 Sessions (1 hr 30 min each)", cents: 85000 },
    { id: "group2_7", name: "Group of 2 — 7 Sessions (1 hr 30 min each)", cents: 100000 },
  ] as { id: string; name: string; cents: number }[],
  /** Settings → To do items an admin confirmed with the client. */
  todo_resolved: {} as Record<string, { by: string; at: string; option?: string }>,
};

export interface SiblingDiscount {
  kind: "none" | "percent" | "amount";
  /** Percent (1-100) or cents. */
  amount: number;
  applies: "camps" | "miami" | "all";
}

/** Settings the dashboard's Email setup page may change. */
export const DASHBOARD_SETTINGS = [
  "notify_email",
  "reply_to_email",
  "mailing_address",
  "email_logo_url",
  "auto_confirmations",
  "auto_reminders",
  "reminder_note",
  "miami_confirmation_note",
] as const;

export type Settings = typeof SETTING_DEFAULTS;
export type SettingKey = keyof Settings;

export async function getSettings(db: Db): Promise<Settings> {
  const rows = await db<{ key: string; value: unknown }[]>`select key, value from public.settings`;
  const merged: Record<string, unknown> = { ...SETTING_DEFAULTS };
  for (const row of rows) {
    if (row.key in SETTING_DEFAULTS) merged[row.key] = row.value;
  }
  return merged as Settings;
}

export function isSettingKey(key: string): key is SettingKey {
  return key in SETTING_DEFAULTS;
}
