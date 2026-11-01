import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import Stripe from "stripe";

export interface CheckoutLine {
  name: string;
  unitAmountCents: number;
  quantity: number;
}

/** Extra questions Stripe Checkout asks (Stripe allows up to 3). Dropdown values come back as `opt<index>`. */
export interface CheckoutCustomField {
  key: string;
  label: string;
  options?: string[];
}

export interface CreateCheckoutInput {
  intentId: string;
  flow: "camp" | "miami" | "training";
  lines: CheckoutLine[];
  /** When unknown, Stripe asks for it. */
  customerEmail?: string;
  /** Ask for a phone number on the Stripe page (the site's camp form doesn't). */
  collectPhone?: boolean;
  customFields?: CheckoutCustomField[];
  /** Show Stripe's own promotion-code box (codes made in the Stripe dashboard). */
  allowPromotionCodes?: boolean;
  successUrl: string;
  cancelUrl: string;
  expiresAt: Date;
}

export interface CreatedCheckout {
  id: string;
  url: string;
}

/** The subset of a Stripe event the webhook handler relies on. */
export interface WebhookEvent {
  id: string;
  type: string;
  data: { object: Record<string, any> };
}

export interface PaymentsGateway {
  readonly mode: "stripe" | "mock";
  createCheckout(input: CreateCheckoutInput): Promise<CreatedCheckout>;
  expireCheckout(sessionId: string): Promise<void>;
  verifyWebhook(rawBody: string, signature: string | null): WebhookEvent;
}

export class WebhookSignatureError extends Error {
  constructor() {
    super("Invalid Stripe signature");
    this.name = "WebhookSignatureError";
  }
}

function verifyStripeSignature(stripe: Stripe, rawBody: string, signature: string | null, secret: string): WebhookEvent {
  if (!signature) throw new WebhookSignatureError();
  try {
    return stripe.webhooks.constructEvent(rawBody, signature, secret) as unknown as WebhookEvent;
  } catch {
    throw new WebhookSignatureError();
  }
}

export class StripeGateway implements PaymentsGateway {
  readonly mode = "stripe" as const;
  private readonly stripe: Stripe;

  constructor(
    secretKey: string,
    private readonly webhookSecret: string,
  ) {
    this.stripe = new Stripe(secretKey, { maxNetworkRetries: 2 });
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CreatedCheckout> {
    const metadata = { intent_id: input.intentId, flow: input.flow };
    const session = await this.stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: input.lines.map((line) => ({
          quantity: line.quantity,
          price_data: {
            currency: "usd",
            unit_amount: line.unitAmountCents,
            product_data: { name: line.name },
          },
        })),
        ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
        ...(input.collectPhone ? { phone_number_collection: { enabled: true } } : {}),
        ...(input.allowPromotionCodes ? { allow_promotion_codes: true } : {}),
        ...(input.customFields?.length
          ? {
              custom_fields: input.customFields.slice(0, 3).map((f) => ({
                key: f.key,
                label: { type: "custom" as const, custom: f.label.slice(0, 50) },
                ...(f.options
                  ? { type: "dropdown" as const, dropdown: { options: f.options.slice(0, 200).map((o, i) => ({ label: o.slice(0, 100), value: `opt${i}` })) } }
                  : { type: "text" as const }),
              })),
            }
          : {}),
        client_reference_id: input.intentId,
        metadata,
        payment_intent_data: { metadata },
        expires_at: Math.floor(input.expiresAt.getTime() / 1000),
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
      },
      { idempotencyKey: `checkout-${input.intentId}` },
    );
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return { id: session.id, url: session.url };
  }

  async expireCheckout(sessionId: string): Promise<void> {
    await this.stripe.checkout.sessions.expire(sessionId);
  }

  verifyWebhook(rawBody: string, signature: string | null): WebhookEvent {
    return verifyStripeSignature(this.stripe, rawBody, signature, this.webhookSecret);
  }
}

interface MockSession {
  id: string;
  input: CreateCheckoutInput;
  amountTotal: number;
  paymentIntentId: string;
  status: "open" | "complete" | "expired";
}

/**
 * Local stand-in for Stripe Checkout. Signs its webhook events with the same
 * algorithm Stripe uses, so the real verification path runs end to end.
 * Refused in production by loadEnv().
 */
export class MockGateway implements PaymentsGateway {
  readonly mode = "mock" as const;
  readonly sessions = new Map<string, MockSession>();
  private readonly stripe = new Stripe("sk_test_mock_gateway_not_a_real_key");
  failNextCheckout = false;

  constructor(
    private readonly siteUrl: string,
    readonly webhookSecret: string,
  ) {}

