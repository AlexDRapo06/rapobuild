# Footy Up: Stage 1 Checklist

For Alex Rapo and Chris Calden. This is the short list of what must work before
Miami registration goes live on **Sunday, November 1, 2026 at 10:00 AM**. Every
item is tested with Stripe test payments and made-up families. No real card
is charged and no real family data is used.

When every box is ticked on the staging site, Ivy Devs switches the live site over.

## 1. Miami combine checkout

- [ ] The Miami page shows the combine description, the boys dates (May 21–23,
      4:30–8:30 PM) and the girls dates (May 24–26, 4:30–8:30 PM), and the price ($1,500).
- [ ] A family can register a player with every field from your Kickoff Form:
      player first and last name, age, height, weight, primary position, current club,
      player email, shirt size and short size; parent first and last name, phone, email
      and emergency phone; shipping street, apartment, city, state and ZIP.
- [ ] Leaving out a required field shows a clear message and does not take payment.
- [ ] A test payment completes and the registration appears in the dashboard
      within a minute, with every field saved.
- [ ] Boys and girls are counted separately. When a group is full, its checkout closes
      and the page offers the waitlist instead.
- [ ] Two families trying to take the last spot at the same moment: only one gets it.
- [ ] A family who starts checkout but doesn't pay gets their spot released automatically.
- [ ] Before 10:00 AM on November 1, nobody without the access code can register.
- [ ] The host-school access code unlocks the spots reserved for host-school families.
      A wrong code is refused. The code is never visible in the website's code.
- [ ] Registration closes automatically on March 1, 2027.

## 2. Summer camp checkout

- [ ] Arlington Catholic shows two weeks: July 12 (ages 6–13, $500) and July 19
      (ages 14–18, $750).
- [ ] A parent can register two children, or one child for both weeks, in one payment,
      and each registration lands under the right week.
- [ ] BB&N shows information only, with no checkout.
- [ ] The current camp checkout on footyup.net keeps working until the switch-over.

## 3. Private training form

- [ ] A request from the website is saved and shows in the dashboard.
- [ ] You receive an email for each new request at the address you choose.
- [ ] Spam (a bot filling the form, or many submissions in a row) is blocked.

## 4. Your dashboard login

- [ ] Alex and Chris each receive an invite email, choose a password and can sign in.
- [ ] You can see every registration, filter by camp, Miami group, town, payment and
      date, open one to see all its details, and export to a spreadsheet (CSV).
- [ ] The overview shows how many boys and girls spots are paid, in checkout, and left.
- [ ] Private training requests and the waitlist each have their own page.
- [ ] Nobody else can see any of this. Signed-out visitors and other accounts see nothing.

## 5. Payments and records

- [ ] A refund in Stripe shows as refunded (or partly refunded) in the dashboard,
      and a refunded Miami registration frees its spot.
- [ ] Stripe sending the same payment notice twice never creates a duplicate.

## What we still need from you for November 1

| Item | Why it matters |
| --- | --- |
| Spot limits per group (the form says 450 total; neither box is ticked) | Sets when each group closes |
| How the 200 host-school spots work (shared across boys and girls, or split?) and until when they're held | Sets how many spots the public can take |
| Whether host-school families can register before 10:00 AM on November 1 | Sets early access for code holders |
| Chris's email address | His dashboard invite |
| The email address that should receive private training requests | Notifications |
| Shirt and short size options, and position options (or free text) | Makes apparel orders consistent |
| Waiver wording | Until it arrives, Miami registrations are marked "waiver not collected" so you can follow up |

Questions: Viraj Shah, Ivy Devs, 781-468-8645.
