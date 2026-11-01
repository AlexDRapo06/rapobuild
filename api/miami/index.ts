import { miamiStatus } from "../../platform/src/handlers/miami.js";
import { getDeps } from "../../platform/src/lib/deps.js";
import { endpoint } from "../../platform/src/lib/http.js";

export const GET = endpoint("miami.status", (req) => miamiStatus(req, getDeps()));
export const OPTIONS = GET;
