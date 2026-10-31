import { listCamps } from "../platform/src/handlers/camps.js";
import { getDeps } from "../platform/src/lib/deps.js";
import { endpoint } from "../platform/src/lib/http.js";

export const GET = endpoint("camps", (req) => listCamps(req, getDeps()));
export const OPTIONS = GET;
