import { stripeWebhook } from "../../platform/src/handlers/stripe-webhook.js";
import { getDeps } from "../../platform/src/lib/deps.js";
import { endpoint } from "../../platform/src/lib/http.js";

export const POST = endpoint("stripe.webhook", (req) => stripeWebhook(req, getDeps()));
