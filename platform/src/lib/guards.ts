import { createHash } from "node:crypto";
import type { Db } from "./db.js";
import type { Env } from "./env.js";
import { ApiError, clientIp } from "./http.js";

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Codes are case- and whitespace-insensitive, so "FootyUp 2027 " matches "footyup2027". */
export function hashAccessCode(code: string): string {
  return sha256(code.trim().toLowerCase().replace(/\s+/g, ""));
}

export const RATE_LIMITS = {
  checkout: { limit: 20, windowSeconds: 600 },
  verifyCode: { limit: 10, windowSeconds: 600 },
  privateTraining: { limit: 5, windowSeconds: 3600 },
  waitlist: { limit: 10, windowSeconds: 3600 },
  publicRead: { limit: 300, windowSeconds: 600 },
} as const;

export async function enforceRateLimit(db: Db, env: Env, req: Request, bucket: keyof typeof RATE_LIMITS): Promise<void> {
  const { limit, windowSeconds } = RATE_LIMITS[bucket];
  const key = `${bucket}:${sha256(env.rateLimitSalt + clientIp(req)).slice(0, 32)}`;
  const [row] = await db<{ ok: boolean }[]>`select public.rate_limit_hit(${key}, ${limit}, ${windowSeconds}) as ok`;
  if (!row?.ok) throw new ApiError(429, "rate_limited", "Too many requests. Please wait a minute and try again.");
}

export async function verifyTurnstile(env: Env, token: string | undefined, req: Request): Promise<void> {
  if (!env.turnstileSecretKey) return;
  if (!token) throw new ApiError(400, "captcha_failed", "Please complete the verification challenge.");
  const body = new URLSearchParams({ secret: env.turnstileSecretKey, response: token, remoteip: clientIp(req) });
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  const result = (await res.json().catch(() => ({}))) as { success?: boolean };
  if (!result.success) throw new ApiError(400, "captcha_failed", "Verification failed. Please try again.");
}
