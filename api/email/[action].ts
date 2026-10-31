import { emailPublic } from "../../platform/src/handlers/email-public.js";
import { getDeps } from "../../platform/src/lib/deps.js";
import { endpoint } from "../../platform/src/lib/http.js";

const handler = endpoint("email", (req) => emailPublic(req, getDeps()));
export const GET = handler;
export const POST = handler;
