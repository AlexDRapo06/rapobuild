# Requirements checklist

Every requirement in the **Developer Brief (full scope)** and the client's
**Kickoff Information Form**, mapped to where it lives. Status key:

- ✅ built and covered by automated tests (`pnpm test`, 106 tests)
- 🟡 built; needs client info or a live account to finish
- 🔷 Ivy Devs' part (public pages); the API it needs is ready
- ⬜ not built yet

"Dashboard → X" means the admin dashboard at `/admin`.

## Brief §1–3: stages, split of work, stack

| Requirement | Status | Where |
| --- | --- | --- |
| Stage 1 data layer for everything (waitlists, waivers, discounts) | ✅ | `supabase/migrations/` |
| Payment data stored from the first registration | ✅ | `payments`, `registrations.price_cents/discount_cents` |
| Supabase (Postgres, Auth, RLS), Vercel functions + crons, Stripe webhooks, Brevo | ✅ | `api/`, `vercel.json` |
| Live checkout keeps working during migration | ✅ | New endpoints use new paths; old `api/checkout.js` payments are still recorded |
| Public pages, Miami landing page, form screens | 🔷 | See "What Ivy Devs' pages need" below |
| Agree request/response shapes in the first two days | ✅ | `docs/api-contract.md`, `src/contract.ts` |

## D1 Database and registration saving

| Requirement | Status | Where |
| --- | --- | --- |
| Schema in Supabase, migrations in the repo | ✅ | `supabase/migrations/` |
| Webhook handles `checkout.session.completed`, verifies signature | ✅ | `src/handlers/stripe-webhook.ts` |
| Idempotent: retried webhook never duplicates | ✅ | tests: webhook #1 |
| Every form field saved, including town | ✅ | `registrations` (+ `extra` for any extra field) |
| Amount, currency, discount, Stripe payment ID, status paid/refunded/partially refunded | ✅ | `payments` |
| Refund events update status | ✅ | `charge.refunded`; tests #2 |
| Contact created/updated for every registrant | ✅ | `upsert_contact()` |

## D2 Camp checkout

| Requirement | Status | Where |
| --- | --- | --- |
| Camp → sessions with dates, start time, location, ages, price, optional capacity, info text | ✅ | Dashboard → Settings → Camps & sessions |
| Several sessions and several children in one payment | ✅ | tests #3 |
| Information-only camps (BB&N) | ✅ | "Information only" switch |
| Arlington Catholic July 12 (6–13, $500), July 19 (14–18, $750) | ✅ | Kickoff Form; `data/camps.json` |
| Watertown two weeks | ✅ | From the live site: $415 per week, July 12–16 and 19–23, both weeks $830 |
| Dover and others | 🟡 | "Camps will be finalized in the next couple weeks": add in Settings |
| Add/edit a camp or session without a code change (dashboard) | ✅ | Settings → Camps & sessions; tests |
| Prices "connected to Stripe" | ✅ | Every Stripe Checkout is built from current database prices; tests prove an edited price is charged on the next checkout |

## D3 Miami combine checkout

| Requirement | Status | Where |
| --- | --- | --- |
| Separate flow and data | ✅ | `/api/miami/*`, `miami_event`, `miami_groups` |
| Boys/girls each with a hard cap, closes when full | ✅ | Settings → Miami; tests #5 |
| Kickoff Form fields (split names, age, height, weight, position, club, player email, shirt and short size; parent names, phone, email, emergency phone; street, apt, city, state, ZIP) | ✅ | `src/contract.ts`; tests |
| Access code server-side only, on/off, end date, changeable without deploy | ✅ | Settings → Access codes (hashed; never readable); tests #4 |
| Spot holds, released on `checkout.session.expired` | ✅ | tests #5 |
| Cap − paid − active holds, enforced atomically | ✅ | `reserve_miami()`; concurrency tests |
| Reserved allotment for code holders | ✅ | Kickoff Form: 200 shared; per-group also supported |
| "Full" state for the waitlist | ✅ | `GET /api/miami` → `full: true` |
| Prices, dates, wording as configuration | ✅ | Settings → Miami ($1,500; May 21–23 boys, May 24–26 girls, 4:30–8:30 PM) |
| Opens Nov 1, 10:00 AM ET; closes Mar 1, 2027 | ✅ | Settings → Miami → schedule |
| Spot limits | ✅ | 225 boys / 225 girls, as on the live site |

