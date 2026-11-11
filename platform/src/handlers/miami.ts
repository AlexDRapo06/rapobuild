import {
  MiamiCheckoutRequest,
  VerifyCodeRequest,
  type MiamiGroupStatus,
  type MiamiStatusResponse,
  type VerifyCodeResponse,
} from "../contract.js";
import { startCheckout } from "../lib/checkout.js";
import type { Db } from "../lib/db.js";
import type { Deps } from "../lib/deps.js";
import { enforceRateLimit, hashAccessCode } from "../lib/guards.js";
import { ApiError, json, parse, readJson } from "../lib/http.js";
import type { CheckoutCustomField } from "../lib/payments.js";
import { loadPromo, priceLines, stripeLines, totals, type PriceLine } from "../lib/pricing.js";
import { getSettings } from "../lib/settings.js";
import { claimOffer } from "../lib/waitlist.js";
import { currentWaiver, resolveWaiver } from "../lib/waiver.js";
import type { CheckoutExtras } from "./camp-checkout.js";

type Group = "boys" | "girls";

export interface EventRow {
  camp_id: string;
  name: string;
  location: string | null;
  info_text: string | null;
  opens_at: Date | null;
  public_opens_at: Date | null;
  closes_at: Date | null;
  checkout_open: boolean;
  hold_minutes: number;
  waiver_required: boolean;
  positions: string[];
  shirt_sizes: string[];
  short_sizes: string[];
  grad_years: string[];
  price_tiers: { until: string | null; cents: number }[];
}

export interface AvailabilityRow {
  grp: Group;
  label: string;
  open: boolean;
  left_for_code_holders: number;
  left_for_public: number;
  price_code_holder_cents: number | null;
  price_public_cents: number | null;
  starts_on: string | null;
  ends_on: string | null;
  daily_start_time: string | null;
  daily_end_time: string | null;
  age_min: number | null;
  age_max: number | null;
}

export async function loadEvent(db: Db): Promise<EventRow> {
  const [event] = await db<EventRow[]>`
    select camp_id, name, location, info_text, opens_at, public_opens_at, closes_at,
           checkout_open, hold_minutes, waiver_required, positions, shirt_sizes, short_sizes, price_tiers, grad_years
      from public.miami_event`;
  if (!event) throw new ApiError(409, "registration_not_open", "Combine registration is not open yet.");
  return event;
}

export async function loadAvailability(db: Db): Promise<AvailabilityRow[]> {
  return db<AvailabilityRow[]>`
    select a.grp, a.label, a.open, a.left_for_code_holders, a.left_for_public,
           a.price_code_holder_cents, a.price_public_cents,
           g.starts_on, g.ends_on, g.age_min, g.age_max,
           to_char(g.daily_start_time, 'HH24:MI') as daily_start_time,
           to_char(g.daily_end_time, 'HH24:MI') as daily_end_time
      from public.miami_availability() a
      join public.miami_groups g on g.grp = a.grp
     order by a.grp`;
}

export async function codesActive(db: Db): Promise<boolean> {
  const [row] = await db<{ active: boolean }[]>`select public.miami_codes_active() as active`;
  return Boolean(row?.active);
}

/** Returns the groups the code is valid for, or null if the code is wrong, off, or past its end date. */
export async function checkCode(db: Db, code: string): Promise<Group[] | null> {
  const rows = await db<{ grp: Group | null }[]>`
    select grp from public.access_codes
     where code_hash = ${hashAccessCode(code)}
       and active
       and (ends_at is null or ends_at > now())`;
  if (!rows.length) return null;
  return rows.some((r) => r.grp === null) ? ["boys", "girls"] : rows.map((r) => r.grp as Group);
}

/** The first tier whose `until` hasn't passed (e.g. $1,500 through Feb 1, then $1,650). */
export function currentTier(event: Pick<EventRow, "price_tiers">, now = Date.now()) {
  return (event.price_tiers ?? []).find((t) => !t.until || now < Date.parse(t.until)) ?? null;
}

function priceFor(row: AvailabilityRow, viaCode: boolean, event: Pick<EventRow, "price_tiers">): number | null {
  const tier = currentTier(event);
  if (tier) return tier.cents;
  return viaCode ? (row.price_code_holder_cents ?? row.price_public_cents) : row.price_public_cents;
}

function groupView(rows: AvailabilityRow[], viaCode: boolean, event: Pick<EventRow, "price_tiers">): MiamiGroupStatus[] {
  return rows.map((row) => {
    const spotsLeft = viaCode ? row.left_for_code_holders : row.left_for_public;
    return {
      group: row.grp,
      label: row.label,
      priceCents: priceFor(row, viaCode, event),
      spotsLeft,
      full: spotsLeft <= 0,
      open: row.open,
      startsOn: row.starts_on,
      endsOn: row.ends_on,
      dailyStartTime: row.daily_start_time,
      dailyEndTime: row.daily_end_time,
    };
  });
}

const passed = (at: Date | null) => !at || at.getTime() <= Date.now();

export function isOpen(event: EventRow): boolean {
  return event.checkout_open && passed(event.opens_at) && (!event.closes_at || event.closes_at.getTime() > Date.now());
}

