import { timingSafeEqual } from "node:crypto"
import type { Deps } from "../lib/deps.js"
import { ApiError, json, logError } from "../lib/http.js"
import { verifyUnsubscribe } from "../email/links.js"

function page(title: string, message: string, form = ""): Response {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${title} · Footy Up</title>
<style>body{margin:0;font:16px/1.6 -apple-system,"Segoe UI",Roboto,Arial,sans-serif;background:#f4f4f5;color:#18181b}
main{max-width:440px;margin:12vh auto;padding:36px;background:#fff;border:1px solid #e4e4e7;border-radius:16px;text-align:center}
.mark{font-weight:800;letter-spacing:2px;color:#047857;margin-bottom:18px}h1{font-size:22px;margin:0 0 8px}p{color:#52525b;margin:0 0 20px}
button{font:inherit;font-weight:600;height:44px;padding:0 22px;border:0;border-radius:10px;background:#18181b;color:#fff;cursor:pointer}</style></head>
<body><main><div class="mark">FOOTY UP</div><h1>${title}</h1><p>${message}</p>${form}</main></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  )
}

/**
 * GET shows a confirm button (so link scanners can't unsubscribe people);
 * POST unsubscribes. POST also covers one-click List-Unsubscribe.
 */
async function unsubscribe(req: Request, deps: Deps): Promise<Response> {
  const url = new URL(req.url)
  const email = verifyUnsubscribe(deps.env, url.searchParams.get("e"), url.searchParams.get("t"))
  if (!email) return page("Link not valid", "This unsubscribe link is incomplete or has been changed. Reply to any Footy Up email and we'll remove you.")
  if (req.method === "GET") {
    return page("Unsubscribe?", `Stop receiving Footy Up marketing emails at <strong>${email.replace(/</g, "&lt;")}</strong>? You'll still get confirmations for anything you register for.`, `<form method="post"><button type="submit">Unsubscribe</button></form>`)
  }
  await deps.db`
    insert into public.contacts (email, sources, unsubscribed, unsubscribed_at) values (${email}, '{}', true, now())
    on conflict (email) do update set unsubscribed = true, unsubscribed_at = coalesce(public.contacts.unsubscribed_at, now())`
  await deps.email.setBlocked(email, true).catch((err) => logError("email.unsubscribe.provider", err))
  return page("You're unsubscribed", "You won't receive Footy Up marketing emails anymore. Changed your mind? Just reply to any of our emails.")
}

interface BrevoEvent {
  event?: string
  email?: string
}

/**
 * Brevo -> us: unsubscribes, spam complaints and bounces from Brevo's webhooks
 * (marketing and transactional). Authenticated by the secret token in the URL.
 */
async function brevoWebhook(req: Request, deps: Deps): Promise<Response> {
  const secret = deps.env.brevoWebhookSecret
  const token = new URL(req.url).searchParams.get("token") ?? ""
  if (!secret || token.length !== secret.length || !timingSafeEqual(Buffer.from(token), Buffer.from(secret))) {
    throw new ApiError(401, "unauthorized", "Unauthorized")
  }
  const payload = (await req.json().catch(() => null)) as BrevoEvent | BrevoEvent[] | null
  const events = Array.isArray(payload) ? payload : payload ? [payload] : []
  let processed = 0
  for (const e of events) {
    const email = e.email?.trim().toLowerCase()
    const kind = (e.event ?? "").toLowerCase().replace(/[^a-z]/g, "")
    if (!email) continue
    if (["unsubscribed", "unsubscribe", "spam", "complaint"].includes(kind)) {
      await deps.db`update public.contacts set unsubscribed = true, unsubscribed_at = coalesce(unsubscribed_at, now()) where email = ${email}`
      processed++
    } else if (["hardbounce", "invalidemail", "blocked"].includes(kind)) {
      await deps.db`update public.contacts set bounced = true where email = ${email}`
      processed++
    }
  }
  return json({ ok: true, processed })
}

/** /api/email/<action> */
export async function emailPublic(req: Request, deps: Deps): Promise<Response> {
  const action = new URL(req.url).pathname.split("/").filter(Boolean).at(-1)
  if (action === "unsubscribe" && (req.method === "GET" || req.method === "POST")) return unsubscribe(req, deps)
  if (action === "brevo-webhook" && req.method === "POST") return brevoWebhook(req, deps)
  throw new ApiError(404, "not_found", "Not found")
}
