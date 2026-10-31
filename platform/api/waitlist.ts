import { joinWaitlist, waitlistOffer } from "../src/handlers/waitlist.js";
import { getDeps } from "../src/lib/deps.js";
import { endpoint } from "../src/lib/http.js";

export const POST = endpoint("waitlist", (req) => joinWaitlist(req, getDeps()));
export const OPTIONS = POST;
export const GET = endpoint("waitlist.offer", (req) => waitlistOffer(req, getDeps()));