## D4 Private training form

| Requirement | Status | Where |
| --- | --- | --- |
| Endpoint: validation, honeypot, rate limit, optional CAPTCHA | ✅ | `POST /api/private-training`; tests #6 |
| Saved and emailed to the client's chosen address | 🟡 | Dashboard → Settings → Email → notifications address (needs the address) |
| Contact created; shows in dashboard | ✅ | Dashboard → Private training |

## D5 Admin dashboard

| Requirement | Status | Where |
| --- | --- | --- |
| At `/admin` | ✅ | |
| Supabase email + password, no public sign-up, two accounts | ✅ | Settings → Admins (invite / remove) or `pnpm admins add`; turn off sign-ups in Supabase Auth |
| Multi-factor authentication ("preferred") | ⬜ | Recommended next; Supabase supports TOTP |
| Registrations: search, filters (camp, session, town, date, Miami group, payment, waiver), sort, pagination, detail, CSV of all fields | ✅ | Dashboard → Registrations |
| Training requests, contacts, waitlists: each with search and CSV | ✅ | Dashboard pages |
| Create, edit, close camps and sessions | ✅ | Settings → Camps & sessions |
| Miami settings: caps, reserved, code on/off with end date, prices | ✅ | Settings → Miami, Access codes |
| Navigation to send email, promo codes, analytics, revenue, rosters | ✅ | Sidebar |
| Fast with ~1,000 registrations and 5,000+ contacts | ✅ | Indexed queries; client-side filtering |
| Every read through RLS; nobody else can read | ✅ | `asAdmin()`; tests #7 |
| Kickoff Form: "You and Chris get login access to view the registrations" on Nov 1 | 🟡 | Needs Chris's email and the client's Supabase |

## D6 Contact import and management

| Requirement | Status | Where |
| --- | --- | --- |
| Import from the Word document, repeatable, cleaned, validated, de-duplicated, merged, source "imported" | ✅ | Dashboard → Contacts → Import (.docx/.csv/.txt/paste); tests #9 |
| Report: imported, duplicates merged, rejected with reasons | ✅ | Preview + result report |
| Consent status; imported start "unknown"; sends exclude unknown by default | ✅ | Contacts page; "Mark as agreed" per import |
| Registrants, training requests, waitlist auto-added with town | ✅ | |
| Unsubscribed never emailed | ✅ | tests |
| Real contact list | 🟡 | Kickoff Form: "don't need right now"; Ivy Devs runs the real import |

## D7 Segmented email sending

| Requirement | Status | Where |
| --- | --- | --- |
| Brevo, paid plan, client's account | 🟡 | Needs the client's API key (Settings → Email shows plan and credits) |
| Contacts synced with town, camps, source; unsubscribes synced both ways via webhooks | ✅ | Per-send Brevo list with TOWN/SOURCES/PROGRAMS; `/api/email/brevo-webhook`; our unsubscribes push to Brevo's blocklist |
| Choose a segment (camp, session, town, everyone, combinations) with count and exclusion reasons | ✅ | Dashboard → Send email |
| Template, subject, body, test to yourself, send, log | ✅ | Campaign template; Email history |
| Server-side sending, key only on the server | ✅ | |
| Unsubscribe link and mailing address in every marketing email | ✅ / 🟡 | Enforced (send is blocked without an address); needs the address |
| SPF, DKIM, DMARC + deliverability check | 🟡 | Settings → Email lists Brevo's exact records and checks live DNS; Ivy Devs adds them |

## D8 Automatic parent emails

