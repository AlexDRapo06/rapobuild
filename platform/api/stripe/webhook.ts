import { stripeWebhook } from "../../src/handlers/stripe-webhook.js";
import { getDeps } from "../../src/lib/deps.js";
import { endpoint } from "../../src/lib/http.js";

export const POST = endpoint("stripe.webhook", (req) => stripeWebhook(req, getDeps()));
