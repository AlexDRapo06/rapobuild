import type { CheckoutResponse } from "../contract.js";
import { capacityError, type Db } from "./db.js";
import type { Deps } from "./deps.js";
import { ApiError, logError } from "./http.js";
import type { CheckoutCustomField, CheckoutLine } from "./payments.js";

/** Holds outlive the Stripe session by this much, so a payment can never complete after its hold lapses. */
const HOLD_GRACE_MS = 5 * 60_000;
/** Stripe rejects expires_at less than 30 minutes out; keep a margin for request latency. */
const MIN_STRIPE_MINUTES = 31;

export interface StartCheckoutOptions {
  flow: "camp" | "miami" | "training";
  payload: Record<string, unknown>;
  viaAccessCode: boolean;
  lines: CheckoutLine[];
  customerEmail?: string;
  collectPhone?: boolean;
  allowPromotionCodes?: boolean;
  customFields?: CheckoutCustomField[];
  holdMinutes: number;
  successPath: string;
  cancelPath: string;
  /** Runs in the same transaction as the intent insert. May update `payload` (e.g. the claimed waitlist entry). */
  reserve: (tx: Db, intentId: string, holdExpiresAt: Date, payload: any) => Promise<void>;
}

function mapCapacityError(err: unknown): never {
  const cap = capacityError(err);
  if (cap?.kind === "group_full") {
    throw new ApiError(409, "group_full", "This group is full. You can join the waitlist.", { group: cap.subject });
  }
  if (cap?.kind === "group_closed" || cap?.kind === "unknown_group") {
    throw new ApiError(409, "group_closed", "Registration for this group is closed.", { group: cap.subject });
  }
  if (cap?.kind === "session_full") {
    throw new ApiError(409, "session_full", "This session is full. You can join the waitlist.", { sessionId: cap.subject });
  }
  throw err;
}

function withSessionId(siteUrl: string, path: string): string {
  const url = new URL(path, siteUrl);
  return `${url.toString()}${url.search ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`;
}

export async function startCheckout(deps: Deps, opts: StartCheckoutOptions): Promise<CheckoutResponse> {
  const { db, env, payments } = deps;
  const amountCents = opts.lines.reduce((sum, l) => sum + l.unitAmountCents * l.quantity, 0);
  const stripeExpiresAt = new Date(Date.now() + Math.max(opts.holdMinutes, MIN_STRIPE_MINUTES) * 60_000);
  const holdExpiresAt = new Date(stripeExpiresAt.getTime() + HOLD_GRACE_MS);

  let intentId: string;
  try {
    intentId = await db.begin(async (tx) => {
      const [intent] = await tx<{ id: string }[]>`
        insert into public.checkout_intents (flow, payload, via_access_code, amount_cents, expires_at)
        values (${opts.flow}, ${tx.json(opts.payload as never)}, ${opts.viaAccessCode}, ${amountCents}, ${holdExpiresAt})
        returning id`;
      await opts.reserve(tx, intent!.id, holdExpiresAt, opts.payload);
      return intent!.id;
    });
  } catch (err) {
    mapCapacityError(err);
  }

  let created;
  try {
    created = await payments.createCheckout({
      intentId,
      flow: opts.flow,
      lines: opts.lines,
      customerEmail: opts.customerEmail,
      collectPhone: opts.collectPhone,
      allowPromotionCodes: opts.allowPromotionCodes,
      customFields: opts.customFields,
      successUrl: withSessionId(env.siteUrl, opts.successPath),
      cancelUrl: new URL(opts.cancelPath, env.siteUrl).toString(),
      expiresAt: stripeExpiresAt,
    });
  } catch (err) {
    logError("checkout.create_session", err);
    await db.begin(async (tx) => {
      await tx`update public.checkout_intents set status = 'failed', payload = null where id = ${intentId}`;
      await tx`update public.holds set status = 'released' where intent_id = ${intentId} and status = 'active'`;
    });
    throw new ApiError(502, "payment_provider_error", "We couldn't start the payment. Please try again in a moment.");
  }

  await db`update public.checkout_intents set stripe_session_id = ${created.id} where id = ${intentId}`;
  return { checkoutUrl: created.url, expiresAt: stripeExpiresAt.toISOString() };
}
