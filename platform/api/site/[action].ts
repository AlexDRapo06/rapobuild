import { site } from "../../src/handlers/site.js";
import { getDeps } from "../../src/lib/deps.js";
import { endpoint } from "../../src/lib/http.js";

/** Endpoints the live site's api/*.js functions forward to (see integration/rapobuild). */
const handler = endpoint("site", (req) => site(req, getDeps()));
export const GET = handler;
export const POST = handler;
