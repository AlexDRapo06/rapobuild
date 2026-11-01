import type { z } from "zod";
import type { ErrorCode, ErrorResponse } from "../contract.js";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

export async function readJson(req: Request, maxBytes = 32_000): Promise<unknown> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > maxBytes) throw new ApiError(413, "payload_too_large", "Request body is too large");
  const raw = await req.text();
  if (raw.length > maxBytes) throw new ApiError(413, "payload_too_large", "Request body is too large");
  try {
    return JSON.parse(raw);
  } catch {
    throw new ApiError(400, "invalid_json", "Request body must be valid JSON");
  }
}

export function parse<S extends z.ZodType>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ApiError(400, "validation_failed", "Some fields are missing or invalid", {
      issues: result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  return result.data;
}

export function clientIp(req: Request): string {
  // The site's own functions call the platform server-to-server, so the
  // family's IP arrives in a header that's only trusted with the shared key.
  const siteKey = process.env.SITE_API_KEY;
  if (siteKey && req.headers.get("x-site-key") === siteKey) {
    const relayed = req.headers.get("x-footyup-client-ip");
    if (relayed) return relayed.split(",")[0]!.trim();
  }
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Logs only the error's class and database code/constraint. Postgres error
 * messages and details can echo row values, which may include personal data.
 */
export function logError(scope: string, err: unknown): void {
  const e = err as { name?: string; code?: string; constraint?: string; type?: string };
  console.error(JSON.stringify({ level: "error", scope, name: e?.name ?? typeof err, code: e?.code, constraint: e?.constraint, type: e?.type }));
}

export function errorResponse(err: unknown, scope: string): Response {
  if (err instanceof ApiError) {
    const body: ErrorResponse = { error: err.code, message: err.message };
    if (err.details) body.details = err.details;
    return json(body, err.status, err.status === 429 ? { "retry-after": "60" } : {});
  }
  logError(scope, err);
  const body: ErrorResponse = { error: "internal_error", message: "Something went wrong. Please try again." };
  return json(body, 500);
}

/**
 * Origins allowed to call the public endpoints from a browser, e.g. the live
 * site and its staging domain when they're on a different Vercel project.
 * Comma-separated in CORS_ALLOWED_ORIGINS.
 */
function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  const allowed = (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  if (!origin || !allowed.includes(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "600",
    vary: "Origin",
  };
}

/** Wraps a handler so thrown ApiErrors become JSON responses and nothing else leaks. Also answers CORS preflights. */
export function endpoint(scope: string, fn: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    const cors = corsHeaders(req);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    let res: Response;
    try {
      res = await fn(req);
    } catch (err) {
      res = errorResponse(err, scope);
    }
    for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
    return res;
  };
}
