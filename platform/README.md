# Footy Up registration platform

The back end and admin dashboard for Footy Up's registrations: the database,
the serverless API behind camp checkout, the Miami combine checkout and the
private training form, the Stripe webhook, and the dashboard where Alex and
Chris view registrations.

It lives in the site's repo (`rapobuild`) and deploys with it as **one Vercel
project**. The website's pages are at the repo root; this folder holds the
back end and dashboard code; the serverless functions are in the repo-root
`api/` folder. The site's forms call `/api/site/*` directly, so registrations,
payments, training requests and contacts land in Supabase and the dashboard.
The general API for other front ends is in [`docs/api-contract.md`](docs/api-contract.md).

Requirements come from the Developer Brief, with the client's **Kickoff
Information Form (Oct 18, 2026)** taking priority where they differ.

## Status

Every requirement in the brief and the Kickoff Form is listed in
[`docs/requirements-checklist.md`](docs/requirements-checklist.md) with where it lives
and what's still waiting on the client. In short:

- **Stage 1:** done and tested. Payment saving, camp checkout, Miami checkout and the private training form.
- **Dashboard at `/admin`:**
  - Overview, analytics and revenue (with refunds and cancellations).
  - Registrations, rosters, waitlist and private training.
  - Email: send to groups, contacts with import, and history.
  - Settings: camps and sessions, Miami, access codes, discounts and promo codes, waivers, email.
- **Changing the domain:** one platform setting (`PUBLIC_SITE_URL`) plus a few clicks; see [`docs/changing-the-domain.md`](docs/changing-the-domain.md).
- **Site and back end in one project:** the site's camp, Miami, training checkout, inquiry and waitlist forms feed
  the dashboard. Payments the site's old checkout took before the switch can be imported with `pnpm stripe:backfill`.
- **Email through Brevo:** campaigns, two-way unsubscribe sync, confirmations, reminders and waitlist offers. See [`docs/email-guide.md`](docs/email-guide.md).
- **Not built:** multi-factor login for admins (recommended next), plus template screenshots from Gmail/Outlook/Apple Mail, which need the live Brevo account.

Client-facing test list: [`docs/stage-1-checklist.md`](docs/stage-1-checklist.md). Open questions: [`docs/open-decisions.md`](docs/open-decisions.md).

## Run it locally

Requires Node 22, pnpm 10 and Postgres 15+. Run everything from the **repo root**.

```bash
pnpm install
cp platform/.env.example platform/.env   # local Postgres, mock Stripe, dev admin login
pnpm db:reset                 # local only: schema + data/*.json
pnpm admin:build              # builds the dashboard into platform/public/admin
pnpm dev                      # http://localhost:4319: the website, /admin/ and the API
pnpm admins add you@example.com   # local admin for the dev login
pnpm demo:data                # optional: fake families through the real checkout
pnpm build                    # what Vercel runs: site + dashboard into dist/
```

`data/camps.json` and `data/miami.json` mirror the live site's catalog (same camp and
session ids as the site's `src/camps.jsx`). Miami opens to access-code holders on
Nov 1, 2026 and to everyone on Dec 1. To try Miami checkout locally before then,
clear the opening times:
`psql "$DATABASE_URL" -c "update miami_event set opens_at = null, public_opens_at = null"`.

With `PAYMENTS_MODE=mock`, checkout goes to a local fake Stripe page with **Pay**
and **Abandon** buttons that send correctly signed webhooks. Locally, the
dashboard uses a dev login (email only). On Vercel it requires Supabase Auth.

```bash
pnpm test            # throwaway database "footyup_test", 104 acceptance tests
pnpm typecheck       # API + dashboard
pnpm licenses:check  # every package must be MIT/Apache/BSD/ISC (Build Agreement §4)
```

## Running it day to day

Settings change without a deploy. These scripts use `DIRECT_DATABASE_URL` (or `DATABASE_URL`).

