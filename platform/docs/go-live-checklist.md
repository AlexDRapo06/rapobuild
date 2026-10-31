# Footy Up go-live checklist

Everything left to finish the Footy Up registration platform, written for a
person to do by hand. Do the parts in order; each step says who has the access.

**Where things are today (staging)**

| What | Address |
| --- | --- |
| Live website today (old version) | https://www.footyup.net, from Alex's personal Vercel project `rapobuild` |
| Website (staging copy) | https://footyup-site.vercel.app |
| Dashboard | https://footyup-site.vercel.app/admin |
| Platform (behind the site) | https://footyup-platform.vercel.app |
| Vercel team | FootyUP (projects `footyup-site` and `footyup-platform`) |
| Supabase project | FootyUP org → "FootyUP Project" |
| Stripe | Footy Up account; the Sandbox is set up and tested |

The only dashboard login right now is the temporary test admin `test@test.com`
(Reid has the password). It gets removed in step 4.

"Redeploy the platform" always means: Vercel → FootyUP → **footyup-platform** →
**Deployments** → the top deployment → **⋯** → **Redeploy**. Environment
variable changes only take effect after a redeploy.

---

## Part 1: Accounts (before Miami opens Sunday, Nov 1, 10 AM ET)

1. **Upgrade Vercel to Pro.** Vercel → FootyUP team → **Settings → Billing** → upgrade. The trial is ending; without Pro, deployments stop.
2. **Supabase login settings** (needs the Supabase org owner, Alex):
   1. Supabase → FootyUP Project → **Authentication → URL Configuration**.
   2. **Site URL:** `https://www.footyup.net/admin/`
   3. **Redirect URLs:** add `https://www.footyup.net/admin/` and `https://footyup-site.vercel.app/admin/`.
   4. **Authentication → Sign In / Providers** (or **Settings**): turn off **Allow new users to sign up**.
3. **Add the real admins.** Sign in to the dashboard → **Settings → Admins** → invite Alex's and Chris's emails. Each gets an email to set a password. This only works after step 2.
4. **Remove the test admin.** Once Alex or Chris can sign in:
   1. Dashboard → **Settings → Admins** → remove `test@test.com`.
   2. Supabase → **Authentication → Users** → delete `test@test.com`.

## Part 2: Put the new site on footyup.net

**How it's set up today:**
- The live site is **www.footyup.net**; `footyup.net` redirects to it.
- It runs from the Vercel project **rapobuild** in **Alex's personal Vercel account**, not the FootyUP team.
- That project redeploys automatically whenever `main` changes in the GitHub repo `AlexDRapo06/rapobuild`.

The plan: give rapobuild the two settings that connect it to the back end, then merge the pull request (branch `platform-integration`). The site then redeploys already connected.

**Do steps 6–8 before step 9.** Merging redeploys the live site within a minute or two, so the settings need to be in place first.

5. **Get access to the rapobuild Vercel project.**
   - Alex's personal Vercel account most likely can't add other people; personal (Hobby) accounts have no members.
   - The clean way: Alex opens rapobuild → **Settings → General** (or **Advanced**) → **Transfer Project**, and picks the **FootyUP** team. The domain, settings and GitHub connection move with it, and it ends up on the FootyUP team's Pro plan (Vercel doesn't allow business sites on the free plan).
   - If he'd rather not transfer it, Alex does steps 6–8 himself while logged in.
6. **Make a new shared key.** On your computer, run `openssl rand -hex 32` in Terminal and copy the result. It's a password the site uses to identify itself to the back end. Keep it out of chats and docs.
7. **Add two settings to rapobuild.** rapobuild → **Settings → Environment Variables**. Add each one for Production and Preview, ticked **Sensitive**:
   - `PLATFORM_API_URL` = `https://footyup-platform.vercel.app`
   - `SITE_API_KEY` = the key from step 6
   - Leave its existing settings (Stripe key, Telegram) alone. They're the fallback if anything goes wrong.
8. **Update the platform.** FootyUP → **footyup-platform → Settings → Environment Variables**:
   - Edit `SITE_API_KEY` and set it to the same key from step 6.
   - Set `PUBLIC_SITE_URL` to `https://www.footyup.net`.
   - Redeploy the platform.
9. **Merge the pull request** into `main` on GitHub. rapobuild redeploys by itself; wait until its latest deployment shows **Ready**.
   - If you want Miami visible right away, also change `const SHOW_MIAMI = false;` to `true` in `src/camps.jsx`, line 13, and commit it.
