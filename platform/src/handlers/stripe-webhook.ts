import type { Db, Sql } from "../lib/db.js";
import type { Deps } from "../lib/deps.js";
import { json, logError } from "../lib/http.js";
import { sendConfirmations } from "../email/automatic.js";
import { processWaitlistsQuietly } from "../lib/waitlist.js";
import { legacyRegistration } from "../lib/site-legacy.js";
import { WebhookSignatureError, type WebhookEvent } from "../lib/payments.js";
import type { WaiverRecord } from "../lib/waiver.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface IntentPayload {
  parent: {
    name: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone: string | null;
    emergencyPhone?: string | null;
    town: string;
  };
  marketingOptIn: boolean;
  extra: Record<string, unknown>;
  waiver: WaiverRecord;
  pricing?: { gross: number; sibling: number; promo: number; promoCodeId: string | null; promoCode: string | null };
  waitlistEntryId?: string | null;
  lines: Array<{
    priceCents?: number;
    discountCents?: number;
    lineNo: number;
    campId: string;
    sessionId?: string;
    miamiGroup?: "boys" | "girls";
    player: {
      name: string;
      firstName?: string;
      lastName?: string;
      age: number;
      sex: "boy" | "girl" | null;
      email?: string;
      heightIn?: number;
      weightLb?: number;
      position?: string;
      club?: string;
      shirtSize?: string;
      shortSize?: string | null;
      shippingAddress?: { line1: string; line2?: string; city: string; state: string; postalCode: string };
      extra: Record<string, unknown>;
    };
  }>;
}

export type WebhookResult =
  | "duplicate"
  | "ignored"
  | "registered"
  | "already_completed"
  | "awaiting_payment"
  | "legacy_payment_recorded"
  | "training_recorded"
  | "payload_missing"
  | "released"
  | "refund_recorded"
  | "unknown_payment";

function idOf(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value) return String((value as { id: unknown }).id);
  return null;
}

async function insertPayment(tx: Db, session: Record<string, any>, intentId: string | null, legacy: boolean) {
  const [row] = await tx<{ id: string }[]>`
    insert into public.payments
      (intent_id, stripe_checkout_session_id, stripe_payment_intent_id, currency,
       amount_subtotal_cents, amount_total_cents, discount_cents, customer_email, legacy_metadata)
    values
      (${intentId}, ${session.id}, ${idOf(session.payment_intent)}, ${session.currency ?? "usd"},
       ${session.amount_subtotal ?? 0}, ${session.amount_total ?? 0}, ${session.total_details?.amount_discount ?? 0},
       ${session.customer_details?.email ?? session.customer_email ?? null},
       ${legacy ? tx.json({ metadata: session.metadata ?? {}, client_reference_id: session.client_reference_id ?? null }) : null})
    on conflict (stripe_checkout_session_id) do update set updated_at = now()
    returning id`;
  return row!.id;
}

/** Answers to questions Stripe Checkout asked (see CheckoutCustomField); dropdowns map back to their labels. */
function customFieldValues(session: Record<string, any>, defs: { key: string; options?: string[] }[] = []): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of (session.custom_fields ?? []) as any[]) {
    let v: unknown = f.type === "dropdown" ? f.dropdown?.value : f.type === "numeric" ? f.numeric?.value : f.text?.value;
    const def = defs.find((d) => d.key === f.key);
    if (def?.options && typeof v === "string" && /^opt\d+$/.test(v)) v = def.options[Number(v.slice(3))] ?? v;
    if (v !== undefined && v !== null && String(v).trim()) out[f.key] = String(v).trim();
  }
  return out;
}

