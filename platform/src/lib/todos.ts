/**
 * Settings → To do: what still needs a decision or setup before (and after) launch.
 *
 * Decisions are places where the live site (footyup.net), the client's Kickoff
 * Form and the Developer Brief disagree. Each option can be applied in one
 * click and the item stays listed until an admin confirms it with the client.
 * Launch checks are computed from the database and environment, so they clear
 * themselves once fixed.
 */
import type { Db } from "./db.js";
import type { Env } from "./env.js";
import { ApiError } from "./http.js";
import { getSettings } from "./settings.js";

export type TodoSeverity = "blocker" | "warning" | "info";

export interface TodoOption {
  id: string;
  label: string;
  detail: string;
  source: string;
  current: boolean;
}

export interface Todo {
  key: string;
  kind: "decision" | "check";
  severity: TodoSeverity;
  title: string;
  detail: string;
  options?: TodoOption[];
  /** Settings section where it's fixed by hand. */
  section?: "camps" | "miami" | "codes" | "discounts" | "waivers" | "email" | "admins" | "training";
  /** Fixed (checks) — computed, not stored. */
  done: boolean;
  confirmed: { by: string; at: string; option?: string } | null;
  /** Checks that can be marked "confirmed" because only the client can answer them. */
  confirmable: boolean;
}

interface EventRow {
  opens_at: Date | null;
  public_opens_at: Date | null;
  location: string | null;
  price_tiers: { until: string | null; cents: number }[];
  reserved_total: number;
  waiver_required: boolean;
}
interface GroupRow {
  grp: "boys" | "girls";
  cap: number;
  price_public_cents: number | null;
  price_code_holder_cents: number | null;
  reserved_for_code_holders: number;
}

const iso = (d: Date | null) => (d ? d.getTime() : null);
const at = (s: string) => Date.parse(s);

/** Decisions: how to apply each option. Everything runs in one transaction. */
const DECISIONS: Record<string, Record<string, (tx: Db) => Promise<void>>> = {
  watertown_price: {
    site: (tx) => setWatertown(tx, 41500),
    kickoff: (tx) => setWatertown(tx, 42500),
  },
};

async function setWatertown(tx: Db, cents: number) {
  await tx`
    update public.sessions set price_cents = ${cents}
     where slug in ('week1', 'week2') and camp_id = (select id from public.camps where slug = 'watertown_2027')`;
}

export async function applyDecision(tx: Db, key: string, option: string) {
  const apply = DECISIONS[key]?.[option];
  if (!apply) throw new ApiError(404, "not_found", "Unknown choice.");
  await apply(tx);
}

export async function confirmTodo(tx: Db, key: string, by: string, option?: string) {
  const settings = await getSettings(tx);
  const next = { ...settings.todo_resolved, [key]: { by, at: new Date().toISOString(), ...(option ? { option } : {}) } };
  await tx`
    insert into public.settings (key, value) values ('todo_resolved', ${tx.json(next)})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
}

export async function reopenTodo(tx: Db, key: string) {
  const settings = await getSettings(tx);
  const next = { ...settings.todo_resolved };
  delete next[key];
  await tx`
    insert into public.settings (key, value) values ('todo_resolved', ${tx.json(next)})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
}

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US")}`;
const et = (d: Date | null) =>
  d ? d.toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "not set";