| Requirement | Status | Where |
| --- | --- | --- |
| Confirmation right after saving, with camp/session, dates, location, start time, info; Miami details | ✅ | tests #12 |
| Reminders 7 and 1 days before, configurable per camp, never twice, skip refunds | ✅ | Per-session "Reminder emails"; Miami setting; tests #12 |
| Transactional (ignores marketing unsubscribe), reply-to | ✅ | Settings → Email |

## D9 Waitlists

| Requirement | Status | Where |
| --- | --- | --- |
| Waitlist form when full (name, email, phone, town, session/group, spots), ordered | ✅ | Site's camp and Miami forms; `POST /api/site/waitlist` (or `POST /api/waitlist` for other front ends) |
| Freed spot (refund, cancellation, expired hold, capacity increase) → email next family with time-limited link, spot held | ✅ | Daily cron + immediate on refund/expiry/cancel/edit; tests #13 |
| Hold length configurable (48h default) | ✅ | Settings → Discounts → Waitlist hold |
| Dashboard: ordered list, manual "notify next", remove | ✅ | Dashboard → Waitlist |
| Unused hold passes to the next family | ✅ | tests #13 |

## D10 Promo codes, early-bird, sibling discount

| Requirement | Status | Where |
| --- | --- | --- |
| Promo codes: create/disable, % or $, scope (all/camp/session/Miami), usage limit, per-family limit, dates | ✅ | Settings → Discounts & promo codes; server-checked equivalent of Stripe promotion codes; tests #14 |
| Early-bird price until a date | ✅ | Per session |
| Sibling discount on the 2nd+ child, configurable | ✅ / 🟡 | Amount TBC by the client |
| Discount and code recorded on the payment | ✅ | |

## D11 Analytics

| Requirement | Status | Where |
| --- | --- | --- |
| Over time (daily, weekly), by camp/session, top towns, Miami fill vs cap, totals | ✅ | Dashboard → Analytics |
| Date range, charts + tables, CSV export, paid only | ✅ | |
| Drill-down | ✅ | Click any bar/row → filtered Registrations |
| Totals match the registrations table | ✅ | tests #15 |

## D12 Payment status and revenue

| Requirement | Status | Where |
| --- | --- | --- |
| Payment status on every registration | ✅ | Registrations page |
| Revenue by camp, session, Miami group for a range: gross, discounts, refunds, net; CSV | ✅ | Dashboard → Revenue |
| Reconcile with Stripe; documented | ✅ | Note on the Revenue page; tests #15 |
| Refunds and cancellations list ("retractions") | ✅ | Revenue → Refunds & cancellations; cancel/restore a registration in its detail panel |

## D13 Waivers

| Requirement | Status | Where |
| --- | --- | --- |
| Required checkbox + text at checkout for camps and Miami | ✅ / 🔷 | Settings → Waivers (publish + require) |
| Stored with timestamp, version, typed name; versions immutable | ✅ | tests #16 |
| Status in dashboard and rosters | ✅ | |
| "Waiver not collected" flag if wording isn't ready | ✅ | |
| Waiver wording | 🟡 | Promised Oct 23; not received |

## D14 Rosters

| Requirement | Status | Where |
| --- | --- | --- |
| Per session and Miami group: name, age, parent and phone, waiver, payment, check-in box, notes; by last name; header with camp, dates, count | ✅ | Dashboard → Rosters |
| Prints on letter paper; never height, weight or address | ✅ | tests #17 |

## D15 Email templates

| Requirement | Status | Where |
| --- | --- | --- |
| Confirmation, reminder, campaign (waitlist reuses campaign); responsive HTML + plain text; placeholders | ✅ | `src/email/templates.ts` |
| Logo, colors, fonts | 🟡 | Logo promised Oct 26; set Settings → Email → logo URL. Wordmark until then |
| Tested in Gmail, Apple Mail, Outlook with screenshots | ⬜ | Needs the live Brevo account |

## D16 Security, testing, handoff

