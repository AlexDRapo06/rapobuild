import { miamiVerifyCode } from "../../src/handlers/miami.js";
import { getDeps } from "../../src/lib/deps.js";
import { endpoint } from "../../src/lib/http.js";

export const POST = endpoint("miami.verify_code", (req) => miamiVerifyCode(req, getDeps()));
export const OPTIONS = POST;
