/**
 * GET/POST /api/test-checkout: the payment page for staging deployments (StagingGateway).
 * "Pay" completes the checkout exactly like Stripe's checkout.session.completed webhook,
 * including the confirmation email; "Cancel" releases the held spots like an expired session.
 */
import { randomUUID } from "node:crypto";
import { sendConfirmations } from "../email/automatic.js";
import { escapeHtml } from "../email/templates.js";
import type { Deps } from "../lib/deps.js";
import { enforceRateLimit } from "../lib/guards.js";
import { ApiError } from "../lib/http.js";
import { StagingGateway, type CheckoutCustomField } from "../lib/payments.js";
import { processWaitlistsQuietly } from "../lib/waitlist.js";
import { processStripeEvent } from "./stripe-webhook.js";

const money = (cents: number) => (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

function page(title: string, body: string, status = 200) {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title>
<style>*{box-sizing:border-box}body{font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;margin:0;background:#f4f4f5;color:#18181b}
main{max-width:480px;margin:40px auto;background:#fff;border:1px solid #e4e4e7;border-radius:14px;padding:28px}
h1{font-size:20px;margin:8px 0 4px}.tag{display:inline-block;font-size:12px;font-weight:600;color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:999px;padding:2px 10px}
ul{padding-left:18px}label{display:block;font-size:13px;font-weight:600;margin:14px 0 4px}input,select{width:100%;font:inherit;padding:9px 10px;border:1px solid #d4d4d8;border-radius:8px}
.total{font-size:18px;font-weight:700;margin:16px 0}button{font:inherit;font-weight:600;padding:11px 16px;border-radius:9px;border:1px solid transparent;cursor:pointer;margin-top:18px}
.pay{background:#18181b;color:#fff;width:100%}.cancel{background:#fff;border-color:#d4d4d8;width:100%;margin-top:8px}p.small{font-size:12px;color:#71717a}</style></head>
<body><main>${body}</main></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } },
  );
}

interface IntentRow {
  id: string;
  flow: string;
  status: string;
  amount_cents: number;
  payload: { parent?: { name?: string; email?: string; phone?: string | null }; lines?: { player?: { name?: string } }[]; packageName?: string } | null;
}

export async function testCheckout(req: Request, deps: Deps): Promise<Response> {
  const gateway = deps.payments;
  if (!(gateway instanceof StagingGateway)) throw new ApiError(404, "not_found", "Not found");
  const url = new URL(req.url);
  if (!gateway.verify(url.searchParams)) return page("Invalid link", "<h1>This test checkout link isn't valid.</h1>", 400);
  const q = url.searchParams;
  const intentId = q.get("intent")!;
  const fields = JSON.parse(q.get("fields") || "[]") as CheckoutCustomField[];
  const [intent] = await deps.db<IntentRow[]>`
    select id, flow, status, amount_cents, payload from public.checkout_intents where id = ${intentId}`;
  if (!intent) return page("Not found", "<h1>This checkout no longer exists.</h1>", 404);

  if (req.method === "GET") {
    if (intent.status !== "pending") return page("Already finished", `<h1>This checkout is already ${escapeHtml(intent.status)}.</h1><p><a href="${escapeHtml(q.get("back")!)}">Back to the site</a></p>`);
    const items = intent.flow === "training"
      ? `<li>${escapeHtml(intent.payload?.packageName ?? "Private training")}</li>`
      : (intent.payload?.lines ?? []).map((l) => `<li>${escapeHtml(l.player?.name ?? "Player")}</li>`).join("");
    const inputs = [
      q.get("email") ? "" : `<label>Email</label><input name="email" type="email" required placeholder="you@example.com">`,
      q.get("phone") ? `<label>Phone</label><input name="phone" required value="617-555-0100">` : "",
      ...fields.map((f) =>
        f.options
          ? `<label>${escapeHtml(f.label)}</label><select name="f_${escapeHtml(f.key)}">${f.options.map((o, i) => `<option value="opt${i}">${escapeHtml(o)}</option>`).join("")}</select>`
          : `<label>${escapeHtml(f.label)}</label><input name="f_${escapeHtml(f.key)}" required>`,
      ),
    ].join("");
    return page(
      "Test checkout",
      `<span class="tag">Test mode · no money moves</span><h1>Footy Up checkout</h1><p class="small">Stands in for Stripe until the client's Stripe keys are added. Paying here saves the registration and sends the confirmation email, exactly like a real payment.</p>
<ul>${items}</ul><div class="total">Total: ${money(intent.amount_cents)}</div>
<form method="post">${inputs}<button class="pay" name="action" value="pay">Pay ${money(intent.amount_cents)} (test)</button></form>
<form method="post"><button class="cancel" name="action" value="cancel">Cancel</button></form>`,
    );
  }

  await enforceRateLimit(deps.db, deps.env, req, "checkout");
  const form = await req.formData();
  const sessionId = `cs_test_staging_${intent.id.replaceAll("-", "")}`;
  if (form.get("action") === "cancel") {
    await processStripeEvent(deps.db, { id: `evt_test_${randomUUID()}`, type: "checkout.session.expired", data: { object: { id: sessionId, metadata: { intent_id: intent.id } } } });
    await processWaitlistsQuietly(deps);
    return new Response(null, { status: 303, headers: { location: q.get("back")! } });
  }
  if (intent.status !== "pending") return new Response(null, { status: 303, headers: { location: q.get("ok")! } });

  const email = String(q.get("email") || form.get("email") || "").trim();
  const session = {
    id: sessionId,
    object: "checkout.session",
    payment_status: "paid",
    amount_subtotal: intent.amount_cents,
    amount_total: intent.amount_cents,
    total_details: { amount_discount: 0 },
    currency: "usd",
    payment_intent: `pi_test_staging_${intent.id.replaceAll("-", "")}`,
    client_reference_id: intent.id,
    metadata: { intent_id: intent.id, flow: intent.flow },
    customer_details: { email, name: intent.payload?.parent?.name ?? null, phone: form.get("phone") ? String(form.get("phone")) : null },
    custom_fields: fields.map((f) =>
      f.options
        ? { key: f.key, type: "dropdown", dropdown: { value: String(form.get(`f_${f.key}`) ?? "opt0") } }
        : { key: f.key, type: "text", text: { value: String(form.get(`f_${f.key}`) ?? "") } },
    ),
  };
  const result = await processStripeEvent(deps.db, { id: `evt_test_${randomUUID()}`, type: "checkout.session.completed", data: { object: session } });
  if (result === "registered") {
    const [payment] = await deps.db<{ id: string }[]>`select id from public.payments where stripe_checkout_session_id = ${sessionId}`;
    if (payment) await sendConfirmations(deps, { paymentId: payment.id });
  }
  return new Response(null, { status: 303, headers: { location: q.get("ok")! } });
}