/** Families without a code may register once public_opens_at passes; with no public time set, they may whenever no code is active. */
export function phase(event: EventRow, anyCodeActive: boolean) {
  const publicOpen = event.public_opens_at ? passed(event.public_opens_at) : !anyCodeActive;
  return { publicOpen, codeRequired: anyCodeActive && !publicOpen, codeAccepted: anyCodeActive };
}

function checkOption(list: string[], value: string, path: string): string {
  if (!list.length) return value;
  const match = list.find((v) => v.toLowerCase() === value.toLowerCase());
  if (!match) {
    throw new ApiError(400, "validation_failed", `Please choose one of: ${list.join(", ")}`, {
      issues: [{ path, message: `Choose one of: ${list.join(", ")}` }],
    });
  }
  return match;
}

/** GET /api/miami */
export async function miamiStatus(_req: Request, deps: Deps): Promise<Response> {
  const { db } = deps;
  const event = await loadEvent(db);
  const [availability, anyCode, waiver] = await Promise.all([loadAvailability(db), codesActive(db), currentWaiver(db, "miami")]);
  const { publicOpen, codeRequired, codeAccepted } = phase(event, anyCode);

  const body: MiamiStatusResponse = {
    event: {
      name: event.name,
      location: event.location,
      infoText: event.info_text,
      opensAt: event.opens_at?.toISOString() ?? null,
      publicOpensAt: event.public_opens_at?.toISOString() ?? null,
      closesAt: event.closes_at?.toISOString() ?? null,
      open: isOpen(event),
      publicOpen,
    },
    accessCodeRequired: codeRequired,
    accessCodeAccepted: codeAccepted,
    options: { positions: event.positions, shirtSizes: event.shirt_sizes, shortSizes: event.short_sizes },
    waiver,
    waiverRequired: Boolean(waiver) && event.waiver_required,
    groups: groupView(availability, codeRequired, event),
  };
  return json(body, 200, { "cache-control": "public, s-maxage=5, stale-while-revalidate=10" });
}

/** POST /api/miami/verify-code: lets the page confirm a code and show host-family availability. */
export async function miamiVerifyCode(req: Request, deps: Deps): Promise<Response> {
  const { db } = deps;
  await enforceRateLimit(db, deps.env, req, "verifyCode");
  const { accessCode } = parse(VerifyCodeRequest, await readJson(req));

  const groups = await checkCode(db, accessCode);
  if (!groups) throw new ApiError(403, "access_code_invalid", "That access code isn't valid.");
  const event = await loadEvent(db);
  const view = groupView(await loadAvailability(db), true, event).filter((g) => groups.includes(g.group));
  return json({ valid: true, groups: view } satisfies VerifyCodeResponse);
}

/** Same as the public request, except emergency phone and short size may be left for Stripe to ask. */
export type MiamiCheckoutInput = Omit<MiamiCheckoutRequest, "parent" | "players"> & {
  parent: Omit<MiamiCheckoutRequest["parent"], "emergencyPhone"> & { emergencyPhone?: string };
  players: (Omit<MiamiCheckoutRequest["players"][number], "shortSize"> & { shortSize?: string; extra?: Record<string, unknown> })[];
};

