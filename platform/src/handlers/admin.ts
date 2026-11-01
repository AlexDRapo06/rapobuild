import { z } from "zod";
import { asAdmin, requireAdmin, signDevToken } from "../lib/admin-auth.js";
import type { Deps } from "../lib/deps.js";
import { enforceRateLimit } from "../lib/guards.js";
import { ApiError, json, parse, readJson } from "../lib/http.js";
import { EMAIL_GET, EMAIL_POST } from "./admin-email.js";
import { ADMIN_USERS_GET, ADMIN_USERS_POST } from "./admin-users.js";
import { TODO_GET, TODO_POST } from "./admin-todos.js";
import { MANAGE_GET, MANAGE_POST } from "./admin-manage.js";

/** GET /api/admin/config: tells the dashboard how to sign in. Public. */
async function config(_req: Request, deps: Deps) {
  const { adminAuthMode, supabaseUrl, supabaseAnonKey } = deps.env;
  return json({ auth: adminAuthMode, supabaseUrl: supabaseUrl ?? null, supabaseAnonKey: supabaseAnonKey ?? null });
}

/** POST /api/admin/dev-login: local development only, for an email already in admin_users. */
async function devLogin(req: Request, deps: Deps) {
  if (deps.env.adminAuthMode !== "dev") throw new ApiError(404, "not_found", "Not found");
  await enforceRateLimit(deps.db, deps.env, req, "verifyCode");
  const { email } = parse(z.object({ email: z.string().trim().toLowerCase() }), await readJson(req));
  const [admin] = await deps.db<{ user_id: string; email: string }[]>`
    select user_id, email from public.admin_users where lower(email) = ${email}`;
  if (!admin) throw new ApiError(403, "unauthorized", "That email isn't an admin. Add it with `pnpm admins add <email>`.");
  const { token, expiresAt } = signDevToken(deps, { id: admin.user_id, email: admin.email });
  return json({ accessToken: token, expiresAt, email: admin.email });
}

async function overview(req: Request, deps: Deps) {
  const user = await requireAdmin(req, deps);
  return json(
    await asAdmin(deps, user, async (tx) => {
      const [event] = await tx`
        select name, opens_at, public_opens_at, closes_at, checkout_open, reserved_total, reserved_until
          from public.miami_event`;
      const miami = await tx`
        select a.grp, a.label, a.cap, a.code_taken, a.public_taken, a.reserved_effective,
               a.left_for_code_holders, a.left_for_public, a.price_code_holder_cents, a.price_public_cents,
               g.starts_on, g.ends_on,
               (select count(*)::int from public.registrations r join public.payments p on p.id = r.payment_id
                 where r.miami_group = a.grp and r.status = 'active' and p.status <> 'refunded') as paid,
               (select coalesce(sum(h.quantity), 0)::int from public.holds h
                 where h.miami_group = a.grp and h.status = 'active' and h.expires_at > now()) as held
          from public.miami_availability() a join public.miami_groups g on g.grp = a.grp
         order by a.grp`;
      const [codes] = await tx`select public.miami_codes_active() as active, public.miami_gate_active() as required`;
      const byCamp = await tx`
        select c.name as camp, c.kind, coalesce(s.name, initcap(r.miami_group)) as session, count(*)::int as registrations
          from public.registrations r
          join public.payments p on p.id = r.payment_id
          join public.camps c on c.id = r.camp_id
          left join public.sessions s on s.id = r.session_id
         where r.status = 'active' and p.status <> 'refunded'
         group by c.name, c.kind, coalesce(s.name, initcap(r.miami_group)), c.sort_order
         order by c.kind = 'miami' desc, c.sort_order, 3`;
      const [totals] = await tx`
        select (select count(*)::int from public.registrations r join public.payments p on p.id = r.payment_id
                 where r.status = 'active' and p.status <> 'refunded') as registrations,
               (select coalesce(sum(amount_total_cents - refunded_cents), 0)::int from public.payments where intent_id is not null) as net_cents,
               (select count(*)::int from public.private_training_requests where status = 'new') as new_requests,
               (select count(*)::int from public.waitlist_entries where status = 'waiting') as waiting,
               (select count(*)::int from public.payments where intent_id is null) as legacy_payments`;
      const daily = await tx`
        select to_char(d, 'YYYY-MM-DD') as day,
               (select count(*)::int from public.registrations r join public.payments p on p.id = r.payment_id
                 where r.status = 'active' and p.status <> 'refunded'
                   and (r.created_at at time zone 'America/New_York')::date = d) as registrations
          from generate_series(public.app_today() - 13, public.app_today(), interval '1 day') as d
         order by d`;
      const recent = await tx`
        select r.id, r.created_at, r.player_name, r.parent_town, c.name as camp, s.name as session, r.miami_group
          from public.registrations r
          join public.camps c on c.id = r.camp_id
          left join public.sessions s on s.id = r.session_id
         order by r.created_at desc, r.line_no
         limit 6`;
      return { me: { email: user.email }, event: event ?? null, codes, miami, byCamp, totals, daily, recent };
    }),
  );
}