  async createCheckout(input: CreateCheckoutInput): Promise<CreatedCheckout> {
    if (this.failNextCheckout) {
      this.failNextCheckout = false;
      throw new Error("Mock payment provider failure");
    }
    const id = `cs_mock_${randomUUID().replaceAll("-", "")}`;
    const amountTotal = input.lines.reduce((sum, l) => sum + l.unitAmountCents * l.quantity, 0);
    this.sessions.set(id, { id, input, amountTotal, paymentIntentId: `pi_mock_${randomUUID().replaceAll("-", "")}`, status: "open" });
    return { id, url: `${this.siteUrl}/__mock/checkout/${id}` };
  }

  async expireCheckout(sessionId: string): Promise<void> {
    const s = this.sessions.get(sessionId);
    if (s) s.status = "expired";
  }

  verifyWebhook(rawBody: string, signature: string | null): WebhookEvent {
    return verifyStripeSignature(this.stripe, rawBody, signature, this.webhookSecret);
  }

  sessionObject(sessionId: string): Record<string, any> {
    const s = this.sessions.get(sessionId);
    if (!s) throw new Error(`Unknown mock session ${sessionId}`);
    return {
      id: s.id,
      object: "checkout.session",
      status: s.status,
      payment_status: s.status === "complete" ? "paid" : "unpaid",
      amount_subtotal: s.amountTotal,
      amount_total: s.amountTotal,
      total_details: { amount_discount: 0 },
      currency: "usd",
      payment_intent: s.status === "complete" ? s.paymentIntentId : null,
      client_reference_id: s.input.intentId,
      metadata: { intent_id: s.input.intentId, flow: s.input.flow },
      customer_details: {
        email: s.input.customerEmail ?? "stripe-asked@example.test",
        name: s.input.customerEmail ? null : "Stripe Customer",
        phone: s.input.collectPhone ? "+16175550199" : null,
      },
      custom_fields: (s.input.customFields ?? []).map((f) =>
        f.options
          ? { key: f.key, type: "dropdown", dropdown: { value: "opt1" } }
          : { key: f.key, type: "text", text: { value: f.key.includes("phone") ? "617-555-0123" : f.key.includes("age") ? "12" : "Mock Answer" } },
      ),
    };
  }

  /** Builds a signed webhook delivery: { body, signature }. */
  signedEvent(type: string, object: Record<string, any>, eventId = `evt_mock_${randomUUID().replaceAll("-", "")}`) {
    const body = JSON.stringify({ id: eventId, object: "event", type, data: { object } });
    const signature = this.stripe.webhooks.generateTestHeaderString({ payload: body, secret: this.webhookSecret });
    return { body, signature, eventId };
  }

  complete(sessionId: string) {
    const s = this.sessions.get(sessionId);
    if (!s) throw new Error(`Unknown mock session ${sessionId}`);
    s.status = "complete";
    return this.signedEvent("checkout.session.completed", this.sessionObject(sessionId));
  }

  expire(sessionId: string) {
    const s = this.sessions.get(sessionId);
    if (!s) throw new Error(`Unknown mock session ${sessionId}`);
    s.status = "expired";
    return this.signedEvent("checkout.session.expired", this.sessionObject(sessionId));
  }

  refund(sessionId: string, amountRefundedCents: number) {
    const s = this.sessions.get(sessionId);
    if (!s) throw new Error(`Unknown mock session ${sessionId}`);
    return this.signedEvent("charge.refunded", {
      id: `ch_mock_${s.id.slice(8)}`,
      object: "charge",
      amount: s.amountTotal,
      amount_refunded: amountRefundedCents,
      payment_intent: s.paymentIntentId,
    });
  }
}

/**
 * Test checkout for a Vercel deployment in staging mode (FOOTYUP_STAGING, PAYMENTS_MODE=mock).
 * Serverless instances share no memory, so everything the test page needs travels in a signed
 * link and the database; paying runs the same code as a Stripe webhook (api/test-checkout).
 */
export class StagingGateway implements PaymentsGateway {
  readonly mode = "mock" as const;

  constructor(
    private readonly apiUrl: string,
    private readonly secret: string,
  ) {}

  sign(params: URLSearchParams): string {
    return createHmac("sha256", this.secret).update(`test-checkout:${params.toString()}`).digest("base64url");
  }

  verify(params: URLSearchParams): boolean {
    const given = params.get("sig") ?? "";
    const rest = new URLSearchParams(params);
    rest.delete("sig");
    const expected = this.sign(rest);
    return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CreatedCheckout> {
    const id = `cs_test_staging_${input.intentId.replaceAll("-", "")}`;
    const params = new URLSearchParams({
      intent: input.intentId,
      flow: input.flow,
      ok: input.successUrl.replace("{CHECKOUT_SESSION_ID}", id),
      back: input.cancelUrl,
      email: input.customerEmail ?? "",
      phone: input.collectPhone ? "1" : "",
      fields: JSON.stringify(input.customFields ?? []),
    });
    params.set("sig", this.sign(params));
    return { id, url: `${this.apiUrl}/api/test-checkout?${params}` };
  }

  async expireCheckout(): Promise<void> {}

  verifyWebhook(): WebhookEvent {
    throw new WebhookSignatureError();
  }
}
