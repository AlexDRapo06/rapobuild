import { admin } from "../../platform/src/handlers/admin.js";
import { getDeps } from "../../platform/src/lib/deps.js";
import { endpoint } from "../../platform/src/lib/http.js";

const handler = endpoint("admin", (req) => admin(req, getDeps()));
export const GET = handler;
export const POST = handler;
