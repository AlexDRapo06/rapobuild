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
  miami_combine_2027: {
    name: 'FOOTYUP Miami College Combine 2027 — Gulliver Prep',
    route: 'miami',
    kind: 'combine',
    // Registration opens at midnight Eastern on Nov 1, 2026.
    opensAt: '2026-11-01T00:00:00-04:00',
    // Private-school priority window: checkout requires the access code.
    // To open registration to the public, set `gated: false` — the Miami page
    // reads this through /api/camp-access, so nothing else needs to change.
    gated: true,
    // sha256(ACCESS_CODE_SALT + normalized code). The code itself never ships
    // to the browser or lives in the repo. To change it, hash the new code:
    //   node -e "console.log(require('crypto').createHash('sha256').update('footyup-combine-2027:'+'NEWCODE'.trim().toLowerCase()).digest('hex'))"
    accessCodeHash: '177f3362edf9ec32f3791758493a3f6cb4023ca3082caf1e1da01c776924e435',
    sessions: {
      boys:  { label: 'Boys Combine · May 21–23, 2027 · Ages 14–18', unit_amount: 130000, minAge: 14, maxAge: 18, sex: 'Male' },
      girls: { label: 'Girls Combine · May 24–26, 2027 · Ages 14–18', unit_amount: 130000, minAge: 14, maxAge: 18, sex: 'Female' },
    },
  },
};

const ACCESS_CODE_SALT = 'footyup-combine-2027:';

const getCamp = (id) => (Object.prototype.hasOwnProperty.call(CAMPS, id) ? CAMPS[id] : null);

// Whether registration has opened yet, and whether it still needs a code.
const registrationStatus = (camp, now = Date.now()) => {
  const opensAt = camp.opensAt ? Date.parse(camp.opensAt) : null;
  return {
    open: opensAt == null || now >= opensAt,
    gated: !!camp.gated,
    opensAt: camp.opensAt || null,
  };
};

// Codes are compared case-insensitively with surrounding spaces ignored, so a
// parent's phone auto-capitalizing or a pasted trailing space never locks them out.
const checkAccessCode = (camp, code) => {
  if (!camp.gated) return true;
  if (typeof code !== 'string' || !code.trim()) return false;
  const given = crypto
    .createHash('sha256')
    .update(ACCESS_CODE_SALT + code.trim().toLowerCase())
    .digest();
  const expected = Buffer.from(camp.accessCodeHash, 'hex');
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
};

module.exports = { CAMPS, getCamp, registrationStatus, checkAccessCode };
