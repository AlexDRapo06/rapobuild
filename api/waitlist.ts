import { joinWaitlist, waitlistOffer } from "../platform/src/handlers/waitlist.js";
import { getDeps } from "../platform/src/lib/deps.js";
import { endpoint } from "../platform/src/lib/http.js";

export const POST = endpoint("waitlist", (req) => joinWaitlist(req, getDeps()));
export const OPTIONS = POST;
export const GET = endpoint("waitlist.offer", (req) => waitlistOffer(req, getDeps()));
