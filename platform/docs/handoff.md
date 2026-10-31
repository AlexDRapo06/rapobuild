# Handoff

What the Build Agreement (§10) and the Brief (D16) ask for at handoff. Sections
marked *Stage 2/3* get filled in as those stages ship.

## Services

All accounts belong to Ivy Devs or the client (Agreement §8).

| Service | Used for | Owner |
| --- | --- | --- |
| Vercel | Hosting, serverless functions in `api/`, daily cleanup cron | Ivy Devs / client |
| Supabase | Postgres database, Row Level Security, admin login (Stage 2), backups | Ivy Devs / client |
| Stripe | Checkout, webhooks, refunds | Client |
| Brevo | Notification, transactional and campaign email | Ivy Devs / client |
| Cloudflare Turnstile (optional) | CAPTCHA on the private training form | Ivy Devs / client |

## Secret names

Values live only in Vercel project settings (and a local `.env` with test values).
Never in the repo.

| Name | Where it comes from |
| --- | --- |
| `DATABASE_URL` | Supabase → Connect → transaction pooler (port 6543) |
| `DIRECT_DATABASE_URL` | Supabase → Connect → direct connection (scripts only) |
| `PUBLIC_SITE_URL` | The site's origin |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → the `/api/stripe/webhook` endpoint |
| `BREVO_API_KEY` | Brevo → SMTP & API → API keys |
| `EMAIL_FROM`, `EMAIL_FROM_NAME` | Chosen sender (must be verified in Brevo) |
| `TURNSTILE_SECRET_KEY` | Cloudflare → Turnstile (optional) |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Supabase → Project Settings → API (URL and publishable/anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (secret key). Server-only: Vercel (for Settings → Admins) and scripts; never in the browser or the repo |
| `PUBLIC_ADMIN_URL` | The deployed dashboard URL, e.g. `https://<api domain>/admin/` |
| `CORS_ALLOWED_ORIGINS` | The public site's domains, comma-separated |
| `BREVO_WEBHOOK_SECRET` | Any long random string; also pasted into the Brevo webhook URL |
| `CRON_SECRET` | Any long random string; Vercel sends it to cron routes |
| `RATE_LIMIT_SALT` | Any long random string |
| `SITE_API_KEY` | Any long random string; the same value on the site's Vercel project (`integration/rapobuild/`) |

## Packages

All permissive licenses, as the Agreement (§4) requires. Check any time with
`pnpm licenses:check` (it covers transitive and dev packages too).

| Package | License | Used for |
| --- | --- | --- |
| `pg` | MIT | Postgres client |
| `stripe` | MIT | Stripe API and webhook signature checks |
| `zod` | MIT | Request validation |
| `typescript` (dev) | Apache-2.0 | Type checking |
| `tsx` (dev) | MIT | Running TypeScript scripts and tests |
| `react`, `react-dom` (dev, bundled) | MIT | Admin dashboard |
| `esbuild` (dev) | MIT | Bundling and minifying the admin dashboard |
| `tailwindcss` (dev) | MIT | Dashboard styles (its compiler is called directly, without `@tailwindcss/cli`, whose `lightningcss` dependency is MPL-2.0) |
| `tw-animate-css` (dev) | MIT | Enter/exit animations |
| `radix-ui` (dev, bundled) | MIT | Accessible primitives (dialog, dropdown, tooltip, avatar) |
| `motion` (dev, bundled) | MIT | Dashboard animations |
| `lucide-react` (dev, bundled) | ISC | Icons |
| `class-variance-authority` (dev, bundled) | Apache-2.0 | Component variants |
| `clsx`, `tailwind-merge` (dev, bundled) | MIT | Class name helpers |
| `@types/node`, `@types/pg`, `@types/react`, `@types/react-dom` (dev) | MIT | Type definitions |

Tests use Node's built-in test runner, so no extra test framework is installed.
Copied UI component code (ReUI, shadcn/ui, Magic UI) is credited in `THIRD_PARTY_NOTICES.md`.

## How to

Everything below is in the dashboard at `/admin` unless noted.

| Task | Where |
| --- | --- |
| Add or edit a camp or session (dates, price, early-bird, spot limit, open/closed, reminders) | Settings → Camps & sessions |
| Change Miami limits, prices, dates, reserved spots, opening/closing times, size lists | Settings → Miami combine |
| Set, end-date or turn off the Miami access code | Settings → Access codes |
| Create or disable a promo code; set the sibling discount; waitlist hold time | Settings → Discounts & promo codes |
| Publish waiver wording and require it | Settings → Waivers |
| Import contacts | Contacts → Import contacts |
| Send a campaign | Send email (see `docs/email-guide.md`) |
| See past sends and automatic emails | Email history |
| Mailing address, reply-to, notification address, automatic emails | Settings → Email |
| Print a roster | Rosters → pick a session → Print roster |
| Notify the next waitlist family / remove one | Waitlist |
| Cancel or restore a registration | Registrations → open it → Cancel registration |
| Export registrations, contacts, payments, revenue, analytics | "Export CSV" on each page |
| Revenue reconciliation | Revenue page: Collected and Refunds match Stripe for the same dates (before fees) |
| Give someone dashboard access, or take it away | Settings → Admins (or terminal: `pnpm admins add <email>`, `pnpm admins remove <email>`) |
| Add a camp the site sells | Settings → Camps, with the same camp id and session ids as the site's `src/camps.jsx` |
| Connect or disconnect the live site | `integration/rapobuild/README.md` (set or remove `PLATFORM_API_URL` on the site) |
| Import payments Stripe has but the dashboard doesn't | Terminal: `pnpm stripe:backfill --since <date> --apply` |
| Restore a backup | Supabase → Database → Backups → choose a point in time → Restore (Pro plan). Restoring replaces the whole database, so export recent registrations first. |

## Handoff checklist (Agreement §10)

- [ ] All code committed to Ivy Devs' repo
- [ ] This document up to date (services, secret names, packages)
- [ ] `pnpm test` passes; acceptance checklist results shared
- [ ] Project files and credentials deleted from the developer's devices
- [ ] Anything in the developer's name transferred or deleted
- [ ] Written note to Ivy Devs confirming no access remains
