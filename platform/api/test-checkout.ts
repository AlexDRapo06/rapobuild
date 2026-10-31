import { testCheckout } from "../src/handlers/test-checkout.js";
import { getDeps } from "../src/lib/deps.js";
import { endpoint } from "../src/lib/http.js";

/** Staging deployments only: the stand-in payment page until Stripe keys are added. */
const handler = endpoint("test-checkout", (req) => testCheckout(req, getDeps()));
export const GET = handler;
export const POST = handler;
