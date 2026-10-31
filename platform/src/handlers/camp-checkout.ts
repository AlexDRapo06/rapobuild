import { CampCheckoutRequest } from "../contract.js";
import { startCheckout } from "../lib/checkout.js";
import type { Deps } from "../lib/deps.js";
import { enforceRateLimit } from "../lib/guards.js";
import { ApiError, json, parse, readJson } from "../lib/http.js";
import type { CheckoutCustomField } from "../lib/payments.js";
import { loadPromo, priceLines, stripeLines, totals, type PriceLine } from "../lib/pricing.js";
import { getSettings } from "../lib/settings.js";
import { claimOffer } from "../lib/waitlist.js";
import { currentWaiver, resolveWaiver } from "../lib/waiver.js";

interface SessionRow {
  id: string;
  name: string;
  status: "open" | "closed";
  price_cents: number;
  age_min: number | null;
  age_max: number | null;
  closes_at: Date | null;
  camp_id: string;
  camp_name: string;
  camp_kind: string;
  info_only: boolean;
  camp_active: boolean;
}

/** Same as the public request, except the phone may be left for Stripe to collect. */
export type CampCheckoutInput = Omit<CampCheckoutRequest, "parent"> & {
  parent: Omit<CampCheckoutRequest["parent"], "phone"> & { phone?: string };
};

export interface CheckoutExtras {
  /** Full paths (query allowed) on the public site; the public endpoint passes the validated request paths. */
  successPath?: string;
  cancelPath?: string;
  /** Ask Stripe Checkout for anything the form didn't collect. */
  collectPhone?: boolean;
  customFields?: CheckoutCustomField[];
  allowPromotionCodes?: boolean;
}

export async function runCampCheckout(deps: Deps, body: CampCheckoutInput, extras: CheckoutExtras = {}) {
  const { db } = deps;
  const players = body.players.map((p) => ({ ...p, sessionIds: [...new Set(p.sessionIds)] }));
  const sessionIds = [...new Set(players.flatMap((p) => p.sessionIds))];

  const rows = await db<SessionRow[]>`
    select s.id, s.name, s.status, public.session_price_cents(s) as price_cents, s.age_min, s.age_max, s.closes_at,
           c.id as camp_id, c.name as camp_name, c.kind as camp_kind, c.info_only, c.active as camp_active
      from public.sessions s
      join public.camps c on c.id = s.camp_id
     where s.id = any(${sessionIds}::uuid[])`;
  const byId = new Map(rows.map((r) => [r.id, r]));

  const missing = sessionIds.filter((id) => {
    const row = byId.get(id);
    return !row || row.camp_kind === "miami";
  });
  if (missing.length) {
    throw new ApiError(404, "session_not_found", "One or more selected sessions no longer exist.", { sessionIds: missing });
  }
  for (const row of rows) {
    if (row.info_only) {
      throw new ApiError(409, "camp_info_only", "This camp does not take registrations on this site.", { campId: row.camp_id });
    }
    if (row.status !== "open" || !row.camp_active || (row.closes_at && row.closes_at.getTime() <= Date.now())) {
      throw new ApiError(409, "session_closed", "Registration for this session is closed.", { sessionId: row.id });
    }
  }
  for (const [i, player] of players.entries()) {
    for (const id of player.sessionIds) {
      const row = byId.get(id)!;
      if ((row.age_min !== null && player.age < row.age_min) || (row.age_max !== null && player.age > row.age_max)) {
        throw new ApiError(400, "validation_failed", `This session is for ages ${row.age_min ?? "any"}–${row.age_max ?? "any"}.`, {
          issues: [{ path: `players.${i}.age`, message: `This session is for ages ${row.age_min ?? "any"}–${row.age_max ?? "any"}.` }],
        });
      }
    }
  }

  const [settings, waiver] = await Promise.all([getSettings(db), currentWaiver(db, "camp")]);
  const waiverRecord = resolveWaiver(waiver, settings.camp_waiver_required, body.waiver, new Date());

  let lineNo = 0;
  const regLines = players.flatMap((player, playerIndex) =>
    player.sessionIds.map((sessionId) => ({
      lineNo: ++lineNo,
      playerIndex,
      campId: byId.get(sessionId)!.camp_id,
      sessionId,
      player: { name: player.name, age: player.age, sex: player.sex ?? null, extra: player.extra ?? {} },
    })),
  );

  const counts: Record<string, number> = {};
  for (const line of regLines) counts[line.sessionId] = (counts[line.sessionId] ?? 0) + 1;

  const priceInput: PriceLine[] = regLines.map((l) => {
    const row = byId.get(l.sessionId)!;
    return { lineNo: l.lineNo, playerIndex: l.playerIndex, unitCents: row.price_cents, campId: row.camp_id, sessionId: l.sessionId, miami: false, label: `${row.camp_name} – ${row.name}` };
  });
  const promo = await loadPromo(db, body.promoCode, body.parent.email, priceInput);
  const priced = priceLines(priceInput, settings.sibling_discount, promo);
  const sums = totals(priced);
  if (sums.net > 0 && sums.net < 50) throw new ApiError(422, "promo_invalid", "This discount brings the total below Stripe's $0.50 minimum.");
  const byLine = new Map(priced.map((p) => [p.lineNo, p]));

  return startCheckout(deps, {
    flow: "camp",
    viaAccessCode: false,
    payload: {
      parent: body.parent,
      marketingOptIn: body.marketingOptIn ?? false,
      extra: body.extra ?? {},
      waiver: waiverRecord,
      pricing: { gross: sums.gross, sibling: sums.sibling, promo: sums.promo, promoCodeId: promo?.id ?? null, promoCode: promo?.code ?? null },
      waitlistEntryId: null as string | null,
      customFields: extras.customFields ?? [],
      lines: regLines.map((l) => ({ ...l, priceCents: byLine.get(l.lineNo)!.finalCents, discountCents: byLine.get(l.lineNo)!.siblingCents + byLine.get(l.lineNo)!.promoCents })),
    },
    lines: stripeLines(priced, promo),
    customerEmail: body.parent.email,
    collectPhone: extras.collectPhone ?? !body.parent.phone,
    allowPromotionCodes: extras.allowPromotionCodes && !promo,
    customFields: extras.customFields,
    holdMinutes: settings.camp_hold_minutes,
    successPath: extras.successPath ?? body.successPath ?? settings.default_success_path,
    cancelPath: extras.cancelPath ?? body.cancelPath ?? settings.default_cancel_path,
    reserve: async (tx, intentId, holdExpiresAt, payload) => {
      if (body.waitlistToken) {
        payload.waitlistEntryId = await claimOffer(tx, body.waitlistToken, { sessionIds }, players.length);
        await tx`update public.checkout_intents set payload = ${tx.json(payload as never)} where id = ${intentId}`;
      }
      await tx`select public.reserve_sessions(${intentId}, ${tx.json(counts)}, ${holdExpiresAt})`;
    },
  });
}

/** POST /api/checkout/camp (D2) */
export async function campCheckout(req: Request, deps: Deps): Promise<Response> {
  await enforceRateLimit(deps.db, deps.env, req, "checkout");
  const body = parse(CampCheckoutRequest, await readJson(req));
  return json(await runCampCheckout(deps, body));
}