async function insertRegistrations(tx: Db, opts: { intentId: string; paymentId: string; viaCode: boolean; payload: IntentPayload; session: Record<string, any> }) {
  const { payload, session } = opts;
  const answers = customFieldValues(session, (payload as any).customFields);
  const parent = { ...payload.parent, phone: payload.parent.phone || session.customer_details?.phone || null };
  const emergency = parent.emergencyPhone ?? answers.emergency_phone ?? null;
  const { waiver } = payload;
  // line.priceCents is the price before any Stripe promotion code, which applies to
  // the whole session; spread that discount over the lines by price.
  const stripeDiscount = Number(session.total_details?.amount_discount ?? 0);
  const prices = payload.lines.map((l) => Math.max(l.priceCents ?? 0, 0));
  const priceTotal = prices.reduce((a, b) => a + b, 0);
  const shares = prices.map((n) => (priceTotal ? Math.floor((stripeDiscount * n) / priceTotal) : 0));
  if (shares.length) shares[shares.length - 1]! += stripeDiscount - shares.reduce((a, b) => a + b, 0);
  for (const [i, line] of payload.lines.entries()) {
    const p = line.player;
    const addr = p.shippingAddress;
    await tx`
      insert into public.registrations (
        intent_id, line_no, payment_id, camp_id, session_id, miami_group, via_access_code,
        parent_name, parent_first_name, parent_last_name, parent_email, parent_phone, emergency_phone, parent_town,
        player_name, player_first_name, player_last_name, player_age, player_sex, player_email,
        player_height_in, player_weight_lb, player_position, player_club, shirt_size, short_size,
        ship_line1, ship_line2, ship_city, ship_state, ship_postal_code, extra,
        waiver_status, waiver_id, waiver_accepted_at, waiver_accepted_name, price_cents, discount_cents
      ) values (
        ${opts.intentId}, ${line.lineNo}, ${opts.paymentId}, ${line.campId}, ${line.sessionId ?? null}, ${line.miamiGroup ?? null},
        ${opts.viaCode},
        ${parent.name}, ${parent.firstName ?? null}, ${parent.lastName ?? null}, ${parent.email}, ${parent.phone},
        ${line.miamiGroup ? emergency : (parent.emergencyPhone ?? null)}, ${parent.town},
        ${p.name}, ${p.firstName ?? null}, ${p.lastName ?? null}, ${p.age}, ${p.sex ?? null}, ${p.email ?? null},
        ${p.heightIn ?? null}, ${p.weightLb ?? null}, ${p.position ?? null}, ${p.club ?? null},
        ${p.shirtSize ?? null}, ${p.shortSize ?? (line.miamiGroup ? (answers.short_size ?? null) : null)},
        ${addr?.line1 ?? null}, ${addr?.line2 ?? null}, ${addr?.city ?? null}, ${addr?.state ?? null}, ${addr?.postalCode ?? null},
        ${tx.json({ ...payload.extra, ...p.extra } as never)},
        ${waiver.status}, ${waiver.waiverId}, ${waiver.acceptedAt}, ${waiver.acceptedName},
        ${line.priceCents === undefined || line.priceCents === null ? null : line.priceCents - shares[i]!}, ${(line.discountCents ?? 0) + shares[i]!}
      )
      on conflict (intent_id, line_no) do nothing`;
  }
  await tx`select public.upsert_contact(${parent.email}, ${parent.name}, ${parent.phone}, ${parent.town},
                                        'registration', ${payload.marketingOptIn ? "granted" : null})`;
}

async function recordTraining(tx: Db, session: Record<string, any>, paymentId: string, pkg: { id: string; name: string }, defs: { key: string; options?: string[] }[] = []) {
  const answers = customFieldValues(session, defs);
  const c = session.customer_details ?? {};
  await tx`
    insert into public.training_purchases (payment_id, package_id, package_name, parent_name, email, phone, player_name, player_age)
    values (${paymentId}, ${pkg.id}, ${pkg.name}, ${c.name ?? null}, ${c.email ?? session.customer_email ?? null}, ${c.phone ?? null},
            ${answers.player_name ?? null}, ${answers.player_age ?? null})
    on conflict (payment_id) do nothing`;
  if (c.email) await tx`select public.upsert_contact(${c.email}, ${c.name ?? null}, ${c.phone ?? null}, null, 'private_training', null)`;
}

async function completeCheckout(tx: Db, session: Record<string, any>): Promise<WebhookResult> {
  const intentId: string | undefined = session.metadata?.intent_id ?? session.client_reference_id ?? undefined;

  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    // A delayed payment method (e.g. bank debit) was used. Keep the spot held
    // until Stripe reports async_payment_succeeded or async_payment_failed.
    if (intentId && UUID.test(intentId)) {
      await tx`update public.holds set expires_at = now() + interval '10 days' where intent_id = ${intentId} and status = 'active'`;
      await tx`update public.checkout_intents set expires_at = now() + interval '10 days' where id = ${intentId} and status = 'pending'`;
    }
    return "awaiting_payment";
  }

  const [intent] =
    intentId && UUID.test(intentId)
      ? await tx<{ id: string; flow: string; status: string; via_access_code: boolean; payload: IntentPayload | null }[]>`
          select id, flow, status, via_access_code, payload from public.checkout_intents where id = ${intentId} for update`
      : [];

  if (!intent) {
    // Checkouts started by the site's original api/checkout.js and
    // api/checkout-training.js carry the form in Stripe metadata.
    const md = session.metadata ?? {};
    if (md.package_id) {
      const paymentId = await insertPayment(tx, session, null, true);
      await recordTraining(tx, session, paymentId, { id: String(md.package_id), name: String(md.package_name ?? md.package_id) });
      return "training_recorded";
    }
    const [seen] = await tx`select 1 from public.checkout_intents where stripe_session_id = ${session.id} and status = 'completed'`;
    if (seen) return "already_completed";
    const legacy = await legacyRegistration(tx, session);
    if (!legacy) {
      await insertPayment(tx, session, null, true);
      return "legacy_payment_recorded";
    }
    const [synthetic] = await tx<{ id: string }[]>`
      insert into public.checkout_intents (flow, status, via_access_code, amount_cents, stripe_session_id, expires_at, completed_at)
      values (${legacy.flow}, 'completed', ${legacy.viaCode}, ${Number(session.amount_total ?? 0)}, ${session.id}, now(), now())
      on conflict (stripe_session_id) do update set status = 'completed'
      returning id`;
    const paymentId = await insertPayment(tx, session, synthetic!.id, true);
    await insertRegistrations(tx, { intentId: synthetic!.id, paymentId, viaCode: legacy.viaCode, payload: legacy.payload, session });
    return "registered";
  }
  if (intent.status === "completed") return "already_completed";

  const paymentId = await insertPayment(tx, session, intent.id, false);
  const payload = intent.payload;
  if (!payload) {
    logError("webhook.payload_missing", { name: "PayloadMissing", code: intent.id });
    return "payload_missing";
  }

  if (intent.flow === "training") {
    const t = payload as unknown as { packageId: string; packageName: string; customFields?: { key: string; options?: string[] }[] };
    await recordTraining(tx, session, paymentId, { id: t.packageId, name: t.packageName }, t.customFields);
    await tx`update public.checkout_intents set status = 'completed', completed_at = now(), payload = null where id = ${intent.id}`;
    return "training_recorded";
  }

  if (payload.pricing) {
    const p = payload.pricing;
    await tx`
      update public.payments set
        promo_code_id = ${p.promoCodeId}, promo_code = ${p.promoCode},
        sibling_discount_cents = ${p.sibling}, promo_discount_cents = ${p.promo},
        discount_cents = ${p.sibling + p.promo + Number(session.total_details?.amount_discount ?? 0)},
        amount_subtotal_cents = ${p.gross}
       where id = ${paymentId}`;
  }

  await insertRegistrations(tx, { intentId: intent.id, paymentId, viaCode: intent.via_access_code, payload, session });
  await tx`update public.holds set status = 'converted' where intent_id = ${intent.id} and status = 'active'`;
  if (payload.waitlistEntryId) {
    await tx`update public.waitlist_entries set status = 'converted', converted_at = now(), offer_token = null where id = ${payload.waitlistEntryId}`;
  }
  await tx`update public.checkout_intents set status = 'completed', completed_at = now(), payload = null where id = ${intent.id}`;
  return "registered";
}

