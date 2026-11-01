import { site } from "../../platform/src/handlers/site.js";
import { getDeps } from "../../platform/src/lib/deps.js";
import { endpoint } from "../../platform/src/lib/http.js";

/** Endpoints the live site's api/*.js functions forward to (see integration/rapobuild). */
const handler = endpoint("site", (req) => site(req, getDeps()));
export const GET = handler;
export const POST = handler;
