import { miamiCheckout } from "../../platform/src/handlers/miami.js";
import { getDeps } from "../../platform/src/lib/deps.js";
import { endpoint } from "../../platform/src/lib/http.js";

export const POST = endpoint("miami.checkout", (req) => miamiCheckout(req, getDeps()));
export const OPTIONS = POST;
