import { miamiStatus } from "../../src/handlers/miami.js";
import { getDeps } from "../../src/lib/deps.js";
import { endpoint } from "../../src/lib/http.js";

export const GET = endpoint("miami.status", (req) => miamiStatus(req, getDeps()));
export const OPTIONS = GET;
