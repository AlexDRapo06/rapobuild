# Open decisions, access and dates

Sources, in priority order: the client's **Kickoff Information Form** (Alex Rapo,
Oct 18, 2026), the signed Build Agreement (Oct 13), and the Developer Brief.
Every undecided item is a setting, so none blocks the build.

## Dates

| Date | What happens | Source |
| --- | --- | --- |
| Wed, Oct 28 | Stage 1 Checklist sent to the client (commitment) | Kickoff Form |
| Fri, Oct 30 | Stage 1 finished (target) | Kickoff Form |
| Sat, Oct 31 | Everything finished with handoff | Build Agreement |
| **Sun, Nov 1, 10:00 AM ET** | Miami registration opens; Alex and Chris can log in to view registrations (commitment) | Kickoff Form |
| Fri, Nov 13 | Stage 2 target (dashboard, contact import, email sending) | Kickoff Form |
| Fri, Nov 27 | Stage 3 target and written handoff guide | Kickoff Form |
| Mon, Mar 1, 2027 | Miami registration closes | Kickoff Form |

The Build Agreement (developer ↔ Ivy Devs) says everything by Oct 31. The
Kickoff Form (Ivy Devs ↔ client) gives Nov 13 / Nov 27 targets. Confirm with
Viraj which dates bind the developer.

## The live site vs the Kickoff Form

`data/camps.json` and `data/miami.json` now mirror the live site (`rapobuild`,
Oct 29, 2026), because that is what families see today and what the site's
checkout charges. Where the site and the Kickoff Form (Oct 18) disagree, the
site's value is loaded and the difference is listed here. Each one is a setting
in Dashboard → Settings → Miami, so it can be changed in a minute once Alex confirms.

| Item | Live site (loaded) | Kickoff Form | Setting |
| --- | --- | --- | --- |
| When Miami opens | Nov 1 at midnight ET, **access-code holders only** until Dec 1, then everyone | Everyone at Nov 1, 10:00 AM ET | "Checkout opens", "Opens to everyone" |
| Miami price | $1,500 through Feb 1, then **$1,650** from Feb 2 | $1,500 | Price schedule |
| Miami venue | Belen Jesuit Preparatory School (the brief said Gulliver Prep) | Not filled in | Location |
| Miami closes | End of Mar 1, 2027 | Mar 1, 2027 | "Registration closes" |
| Watertown | Live: $415 per week, July 12–16 and July 19–23, both weeks $830 | $425, "both weeks" | Settings → Camps |
| Other camps | Veterans Day (Canton, closes Nov 11, 9 AM), Winter (Walpole), Rivier, Union Point, Brandeis, plus BB&N (info only) | Not listed | Settings → Camps |
| Promo codes | Stripe's promotion-code box on every checkout | Not mentioned | Kept: codes are managed in Stripe |
| Miami on the site | Hidden for now (`SHOW_MIAMI = false` in `src/camps.jsx`) | Opens Nov 1 | Site code |

## Decided by the Kickoff Form (now in `data/`)

| Item | Value | Where |
| --- | --- | --- |
| Miami price | $1,500 for everyone (public and host-school families); the site adds $1,650 from Feb 2 | `data/miami.json` |
| Boys dates | May 21–23, 2027, 4:30–8:30 PM | `data/miami.json` |
| Girls dates | May 24–26, 2027, 4:30–8:30 PM | `data/miami.json` |
| Opens to everyone | Kickoff Form: Nov 1, 2026, 10:00 AM ET. Loaded: the site's Dec 1 (see above) | `opensAt`, `publicOpensAt` |
| Closes | Mar 1, 2027 (set to 11:59 PM ET) | `closesAt` |
| Reserved for host-school families | 200 (one pool across both groups) | `reservedTotal` |
| Miami fields | Split names, age, height, weight, position, club, player email, shirt and short size; parent names, phone, email, emergency phone; shipping street, apt, city, state, ZIP | `src/contract.ts` |
| Description | "FOOTYUP x GOINGFORGOAT College Combine" text | `data/miami.json` |
| Arlington Catholic | July 12: ages 6–13, $500 · July 19: ages 14–18, $750 | `data/camps.json` |
| Watertown | Site: $415 per week, both weeks $830 | `data/camps.json` (open, as on the site) |
| Contact list | "Don't need right now" | Stage 2 |
| Chris's full name | Chris Calden | — |

## Still open: questions for Viraj and the client

| # | Question | Built as | Current value | Needed by |
| --- | --- | --- | --- | --- |
| 1 | ~~Spot limits~~ Answered by the site: 225 boys / 225 girls | `groups[].cap` | 225 / 225 | — |
| 2 | **Reserved 200.** Shared across boys and girls (as built), or split (e.g. 100/100)? Are unused reserved spots ever released to the public, and when? | `reservedTotal` / per-group `reservedForCodeHolders`, `reservedUntil` | 200 shared, held until close | Nov 1 |
| 3 | **Early access.** The site gives code holders Nov 1–30 before the public on Dec 1; the Kickoff Form says everyone on Nov 1. Which one? | `opensAt` / `publicOpensAt` | The site's schedule | Nov 1 |
| 4 | ~~Location~~ Answered by the site: Belen Jesuit Preparatory School | `event.location` | Belen Jesuit | — |
| 5 | ~~Size and position options~~ Answered by the site (Youth L–Adult XXL; 8 positions). Short sizes use the same list; confirm | `shirtSizes`, `shortSizes`, `positions` | The site's lists | Nov 1 |
| 6 | **Chris's email** for his dashboard invite | `pnpm admins add` | — | Nov 1 |
| 7 | **Who receives private training emails** | setting `notify_email` | — | Nov 1 |
| 8 | **Waiver wording** (promised Oct 23) | `pnpm waiver add` | None: registrations flagged "not collected" | Nov 1 if possible |
| 9 | ~~Watertown~~ Answered by the site: $415 per week, July 12–16 and 19–23, bookable together for $830 | `data/camps.json` | Open | — |
| 10 | Arlington Catholic daily start time and session info text | `data/camps.json` | 9:00 AM placeholder | Before AC opens |
| 11 | ~~Ages accepted for Miami~~ Answered by the site: 14–18 | group ages | 14–18 | — |
| 12 | Business mailing address and how contacts agreed to be emailed (Section D blank) | settings | — | Stage 2 |

## Accounts (Kickoff Form, Section A)

| Account | Status from the form | What it means |
| --- | --- | --- |
| Vercel "FootyUP" | Pro and invites not ticked | Need an invite to the FootyUP team to deploy |
| Supabase "FootyUP" | Invite "won't work"; the form contains a login password instead | **Don't use the password** (Build Agreement §8–9 and the form itself say never share passwords). Ask Alex to retry the invite or have Viraj create the project and invite you. The password should be changed. |
| Brevo "FootyUP" | Same | Same: needs an invite; the password should be changed |
| Stripe "footyup" | Invite not ticked | Need a Stripe team invite (test mode for Stage 1) |
| Domain | Registrar not filled in | Ivy Devs adds DNS records (Build Agreement §4) |

The access code was written into the form. Per the Build Agreement the developer
never handles the real code: Ivy Devs sets it with `pnpm miami code add`. It isn't in this repo.

## Who to ask

Viraj Shah (781-468-8645), Ishan as backup.
