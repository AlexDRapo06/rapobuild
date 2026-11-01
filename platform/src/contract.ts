/**
 * The request and response shapes shared by the public pages (built by Ivy
 * Devs) and the API (this repo). This file is the contract to lock in the
 * first two days; docs/api-contract.md describes the same shapes in prose.
 */
import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional();

export const Email = z.string().trim().toLowerCase().pipe(z.email().max(254));
export const Phone = z
  .string()
  .trim()
  .min(7)
  .max(32)
  .regex(/^[0-9+().\-\s]+$/, "Phone may contain digits, spaces and + ( ) . - only");

/** Relative path on the public site, e.g. "/camps/thanks". */
const SitePath = z
  .string()
  .regex(/^\/(?!\/)[A-Za-z0-9\-._~/?=&%]*$/, "Must be a path on this site, starting with /")
  .max(200);

/**
 * Any extra form fields the existing camp form collects that are not modelled
 * below. Stored as-is on the registration so the form can change without a
 * schema change.
 */
export const ExtraFields = z
  .record(z.string().min(1).max(64), z.union([z.string().max(1000), z.number(), z.boolean()]))
  .refine((o) => Object.keys(o).length <= 30, "At most 30 extra fields");

export const Parent = z.object({
  name: text(120),
  email: Email,
  phone: Phone,
  town: text(80),
});

export const WaiverAcceptance = z.object({
  waiverId: z.uuid(),
  acceptedName: text(120),
});

const PromoCode = z.string().trim().min(1).max(40);
/** From the ?waitlist=<token> link in a waitlist offer email. */
const WaitlistToken = z.string().trim().min(10).max(100);

const CheckoutCommon = {
  parent: Parent,
  waiver: WaiverAcceptance.optional(),
  marketingOptIn: z.boolean().optional(),
  promoCode: PromoCode.optional(),
  waitlistToken: WaitlistToken.optional(),
  successPath: SitePath.optional(),
  cancelPath: SitePath.optional(),
};

// ---------------------------------------------------------------------------
// POST /api/checkout/camp
// ---------------------------------------------------------------------------

export const CampPlayer = z.object({
  name: text(120),
  age: z.int().min(3).max(19),
  sex: z.enum(["boy", "girl"]).optional(),
  sessionIds: z.array(z.uuid()).min(1).max(10),
  extra: ExtraFields.optional(),
});

export const CampCheckoutRequest = z.object({
  ...CheckoutCommon,
  players: z.array(CampPlayer).min(1).max(8),
  extra: ExtraFields.optional(),
});
export type CampCheckoutRequest = z.infer<typeof CampCheckoutRequest>;

// ---------------------------------------------------------------------------
// POST /api/miami/checkout and POST /api/miami/verify-code
// ---------------------------------------------------------------------------

export const ShippingAddress = z.object({
  line1: text(120),
  line2: optionalText(120),
  city: text(80),
  state: text(40),
  postalCode: z.string().trim().regex(/^[A-Za-z0-9 \-]{3,12}$/),
});

/** Fields from the client's Kickoff Form, "Required parent/guardian information". */
export const MiamiParent = z.object({
  firstName: text(60),
  lastName: text(60),
  email: Email,
  phone: Phone,
  emergencyPhone: Phone,
  /** Not on the client's form. Defaults to the shipping city so emails by town still work. */
  town: text(80).optional(),
});

/** Fields from the client's Kickoff Form, "Required player registration information". */
export const MiamiPlayer = z.object({
  firstName: text(60),
  lastName: text(60),
  age: z.int().min(10).max(20),
  /** Sets the group: boy -> boys, girl -> girls. */
  sex: z.enum(["boy", "girl"]),
  heightIn: z.int().min(36).max(96),
  weightLb: z.int().min(50).max(400),
  position: text(40),
  club: text(120),
  email: Email,
  shirtSize: text(16),
  shortSize: text(16),
  /** Only when this player's package ships somewhere other than the family address. */
  shippingAddress: ShippingAddress.optional(),
  extra: ExtraFields.optional(),
});

export const AccessCode = z.string().trim().min(1).max(64);

export const MiamiCheckoutRequest = z.object({
  accessCode: AccessCode.optional(),
  parent: MiamiParent,
  /** Where the GOINGFORGOAT x FOOTYUP package ships. */
  shippingAddress: ShippingAddress,
  players: z.array(MiamiPlayer).min(1).max(4),
  waiver: WaiverAcceptance.optional(),
  marketingOptIn: z.boolean().optional(),
  promoCode: PromoCode.optional(),
  waitlistToken: WaitlistToken.optional(),
  successPath: SitePath.optional(),
  cancelPath: SitePath.optional(),
});
export type MiamiCheckoutRequest = z.infer<typeof MiamiCheckoutRequest>;

export const VerifyCodeRequest = z.object({ accessCode: AccessCode });

// ---------------------------------------------------------------------------
// POST /api/private-training
// ---------------------------------------------------------------------------

