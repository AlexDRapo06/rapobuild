# Changing the domain

The website, the dashboard (`/admin`) and the API are **one Vercel project**,
built from the `rapobuild` repo. A domain change only touches the things below.

Today:

| What | Address |
| --- | --- |
| Live website (old version, until the switch) | https://www.footyup.net, from Alex's personal Vercel project `rapobuild` |
| Staging (website + dashboard + API) | https://footyup-platform.vercel.app, dashboard at `/admin` |
| Vercel project | FootyUP team → `footyup-platform` |

## Steps

1. **Point the domain at the project.**
   - In Vercel, open **FootyUP → footyup-platform → Settings → Domains** and add `www.footyup.net`, plus `footyup.net` set to redirect to `www.footyup.net`.
   - If the domain is still attached to another Vercel project, remove it there first.
   - If Vercel shows DNS records or a verification record, add them where the domain's DNS is managed.
2. **Tell the project its address.**
   - In **footyup-platform → Settings → Environment Variables**, set `PUBLIC_SITE_URL` to `https://www.footyup.net`, then redeploy.
   - That one setting moves:
     - the dashboard link (`/admin/`);
     - admin invite links;
     - email unsubscribe links;
     - the test checkout;
     - the pages families return to after paying.
   - Don't set `PUBLIC_ADMIN_URL` or `PUBLIC_API_URL`. Left empty, they follow `PUBLIC_SITE_URL`.
3. **Supabase login links** (the FootyUP org owner): in **Authentication → URL Configuration**, set **Site URL** to `https://www.footyup.net/admin/` and add it under **Redirect URLs**.
4. **Brevo unsubscribe sync:** in the dashboard, go to **Settings → Email → Keep unsubscribes in sync** and press **Reconnect**. Both cards should say Connected.
5. **Stripe:** in Stripe's webhook settings, set the endpoint to `https://www.footyup.net/api/stripe/webhook`.
   - Include the `www`. `footyup.net` without it redirects, and Stripe doesn't follow redirects.
6. **Sending email from the domain:**
   - Once Brevo's DNS records are added (Settings → Email lists them), set `EMAIL_FROM` to e.g. `hello@footyup.net` and redeploy.
   - Then press **Check again** in Settings → Email.

## What doesn't change

- The database, the dashboard's data, admins and their passwords.
- The code.
- The Brevo and Stripe keys.
