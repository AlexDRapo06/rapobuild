# Changing the domain (e.g. to footyup.net)

Everything families and admins see runs on **one address: the website's**.
The website forwards `/admin`, the dashboard API, unsubscribe links, Brevo's and
Stripe's webhooks and the test checkout to the platform behind it (the rewrites
in the site's `vercel.json`, from `integration/rapobuild/`). So a domain change
only touches the things below.

Today (staging):

| What | Address |
| --- | --- |
| Website | https://footyup-site.vercel.app |
| Dashboard | https://footyup-site.vercel.app/admin |
| Platform (behind the site) | https://footyup-platform.vercel.app |

## Steps

1. **Point the domain at the website.**
   - In Vercel, open **FootyUP → footyup-site → Settings → Domains** and add `footyup.net` (and `www.footyup.net`).
   - Vercel then lists the DNS records. Ivy Devs adds them at the registrar. If the domain is still attached to the old site project, remove it there first.
2. **Tell the platform its new address.**
   - In **FootyUP → footyup-platform → Settings → Environment Variables**, set `PUBLIC_SITE_URL` to `https://www.footyup.net`, then redeploy.
   - That one setting moves:
     - the dashboard link (`/admin/`);
     - admin invite links;
     - email unsubscribe links;
     - the test checkout;
     - the pages families return to after paying.
   - Don't set `PUBLIC_ADMIN_URL` or `PUBLIC_API_URL`. Left empty, they follow `PUBLIC_SITE_URL`.
3. **Supabase login links** (the FootyUP org owner): in **Authentication → URL Configuration**, set **Site URL** to `https://www.footyup.net/admin/` and add it under **Redirect URLs**.
4. **Brevo unsubscribe sync:** in the dashboard, go to **Settings → Email → Keep unsubscribes in sync** and press **Reconnect**. Both cards should say Connected.
5. **Stripe** (once live keys are in): in Stripe's webhook settings, change the endpoint to `https://www.footyup.net/api/stripe/webhook`.
6. **Sending email from the domain:**
   - Once Ivy Devs adds Brevo's DNS records (Settings → Email lists them), set `EMAIL_FROM` to e.g. `no-reply@footyup.net` on the platform and redeploy.
   - Then press **Check again** in Settings → Email.

## What doesn't change

- The database, the dashboard's data, admins and their passwords.
- The website's own code. Its `PLATFORM_API_URL` keeps pointing at the platform.
- Brevo and Stripe keys.

## If the platform gets its own domain too (optional)

If you later give the platform an address like `app.footyup.net`:

1. Replace `footyup-platform.vercel.app` in the site's `vercel.json` rewrites.
2. Update the site's `PLATFORM_API_URL` to the new address.
3. Redeploy the site.

Families never see this address either way.
