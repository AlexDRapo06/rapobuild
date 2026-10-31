import { cleanup, emailsCron, waitlistCron } from "../../src/handlers/cleanup.js";
import { getDeps } from "../../src/lib/deps.js";
import { ApiError, endpoint } from "../../src/lib/http.js";

/** /api/cron/cleanup and /api/cron/emails /api/cron/waitlist (one function, several Vercel cron schedules). */
export const GET = endpoint("cron", (req) => {
  const task = new URL(req.url).pathname.split("/").filter(Boolean).at(-1);
  if (task === "cleanup") return cleanup(req, getDeps());
  if (task === "emails") return emailsCron(req, getDeps());
  if (task === "waitlist") return waitlistCron(req, getDeps());
  throw new ApiError(404, "not_found", "Not found");
});
