/**
 * Dashboard admins: used by Settings → Admins and by `pnpm admins`.
 *
 * With Supabase, adding someone sends Supabase's invite email (they choose a
 * password from the link) and needs SUPABASE_SERVICE_ROLE_KEY on the server.
 * Without Supabase (local development) it creates a local user for the dev login.
 */
import type { Db, Sql } from "./db.js";
import type { Env } from "./env.js";
import { ApiError } from "./http.js";

export type GrantResult = "invited" | "existing_login" | "local" | "already_admin";

export interface AdminListRow {
  userId: string;
  email: string;
  createdAt: string;
  invitedBy: string | null;
  /** From Supabase when the server can ask it; null otherwise. */
  status: "active" | "invite_pending" | null;
  lastSignInAt: string | null;
}

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1"];

function isLocalDatabase(url: string) {
  try {
    return LOCAL_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** How admins can be added on this deployment. */
export function inviteMode(env: Pick<Env, "supabaseUrl" | "supabaseServiceRoleKey" | "databaseUrl">): "supabase" | "local" | "unavailable" {
  if (env.supabaseUrl && env.supabaseServiceRoleKey) return "supabase";
  if (!env.supabaseUrl && isLocalDatabase(env.databaseUrl)) return "local";
  return "unavailable";
}

type AdminEnv = Pick<Env, "supabaseUrl" | "supabaseServiceRoleKey" | "databaseUrl" | "adminUrl">;

function supabaseHeaders(env: AdminEnv) {
  return { apikey: env.supabaseServiceRoleKey!, authorization: `Bearer ${env.supabaseServiceRoleKey}`, "content-type": "application/json" };
}

interface SupabaseUser {
  id: string;
  email?: string;
  invited_at?: string | null;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
}

async function supabaseUsers(env: AdminEnv): Promise<SupabaseUser[]> {
  const all: SupabaseUser[] = [];
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(`${env.supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=200`, { headers: supabaseHeaders(env) });
    if (!res.ok) throw new ApiError(502, "internal_error", `Supabase didn't return the user list (${res.status}).`);
    const { users } = (await res.json()) as { users: SupabaseUser[] };
    all.push(...users);
    if (users.length < 200) break;
  }
  return all;
}

async function supabaseUserFor(env: AdminEnv, email: string): Promise<{ id: string; result: GrantResult }> {
  const redirect = env.adminUrl ? `?redirect_to=${encodeURIComponent(env.adminUrl)}` : "";
  const invite = await fetch(`${env.supabaseUrl}/auth/v1/invite${redirect}`, {
    method: "POST",
    headers: supabaseHeaders(env),
    body: JSON.stringify({ email }),
  });
  if (invite.ok) return { id: ((await invite.json()) as { id: string }).id, result: "invited" };
  // Supabase refuses to invite an address that already has a login; grant that login instead.
  const found = (await supabaseUsers(env)).find((u) => u.email?.toLowerCase() === email);
  if (found) return { id: found.id, result: "existing_login" };
  const detail = ((await invite.json().catch(() => ({}))) as { msg?: string; message?: string });
  throw new ApiError(502, "internal_error", `Supabase couldn't send the invite: ${detail.msg ?? detail.message ?? invite.status}.`);
}

/** Gives `email` dashboard access, inviting them first if they have no login. */
export async function grantAdmin(db: Db, env: AdminEnv, rawEmail: string, invitedBy: string | null): Promise<{ email: string; result: GrantResult }> {
  const email = rawEmail.trim().toLowerCase();
  const [already] = await db`select 1 from public.admin_users where lower(email) = ${email}`;
  if (already) return { email, result: "already_admin" };

  const mode = inviteMode(env);
  let userId: string;
  let result: GrantResult;
  if (mode === "supabase") {
    ({ id: userId, result } = await supabaseUserFor(env, email));
  } else if (mode === "local") {
    const [existing] = await db<{ id: string }[]>`select id from auth.users where lower(email) = ${email}`;
    userId = existing?.id ?? (await db<{ id: string }[]>`insert into auth.users (email) values (${email}) returning id`)[0]!.id;
    result = "local";
  } else {
    throw new ApiError(
      503,
      "internal_error",
      "Adding admins here needs SUPABASE_SERVICE_ROLE_KEY in this deployment's environment variables. Until then, run `pnpm admins add <email>`.",
    );
  }
  await db`
    insert into public.admin_users (user_id, email, invited_by) values (${userId}, ${email}, ${invitedBy})
    on conflict (user_id) do update set email = excluded.email`;
  return { email, result };
}

/** Removes dashboard access; the login itself is kept. Refuses to remove yourself or the last admin. */
export async function revokeAdmin(db: Sql, userId: string, actingUserId: string | null): Promise<string> {
  if (actingUserId && userId === actingUserId) {
    throw new ApiError(422, "validation_failed", "You can't remove your own access. Ask another admin to do it.");
  }
  return db.begin(async (tx) => {
    const rows = await tx<{ user_id: string; email: string }[]>`select user_id, email from public.admin_users for update`;
    const target = rows.find((r) => r.user_id === userId);
    if (!target) throw new ApiError(404, "not_found", "That person isn't an admin.");
    if (rows.length <= 1) throw new ApiError(422, "validation_failed", "There has to be at least one admin.");
    await tx`delete from public.admin_users where user_id = ${userId}`;
    return target.email;
  });
}

export async function listAdmins(db: Db, env: AdminEnv): Promise<AdminListRow[]> {
  const rows = await db<{ user_id: string; email: string; created_at: Date; invited_by: string | null }[]>`
    select user_id, email, created_at, invited_by from public.admin_users order by created_at`;
  let users = new Map<string, SupabaseUser>();
  if (inviteMode(env) === "supabase") {
    try {
      users = new Map((await supabaseUsers(env)).map((u) => [u.id, u]));
    } catch {
      // The list still shows without sign-in details.
    }
  }
  return rows.map((r) => {
    const u = users.get(r.user_id);
    return {
      userId: r.user_id,
      email: r.email,
      createdAt: r.created_at.toISOString(),
      invitedBy: r.invited_by,
      status: u ? (u.last_sign_in_at || u.email_confirmed_at ? "active" : "invite_pending") : null,
      lastSignInAt: u?.last_sign_in_at ?? null,
    };
  });
}