export const PrivateTrainingRequest = z.object({
  parentName: text(120),
  email: Email,
  phone: Phone,
  town: text(80),
  playerName: text(120),
  playerAge: z.int().min(3).max(25),
  message: optionalText(2000),
  preferredTimes: optionalText(500),
  marketingOptIn: z.boolean().optional(),
  extra: ExtraFields.optional(),
  /** Honeypot. Render hidden; humans leave it empty. */
  website: z.string().max(500).optional(),
  /** Cloudflare Turnstile token, required only when TURNSTILE_SECRET_KEY is set. */
  turnstileToken: z.string().max(2048).optional(),
});
export type PrivateTrainingRequest = z.infer<typeof PrivateTrainingRequest>;

// ---------------------------------------------------------------------------
// POST /api/waitlist
// ---------------------------------------------------------------------------

export const WaitlistRequest = z
  .object({
    sessionId: z.uuid().optional(),
    miamiGroup: z.enum(["boys", "girls"]).optional(),
    parentName: text(120),
    email: Email,
    phone: Phone,
    town: text(80),
    spots: z.int().min(1).max(10).default(1),
    marketingOptIn: z.boolean().optional(),
    website: z.string().max(500).optional(),
  })
  .refine((v) => Boolean(v.sessionId) !== Boolean(v.miamiGroup), {
    message: "Provide exactly one of sessionId or miamiGroup",
  });
export type WaitlistRequest = z.infer<typeof WaitlistRequest>;

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

export type ErrorCode =
  | "validation_failed"
  | "invalid_json"
  | "payload_too_large"
  | "rate_limited"
  | "method_not_allowed"
  | "not_found"
  | "session_not_found"
  | "session_closed"
  | "session_full"
  | "camp_info_only"
  | "registration_not_open"
  | "access_code_required"
  | "access_code_invalid"
  | "group_full"
  | "group_closed"
  | "pricing_not_configured"
  | "waiver_required"
  | "promo_invalid"
  | "waitlist_offer_invalid"
  | "captcha_failed"
  | "payment_provider_error"
  | "email_provider_error"
  | "unauthorized"
  | "internal_error";

export interface ErrorResponse {
  error: ErrorCode;
  message: string;
  /** Present on some errors, e.g. { group: "boys" } or { issues: [...] }. */
  details?: Record<string, unknown>;
}

export interface CheckoutResponse {
  /** Redirect the browser here (Stripe Checkout). */
  checkoutUrl: string;
  /** ISO time the spot hold and the Stripe session expire. */
  expiresAt: string;
}

export interface WaiverInfo {
  id: string;
  version: number;
  title: string;
  body: string;
  url: string | null;
}

export interface PublicSession {
  id: string;
  slug: string;
  name: string;
  startsOn: string | null;
  endsOn: string | null;
  startTime: string | null;
  location: string | null;
  ageMin: number | null;
  ageMax: number | null;
  /** Price a parent pays today (early-bird applied when active). */
  priceCents: number;
  regularPriceCents: number;
  earlyBirdUntil: string | null;
  status: "open" | "closed" | "full";
  /** null when the session has no capacity limit. */
  spotsLeft: number | null;
  infoText: string | null;
}

export interface PublicCamp {
  id: string;
  slug: string;
  name: string;
  host: string | null;
  kind: "summer" | "winter" | "other";
  infoOnly: boolean;
  description: string | null;
  infoUrl: string | null;
  sessions: PublicSession[];
}

export interface CampsResponse {
  camps: PublicCamp[];
  waiver: WaiverInfo | null;
  waiverRequired: boolean;
}

export interface MiamiGroupStatus {
  group: "boys" | "girls";
  label: string;
  /** null until the price for this phase is configured. */
  priceCents: number | null;
  spotsLeft: number;
  full: boolean;
  open: boolean;
  /** This group's combine dates and daily hours (boys and girls attend on different days). */
  startsOn: string | null;
  endsOn: string | null;
  dailyStartTime: string | null;
  dailyEndTime: string | null;
}

export interface MiamiStatusResponse {
  event: {
    name: string;
    location: string | null;
    infoText: string | null;
    /** When checkout opens at all (code holders included). */
    opensAt: string | null;
    /** When families without a code can register. */
    publicOpensAt: string | null;
    closesAt: string | null;
    /** True between opensAt and closesAt, unless the client has paused checkout. */
    open: boolean;
    /** True once families without a code can register. */
    publicOpen: boolean;
  };
  /** A code is required right now. Show the code field and block the form without one. */
  accessCodeRequired: boolean;
  /** Codes are accepted right now (optional during the public phase). Show an optional code field. */
  accessCodeAccepted: boolean;
  /** Empty list = free text. */
  options: { positions: string[]; shirtSizes: string[]; shortSizes: string[] };
  waiver: WaiverInfo | null;
  waiverRequired: boolean;
  /** What a family without a code sees (or code holders, while a code is required). Code holders get their view from verify-code. */
  groups: MiamiGroupStatus[];
}

export interface VerifyCodeResponse {
  valid: true;
  groups: MiamiGroupStatus[];
}

export interface WaitlistOfferResponse {
  valid: boolean;
  program?: string;
  sessionId?: string | null;
  miamiGroup?: "boys" | "girls" | null;
  spots?: number;
  expiresAt?: string;
  parent?: { name: string; email: string; phone: string; town: string };
}

export interface OkResponse {
  ok: true;
}
