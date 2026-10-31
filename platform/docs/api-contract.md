# API contract (draft for sign-off)

How the public pages (built by Ivy Devs) talk to the backend (this repo). The
brief asks for this to be agreed in the first two days. TypeScript types and
validation for every shape below live in [`src/contract.ts`](../src/contract.ts);
the front end can copy that file to get the same types.

**Status: DRAFT v0.3** (Oct 29: promo codes, waitlist offers; Miami from the Kickoff Form). Anything here can change until both sides sign off.
After that, changes are additive only (new optional fields), or agreed in writing.

## Conventions

- All endpoints live under `/api`. Bodies are JSON. If the pages are served from a different
  domain than the API, add that domain to `CORS_ALLOWED_ORIGINS` and the API will accept browser calls from it.
- Money is integer **cents** (USD). Dates are `YYYY-MM-DD`; times are ISO 8601.
- Successful checkouts return `{ checkoutUrl, expiresAt }`. The page redirects
  the browser to `checkoutUrl` (Stripe Checkout). The parent's spot is held until `expiresAt`.
- Errors always look like this:

```json
{ "error": "group_full", "message": "This group is full. You can join the waitlist.", "details": { "group": "boys" } }
```

  `error` is a stable code to branch on; `message` is safe to show a parent;
  `details` is optional. Validation errors list each bad field:
  `details.issues = [{ "path": "players.0.age", "message": "..." }]`.