async function releaseCheckout(tx: Db, session: Record<string, any>): Promise<WebhookResult> {
  const intentId: string | undefined = session.metadata?.intent_id ?? session.client_reference_id ?? undefined;
  if (!intentId || !UUID.test(intentId)) return "ignored";
  await tx`update public.checkout_intents set status = 'expired', payload = null where id = ${intentId} and status = 'pending'`;
  await tx`update public.holds set status = 'released' where intent_id = ${intentId} and status = 'active'`;
  return "released";
}

async function applyRefund(tx: Db, charge: Record<string, any>): Promise<WebhookResult> {
  const paymentIntentId = idOf(charge.payment_intent);
  if (!paymentIntentId) return "unknown_payment";
  const refunded = Number(charge.amount_refunded ?? 0);
  const amount = Number(charge.amount ?? 0);
  const status = refunded <= 0 ? "paid" : refunded >= amount ? "refunded" : "partially_refunded";
  const rows = await tx`
    update public.payments set refunded_cents = ${refunded}, status = ${status}
     where stripe_payment_intent_id = ${paymentIntentId}
    returning id`;
  return rows.length ? "refund_recorded" : "unknown_payment";
}

/**
 * Applies one Stripe event exactly once. The event id is recorded in the same
 * transaction as its effects, so a failure rolls both back and Stripe's retry
 * gets a clean second attempt, while a successful event is never applied twice.
 */
export async function processStripeEvent(db: Sql, event: WebhookEvent): Promise<WebhookResult> {
  return db.begin(async (tx) => {
    const inserted = await tx`
      insert into public.stripe_events (id, type) values (${event.id}, ${event.type})
      on conflict (id) do nothing returning id`;
    if (!inserted.length) return "duplicate";

    const obj = event.data.object;
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        return completeCheckout(tx, obj);
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed":
        return releaseCheckout(tx, obj);
      case "charge.refunded":
        return applyRefund(tx, obj);
      default:
        return "ignored";
    }
  });
}

/** POST /api/stripe/webhook (D1) */
export async function stripeWebhook(req: Request, deps: Deps): Promise<Response> {
  const raw = await req.text();
  let event: WebhookEvent;
  try {
    event = deps.payments.verifyWebhook(raw, req.headers.get("stripe-signature"));
  } catch (err) {
    if (err instanceof WebhookSignatureError) return json({ error: "unauthorized", message: err.message }, 400);
    throw err;
  }
  const result = await processStripeEvent(deps.db, event);
  if (result === "registered") {
    try {
      const [payment] = await deps.db<{ id: string }[]>`
        select id from public.payments where stripe_checkout_session_id = ${String(event.data.object.id)}`;
      if (payment) await sendConfirmations(deps, { paymentId: payment.id });
    } catch (err) {
      // The registration is saved; the daily email job retries unsent confirmations.
      logError("webhook.confirmation", err);
    }
  }
  if (result === "released" || result === "refund_recorded") await processWaitlistsQuietly(deps);
  return json({ received: true, result });
}
