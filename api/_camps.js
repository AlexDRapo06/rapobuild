// CAMP CATALOG — the server's source of truth.
//
// src/camps.jsx mirrors these figures for display, but the amount charged, the
// sessions that exist, the ages each session accepts, and whether a camp is
// locked behind an access code are always resolved here — never taken from the
// request body. Keys must match `id` and session `value` in src/camps.jsx.
// Change a price and you must change it in both places.
//
// `route` is the site page (hash) a family returns to if they cancel checkout.
//
// The leading underscore keeps Vercel from deploying this file as a function.
const crypto = require('crypto');

const CAMPS = {
  winter_walpole: {
    name: 'FOOTYUP Winter Camp — Walpole, MA',
    route: 'winterCamp',
    sessions: {
      full: { label: 'Dec 27–31 · 9 AM–1 PM', unit_amount: 31500, minAge: 6, maxAge: 17 },
    },
  },
  watertown_2027: {
    name: 'FOOTYUP Summer Camp 2027 — Watertown, MA',
    route: 'summerCamp/watertown',
    sessions: {
      week1: { label: 'Week 1 · July 12–16, 2027 · 9 AM–2 PM', unit_amount: 41500, minAge: 6, maxAge: 17 },
      week2: { label: 'Week 2 · July 19–23, 2027 · 9 AM–2 PM', unit_amount: 41500, minAge: 6, maxAge: 17 },
      both:  { label: 'Both Weeks · July 12–23, 2027 · 9 AM–2 PM', unit_amount: 83000, minAge: 6, maxAge: 17 },
    },
  },
  arlington_catholic_2027: {
    name: 'FOOTYUP Summer Camp 2027 — Arlington Catholic High School',
    route: 'summerCamp/arlington-catholic',
    sessions: {
      summer: { label: 'Summer Camp · Ages 6–13 · July 12–16, 2027 · 8:30 AM–1:30 PM', unit_amount: 50000, minAge: 6, maxAge: 13 },
      elite:  { label: 'Elite Summer Camp · Ages 14–18 · July 19–23, 2027 · 9 AM–1 PM', unit_amount: 75000, minAge: 14, maxAge: 18 },
    },
  },
  rivier_2027: {
    name: 'FOOTYUP Summer Camp 2027 — Rivier University, Nashua, NH',
    route: 'summerCamp/rivier',
    sessions: {
      full: { label: 'June 28–July 2, 2027 · 8:30 AM–1:30 PM', unit_amount: 40000, minAge: 6, maxAge: 17 },
    },
  },
  union_point_2027: {
    name: 'FOOTYUP Summer Camp 2027 — Union Point, Weymouth, MA',
    route: 'summerCamp/union-point',
    sessions: {
      full: { label: 'July 26–30, 2027 · 8:30 AM–2:00 PM', unit_amount: 50000, minAge: 6, maxAge: 17 },
    },
  },
  brandeis_2027: {
    name: 'FOOTYUP Summer Camp 2027 — Brandeis University, Waltham, MA',
    route: 'summerCamp/brandeis',
    sessions: {
      full: { label: 'August 2–6, 2027 · 8:30 AM–1:30 PM', unit_amount: 45000, minAge: 6, maxAge: 17 },
    },
  },
  veterans_canton_2026: {
    name: 'FOOTYUP Veterans Day Camp — Canton, MA',
    route: 'veteransDay',
    // Registration closes when camp starts.
    closesAt: '2026-11-11T09:00:00-05:00',
    sessions: {
      full: { label: 'Veterans Day · Wed Nov 11, 2026 · 9 AM–1 PM', unit_amount: 12000, minAge: 6, maxAge: 17 },
    },
  },
  miami_combine_2027: {
    name: 'FOOTYUP Miami College Combine 2027 — Belen Jesuit Preparatory School',
    route: 'miami',
    kind: 'combine',
    // Registration opens at midnight Eastern on Nov 1, 2026…
    opensAt: '2026-11-01T00:00:00-04:00',
    // …and March 1, 2027 is the last day to register.
    closesAt: '2027-03-02T00:00:00-05:00',
    // Private-school priority window (Nov 1–30): checkout requires the access
    // code. From `gatedUntil` on, registration is open to the public — the Miami
    // page reads this through /api/camp-access, so nothing else needs to change.
    gated: true,
    gatedUntil: '2026-12-01T00:00:00-05:00',
    // sha256(ACCESS_CODE_SALT + normalized code). The code itself never ships
    // to the browser or lives in the repo. To change it, hash the new code:
    //   node -e "console.log(require('crypto').createHash('sha256').update('footyup-combine-2027:'+'NEWCODE'.trim().toLowerCase()).digest('hex'))"
    accessCodeHash: '305988d0bcee605deff3c351783303cc7b35516cc84bec95672756dfb25709d4',
    // Price by registration date: the first tier whose `until` hasn't passed.
    // $1,500 through Feb 1, then $1,650 through close on March 1.
    priceTiers: [
      { until: '2027-02-02T00:00:00-05:00', unit_amount: 150000 },
      { unit_amount: 165000 },
    ],
    sessions: {
      boys:  { label: 'Boys Combine · May 21–23, 2027 · 4:30–8:30 PM · Ages 14–18', minAge: 14, maxAge: 18, sex: 'Male' },
      girls: { label: 'Girls Combine · May 24–26, 2027 · 4:30–8:30 PM · Ages 14–18', minAge: 14, maxAge: 18, sex: 'Female' },
    },
  },
};

const ACCESS_CODE_SALT = 'footyup-combine-2027:';

const getCamp = (id) => (Object.prototype.hasOwnProperty.call(CAMPS, id) ? CAMPS[id] : null);

const passed = (iso, now) => !!iso && now >= Date.parse(iso);

// Whether registration has opened (and not yet closed), and whether it still
// needs a code.
const registrationStatus = (camp, now = Date.now()) => {
  const closed = passed(camp.closesAt, now);
  return {
    open: (!camp.opensAt || passed(camp.opensAt, now)) && !closed,
    closed,
    gated: !!camp.gated && !passed(camp.gatedUntil, now),
    opensAt: camp.opensAt || null,
    closesAt: camp.closesAt || null,
    gatedUntil: camp.gatedUntil || null,
  };
};

// What a session costs right now, in cents.
const unitAmount = (camp, session, now = Date.now()) => {
  const tier = (camp.priceTiers || []).find((t) => !t.until || now < Date.parse(t.until));
  return tier ? tier.unit_amount : session.unit_amount;
};

// Codes are compared case-insensitively with surrounding spaces ignored, so a
// parent's phone auto-capitalizing or a pasted trailing space never locks them out.
const checkAccessCode = (camp, code) => {
  if (!camp.accessCodeHash) return true;
  if (typeof code !== 'string' || !code.trim()) return false;
  const given = crypto
    .createHash('sha256')
    .update(ACCESS_CODE_SALT + code.trim().toLowerCase())
    .digest();
  const expected = Buffer.from(camp.accessCodeHash, 'hex');
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
};

module.exports = { CAMPS, getCamp, registrationStatus, unitAmount, checkAccessCode };
