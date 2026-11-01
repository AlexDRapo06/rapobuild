/**
 * Sign-in for the two Footy Up admins. In production this talks to Supabase
 * Auth's REST API directly (email + password, password reset, invite links).
 * Locally, without Supabase, it uses the API's dev login.
 */

export interface AuthConfig {
  auth: "supabase" | "dev" | "unconfigured";
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
}

export interface Session {
  accessToken: string;
  refreshToken: string | null;
  /** Epoch seconds. */
  expiresAt: number;
  email: string;
}

const STORAGE_KEY = "footyup-admin-session";

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session | null) {
  if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else localStorage.removeItem(STORAGE_KEY);
}

export async function fetchConfig(): Promise<AuthConfig> {
  const res = await fetch("/api/admin/config");
  if (!res.ok) throw new Error("Couldn't reach the server. Check your connection and refresh.");
  return res.json();
}

async function supabaseRequest(config: AuthConfig, path: string, init: RequestInit & { token?: string } = {}) {
  const res = await fetch(`${config.supabaseUrl}/auth/v1/${path}`, {
    ...init,
    headers: {
      apikey: config.supabaseAnonKey!,
      "content-type": "application/json",
      ...(init.token ? { authorization: `Bearer ${init.token}` } : {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = body.error_description || body.msg || body.message || "Something went wrong. Please try again.";
    throw new Error(message === "Invalid login credentials" ? "That email and password don't match." : message);
  }
  return body;
}

function toSession(body: { access_token: string; refresh_token?: string; expires_in?: number; expires_at?: number; user?: { email?: string } }, fallbackEmail = ""): Session {
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token ?? null,
    expiresAt: body.expires_at ?? Math.floor(Date.now() / 1000) + (body.expires_in ?? 3600),
    email: body.user?.email ?? fallbackEmail,
  };
}

export async function signIn(config: AuthConfig, email: string, password: string): Promise<Session> {
  if (config.auth === "dev") {
    const res = await fetch("/api/admin/dev-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message ?? "Sign-in failed.");
    return { accessToken: body.accessToken, refreshToken: null, expiresAt: body.expiresAt, email: body.email };
  }
  const body = await supabaseRequest(config, "token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) });
  return toSession(body, email);
}

export async function refresh(config: AuthConfig, session: Session): Promise<Session | null> {
  if (config.auth !== "supabase" || !session.refreshToken) return null;
  try {
    const body = await supabaseRequest(config, "token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: session.refreshToken }),
    });
    return toSession(body, session.email);
  } catch {
    return null;
  }
}

export async function sendPasswordReset(config: AuthConfig, email: string) {
  const redirect = `${location.origin}/admin/`;
  await supabaseRequest(config, `recover?redirect_to=${encodeURIComponent(redirect)}`, { method: "POST", body: JSON.stringify({ email }) });
}

export async function setPassword(config: AuthConfig, session: Session, password: string) {
  await supabaseRequest(config, "user", { method: "PUT", token: session.accessToken, body: JSON.stringify({ password }) });
}

export async function signOut(config: AuthConfig, session: Session | null) {
  if (config.auth === "supabase" && session) {
    await supabaseRequest(config, "logout", { method: "POST", token: session.accessToken }).catch(() => {});
  }
  saveSession(null);
}

/** Invite and password-reset links land on /admin/#access_token=...&type=invite|recovery */
export function takeLinkSession(): { session: Session; type: string } | null {
  if (!location.hash.includes("access_token=")) return null;
  const params = new URLSearchParams(location.hash.slice(1));
  history.replaceState(null, "", location.pathname + location.search);
  const accessToken = params.get("access_token");
  if (!accessToken) return null;
  return {
    type: params.get("type") ?? "magiclink",
    session: {
      accessToken,
      refreshToken: params.get("refresh_token"),
      expiresAt: Number(params.get("expires_at")) || Math.floor(Date.now() / 1000) + Number(params.get("expires_in") ?? 3600),
      email: "",
    },
  };
}

/** Error text from a link that failed, e.g. an expired invite. */
export function takeLinkError(): string | null {
  if (!location.hash.includes("error")) return null;
  const params = new URLSearchParams(location.hash.slice(1));
  history.replaceState(null, "", location.pathname + location.search);
  return params.get("error_description")?.replaceAll("+", " ") ?? "That link didn't work. Ask for a new one.";
}