10. **Reconnect the unsubscribe sync.** Dashboard (now at https://www.footyup.net/admin) → **Settings → Email** → **Keep unsubscribes in sync** → **Reconnect**. Both cards should say Connected.
11. **Check the site:**
    - Open https://www.footyup.net. A camp page should show the new Parent Phone field.
    - https://www.footyup.net/admin should open the dashboard.
    - Send a test private training inquiry. It should appear in the dashboard under Private training.
12. **Later, optional: deploy the platform from GitHub too.** Right now footyup-platform runs the version deployed on Oct 31.
    - To make it update from the repo: footyup-platform → **Settings → Git** → connect `AlexDRapo06/rapobuild`, branch `main`.
    - Then **Settings → Build and Deployment** → **Root Directory** = `platform`.
    - Vercel may ask Alex to approve its GitHub app on the repo.
    - The staging project `footyup-site` isn't needed after this and can be deleted.

## Part 3: Miami settings

13. **Access code** (Viraj or Alex only, never shared with anyone else): Dashboard → **Settings → Access codes** → add the code, with its end date if there is one.
14. **Check Settings → Miami:**
    - price $1,500;
    - boys May 21–23 and girls May 24–26, 4:30–8:30 PM;
    - opens Nov 1, 10 AM ET; closes Mar 1, 2027;
    - limits 225 boys / 225 girls;
    - 200 reserved for code holders.
15. **Waiver** (when Footy Up sends the wording): Dashboard → **Settings → Waivers** → publish it and turn on "required". The checkbox then appears on the camp and Miami forms by itself.

## Part 4: Email

16. **Authenticate the domain in Brevo** (needs DNS access to footyup.net):
    1. Brevo → **Senders, Domains & Dedicated IPs → Domains** → **Add a domain** → `footyup.net`.
    2. Brevo lists the DNS records (its code, DKIM and DMARC). Add each one at the domain registrar exactly as shown.
    3. Back in Brevo, click **Verify**. It can take up to a few hours.
17. **Add the sender.** Brevo → **Senders** → add an address such as `hello@footyup.net`, with name "Footy Up".
18. **Use it.** **footyup-platform → Environment Variables**: set `EMAIL_FROM` to that address, then redeploy the platform. Dashboard → **Settings → Email** → **Check again** should show the domain records passing.
19. **Fill in Dashboard → Settings → Email:**
    - **Mailing address:** Footy Up's business address. It's required in every marketing email; it's a "[TEST]" placeholder now.
    - **Notifications address** (private training alerts): Footy Up's inbox. It's Reid's Gmail now.
    - **Reply-to address**, if different.
    - **Logo URL**, when the logo is ready.

## Part 5: Go live (only after Ivy Devs signs off on staging)

20. **Clear the test data.** Do this before live payments start, while everything in the database is still test data. Supabase → **SQL Editor** → run:
    ```sql
    truncate public.registrations, public.payments, public.checkout_intents, public.holds,
             public.stripe_events, public.training_purchases, public.private_training_requests,
             public.waitlist_entries, public.contacts, public.contact_imports, public.email_log,
             public.rate_limits;
    ```
    It keeps camps, sessions, Miami settings, access codes, waivers, promo codes, settings and admins.
21. **Stripe live mode.** In Stripe, switch from Sandbox to the live account and repeat the Sandbox setup:
    1. **Developers → API keys** → copy the live **Secret key** (`sk_live_…`). In **footyup-platform → Environment Variables**, edit `STRIPE_SECRET_KEY` and replace its value.
    2. **Developers → Webhooks → Add destination**:
       - events from **Your account**;
       - events `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `charge.refunded`;
       - type **Webhook endpoint**;
       - URL `https://www.footyup.net/api/stripe/webhook`. Include the `www`: `footyup.net` without it redirects, and Stripe doesn't follow redirects, so payments would never reach the dashboard.
    3. Copy its **Signing secret** (`whsec_…`) and replace the value of `STRIPE_WEBHOOK_SECRET`.
    4. **Settings → Payment methods**: turn off **ACH Direct Debit** (Link's instant "Bank" option can stay).
22. **Turn off test mode.** **footyup-platform → Environment Variables**: delete `FOOTYUP_STAGING` and `EMAIL_TEST_RECIPIENTS`. Then redeploy the platform. From now on, real payments are taken and every family gets their emails.
23. **Final check with a real card:**
    1. Register one real camp spot on footyup.net.
    2. Confirm it shows in **Registrations** and the confirmation email arrives.
    3. Refund it in Stripe and confirm the dashboard shows "refunded".
24. **Optional, developer only:** to bring in payments made on the old checkout before the switch, run `pnpm stripe:backfill --since 2026-09-01` and then the same with `--apply`. It needs the platform's env locally.

## If something goes wrong

- **The live site has a problem after the switch:** in rapobuild → **Settings → Environment Variables**, delete `PLATFORM_API_URL` and redeploy. The site goes straight back to its original checkout, using rapobuild's own Stripe and Telegram settings, while the problem gets fixed.
- **Settings and how-tos:** `docs/handoff.md` (adding a camp, changing the Miami code, sending email, rosters, backups).
- **Changing the domain later:** `docs/changing-the-domain.md`.