async function registrations(req: Request, deps: Deps) {
  const user = await requireAdmin(req, deps);
  const rows = await asAdmin(
    deps,
    user,
    (tx) => tx`
      select r.id, r.created_at, c.name as camp, c.kind as camp_kind, s.name as session, r.session_id, r.miami_group,
             r.via_access_code, r.status,
             r.parent_name, r.parent_first_name, r.parent_last_name, r.parent_email, r.parent_phone, r.emergency_phone, r.parent_town,
             r.player_name, r.player_first_name, r.player_last_name, r.player_age, r.player_sex, r.player_email,
             r.player_height_in, r.player_weight_lb, r.player_position, r.player_club, r.shirt_size, r.short_size,
             r.ship_line1, r.ship_line2, r.ship_city, r.ship_state, r.ship_postal_code, r.extra,
             r.waiver_status, w.version as waiver_version, r.waiver_accepted_at, r.waiver_accepted_name,
             p.status as payment_status, p.amount_total_cents as checkout_total_cents, p.discount_cents, p.refunded_cents,
             p.stripe_payment_intent_id, p.stripe_checkout_session_id, r.price_cents, r.discount_cents, r.cancelled_at, r.cancel_reason,
             p.promo_code
        from public.registrations r
        join public.camps c on c.id = r.camp_id
        join public.payments p on p.id = r.payment_id
        left join public.sessions s on s.id = r.session_id
        left join public.waivers w on w.id = r.waiver_id
       order by r.created_at desc, r.line_no`,
  );
  return json({ registrations: rows });
}

async function requests(req: Request, deps: Deps) {
  const user = await requireAdmin(req, deps);
  const rows = await asAdmin(
    deps,
    user,
    (tx) => tx`
      select id, created_at, parent_name, email, phone, town, player_name, player_age, message, preferred_times, status,
             players, bundle, player_ages
        from public.private_training_requests order by created_at desc`,
  );
  const purchases = await asAdmin(
    deps,
    user,
    (tx) => tx`
      select t.id, t.created_at, t.package_id, t.package_name, t.parent_name, t.email, t.phone, t.player_name, t.player_age, t.status,
             p.amount_total_cents, p.refunded_cents, p.status as payment_status
        from public.training_purchases t join public.payments p on p.id = t.payment_id
       order by t.created_at desc`,
  );
  return json({ requests: rows, purchases });
}

async function waitlist(req: Request, deps: Deps) {
  const user = await requireAdmin(req, deps);
  const rows = await asAdmin(
    deps,
    user,
    (tx) => tx`
      select w.id, w.created_at, c.name as camp, s.name as session, w.session_id, w.miami_group, w.parent_name, w.email, w.phone, w.town,
             w.spots, w.status, w.notified_at, w.offer_expires_at, w.converted_at
        from public.waitlist_entries w
        join public.camps c on c.id = w.camp_id
        left join public.sessions s on s.id = w.session_id
       order by w.created_at`,
  );
  return json({ waitlist: rows });
}

const GET_VIEWS: Record<string, (req: Request, deps: Deps) => Promise<Response>> = { config, overview, registrations, requests, waitlist, ...EMAIL_GET, ...MANAGE_GET, ...ADMIN_USERS_GET, ...TODO_GET };
const POST_VIEWS: Record<string, (req: Request, deps: Deps) => Promise<Response>> = { "dev-login": devLogin, ...EMAIL_POST, ...MANAGE_POST, ...ADMIN_USERS_POST, ...TODO_POST };

/** /api/admin/<view> */
export async function admin(req: Request, deps: Deps): Promise<Response> {
  const view = new URL(req.url).pathname.split("/").filter(Boolean).at(-1) ?? "";
  const handler = (req.method === "POST" ? POST_VIEWS : GET_VIEWS)[view];
  if (!handler) throw new ApiError(404, "not_found", "Not found");
  return handler(req, deps);
}