export async function runMiamiCheckout(deps: Deps, body: MiamiCheckoutInput, extras: CheckoutExtras = {}) {
  const { db } = deps;
  const event = await loadEvent(db);
  if (!isOpen(event)) {
    const closed = event.closes_at && event.closes_at.getTime() <= Date.now();
    throw new ApiError(
      409,
      "registration_not_open",
      closed ? "Combine registration has closed." : "Combine registration is not open yet.",
      { opensAt: event.opens_at?.toISOString() ?? null, closesAt: event.closes_at?.toISOString() ?? null },
    );
  }

  const players = body.players.map((p, i) => ({
    ...p,
    group: (p.sex === "boy" ? "boys" : "girls") as Group,
    position: checkOption(event.positions, p.position, `players.${i}.position`),
    shirtSize: checkOption(event.shirt_sizes, p.shirtSize, `players.${i}.shirtSize`),
    shortSize: p.shortSize ? checkOption(event.short_sizes, p.shortSize, `players.${i}.shortSize`) : undefined,
  }));

  const { publicOpen, codeRequired } = phase(event, await codesActive(db));
  let viaCode = false;
  if (body.accessCode) {
    const groups = await checkCode(db, body.accessCode);
    if (!groups || players.some((p) => !groups.includes(p.group))) {
      throw new ApiError(403, "access_code_invalid", "That access code isn't valid. Please check it and try again.");
    }
    viaCode = true;
  } else if (body.waitlistToken) {
    // claimOffer() rejects the whole checkout below if the token isn't a live offer for this group.
    viaCode = codeRequired;
  } else if (codeRequired) {
    throw new ApiError(403, "access_code_required", "An access code is required to register right now.");
  } else if (!publicOpen) {
    throw new ApiError(409, "registration_not_open", "Combine registration is not open yet.", {
      opensAt: event.public_opens_at?.toISOString() ?? null,
    });
  }

  const availability = new Map((await loadAvailability(db)).map((r) => [r.grp, r]));
  for (const [i, p] of players.entries()) {
    const row = availability.get(p.group)
    if (row && ((row.age_min !== null && p.age < row.age_min) || (row.age_max !== null && p.age > row.age_max))) {
      const message = `The ${row.label.toLowerCase()} combine is for ages ${row.age_min}–${row.age_max}.`
      throw new ApiError(400, "validation_failed", message, { issues: [{ path: `players.${i}.age`, message }] })
    }
  }

  const counts: Partial<Record<Group, number>> = {};
  for (const p of players) counts[p.group] = (counts[p.group] ?? 0) + 1;

  const priceInput: PriceLine[] = [];
  for (const [i, p] of players.entries()) {
    const row = availability.get(p.group);
    const price = row ? priceFor(row, viaCode, event) : null;
    if (!row || price === null) {
      throw new ApiError(503, "pricing_not_configured", "Combine pricing hasn't been published yet. Please check back soon.", { group: p.group });
    }
    priceInput.push({ lineNo: i + 1, playerIndex: i, unitCents: price, campId: event.camp_id, sessionId: null, miami: true, label: `${event.name} – ${row.label}` });
  }
  const settings = await getSettings(db);
  const promo = await loadPromo(db, body.promoCode, body.parent.email, priceInput);
  const priced = priceLines(priceInput, settings.sibling_discount, promo);
  const sums = totals(priced);
  if (sums.net > 0 && sums.net < 50) throw new ApiError(422, "promo_invalid", "This discount brings the total below Stripe's $0.50 minimum.");

  const waiver = await currentWaiver(db, "miami");
  const waiverRecord = resolveWaiver(waiver, event.waiver_required, body.waiver, new Date());
  const { parent } = body;

  // Anything the Kickoff Form requires that this form didn't collect, Stripe asks for.
  const customFields: CheckoutCustomField[] = [...(extras.customFields ?? [])];
  if (!parent.emergencyPhone) customFields.push({ key: "emergency_phone", label: "Emergency phone number" });
  if (players.some((p) => !p.shortSize)) customFields.push({ key: "short_size", label: "Player short size", options: event.short_sizes.length ? event.short_sizes : undefined });

  return startCheckout(deps, {
    flow: "miami",
    viaAccessCode: viaCode,
    payload: {
      parent: {
        name: `${parent.firstName} ${parent.lastName}`.trim(),
        firstName: parent.firstName,
        lastName: parent.lastName,
        email: parent.email,
        phone: parent.phone,
        emergencyPhone: parent.emergencyPhone ?? null,
        town: parent.town ?? body.shippingAddress.city,
      },
      marketingOptIn: body.marketingOptIn ?? false,
      extra: {},
      waiver: waiverRecord,
      pricing: { gross: sums.gross, sibling: sums.sibling, promo: sums.promo, promoCodeId: promo?.id ?? null, promoCode: promo?.code ?? null },
      waitlistEntryId: null as string | null,
      customFields,
      lines: players.map((p, i) => ({
        lineNo: i + 1,
        priceCents: priced[i]!.finalCents,
        discountCents: priced[i]!.siblingCents + priced[i]!.promoCents,
        campId: event.camp_id,
        miamiGroup: p.group,
        player: {
          name: `${p.firstName} ${p.lastName}`.trim(),
          firstName: p.firstName,
          lastName: p.lastName,
          age: p.age,
          sex: p.sex,
          email: p.email,
          heightIn: p.heightIn,
          weightLb: p.weightLb,
          position: p.position,
          club: p.club,
          shirtSize: p.shirtSize,
          shortSize: p.shortSize ?? null,
          shippingAddress: p.shippingAddress ?? body.shippingAddress,
          extra: p.extra ?? {},
        },
      })),
    },
    lines: stripeLines(priced, promo),
    customerEmail: parent.email,
    collectPhone: extras.collectPhone,
    allowPromotionCodes: extras.allowPromotionCodes && !promo,
    customFields,
    holdMinutes: event.hold_minutes,
    successPath: extras.successPath ?? body.successPath ?? settings.default_success_path,
    cancelPath: extras.cancelPath ?? body.cancelPath ?? settings.default_cancel_path,
    reserve: async (tx, intentId, holdExpiresAt, payload) => {
      if (body.waitlistToken) {
        payload.waitlistEntryId = await claimOffer(tx, body.waitlistToken, { miamiGroups: Object.keys(counts) }, players.length);
        await tx`update public.checkout_intents set payload = ${tx.json(payload as never)} where id = ${intentId}`;
      }
      await tx`select public.reserve_miami(${intentId}, ${tx.json(counts)}, ${viaCode}, ${holdExpiresAt})`;
    },
  });
}

/** POST /api/miami/checkout (D3) */
export async function miamiCheckout(req: Request, deps: Deps): Promise<Response> {
  await enforceRateLimit(deps.db, deps.env, req, "checkout");
  const body = parse(MiamiCheckoutRequest, await readJson(req));
  return json(await runMiamiCheckout(deps, body));
}
