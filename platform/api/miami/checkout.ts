import { miamiCheckout } from "../../src/handlers/miami.js";
import { getDeps } from "../../src/lib/deps.js";
import { endpoint } from "../../src/lib/http.js";

export const POST = endpoint("miami.checkout", (req) => miamiCheckout(req, getDeps()));
export const OPTIONS = POST;
