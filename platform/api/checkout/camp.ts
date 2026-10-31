import { campCheckout } from "../../src/handlers/camp-checkout.js";
import { getDeps } from "../../src/lib/deps.js";
import { endpoint } from "../../src/lib/http.js";

export const POST = endpoint("checkout.camp", (req) => campCheckout(req, getDeps()));
export const OPTIONS = POST;
