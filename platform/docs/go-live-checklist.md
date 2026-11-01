# Footy Up go-live checklist

Everything left to finish the Footy Up registration platform, written for a
person to do by hand. Do the parts in order; each step says who has the access.

**Status, Sun Nov 1, 3:00 PM ET** (✅ done · ⬜ to do · ⚠️ urgent)

| | What | Who |
| --- | --- | --- |
| ⚠️ | **Step 1: upgrade Vercel to Pro. The trial ends today, Nov 1, at 7:18 PM ET.** | Whoever pays for the FootyUP team |
| ⬜ | Step 2: Supabase login settings (sign-ups are still on) | Alex |
| ⬜ | Steps 3–4: add Alex and Chris as admins, then remove `test@test.com` | Reid, after step 2 |
| ✅ | Step 5: pull request #1 is open. Re-push it to include today's fixes (step 5). | Reid |
| ⬜ | Step 8: Miami access code (none entered yet) | Viraj or Alex |
| ⬜ | Step 9: confirm the Miami settings and the open Miami decisions in **To do** | Reid with Alex |
| ⬜ | Step 10: waiver wording (none published) | Footy Up |
| ⬜ | Steps 11–13: Brevo TXT record at Wix, then the `no-reply@footyup.net` sender. Until then, emails go from Footy Up's verified sender (`FootyUP <alexdimitrirapo@gmail.com>`), and the new permanent Brevo key is in. | Wix login holder, then Reid |
| ⬜ | Step 14: real mailing address, training-alert inbox, logo. Reply-to is set to `footyupp@outlook.com`. | Reid with Alex |
| ✅ | Step 15: test data cleared | Done Nov 1 |
| ✅ | Step 16: Stripe live secret key and live webhook are in. The dashboard confirms live mode. Check ACH is off. | Done Nov 1 |
| ✅ | Step 17: test mode off; emails go to everyone | Done Nov 1 |
| ⬜ | Steps 18–25: the switch (set address, redeploy, Wix TXT records, checks, real-card test, backfill, merge) | Reid, after Ivy Devs signs off |

**Where things are today**

| What | Address |
| --- | --- |
| Live website (old version, until step 20) | https://www.footyup.net, from Alex's personal Vercel project `rapobuild` |
| The new system (live mode; not on footyup.net until step 20) | https://footyup-platform.vercel.app (dashboard at `/admin`) |
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

## Part 2: Code and project (now)

**How it's set up:**
- The site and back end are one app in one repo (`AlexDRapo06/rapobuild`), deployed as one Vercel project: **footyup-platform** in the FootyUP team.
- footyup-platform already has every key, the Stripe webhook and the scheduled jobs.
- `www.footyup.net` and `footyup.net` are already added to footyup-platform as **pending**. The live site keeps running the old version from Alex's personal Vercel project until the Wix record in step 20 is added.

5. ✅ **Pull request #1 is open** (from `ReidT205/rapobuild`, branch `platform-integration`).
   - The Vercel bot comment and the red ✕ on it come from Alex's old project trying to build a preview. Ignore them and don't click "authorize it".
   - **Keep it up to date:** in Terminal, inside your `rapobuild` folder, run:
     ```bash
     git checkout main
     git fetch "$HOME/Library/Application Support/Cursor/AgentStores/cursor_agent_stores/bc-53f0c4d2-07d0-440f-a3f8-d2ec82efaf04/files/artifacts/rapobuild-platform-integration.bundle" +platform-integration:platform-integration
     git push fork platform-integration
     ```
6. **Don't merge it yet.** Merge it in step 25, after the switch. If it's merged before the switch, Alex's old project rebuilds with code it has no keys for, and checkout on footyup.net breaks.
7. **Optional: deploy from GitHub automatically.** footyup-platform → **Settings → Git** → **Connect Git Repository** → `AlexDRapo06/rapobuild`, branch `main`, Root Directory empty. Vercel asks Alex to approve its GitHub app on the repo once.
   - Until then, a FootyUP team member deploys from a checkout of the repo with `npx vercel deploy --prod`.

## Part 3: Miami settings

8. **Access code** (Viraj or Alex only, never shared with anyone else): Dashboard → **Settings → Access codes** → add the code, with its end date if there is one.
9. **Check Settings → Miami:**
    - price $1,500;
    - boys May 21–23 and girls May 24–26, 4:30–8:30 PM;
    - opens Nov 1, 10 AM ET; closes Mar 1, 2027;
    - limits 225 boys / 225 girls;
    - 200 reserved for code holders.
10. **Waiver** (when Footy Up sends the wording): Dashboard → **Settings → Waivers** → publish it and turn on "required". The checkbox then appears on the camp and Miami forms by itself.

## Part 4: Email

11. **Finish authenticating footyup.net in Brevo** (needs the footyup.net login at **Wix**, where its DNS is managed):
    - Status on Nov 1: footyup.net is added in Footy Up's Brevo account, and its DKIM, DMARC and SPF records are already live at Wix. The only thing missing is Brevo's ownership code for this account.
    1. In Wix → **Domains → footyup.net → Manage DNS records → TXT → Add record**:
       - Host: `@` (or leave empty)
       - Value: `brevo-code:fa93e36266e5a8c9ede46626470b2489`
       - Keep the existing `brevo-code:941db…` TXT record and the SPF record. Add this one next to them; don't replace anything.
    2. Wait about 30 minutes. Then go to Dashboard → **Settings → Email** → **Authenticate domain** (or Brevo → **Senders, Domains & Dedicated IPs → Domains → footyup.net → Authenticate**).