export async function listTodos(db: Db, env: Env): Promise<Todo[]> {
  const settings = await getSettings(db);
  const [event] = await db<EventRow[]>`select opens_at, public_opens_at, location, price_tiers, reserved_total, waiver_required from public.miami_event`;
  const groups = await db<GroupRow[]>`select grp, cap, price_public_cents, price_code_holder_cents, reserved_for_code_holders from public.miami_groups order by grp`;
  const [counts] = await db<{
    admins: number; codes: number; camp_waiver: number; miami_waiver: number; stripe_events: number; imports: number;
    undated: string[]; no_route: string[]; watertown: number[];
  }[]>`
    select (select count(*)::int from public.admin_users) as admins,
           (select count(*)::int from public.access_codes where active and (ends_at is null or ends_at > now())) as codes,
           (select count(*)::int from public.waivers where active and flow in ('camp', 'all')) as camp_waiver,
           (select count(*)::int from public.waivers where active and flow in ('miami', 'all')) as miami_waiver,
           (select count(*)::int from public.stripe_events) as stripe_events,
           (select count(*)::int from public.contact_imports) as imports,
           (select coalesce(array_agg(c.name || ' · ' || s.name order by c.sort_order, s.sort_order), '{}')
              from public.sessions s join public.camps c on c.id = s.camp_id
             where s.status = 'open' and c.active and not c.info_only and s.starts_on is null) as undated,
           (select coalesce(array_agg(name order by sort_order), '{}') from public.camps
             where active and kind <> 'miami' and site_route is null) as no_route,
           (select coalesce(array_agg(s.price_cents order by s.slug), '{}') from public.sessions s join public.camps c on c.id = s.camp_id
             where c.slug = 'watertown_2027' and s.slug in ('week1', 'week2')) as watertown`;
  const c = counts!;
  const resolved = settings.todo_resolved;
  const items: Omit<Todo, "confirmed">[] = [];
  const opt = (id: string, label: string, detail: string, source: string, current: boolean): TodoOption => ({ id, label, detail, source, current });

  // The Miami decisions (opening, price, caps, reserved spots, venue) were
  // retired when the combine moved to Middlesex School (Boston College Combine).
  if (event) {
    const gated = event.opens_at && event.public_opens_at && event.public_opens_at.getTime() > event.opens_at.getTime();
    if (gated) {
      items.push({
        key: "access_code", kind: "check", severity: "blocker", section: "codes", done: c.codes > 0, confirmable: false,
        title: "Add the combine access code",
        detail: `Until ${et(event.public_opens_at)} only families with the code can register. With no active code, nobody can register before then.`,
      });
    }
  }

  if (c.watertown.length === 2) {
    items.push({
      key: "watertown_price", kind: "decision", severity: "warning", section: "camps", done: false, confirmable: true,
      title: "Watertown price",
      detail: `The live site charges $415 a week ($830 for both). The Kickoff Form says $425. Now set: ${c.watertown.map(money).join(" / ")} per week.`,
      options: [
        opt("site", "$415 a week", "$830 for both weeks.", "Live site", c.watertown.every((p) => p === 41500)),
        opt("kickoff", "$425 a week", "$850 for both weeks.", "Kickoff Form", c.watertown.every((p) => p === 42500)),
      ],
    });
  }

  items.push(
    {
      key: "promo_codes", kind: "check", severity: "info", section: "discounts", done: false, confirmable: true,
      title: "Promo codes: which ones to use",
      detail: "The Developer Brief (D10) asks for promo codes managed here (Settings → Discounts); the Kickoff Form doesn't mention them. The site's forms now have a promo box for these codes, and Stripe's own promotion-code box still works for codes made in Stripe. Agree with the client which to use.",
    },
    {
      key: "sibling_discount", kind: "check", severity: "info", section: "discounts", done: settings.sibling_discount.kind !== "none", confirmable: true,
      title: "Sibling discount amount",
      detail: "The Developer Brief (D10) asks for a discount on the 2nd and later child. The amount is up to the client; it's off until set.",
    },
    {
      key: "admins", kind: "check", severity: "warning", section: "admins", done: c.admins >= 2, confirmable: false,
      title: "Add Chris as an admin",
      detail: `The Kickoff Form gives dashboard access to Alex and Chris Calden. Admins now: ${c.admins}.`,
    },
    {
      key: "waiver", kind: "check", severity: event?.waiver_required || settings.camp_waiver_required ? "blocker" : "warning", section: "waivers",
      done: c.camp_waiver > 0 && c.miami_waiver > 0, confirmable: false,
      title: "Publish the waiver wording",
      detail: "The client promised the waiver text (Developer Brief D13). Until it's published, registrations are saved as \"waiver not collected\".",
    },
    {
      key: "notify_email", kind: "check", severity: "warning", section: "email", done: Boolean(settings.notify_email), confirmable: false,
      title: "Who gets private training inquiries",
      detail: "Set the notification email so inquiries are emailed to the coaches, not only saved here.",
    },
    {
      key: "mailing_address", kind: "check", severity: "warning", section: "email", done: Boolean(settings.mailing_address) && !settings.mailing_address!.startsWith("[TEST]"), confirmable: false,
      title: "Business mailing address",
      detail: settings.mailing_address?.startsWith("[TEST]")
        ? "A temporary placeholder is in use so test emails can go out. Replace it with the real business address before emailing families."
        : "Required in the footer of every campaign email (Kickoff Form, Section D, left blank).",
    },
    {
      key: "contact_list", kind: "check", severity: "info", done: c.imports > 0, confirmable: true,
      title: "Import the contact list",
      detail: "Kickoff Form: \"don't need right now\". Import it from Contacts → Import when it's ready, along with how those contacts agreed to be emailed.",
    },
    {
      key: "site_text", kind: "check", severity: "info", done: false, confirmable: true,
      title: "Words on the site pages",
      detail: "Prices, ages, spots and open/closed now follow these settings. Dates written in sentences, descriptions and session labels are still in the site's code (src/camps.jsx), so update them there when they change.",
    },
  );

  if (c.undated.length) {
    items.push({
      key: "session_dates", kind: "check", severity: "warning", section: "camps", done: false, confirmable: false,
      title: "Open sessions without dates",
      detail: `Reminder emails need a start date: ${c.undated.join("; ")}.`,
    });
  }
  if (c.no_route.length) {
    items.push({
      key: "site_routes", kind: "check", severity: "info", section: "camps", done: false, confirmable: true,
      title: "Camps without a site page",
      detail: `Families who cancel checkout return to the home page: ${c.no_route.join("; ")}.`,
    });
  }

  // Environment (Vercel project settings; Ivy Devs).
  items.push(
    {
      key: "stripe_mode", kind: "check", severity: env.paymentsMode === "mock" ? "info" : "warning",
      done: env.paymentsMode === "stripe" && Boolean(env.stripeSecretKey?.startsWith("sk_live_")), confirmable: false,
      title: env.paymentsMode === "mock" ? "Payments are simulated (local test mode)" : "Stripe is in test mode",
      detail: "Switch to the client's live Stripe keys only after the Stage 1 checklist is signed off.",
    },
    {
      key: "brevo", kind: "check", severity: env.onVercel ? "warning" : "info", done: Boolean(env.brevoApiKey), confirmable: false,
      title: "Email sending (Brevo)",
      detail: "Without BREVO_API_KEY, confirmations and campaigns are logged, not sent. See docs/email-guide.md.",
    },
    {
      key: "admin_login", kind: "check", severity: env.onVercel ? "blocker" : "info", done: env.adminAuthMode === "supabase", confirmable: false,
      title: "Supabase sign-in",
      detail: "Set SUPABASE_URL and SUPABASE_ANON_KEY so Alex and Chris sign in with their passwords. Locally, the email-only test login is used.",
    },
    {
      key: "invites", kind: "check", severity: "info", section: "admins", done: Boolean(env.supabaseServiceRoleKey) || env.adminAuthMode === "dev", confirmable: false,
      title: "Admin invites from the dashboard",
      detail: "Needs SUPABASE_SERVICE_ROLE_KEY and PUBLIC_ADMIN_URL in the Vercel project.",
    },
    {
      key: "stripe_webhook", kind: "check", severity: env.onVercel ? "warning" : "info", done: c.stripe_events > 0, confirmable: false,
      title: "Stripe webhook",
      detail: "No payment events have arrived yet. Point Stripe's webhook at /api/stripe/webhook so payments land here.",
    },
  );

  return items.map((t) => ({ ...t, confirmed: resolved[t.key] ?? null }));
}

const RANK: Record<TodoSeverity, number> = { blocker: 0, warning: 1, info: 2 };
export const isOpen = (t: Todo) => !t.done && !t.confirmed;
export const sortTodos = (items: Todo[]) => [...items].sort((a, b) => Number(!isOpen(a)) - Number(!isOpen(b)) || RANK[a.severity] - RANK[b.severity]);
