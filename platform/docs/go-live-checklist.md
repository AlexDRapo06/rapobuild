# Footy Up go-live checklist

Everything left to finish the Footy Up registration platform, written for a
person to do by hand. Do the parts in order; each step says who has the access.

**Where things are today**

| What | Address |
| --- | --- |
| Live website (old version, until step 9) | https://www.footyup.net, from Alex's personal Vercel project `rapobuild` |
| Staging: website + dashboard + API in one | https://footyup-platform.vercel.app (dashboard at `/admin`) |
| Code | GitHub `AlexDRapo06/rapobuild`: the site at the root, the back end in `platform/`, functions in `api/` |
| Vercel project | FootyUP team → `footyup-platform`. This becomes the one project for footyup.net |
| Supabase project | FootyUP org → "FootyUP Project" |
| Stripe | Footy Up account; the Sandbox is set up and tested |

The only dashboard login right now is the temporary test admin `test@test.com`
(Reid has the password). It gets removed in step 4.

"Redeploy" always means: Vercel → FootyUP → **footyup-platform** →
**Deployments** → the top deployment → **⋯** → **Redeploy**. Environment
variable changes only take effect after a redeploy.

---

## Part 1: Accounts (before Miami opens Sunday, Nov 1, 10 AM ET)

1. **Upgrade Vercel to Pro.** Vercel → FootyUP team → **Settings → Billing** → upgrade. The trial is ending; without Pro, deployments stop.
2. **Supabase login settings** (needs the Supabase org owner, Alex):
   1. Supabase → FootyUP Project → **Authentication → URL Configuration**.
   2. **Site URL:** `https://www.footyup.net/admin/`
   3. **Redirect URLs:** add `https://www.footyup.net/admin/` and `https://footyup-platform.vercel.app/admin/`.
   4. **Authentication → Sign In / Providers** (or **Settings**): turn off **Allow new users to sign up**.
3. **Add the real admins.** Sign in to the dashboard → **Settings → Admins** → invite Alex's and Chris's emails. Each gets an email to set a password. This only works after step 2.
4. **Remove the test admin.** Once Alex or Chris can sign in:
   1. Dashboard → **Settings → Admins** → remove `test@test.com`.
   2. Supabase → **Authentication → Users** → delete `test@test.com`.

## Part 2: Put the new site on footyup.net

**How it's set up:**
- The site and the back end are one app, in one repo (`AlexDRapo06/rapobuild`), deployed as one Vercel project: **footyup-platform** in the FootyUP team. That project already has every key, the Stripe webhook and the scheduled jobs.
- The live site at **www.footyup.net** still runs the old version from Alex's personal Vercel project **rapobuild**. That project redeploys whenever `main` changes in the repo.
- The new code arrives as one pull request (branch `platform-integration`).

**Alex's old project must stop deploying from GitHub before the merge** (step 6). Otherwise it rebuilds with the new code, which it has no keys for, and checkout on footyup.net breaks until the domain moves. Once it's disconnected, it keeps serving today's version until step 9.

5. **Give the FootyUP Vercel team access to the repo** (Alex). In step 8, Vercel asks to install its GitHub app on `AlexDRapo06/rapobuild`, and Alex approves it.
6. **Stop the old project deploying** (Alex). In his Vercel project **rapobuild**, go to **Settings → Git** and click **Disconnect**. footyup.net keeps working on its current version.
7. **Merge the pull request** into `main` on GitHub.
   - If you want Miami visible right away, also change `const SHOW_MIAMI = false;` to `true` in `src/camps.jsx`, line 13, and commit it.
8. **Connect the FootyUP project to the repo.** FootyUP → **footyup-platform** → **Settings → Git** → **Connect Git Repository** → `AlexDRapo06/rapobuild`, production branch `main`.
   - Leave **Root Directory** empty (the repo root).
   - Don't change any settings or environment variables.
   - It deploys by itself. Wait for **Ready** under **Deployments**, then open https://footyup-platform.vercel.app and check the site and `/admin` load.