```bash
pnpm camps:upsert                       # load data/camps.json
pnpm miami config                       # load data/miami.json (caps, reserved spots, price, dates, phases)
pnpm miami status                       # spots left per group, whether a code is required
pnpm miami code add <code> --label "Host families" [--ends-at <ISO time>]
pnpm miami code off                     # turn codes off
pnpm waiver add --flow miami --title "Participant waiver" --file waiver.txt
pnpm settings set notify_email '"alex@example.com"'
pnpm admins add <email>                 # invite a dashboard admin (or Dashboard → Settings → Admins)
pnpm admins list | remove <email>
pnpm stripe:backfill --since 2026-09-01 [--apply]   # import payments the site took before the switch
```

The real Miami access code is never committed or stored in plain text. Ivy Devs sets it with
`pnpm miami code add`, and only its hash is saved.

## How the important parts work

- **No child data in Stripe.** Starting a checkout saves the form as a pending
  intent; Stripe only gets its id. The webhook turns it into registrations and
  clears the pending copy.
- **Caps can't be oversold.** `reserve_miami()` locks both group rows, counts paid
  registrations plus unexpired holds, and inserts the hold in one transaction.
  Holds outlive the Stripe session by 5 minutes and stop counting on their own.
- **Phases.** Before `public_opens_at` only code holders can check out. After it,
  everyone can, and the code (optional) unlocks the reserved spots. Checkout closes at `closes_at`.
- **Reserved spots.** One pool across both groups (`reserved_total`, 200 per the
  Kickoff Form) and/or per group. They apply while a code is active and before `reserved_until`.
- **Webhooks apply exactly once.** The Stripe event id is stored in the same transaction as its effects.
- **Dashboard reads go through Row Level Security.** The API checks the Supabase
  login, then runs every query as role `authenticated` with that user's id, so the
  table policies (admin_users membership) decide what's visible.

## Environment variables

Names only. Values go in Vercel project settings, never in the repo.

