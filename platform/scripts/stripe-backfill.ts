/**
 * Pulls payments the site took before it was switched to the platform (or any
 * webhook that was missed) into the dashboard. Each Stripe Checkout Session and
 * refund goes through the same code as the webhook, so running it twice is safe.
 *
 *   pnpm stripe:backfill --since 2026-09-01            (lists what it found)
 *   pnpm stripe:backfill --since 2026-09-01 --apply    (writes it)
 *
 * Needs STRIPE_SECRET_KEY and DATABASE_URL in the environment. Ivy Devs runs
 * this against production; developers only ever run it with test keys.
 */
import Stripe from "stripe";
import { processStripeEvent } from "../src/handlers/stripe-webhook.js";
import { flag, scriptDb } from "./_db.js";

const args = process.argv.slice(2);
const since = flag(args, "since");
const apply = args.includes("--apply");
const key = process.env.STRIPE_SECRET_KEY;

if (!key || !since || Number.isNaN(Date.parse(since))) {
  console.error("Usage: pnpm stripe:backfill --since YYYY-MM-DD [--apply]   (needs STRIPE_SECRET_KEY)");
  process.exit(1);
}

const stripe = new Stripe(key, { maxNetworkRetries: 2 });
const created = { gte: Math.floor(Date.parse(since) / 1000) };
const sql = scriptDb();
const tally: Record<string, number> = {};
const count = (k: string) => (tally[k] = (tally[k] ?? 0) + 1);

console.log(`${key.startsWith("sk_live_") ? "LIVE" : "TEST"} Stripe account, payments since ${since}. ${apply ? "Applying." : "Dry run (add --apply to write)."}`);

try {
  for await (const session of stripe.checkout.sessions.list({ created, status: "complete", limit: 100 })) {
    const md = session.metadata ?? {};
    const what = md.intent_id ? `platform ${md.flow ?? ""}` : md.package_id ? `training ${md.package_id}` : md.camp_id ? `${md.camp_id} / ${md.session_id}` : "no metadata";
    console.log(`${session.id}  ${new Date(session.created * 1000).toISOString().slice(0, 10)}  $${((session.amount_total ?? 0) / 100).toFixed(2)}  ${session.customer_details?.email ?? ""}  ${what}`);
    if (!apply) {
      count("found");
      continue;
    }
    const result = await processStripeEvent(sql, {
      id: `backfill_${session.id}`,
      type: "checkout.session.completed",
      data: { object: session as unknown as Record<string, any> },
    });
    count(result);
  }

  for await (const charge of stripe.charges.list({ created, limit: 100 })) {
    if (!charge.amount_refunded) continue;
    if (!apply) {
      count("refunds found");
      continue;
    }
    const result = await processStripeEvent(sql, {
      id: `backfill_${charge.id}_${charge.amount_refunded}`,
      type: "charge.refunded",
      data: { object: charge as unknown as Record<string, any> },
    });
    count(result);
  }
  console.table(tally);
} finally {
  await sql.end();
}