| HTTP | `error` codes |
| --- | --- |
| 400 | `validation_failed`, `invalid_json`, `captcha_failed` |
| 403 | `access_code_required`, `access_code_invalid` |
| 404 | `session_not_found`, `not_found` |
| 409 | `session_closed`, `session_full`, `camp_info_only`, `group_full`, `group_closed`, `registration_not_open` |
| 413 | `payload_too_large` |
| 422 | `waiver_required` (with `details.currentWaiverId`), `promo_invalid` (message says why: expired, used up, doesn't apply) |
| 409 | `waitlist_offer_invalid` (offer expired or doesn't match) |
| 429 | `rate_limited` (with a `Retry-After` header) |
| 502 | `payment_provider_error` (Stripe unavailable; safe to retry) |
| 502 | `email_provider_error` (dashboard only: Brevo rejected a send, e.g. the From address isn't a verified sender) |
| 503 | `pricing_not_configured` (Miami price not set yet) |
| 500 | `internal_error` |

## Camps (D2)

### `GET /api/camps`

Active camps (Miami excluded) and their sessions, plus the current camp waiver.

```json
{
  "camps": [
    {
      "id": "uuid", "slug": "arlington-catholic", "name": "Arlington Catholic Summer Camp",
      "host": "Arlington Catholic High School", "kind": "summer", "infoOnly": false,
      "description": null, "infoUrl": null,
      "sessions": [
        {
          "id": "uuid", "slug": "week-of-july-12", "name": "Week of July 12 (ages 6-13)",
          "startsOn": "2027-07-12", "endsOn": "2027-07-16", "startTime": "09:00",
          "location": "Arlington Catholic High School", "ageMin": 6, "ageMax": 13,
          "priceCents": 50000, "regularPriceCents": 50000, "earlyBirdUntil": null,
          "status": "open", "spotsLeft": null, "infoText": "..."
        }
      ]
    },
    { "slug": "bbn", "infoOnly": true, "sessions": [], "...": "..." }
  ],
  "waiver": null,
  "waiverRequired": false
}
```

- `infoOnly: true` means the page shows info only, with no checkout.
- `status` is `open`, `closed` or `full`. A `full` session should offer the waitlist.
- `spotsLeft` is `null` when the session has no capacity limit.
- `priceCents` already includes any early-bird price that is active today.

### `POST /api/checkout/camp`

Several children and several sessions in one payment. Each child lists the
sessions they attend.

```json
{
  "parent": { "name": "Jamie Rivera", "email": "jamie@example.com", "phone": "617-555-0142", "town": "Brookline" },
  "players": [
    { "name": "Alex Rivera", "age": 10, "sex": "boy", "sessionIds": ["<week 1 id>", "<week 2 id>"], "extra": { "shirtSize": "YM" } },
    { "name": "Sam Rivera", "age": 15, "sessionIds": ["<week 2 id>"] }
  ],
  "waiver": { "waiverId": "<waiver.id from GET /api/camps>", "acceptedName": "Jamie Rivera" },
  "marketingOptIn": true,
  "extra": { "hearAboutUs": "Friend" },
  "successPath": "/camps/thanks",
  "cancelPath": "/camps/arlington-catholic"
}
```

- `extra` (per child and per form) stores any field the existing form collects that
  isn't modelled above, so the form can change without a backend change. Keys are
  up to 64 characters and there are at most 30 per object.
- `waiver` is optional until a camp waiver is published and `camp_waiver_required` is on.
- `successPath` and `cancelPath` must be paths on this site. Stripe appends `?session_id=...` to the success URL.

Returns `200 { "checkoutUrl": "...", "expiresAt": "..." }`.

## Miami combine (D3)

Fields and schedule follow the client's Kickoff Information Form (Oct 18, 2026).

**Phases.** `opensAt` → checkout opens (code holders included). `publicOpensAt` →
families without a code can register; the code becomes optional and unlocks the
host-school reserved spots. `closesAt` → checkout closes. Current settings:
opens to everyone **Nov 1, 2026 10:00 AM ET**, closes **Mar 1, 2027**.

### `GET /api/miami`

```json
{
  "event": {
    "name": "FOOTYUP x GOINGFORGOAT College Combine",
    "location": "Miami, FL",
    "infoText": "Players will participate in an elite three-day college soccer combine...",
    "opensAt": "2026-11-01T15:00:00.000Z",
    "publicOpensAt": "2026-11-01T15:00:00.000Z",
    "closesAt": "2027-03-02T04:59:00.000Z",
    "open": true,
    "publicOpen": true
  },
  "accessCodeRequired": false,
  "accessCodeAccepted": true,
  "options": { "positions": [], "shirtSizes": [], "shortSizes": [] },
  "waiver": null,
  "waiverRequired": false,
  "groups": [
    { "group": "boys", "label": "Boys", "priceCents": 150000, "spotsLeft": 25, "full": false, "open": true,
      "startsOn": "2027-05-21", "endsOn": "2027-05-23", "dailyStartTime": "16:30", "dailyEndTime": "20:30" },
    { "group": "girls", "label": "Girls", "priceCents": 150000, "spotsLeft": 0, "full": true, "open": true,
      "startsOn": "2027-05-24", "endsOn": "2027-05-26", "dailyStartTime": "16:30", "dailyEndTime": "20:30" }
  ]
}
```

- `accessCodeRequired: true` means a code is mandatory right now, so show the code field and block the form without one.
- `accessCodeAccepted: true` with `accessCodeRequired: false` means the code is optional. Show an
  optional "Host-school access code" field. Host families who enter it can use the reserved spots.
- `spotsLeft` is what a family **without** a code can take. Host families get their numbers from verify-code.
- `full: true` means the page should offer the waitlist (`POST /api/waitlist` with `miamiGroup`).
- Empty option lists mean free text. When the client supplies lists, show dropdowns. The server enforces them.
- `event.open: false` means show "opens on…" or "closed" using `opensAt` / `closesAt`.
- This response is cached at the edge for 5 seconds. The checkout itself always re-checks capacity.

### `POST /api/miami/verify-code`

Optional step so the page can confirm a code before the form. The request is `{ "accessCode": "..." }`.
It returns `200 { "valid": true, "groups": [...] }` (spots open to code holders) or `403 access_code_invalid`, and
allows 10 attempts per 10 minutes per IP.

### `POST /api/miami/checkout`

```json
{
  "accessCode": "optional; required only while accessCodeRequired is true",
  "parent": {
    "firstName": "Jamie", "lastName": "Rivera",
    "email": "jamie@example.com", "phone": "617-555-0142", "emergencyPhone": "617-555-0177"
  },
  "shippingAddress": { "line1": "1 Main St", "line2": "Apt 2", "city": "Miami", "state": "FL", "postalCode": "33156" },
  "players": [
    {
      "firstName": "Avery", "lastName": "Rivera", "age": 16, "sex": "girl",
      "heightIn": 66, "weightLb": 130,
      "position": "Midfielder", "club": "Miami FC Academy",
      "email": "avery@example.com", "shirtSize": "M", "shortSize": "S"
    }
  ],
  "waiver": { "waiverId": "...", "acceptedName": "..." },
  "marketingOptIn": false,
  "successPath": "/miami/thanks",
  "cancelPath": "/miami"
}
```

- Every field above is required except `accessCode`, `line2`, `waiver` (until a waiver is published), `marketingOptIn` and the paths.
- `sex` sets the group (`boy` → boys, `girl` → girls). 1–4 players per checkout.
- `shippingAddress` is where the GOINGFORGOAT x FOOTYUP package ships. A player can override it with their own `shippingAddress`.
- `parent.town` is optional; the shipping city is used when it's missing.
- Height is in **inches** and weight in **pounds** (whole numbers). The page can collect feet and inches and convert.
- The code is checked on the server only, ignoring case and spaces. A wrong code is refused even when the code is optional.
- Possible errors: `403 access_code_required | access_code_invalid`, `409 group_full`
  (`details.group`), `409 registration_not_open` (`details.opensAt`, `details.closesAt`), `503 pricing_not_configured`,
  `422 waiver_required`, `400 validation_failed` (per-field `details.issues`).

## Discounts and waitlist offers (both checkouts)

Both `POST /api/checkout/camp` and `POST /api/miami/checkout` also accept:

- `promoCode` (optional): checked on the server. The Stripe page shows the discounted line, labelled with the code.
  The sibling discount (2nd+ child) applies automatically when the client has turned it on.
- `waitlistToken` (optional): from a waitlist offer link (`?waitlist=<token>`). It uses the spot held for that family.

### `GET /api/waitlist?token=<token>`

Returns `{ "valid": true, "program": "...", "sessionId": "...", "miamiGroup": null, "spots": 1, "expiresAt": "...", "parent": { "name", "email", "phone", "town" } }`
or `{ "valid": false }`. Use it to prefill the form on the page the offer email links to (`waitlist_session_path` / `waitlist_miami_path` settings).

## Forms

### `POST /api/private-training` (D4)

```json
{
  "parentName": "...", "email": "...", "phone": "...", "town": "...",
  "playerName": "...", "playerAge": 12,
  "message": "optional", "preferredTimes": "optional",
  "marketingOptIn": false,
  "website": "",
  "turnstileToken": "only if Turnstile is enabled"
}
```

- `website` is a honeypot. Render it as a visually hidden input that humans leave empty.
- Returns `201 { "ok": true }`. The endpoint allows 5 submissions per hour per IP.

### `POST /api/waitlist`

Send exactly one of `sessionId` or `miamiGroup`:

```json
{ "sessionId": "uuid", "parentName": "...", "email": "...", "phone": "...", "town": "...", "spots": 1, "marketingOptIn": false, "website": "" }
```

Returns `201 { "ok": true }`.

## The live site's adapter: `/api/site/*`

footyup.net's own `api/*.js` functions forward their exact request bodies here
(see `integration/rapobuild/README.md`), so the site's pages don't change.
They use the site's camp ids and session values, and answer in the site's
shapes: `{ "url" }` to redirect to Stripe, `{ "success": true }`, or
`{ "error": "message to show" }`.

| Endpoint | Body or query (as the site sends it) |
| --- | --- |
| `POST /api/site/checkout` | Camps: `campId, session, playerName, playerAge, parentName, parentEmail, parentPhone, town`. Miami: `campId, session (boys/girls), accessCode, playerName, playerEmail, playerAge, heightFt, heightIn, weight, gradYear, position, club, clothingSize, shortSize, parentName, parentEmail, parentPhone, emergencyPhone, address1, address2, city, state, zip`. Both optionally: `waiverId, waiverAccepted, waitlistToken` |
| `GET /api/site/camp-access?campId=…` | Returns `{ open, closed, gated, opensAt, closesAt, gatedUntil }` |
| `POST /api/site/camp-access` | `{ campId, code }`; `200 { …status, ok: true }` or `403 { …status, error }` |
| `POST /api/site/checkout-training` | `{ packageId }` (`individual_5`, `individual_7`, `individual_10`, `group2_5`, `group2_7`) |
| `POST /api/site/inquiry` | `{ name, email, phone, town, playerNames, players, bundle, ages, notes, website }` |
| `POST /api/site/waitlist` | `{ campId, session, parentName, email, phone, town, spots, website }` (Watertown `both` waits on either week) |
| `GET /api/site/waitlist?token=…` | `{ valid, campId, session, spots, expiresAt, parent: { name, email, phone, town } }` or `{ valid: false }` |
| `GET /api/site/catalog` | Live prices, spots and open state per camp and session, Miami price steps and form options, training package prices |

When the site's server sends `x-site-key` equal to `SITE_API_KEY`, the
platform rate-limits by the family's IP in `x-footyup-client-ip` instead of the site server's.

## Not called by the pages

- `POST /api/stripe/webhook`: Stripe only. It verifies the signature and needs the raw body.
- `GET /api/cron/cleanup`: Vercel Cron only. It requires `Authorization: Bearer $CRON_SECRET`.