12. **Add the sender.** Brevo → **Senders** → add `no-reply@footyup.net` (or `hello@footyup.net`) with name "Footy Up".
    - footyup.net has no mailbox, so set a **Reply-to address** in step 14. Otherwise parents' replies go nowhere.
13. **Use it.** **footyup-platform → Environment Variables**: set `EMAIL_FROM` to that address, then redeploy. Dashboard → **Settings → Email** → **Check again** should show all records passing.
14. **Fill in Dashboard → Settings → Email:**
    - **Mailing address:** Footy Up's business address. It's required in every marketing email; it's a "[TEST]" placeholder now.
    - **Notifications address** (private training alerts): Footy Up's inbox. It's Reid's Gmail now.
    - ✅ **Reply-to address:** set to `footyupp@outlook.com` (Nov 1), the contact address used on the website.
    - **Logo URL**, when the logo is ready.

## Part 5: Go live and switch footyup.net (one sitting, only after Ivy Devs signs off)

Adding the Wix record in step 20 makes footyup.net run the new system within minutes. Steps 15–17 are done. Do 18–19 right before 20.

15. ✅ **Clear the test data.** Done Nov 1: all test registrations, payments, inquiries, contacts and email history were cleared. Camps, sessions, Miami settings, admins and settings were kept.
16. ✅ **Stripe live mode.** Done Nov 1: the live secret key (`Footy Up platform`) and the live webhook signing secret are in Vercel, and the dashboard confirms live mode. Only step 4 below is unconfirmed. For reference, the setup was:
    1. **Developers → API keys** → copy the live **Secret key** (`sk_live_…`). In **footyup-platform → Settings → Environment Variables**, edit `STRIPE_SECRET_KEY` and replace its value.
    2. **Developers → Webhooks → Add destination**:
       - events from **Your account**;
       - events `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `charge.refunded`;
       - type **Webhook endpoint**;
       - URL `https://footyup-platform.vercel.app/api/stripe/webhook`. It works before and after the domain switch, so no payment is missed in between. Don't use `www.footyup.net` until step 20 is done; until then that address is still the old site.
    3. Copy its **Signing secret** (`whsec_…`) and replace the value of `STRIPE_WEBHOOK_SECRET`.
    4. **Settings → Payment methods**: turn off **ACH Direct Debit** (Link's instant "Bank" option can stay).
17. ✅ **Turn off test mode.** Done Nov 1: `FOOTYUP_STAGING` and `EMAIL_TEST_RECIPIENTS` were deleted. Emails go to every real recipient through Footy Up's Brevo account.
18. **Set the address** (right before step 20). **footyup-platform → Settings → Environment Variables**: set `PUBLIC_SITE_URL` to `https://www.footyup.net`.
19. **Redeploy:** Vercel → footyup-platform → **Deployments** → the top deployment → **⋯** → **Redeploy**. Wait for **Ready**.
20. **Switch footyup.net** (needs the Wix login):
    1. Wix → **Domains → footyup.net → Manage DNS records → TXT → Add record**.
       - Host: `_vercel`
       - Value: `vc-domain-verify=www.footyup.net,53d7f6f32cdbaec48b5d`
    2. Add a second TXT record, also with Host `_vercel`:
       - Value: `vc-domain-verify=footyup.net,e5a0726591e34733c96f`
    3. Don't change the existing A and CNAME records. They already point at Vercel.
    4. In Vercel → footyup-platform → **Settings → Domains**, both should change from "Verification Needed" to **Valid Configuration**, usually within 5–30 minutes. Click **Refresh** to check sooner.
21. **Reconnect the unsubscribe sync.** Dashboard (https://www.footyup.net/admin) → **Settings → Email** → **Keep unsubscribes in sync** → **Reconnect**. Both cards should say Connected.
22. **Check the site:**
    - https://www.footyup.net loads, and a camp page shows the Parent Phone field.
    - https://www.footyup.net/admin opens the dashboard.
    - A test private training inquiry appears in the dashboard under Private training.
23. **Final check with a real card:**
    1. Register one real camp spot on www.footyup.net.
    2. Confirm it shows in **Registrations** and the confirmation email arrives.
    3. Refund it in Stripe and confirm the dashboard shows "refunded".
24. **Bring in payments the old checkout took** (developer): `pnpm stripe:backfill --since 2026-09-01`, then the same with `--apply`. It needs the live Stripe key and the database URL in `platform/.env`.
25. **Merge pull request #1** on GitHub.
    - Then delete the fork `ReidT205/rapobuild` (its **Settings → Delete this repository**). The Build Agreement says no private copies of client code.
    - Alex can delete his old Vercel project **rapobuild** after a week.

## If something goes wrong

- **A deploy broke something:** Vercel → **footyup-platform → Deployments** → the last good deployment → **⋯** → **Promote to Production** (Instant Rollback). It takes seconds.
- **The new system has a problem right after the switch:** Alex adds `www.footyup.net` and `footyup.net` back to his old **rapobuild** project. Vercel shows him a `_vercel` TXT value to add at Wix, and once it's added the old version is live again. Don't merge pull request #1 until this is settled, so his old project still has the old code.
- **Settings and how-tos:** `docs/handoff.md` (adding a camp, changing the Miami code, sending email, rosters, backups).
- **Changing the domain later:** `docs/changing-the-domain.md`.
