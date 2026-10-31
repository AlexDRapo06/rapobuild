import { admin } from "../../src/handlers/admin.js";
import { getDeps } from "../../src/lib/deps.js";
import { endpoint } from "../../src/lib/http.js";

const handler = endpoint("admin", (req) => admin(req, getDeps()));
export const GET = handler;
export const POST = handler;