| Requirement | Status | Where |
| --- | --- | --- |
| §10 security list (RLS default-deny, server-only keys, server-side code/caps/discounts, signed idempotent webhooks, rate limits, no PII in logs, backups, unsubscribe, sensitive fields kept off rosters) | ✅ | Tests cover each |
| Acceptance checklist run end to end in Stripe test mode | 🟡 | All 19 checks have automated equivalents; the live test-mode run needs the client's Stripe |
| Handoff document | ✅ | `docs/handoff.md` |
| README with every env var | ✅ | |
| Two admin accounts | 🟡 | Alex's email known; Chris's needed |

## Brief §9 environments

| Requirement | Status |
| --- | --- |
| Staging with Stripe test mode and fake data | 🟡 Needs the client's Vercel/Supabase invites (yours are personal accounts) |
| Fake data only in development | ✅ `pnpm demo:data` |

## Kickoff Information Form

| Item | Status |
| --- | --- |
| Miami price $1,500 (both), dates/times per group, opens Nov 1 10 AM, closes Mar 1, 200 reserved, description, required fields | ✅ |
| Spot limits (250/250 vs 450 total) | ✅ 225/225 from the live site |
| Access code | ✅ Set by Ivy Devs in Settings → Access codes (never stored in the repo) |
| Arlington Catholic pairing | ✅ |
| Watertown dates/booking | ✅ From the live site: $415 per week, both weeks $830 (two registrations) |
| BB&N info only | ✅ |
| Contact list, mailing address, consent description | 🟡 Section D blank |
| Accounts in the client's name with invites | 🟡 Form shows invites failed; a password was written instead (don't use it) |
| Stage 1 checklist by Oct 28 | ✅ `docs/stage-1-checklist.md` |

## The live site (footyup.net, repo `rapobuild`)

| Requirement | Status |
| --- | --- |
| Site's camp and Miami forms save to Supabase and show in the dashboard | ✅ `/api/site/checkout` |
| Miami access-code gate uses the dashboard's codes and schedule | ✅ `/api/site/camp-access` |
| Private training packages bought on the site show in the dashboard | ✅ Training → Packages bought; Revenue |
| Private training inquiries save, add a contact and email the coaches | ✅ `/api/site/inquiry` (replaces Telegram) |
| Site prices follow the dashboard | ✅ `/api/site/catalog` |
| Payments from the site's current checkout reach the dashboard before the switch | ✅ Webhook reads the site's Stripe metadata; `pnpm stripe:backfill` imports earlier ones |
| Fields the brief requires that the site's forms didn't ask (camp parent phone; Miami short size, emergency phone; training town and player names; waiver) | ✅ On the site's forms |
| Waitlist form when full, and offer links | ✅ The camp and Miami forms turn into the waitlist; `/?waitlist=…` opens the held spot |
| Stripe promotion codes keep working, and discounts reconcile per program | ✅ |
| Site and back end deploy together; rollback is one click | ✅ One Vercel project from the `rapobuild` repo; Vercel's Instant Rollback restores the previous deployment |

## Other front ends (🔷)

The site above uses `/api/site/*`. A new or rebuilt front end can use the general
API instead; all shapes are in `docs/api-contract.md`.

1. Camp pages: `GET /api/camps`, then `POST /api/checkout/camp`. Show info-only camps without checkout, and the waiver checkbox when `waiverRequired`. Add an optional promo code field and a "send me Footy Up news" checkbox (`marketingOptIn`). Show the waitlist form when a session is `full`.
2. Miami page: `GET /api/miami`, then `POST /api/miami/checkout` with every Kickoff Form field. Show the access-code field (required/optional per `accessCodeRequired`/`accessCodeAccepted`), dropdowns when option lists exist, and the waitlist when a group is `full`.
3. Waitlist link page: read `?waitlist=<token>`, call `GET /api/waitlist?token=…` to prefill, then checkout with `waitlistToken`.
4. Private training form: `POST /api/private-training`, with a hidden `website` honeypot field.
5. Success and cancel pages at the configured paths.
6. If the pages are served from a different domain than the API, list it in `CORS_ALLOWED_ORIGINS`.
