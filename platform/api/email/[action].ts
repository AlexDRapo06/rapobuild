import { emailPublic } from "../../src/handlers/email-public.js";
import { getDeps } from "../../src/lib/deps.js";
import { endpoint } from "../../src/lib/http.js";

const handler = endpoint("email", (req) => emailPublic(req, getDeps()));
export const GET = handler;
export const POST = handler;
