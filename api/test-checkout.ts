import { testCheckout } from "../platform/src/handlers/test-checkout.js";
import { getDeps } from "../platform/src/lib/deps.js";
import { endpoint } from "../platform/src/lib/http.js";

/** Staging deployments only: the stand-in payment page until Stripe keys are added. */
const handler = endpoint("test-checkout", (req) => testCheckout(req, getDeps()));
export const GET = handler;
export const POST = handler;