9. **Move the domain** (Alex, because it's in his personal Vercel):
   1. In **rapobuild → Settings → Domains**, remove `www.footyup.net` and `footyup.net`.
   2. In FootyUP → **footyup-platform → Settings → Domains**, add `www.footyup.net`, then `footyup.net` set to redirect to `www.footyup.net`, which is how it's set up today.
   3. If Vercel asks to verify the domain or shows DNS records, add them where the domain's DNS is managed.
   4. Keep the old **rapobuild** project for a week as a fallback, then delete it.
10. **Tell the project its address.** **footyup-platform → Settings → Environment Variables**: set `PUBLIC_SITE_URL` to `https://www.footyup.net`, then redeploy.
11. **Reconnect the unsubscribe sync.** Dashboard (now at https://www.footyup.net/admin) → **Settings → Email** → **Keep unsubscribes in sync** → **Reconnect**. Both cards should say Connected.
12. **Check the site:**
    - Open https://www.footyup.net. A camp page should show the new Parent Phone field.
    - https://www.footyup.net/admin should open the dashboard.
    - Send a test private training inquiry. It should appear in the dashboard under Private training.
13. **Clean up:** delete the Vercel project **footyup-site** in the FootyUP team. It was a staging copy and isn't used.

## Part 3: Miami settings

14. **Access code** (Viraj or Alex only, never shared with anyone else): Dashboard → **Settings → Access codes** → add the code, with its end date if there is one.
15. **Check Settings → Miami:**
    - price $1,500;
    - boys May 21–23 and girls May 24–26, 4:30–8:30 PM;
    - opens Nov 1, 10 AM ET; closes Mar 1, 2027;
    - limits 225 boys / 225 girls;
    - 200 reserved for code holders.
16. **Waiver** (when Footy Up sends the wording): Dashboard → **Settings → Waivers** → publish it and turn on "required". The checkbox then appears on the camp and Miami forms by itself.

## Part 4: Email

17. **Authenticate the domain in Brevo** (needs DNS access to footyup.net):
    1. Brevo → **Senders, Domains & Dedicated IPs → Domains** → **Add a domain** → `footyup.net`.
    2. Brevo lists the DNS records (its code, DKIM and DMARC). Add each one at the domain registrar exactly as shown.
    3. Back in Brevo, click **Verify**. It can take up to a few hours.
18. **Add the sender.** Brevo → **Senders** → add an address such as `hello@footyup.net`, with name "Footy Up".
19. **Use it.** **footyup-platform → Environment Variables**: set `EMAIL_FROM` to that address, then redeploy. Dashboard → **Settings → Email** → **Check again** should show the domain records passing.
20. **Fill in Dashboard → Settings → Email:**
    - **Mailing address:** Footy Up's business address. It's required in every marketing email; it's a "[TEST]" placeholder now.
    - **Notifications address** (private training alerts): Footy Up's inbox. It's Reid's Gmail now.
    - **Reply-to address**, if different.
    - **Logo URL**, when the logo is ready.

## Part 5: Go live (only after Ivy Devs signs off on staging)

21. **Clear the test data.** Do this before live payments start, while everything in the database is still test data. Supabase → **SQL Editor** → run:
    ```sql
    truncate public.registrations, public.payments, public.checkout_intents, public.holds,
             public.stripe_events, public.training_purchases, public.private_training_requests,
             public.waitlist_entries, public.contacts, public.contact_imports, public.email_log,
             public.rate_limits;
    ```
    It keeps camps, sessions, Miami settings, access codes, waivers, promo codes, settings and admins.
22. **Stripe live mode.** In Stripe, switch from Sandbox to the live account and repeat the Sandbox setup:
    1. **Developers → API keys** → copy the live **Secret key** (`sk_live_…`). In **footyup-platform → Environment Variables**, edit `STRIPE_SECRET_KEY` and replace its value.
    2. **Developers → Webhooks → Add destination**:
       - events from **Your account**;
       - events `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `charge.refunded`;
       - type **Webhook endpoint**;
       - URL `https://www.footyup.net/api/stripe/webhook`. Include the `www`: `footyup.net` without it redirects, and Stripe doesn't follow redirects, so payments would never reach the dashboard.
    3. Copy its **Signing secret** (`whsec_…`) and replace the value of `STRIPE_WEBHOOK_SECRET`.
    4. **Settings → Payment methods**: turn off **ACH Direct Debit** (Link's instant "Bank" option can stay).
23. **Turn off test mode.** **footyup-platform → Environment Variables**: delete `FOOTYUP_STAGING` and `EMAIL_TEST_RECIPIENTS`. Then redeploy. From now on, real payments are taken and every family gets their emails.
24. **Final check with a real card:**
    1. Register one real camp spot on footyup.net.
    2. Confirm it shows in **Registrations** and the confirmation email arrives.
    3. Refund it in Stripe and confirm the dashboard shows "refunded".
25. **Optional, developer only:** to bring in payments made on the old checkout before the switch, run `pnpm stripe:backfill --since 2026-09-01` and then the same with `--apply`. It needs the platform's env locally.

## If something goes wrong

- **A deploy broke something:** Vercel → **footyup-platform → Deployments** → the last good deployment → **⋯** → **Promote to Production** (Instant Rollback). It takes seconds.
- **The new site has a problem right after the domain move:** Alex adds `www.footyup.net` and `footyup.net` back to his old **rapobuild** project, which still serves the previous version, while the problem gets fixed.
- **Settings and how-tos:** `docs/handoff.md` (adding a camp, changing the Miami code, sending email, rosters, backups).
- **Changing the domain later:** `docs/changing-the-domain.md`.
