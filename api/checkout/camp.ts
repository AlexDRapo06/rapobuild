import { campCheckout } from "../../platform/src/handlers/camp-checkout.js";
import { getDeps } from "../../platform/src/lib/deps.js";
import { endpoint } from "../../platform/src/lib/http.js";

export const POST = endpoint("checkout.camp", (req) => campCheckout(req, getDeps()));
export const OPTIONS = POST;
