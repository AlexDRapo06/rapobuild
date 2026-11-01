import { miamiVerifyCode } from "../../platform/src/handlers/miami.js";
import { getDeps } from "../../platform/src/lib/deps.js";
import { endpoint } from "../../platform/src/lib/http.js";

export const POST = endpoint("miami.verify_code", (req) => miamiVerifyCode(req, getDeps()));
export const OPTIONS = POST;
