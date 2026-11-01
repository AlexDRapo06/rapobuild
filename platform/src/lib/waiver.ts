import type { WaiverInfo } from "../contract.js";
import type { Db } from "./db.js";
import { ApiError } from "./http.js";

export interface WaiverRecord {
  status: "accepted" | "not_collected";
  waiverId: string | null;
  acceptedName: string | null;
  acceptedAt: string | null;
}

export async function currentWaiver(db: Db, flow: "camp" | "miami"): Promise<WaiverInfo | null> {
  const [row] = await db<WaiverInfo[]>`
    select id, version, title, body, url
      from public.waivers
     where active and flow in (${flow}, 'all')
     order by (flow = ${flow}) desc, version desc
     limit 1`;
  return row ?? null;
}

/**
 * Registrations taken while no waiver text exists are stored as
 * "not_collected" so they can be followed up later.
 */
export function resolveWaiver(
  current: WaiverInfo | null,
  required: boolean,
  acceptance: { waiverId: string; acceptedName: string } | undefined,
  now: Date,
): WaiverRecord {
  if (!current) return { status: "not_collected", waiverId: null, acceptedName: null, acceptedAt: null };

  if (!acceptance) {
    if (required) {
      throw new ApiError(422, "waiver_required", "Please accept the waiver to continue.", { currentWaiverId: current.id });
    }
    return { status: "not_collected", waiverId: null, acceptedName: null, acceptedAt: null };
  }

  if (acceptance.waiverId !== current.id) {
    throw new ApiError(422, "waiver_required", "The waiver has been updated. Please review and accept the current version.", {
      currentWaiverId: current.id,
    });
  }

  return { status: "accepted", waiverId: current.id, acceptedName: acceptance.acceptedName, acceptedAt: now.toISOString() };
}
