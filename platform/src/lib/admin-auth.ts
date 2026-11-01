import { createHmac, timingSafeEqual } from "node:crypto";
import type { Db } from "./db.js";
import type { Deps } from "./deps.js";
import { ApiError } from "./http.js";

export interface AdminUser {
  id: string;
  email: string;
}

const verified = new Map<string, { user: AdminUser; until: number }>();
const CACHE_MS = 60_000;

function devSecret(deps: Deps) {
  return createHmac("sha256", deps.env.rateLimitSalt).update("admin-dev-login").digest();
}

/** Local development only: a short-lived token signed with a key derived from RATE_LIMIT_SALT. */
export function signDevToken(deps: Deps, user: AdminUser, ttlSeconds = 8 * 3600): { token: string; expiresAt: number } {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = Buffer.from(JSON.stringify({ sub: user.id, email: user.email, exp: expiresAt })).toString("base64url");
  const sig = createHmac("sha256", devSecret(deps)).update(payload).digest("base64url");
  return { token: `dev.${payload}.${sig}`, expiresAt };
}

function verifyDevToken(deps: Deps, token: string): AdminUser | null {
  const [prefix, payload, sig] = token.split(".");
  if (prefix !== "dev" || !payload || !sig) return null;
  const expected = createHmac("sha256", devSecret(deps)).update(payload).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString()) as { sub: string; email: string; exp: number };
  if (claims.exp * 1000 < Date.now()) return null;
  return { id: claims.sub, email: claims.email };
}

/** Asks Supabase Auth who the token belongs to. Works with any signing-key setup. */
async function verifySupabaseToken(deps: Deps, token: string): Promise<AdminUser | null> {
  const cached = verified.get(token);
  if (cached && cached.until > Date.now()) return cached.user;
  const res = await fetch(`${deps.env.supabaseUrl}/auth/v1/user`, {
    headers: { authorization: `Bearer ${token}`, apikey: deps.env.supabaseAnonKey! },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { id?: string; email?: string };
  if (!body.id) return null;
  const user = { id: body.id, email: body.email ?? "" };
  verified.set(token, { user, until: Date.now() + CACHE_MS });
  if (verified.size > 500) verified.delete(verified.keys().next().value!);
  return user;
}

/** Resolves the signed-in admin or throws 401/403. */
export async function requireAdmin(req: Request, deps: Deps): Promise<AdminUser> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new ApiError(401, "unauthorized", "Please sign in.");

  if (deps.env.adminAuthMode === "unconfigured") {
    throw new ApiError(503, "internal_error", "Admin login isn't configured on this deployment.");
  }
  const user = deps.env.adminAuthMode === "supabase" ? await verifySupabaseToken(deps, token) : verifyDevToken(deps, token);
  if (!user) throw new ApiError(401, "unauthorized", "Your session has expired. Please sign in again.");

  const [admin] = await deps.db<{ email: string }[]>`select email from public.admin_users where user_id = ${user.id}`;
  if (!admin) throw new ApiError(403, "unauthorized", "This account doesn't have access to the Footy Up dashboard.");
  return { id: user.id, email: user.email || admin.email };
}

/**
 * Runs queries as the signed-in user under Row Level Security, the same way
 * Supabase's own API would: role `authenticated` with the user's id as the JWT
 * subject. The policies (admin_users membership) decide what is visible.
 */
export async function asAdmin<T>(deps: Deps, user: AdminUser, fn: (tx: Db) => Promise<T>): Promise<T> {
  return deps.db.begin(async (tx) => {
    await tx`select set_config('request.jwt.claim.sub', ${user.id}, true),
                    set_config('request.jwt.claims', ${JSON.stringify({ sub: user.id, role: "authenticated", email: user.email })}, true)`;
    await tx.unsafe("set local role authenticated");
    return fn(tx);
  });
}
