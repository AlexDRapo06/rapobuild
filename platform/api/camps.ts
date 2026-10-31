import { listCamps } from "../src/handlers/camps.js";
import { getDeps } from "../src/lib/deps.js";
import { endpoint } from "../src/lib/http.js";

export const GET = endpoint("camps", (req) => listCamps(req, getDeps()));
export const OPTIONS = GET;