| Name | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Vercel | Supabase transaction pooler URL (port 6543) |
| `DIRECT_DATABASE_URL` | scripts | Direct Supabase URL for migrations and admin scripts |
| `PUBLIC_SITE_URL` | Vercel | The website's address, e.g. `https://www.footyup.net`. Also sets the dashboard (`/admin/`), unsubscribe and checkout links unless `PUBLIC_ADMIN_URL`/`PUBLIC_API_URL` are set |
| `STRIPE_SECRET_KEY` | Vercel | Stripe secret key (test mode until launch approval) |
| `STRIPE_WEBHOOK_SECRET` | Vercel | Signing secret of the `/api/stripe/webhook` endpoint |
| `SUPABASE_URL` | Vercel + scripts | Supabase project URL (admin login) |
| `SUPABASE_ANON_KEY` | Vercel | Supabase publishable/anon key (safe in the browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (server-only) + scripts | Sending admin invites, from Settings → Admins or `pnpm admins add`. Server secret: never in the browser or the repo. Without it on Vercel, admins can only be added from the terminal |
| `PUBLIC_ADMIN_URL` | scripts | Where invite links land, e.g. `https://<api domain>/admin/` |
| `CORS_ALLOWED_ORIGINS` | Vercel, optional | Other domains allowed to call the API from the browser (not needed for the site itself) |
| `BREVO_WEBHOOK_SECRET` | Vercel | Secret in the Brevo webhook URL (unsubscribe/bounce sync) |
| `PUBLIC_API_URL` | Vercel, optional | Public origin of this API for unsubscribe links (defaults to the admin URL's origin) |
| `EMAIL_DOMAIN` | Vercel, optional | Sending domain to authenticate (defaults to `EMAIL_FROM`'s domain) |
| `BREVO_API_KEY` | Vercel | Email. Without it, emails are logged (subject only), not sent |
| `FOOTYUP_STAGING` | Vercel, until launch | `true` keeps a production deployment in test mode: mock payments allowed and the test-recipient email guard on. Remove it on launch day (then Stripe keys are required) |
| `EMAIL_TEST_RECIPIENTS` | anywhere but production | With a real Brevo key outside production, real email only goes to these addresses (comma-separated; `@domain` allows a domain). Everyone else is skipped, so test data never emails made-up families |
| `EMAIL_FROM`, `EMAIL_FROM_NAME` | Vercel | Sender (must be verified in Brevo) |
| `CRON_SECRET` | Vercel | Auth for `/api/cron/cleanup` |
| `RATE_LIMIT_SALT` | Vercel | Salt for hashing IPs in rate-limit keys |
| `TURNSTILE_SECRET_KEY` | Vercel, optional | CAPTCHA on the training form |
| `PAYMENTS_MODE` | local only | `mock`; refused in production |

## Going live (client accounts)

Everything runs in the client's **FootyUP** accounts (Kickoff Form, Section A):
one Vercel project built from this repo serves the website, `/admin` and the API.
The step-by-step list for launch is [`docs/go-live-checklist.md`](docs/go-live-checklist.md).

1. **Supabase** (FootyUP org, Pro): create the project, then run `pnpm db:migrate`
   with `DIRECT_DATABASE_URL`, and `pnpm camps:upsert` and `pnpm miami config`.
   In Auth settings: turn **off** "Allow new users to sign up", set the Site URL to
   `https://www.footyup.net/admin/` and add it to the redirect URLs. Point backups at the Pro plan's daily backups.
2. **Vercel** (FootyUP team, Pro): import the repo as a project (Root Directory empty).
   The repo-root `vercel.json` sets the build (`pnpm build`), output (`dist`) and the cron jobs.
   Add the environment variables above. Use the Pro plan: Vercel doesn't allow the free plan for a business site that takes payments.
3. **Stripe** (client account, test mode first): add a webhook endpoint at
   `https://www.footyup.net/api/stripe/webhook` for `checkout.session.completed`,
   `checkout.session.expired`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed` and `charge.refunded`. Keep bank-debit methods off.
4. **Admins:** `pnpm admins add alexdimitrirapo@gmail.com` for the first admin. Each gets an
   invite email to choose a password. After that, admins add each other in Settings → Admins
   (needs `SUPABASE_SERVICE_ROLE_KEY` and `PUBLIC_ADMIN_URL` on Vercel).
5. **Brevo:** create an API key and verified sender, set `BREVO_API_KEY`, `EMAIL_FROM`, and
   `pnpm settings set notify_email '"..."'`. Send the SPF/DKIM/DMARC records to whoever
   controls the footyup.net DNS.
6. **Access code:** Ivy Devs runs `pnpm miami code add <code> --label "Host families"` (or Dashboard →
   Settings → Access codes). The site's current code can't be copied over, because only a hash is kept.
7. Run [`docs/stage-1-checklist.md`](docs/stage-1-checklist.md) on test mode, then swap to live Stripe keys.


## Layout

Repo root (`rapobuild`):

```
index.html, src/*.jsx, public/, assets/   The website (Ivy Devs' pages)
api/                  Vercel functions (Web Request/Response). api/site/[action].ts serves the site's forms;
                      api/admin/[view].ts serves the dashboard API
platform/             Back end and dashboard code (this README)
vercel.json           One project: build, output (dist/), cron jobs, /admin headers
```

Inside `platform/`:

```
admin/                Dashboard (React + Tailwind v4, ReUI/shadcn + Magic UI components)
src/contract.ts       Request/response schemas shared with the front end
src/handlers/         Endpoint logic
src/lib/              Database, Stripe gateway (+ mock), email, admin auth, guards, settings
supabase/migrations/  Schema, functions, RLS
supabase/local/       Local-only stand-in for Supabase auth (never applied to Supabase)
scripts/              Dev server, migrations, admin CLIs, demo data, dashboard and site build
data/                 Camp and Miami configuration (mirrors the live site's catalog)
docs/                 Go-live checklist, API contract, Stage 1 checklist, open decisions, handoff
tests/                Acceptance tests against a real Postgres
```
