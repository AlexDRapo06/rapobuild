# Sending email with Brevo: setup and day-to-day

The dashboard sends through the client's Brevo account. Brevo does the
delivering, unsubscribe pages and bounce handling; the dashboard decides who
gets what and keeps the records.

## One-time setup (about 30 minutes, plus DNS time)

1. **Brevo account in the client's name.** Pick a paid plan that covers the
   list: the Starter plan with 20,000 emails/month suits a 5,000-parent list
   (the free plan caps at about 300 emails/day). Invite the developer as a user.
2. **API key.** Brevo → your name (top right) → SMTP & API → API keys →
   Generate. Copy it straight into Vercel → Project → Settings → Environment
   Variables as `BREVO_API_KEY`. Don't paste it into chats or documents.
3. **Sender.** Brevo → Senders, domains & dedicated IPs → Senders → Add
   `hello@footyup.net` (or whichever address the client wants). Set the same
   address as `EMAIL_FROM` and the name as `EMAIL_FROM_NAME` in Vercel.
4. **Domain authentication.** In the dashboard, open Settings → Email →
   "Add footyup.net to Brevo". The exact SPF, DKIM and DMARC records appear in
   the table. Click "Copy all records for Ivy Devs" and send them; Ivy Devs adds
   them at the domain registrar (Build Agreement §4). When they're live, click
   "Ask Brevo to re-check". The live DNS check on the same page turns green as
   each record appears.
5. **Unsubscribe sync.** Make up a long random secret and set it in Vercel as
   `BREVO_WEBHOOK_SECRET`. In Brevo, add a webhook for marketing *and*
   transactional email pointing at the URL shown in Settings → Email (with the
   secret in place of the placeholder). Tick Unsubscribed, Hard bounce and
   Spam/complaint.
6. **Footer and replies.** In Settings → Email, fill in the business mailing
   address (required: sends are blocked without it), the reply-to address and
   where private training requests should go. Redeploy so Vercel picks up the
   new environment variables.

## Sending a campaign

1. **Contacts → Import contacts.** Upload the Word document (or a CSV), choose
   whether they've agreed to emails, click **Preview import**, check the counts
   and rejected rows, then **Import**. Running the same file again is safe.
2. **Send email.** Tick who it's for: any mix of camps, sessions, Miami boys or
   girls, towns, and how people joined. The big number is how many will receive
   it. Below that is who's left out and why (unsubscribed, unknown consent,
   bounced).
3. Write the subject and message. `{{first_name}}` adds each person's first
   name. Check the preview on desktop and phone.
4. **Send me a test.** It goes only to the signed-in admin. Check it in your
   inbox.
5. **Send to N**, then confirm. It goes out through Brevo immediately and is
   logged in **Email history** with the audience, count, exclusions and who sent it.

## Automatic emails (no action needed)

- **Confirmation:** right after each payment, with every child, program, date,
  time, location and info text. Miami confirmations include the shipping address.
- **Reminders:** 7 and 1 days before the first day (change per session in
  Settings → Camps; Miami uses 7 and 1).
- **Waitlist offers:** when a spot opens, the next family gets a link and the
  spot is held (48 hours by default).

These are transactional, so they still go to people who unsubscribed from
marketing. Turn confirmations or reminders off in Settings → Email.

## Testing without Brevo

Locally (`pnpm dev`), nothing is delivered. Every email is captured at
http://localhost:4319/__mock/outbox, including working unsubscribe links.
