// CAMP DATA — one source of truth for every camp page, the summer hub, the
// Boston College Combine, and the home page's Upcoming Camps cards.
//
// Prices, ages and session labels here are display defaults. The admin
// dashboard (Settings → Camps, Combine) holds what Stripe actually charges and
// what the server accepts, keyed by the same `id` and session `value` strings
// below; GET /api/site/catalog swaps the live prices in (applyCatalog).
//
// The combine keeps its original id (`miami_combine_2027`) and the boys/girls
// session values: the database, Stripe and the dashboard key on them.

// Camps with their own `page` (Winter, Combine) need it added to
// VALID_PAGES in src/app.jsx.
//
// status: "open"     — registers and pays on this site
//         "external" — info page only; the host school runs sign-ups
//         "soon"     — teaser card, no page yet
const CAMP_LIST = [
  {
    id: "winter_sudbury",
    season: "winter",
    status: "open",
    page: "winterCamp",
    tag: "Winter Camp",
    name: "Sudbury",
    place: "SUDBURY",
    region: "Sudbury Fieldhouse",
    cardNote: "Dec 28–31 · 9 AM–1 PM",
    venue: "Sudbury Fieldhouse",
    address: "Sudbury Fieldhouse, Sudbury, MA",
    schedule: "9:00 AM – 1:00 PM",
    dates: "December 28 – 31, 2026",
    ages: "Ages 7–16",
    minAge: 7,
    maxAge: 16,
    priceLabel: "$475 for 4 days · $125 per day",
    price: 475,
    accent: "#D2122E",
    headline: ["WINTER SOCCER CAMP.", "TRAIN. COMPETE. IMPROVE."],
    lead: "A 4-day indoor camp at Sudbury Fieldhouse with the FOOTYUP staff — high-level training in a competitive indoor environment to keep your player sharp all winter. Spots are limited.",
    detailsTitle: ["4-DAY INDOOR CAMP.", "COME ALL FOUR, OR PICK YOUR DAYS."],
    details: "Drop your player off at 9 and pick them up at 1, December 28–31 — technical work, small-sided games, and coaching from college and pro-level players. Book the full camp for $475, or single days at $125 each. Register online in under a minute; details for the week are sent after checkout.",
    sessionsNote: "Coming for more than one day? The full camp is $475 for all four days.",
    sessions: [
      { value: "full", kicker: "Mon – Thu", title: "Full Camp", dates: "December 28 – 31, 2026", schedule: "9:00 AM – 1:00 PM", ages: "Ages 7–16", minAge: 7, maxAge: 16, price: 475, label: "Full Camp — Dec 28–31 · 9 AM–1 PM · $475" },
      { value: "dec28", kicker: "Day 1", title: "Monday, Dec 28", dates: "December 28, 2026", schedule: "9:00 AM – 1:00 PM", ages: "Ages 7–16", minAge: 7, maxAge: 16, price: 125, label: "Single Day — Mon Dec 28 · 9 AM–1 PM · $125" },
      { value: "dec29", kicker: "Day 2", title: "Tuesday, Dec 29", dates: "December 29, 2026", schedule: "9:00 AM – 1:00 PM", ages: "Ages 7–16", minAge: 7, maxAge: 16, price: 125, label: "Single Day — Tue Dec 29 · 9 AM–1 PM · $125" },
      { value: "dec30", kicker: "Day 3", title: "Wednesday, Dec 30", dates: "December 30, 2026", schedule: "9:00 AM – 1:00 PM", ages: "Ages 7–16", minAge: 7, maxAge: 16, price: 125, label: "Single Day — Wed Dec 30 · 9 AM–1 PM · $125" },
      { value: "dec31", kicker: "Day 4", title: "Thursday, Dec 31", dates: "December 31, 2026", schedule: "9:00 AM – 1:00 PM", ages: "Ages 7–16", minAge: 7, maxAge: 16, price: 125, label: "Single Day — Thu Dec 31 · 9 AM–1 PM · $125" },
    ],
  },
  {
    id: "rivier_2027",
    season: "summer",
    status: "open",
    slug: "rivier",
    tag: "Summer 2027",
    name: "Rivier University",
    place: "RIVIER",
    region: "Nashua, NH",
    cardNote: "June 28 – July 2 · 8:30 AM–1:30 PM",
    venue: "Rivier University",
    address: "420 S Main St, Nashua, NH 03060",
    schedule: "8:30 AM – 1:30 PM",
    dates: "June 28 – July 2, 2027",
    ages: "Ages 6–17",
    minAge: 6,
    maxAge: 17,
    priceLabel: "$400 per player",
    cta: "REGISTER NOW — $400",
    accent: "#C9A24A",
    headline: ["RIVIER UNIVERSITY.", "SUMMER STARTS HERE."],
    lead: "The first camp of the FOOTYUP summer — five days on campus in Nashua, coached by college and pro-level players. Technical work in the morning, games that test it in the afternoon. Ages 6 to 17, every level welcome.",
    detailsTitle: ["FIVE DAYS.", "COLLEGE GROUNDS."],
    details: "Drop off at 8:30, pick up at 1:30, Monday through Friday. Players are grouped by age and ability so every camper is challenged. Register online in under a minute; details for the week are sent after checkout.",
    sessions: [
      { value: "full", kicker: "Monday – Friday", title: "Summer Camp", dates: "June 28 – July 2, 2027", schedule: "8:30 AM – 1:30 PM", ages: "Ages 6–17", minAge: 6, maxAge: 17, price: 400, label: "Rivier University — June 28 – July 2 · $400" },
    ],
  },
  {
    id: "brooks_2027",
    season: "summer",
    status: "open",
    slug: "brooks",
    tag: "Summer 2027",
    name: "Brooks School",
    place: "BROOKS",
    region: "North Andover, MA",
    cardNote: "June 28 – July 30 · 8:30 AM–3:30 PM",
    venue: "Brooks School",
    address: "1160 Great Pond Rd, North Andover, MA 01845",
    schedule: "8:30 AM – 3:30 PM",
    dates: "June 28 – July 30, 2027",
    ages: "Ages 7–16",
    minAge: 7,
    maxAge: 16,
    priceLabel: "$750 per week",
    cta: "REGISTER NOW — $750/WEEK",
    accent: "#D2122E",
    headline: ["BROOKS SCHOOL.", "FOUR WEEKS. FULL DAYS."],
    lead: "Four weeks of full-day camp on the Brooks School campus in North Andover, coached by college and pro-level players. Take one week or several — ages 7 to 16, every level welcome.",
    detailsTitle: ["8:30 TO 3:30.", "THE FULL-DAY WEEK."],
    details: "Drop off at 8:30, pick up at 3:30. Technical work, small-sided games and full scrimmages, grouped by age and ability so every player is challenged. Each week is booked on its own. Register online in under a minute; details for the week are sent after checkout.",
    sessionsNote: "Coming for more than one week? Register each week separately.",
    sessions: [
      { value: "week1", kicker: "Week 01 · Mon – Thu", title: "Week 1", dates: "June 28 – July 1, 2027", schedule: "8:30 AM – 3:30 PM", ages: "Ages 7–16", minAge: 7, maxAge: 16, price: 750, label: "Week 1 — June 28 – July 1 · $750" },
      { value: "week2", kicker: "Week 02 · Tue – Fri", title: "Week 2", dates: "July 6 – 9, 2027", schedule: "8:30 AM – 3:30 PM", ages: "Ages 7–16", minAge: 7, maxAge: 16, price: 750, label: "Week 2 — July 6–9 · $750" },
      { value: "week3", kicker: "Week 03", title: "Week 3", dates: "July 12 – 16, 2027", schedule: "8:30 AM – 3:30 PM", ages: "Ages 7–16", minAge: 7, maxAge: 16, price: 750, label: "Week 3 — July 12–16 · $750" },
      { value: "week4", kicker: "Week 04", title: "Week 4", dates: "July 26 – 30, 2027", schedule: "8:30 AM – 3:30 PM", ages: "Ages 7–16", minAge: 7, maxAge: 16, price: 750, label: "Week 4 — July 26–30 · $750" },
    ],
  },
  {
    id: "arlington_catholic_2027",
    season: "summer",
    status: "open",
    slug: "arlington-catholic",
    tag: "Summer 2027",
    name: "Arlington Catholic",
    place: "ARLINGTON CATHOLIC",
    region: "Arlington, MA",
    cardNote: "July 12–23 · Ages 6–18",
    venue: "Arlington Catholic High School",
    address: "16 Medford St, Arlington, MA",
    dates: "July 12 – 23, 2027",
    ages: "Ages 6–18",
    minAge: 6,
    maxAge: 18,
    priceLabel: "From $500",
    cta: "REGISTER NOW — FROM $500",
    accent: "#C9A24A",
    headline: ["ARLINGTON CATHOLIC.", "TWO CAMPS. ONE STANDARD."],
    lead: "Two back-to-back weeks at Arlington Catholic High School — a Summer Camp for ages 6–13, then an Elite Summer Camp built for high-school players ages 14–18. Coached by NCAA Division I starters and ex-MLS Academy players.",
    detailsTitle: ["THE RIGHT WEEK", "FOR EVERY PLAYER."],
    details: "Summer Camp is technical work, small-sided games and scrimmages, grouped by age and ability so every camper is challenged. Elite Summer Camp turns the intensity up — high-level sessions for high-school players chasing the next level. Register online in under a minute; details for the week are sent after checkout.",
    sessions: [
      {
        value: "summer",
        kicker: "Week 01 · Ages 6–13",
        title: "Summer Camp",
        dates: "July 12 – 16, 2027",
        schedule: "8:30 AM – 1:30 PM",
        ages: "Ages 6–13",
        minAge: 6,
        maxAge: 13,
        price: 500,
        label: "Summer Camp (Ages 6–13) — July 12–16 · 8:30 AM–1:30 PM · $500",
      },
      {
        value: "elite",
        kicker: "Week 02 · Ages 14–18",
        title: "Elite Summer Camp",
        dates: "July 19 – 23, 2027",
        schedule: "9:00 AM – 1:00 PM",
        ages: "Ages 14–18",
        minAge: 14,
        maxAge: 18,
        price: 750,
        label: "Elite Summer Camp (Ages 14–18) — July 19–23 · 9 AM–1 PM · $750",
      },
    ],
  },
  {
    id: "watertown_2027",
    season: "summer",
    status: "open",
    slug: "watertown",
    tag: "Summer 2027",
    name: "Watertown",
    place: "WATERTOWN",
    region: "Victory Field",
    cardNote: "July 12–23 · 9 AM–2 PM",
    venue: "Victory Field",
    address: "40 Orchard St, Watertown, MA",
    schedule: "9:00 AM – 2:00 PM",
    dates: "July 12 – 23, 2027",
    ages: "Ages 6–17",
    minAge: 6,
    maxAge: 17,
    priceLabel: "$415 per week",
    cta: "REGISTER NOW — $415/WEEK",
    accent: "#C9A24A",
    headline: ["WATERTOWN.", "TWO WEEKS. ALL SUMMER SHARP."],
    lead: "Five hours a day on the grass at Victory Field, coached by college and pro-level players. Take one week or both — ages 6 to 17, every level welcome.",
    detailsTitle: ["FIVE HOURS A DAY.", "ZERO WASTED."],
    details: "Drop off at 9, pick up at 2. Technical work in the morning, small-sided games and full scrimmages in the afternoon — grouped by age and level so every player is challenged. Register online in under a minute; details for the week are sent after checkout.",
    sessionsNote: "Registering for both weeks? Choose Both Weeks at checkout — $830 total.",
    sessions: [
      { value: "week1", kicker: "Week 01", title: "Week 1", dates: "July 12 – 16, 2027", schedule: "9:00 AM – 2:00 PM", ages: "Ages 6–17", minAge: 6, maxAge: 17, price: 415, label: "Week 1 — July 12–16 · $415" },
      { value: "week2", kicker: "Week 02", title: "Week 2", dates: "July 19 – 23, 2027", schedule: "9:00 AM – 2:00 PM", ages: "Ages 6–17", minAge: 6, maxAge: 17, price: 415, label: "Week 2 — July 19–23 · $415" },
      // Offered at checkout only — the page shows the two weeks as cards.
      { value: "both", title: "Both Weeks", dates: "July 12 – 23, 2027", schedule: "9:00 AM – 2:00 PM", ages: "Ages 6–17", minAge: 6, maxAge: 17, price: 830, label: "Both Weeks — July 12–23 · $830", hideCard: true },
    ],
  },
  {
    id: "bbn_2027",
    season: "summer",
    status: "external",
    slug: "bbn",
    tag: "Summer 2027",
    name: "BB&N",
    place: "BB&N",
    region: "Cambridge, MA",
    cardNote: "July 12–23 · 8:30 AM–3:30 PM",
    venue: "Buckingham Browne & Nichols",
    address: "Cambridge, MA",
    schedule: "8:30 AM – 3:30 PM",
    dates: "July 12 – 23, 2027",
    ages: "Boys & girls · All levels",
    priceLabel: "Registration via BB&N",
    accent: "#C9A24A",
    headline: ["BB&N.", "SUMMER CAMP 2027."],
    lead: "FOOTYUP Soccer Camps are designed for players looking to improve their game in a fun, competitive, and high-energy environment.",
    about: [
      "Players will work on technical development, passing, dribbling, shooting, defending, speed, agility, and small-sided games throughout the week.",
      "Instruction is available to boys and girls of all skill levels. Players will be grouped based on age and ability to ensure each camper is challenged appropriately. FOOTYUP camps are led by current and former collegiate soccer players who bring high-level playing experience into each session.",
      "Our goal is for every player to leave camp more confident, more comfortable on the ball, and with a stronger understanding of the game.",
    ],
    whatToBring: [
      "Athletic clothing",
      "Soccer cleats or sneakers",
      "Shin guards",
      "A soccer ball",
      "Reusable water bottle",
      "Sunscreen",
      "Any snacks for the day",
    ],
    // Set to BB&N's sign-up page when they share one; until then the page
    // explains that BB&N handles registration.
    registrationUrl: null,
    sessions: [
      { value: "week1", kicker: "Week 01", title: "Week 1", dates: "July 12 – 16, 2027", schedule: "8:30 AM – 3:30 PM" },
      { value: "week2", kicker: "Week 02", title: "Week 2", dates: "July 19 – 23, 2027", schedule: "8:30 AM – 3:30 PM" },
    ],
  },
  {
    id: "union_point_2027",
    season: "summer",
    status: "open",
    slug: "union-point",
    tag: "Summer 2027",
    name: "Union Point",
    place: "UNION POINT",
    region: "Weymouth, MA",
    cardNote: "July 26 – 30 · 8:30 AM–2 PM",
    venue: "Union Point",
    address: "170 Memorial Drive, Weymouth, MA 02190",
    schedule: "8:30 AM – 2:00 PM",
    dates: "July 26 – 30, 2027",
    ages: "Ages 6–17",
    minAge: 6,
    maxAge: 17,
    priceLabel: "$500 per player",
    cta: "REGISTER NOW — $500",
    accent: "#D2122E",
    headline: ["UNION POINT.", "THE LONGEST DAY ON THE PITCH."],
    lead: "Five and a half hours a day at Union Point in Weymouth — the biggest week on the FOOTYUP summer calendar. Coached by ex-pros and NCAA Division I starters. Ages 6 to 17, every level welcome.",
    detailsTitle: ["8:30 TO 2.", "EVERY MINUTE COACHED."],
    details: "Drop off at 8:30, pick up at 2:00, Monday through Friday. The longest day of the summer means more touches, more small-sided games and more full scrimmages — grouped by age and ability throughout. Register online in under a minute; details for the week are sent after checkout.",
    sessions: [
      { value: "full", kicker: "Monday – Friday", title: "Summer Camp", dates: "July 26 – 30, 2027", schedule: "8:30 AM – 2:00 PM", ages: "Ages 6–17", minAge: 6, maxAge: 17, price: 500, label: "Union Point — July 26 – 30 · $500" },
    ],
  },
  {
    id: "brandeis_2027",
    season: "summer",
    status: "open",
    slug: "brandeis",
    tag: "Summer 2027",
    name: "Brandeis",
    place: "BRANDEIS",
    region: "Waltham, MA",
    cardNote: "August 2 – 6 · 8:30 AM–1:30 PM",
    venue: "Brandeis University",
    address: "415 South St, Waltham, MA 02453",
    schedule: "8:30 AM – 1:30 PM",
    dates: "August 2 – 6, 2027",
    ages: "Ages 6–17",
    minAge: 6,
    maxAge: 17,
    priceLabel: "$450 per player",
    cta: "REGISTER NOW — $450",
    accent: "#C9A24A",
    headline: ["BRANDEIS UNIVERSITY.", "FINISH THE SUMMER SHARP."],
    lead: "The last week of the FOOTYUP summer, on campus at Brandeis in Waltham. Five days to sharpen everything before the season starts. Ages 6 to 17, every level welcome.",
    detailsTitle: ["LAST WEEK OF SUMMER.", "BEST WEEK TO PEAK."],
    details: "Drop off at 8:30, pick up at 1:30, Monday through Friday. Preseason timing on purpose — the week is built to send players into tryouts fit, confident and match-sharp. Register online in under a minute; details for the week are sent after checkout.",
    sessions: [
      { value: "full", kicker: "Monday – Friday", title: "Summer Camp", dates: "August 2 – 6, 2027", schedule: "8:30 AM – 1:30 PM", ages: "Ages 6–17", minAge: 6, maxAge: 17, price: 450, label: "Brandeis — August 2 – 6 · $450" },
    ],
  },
  {
    id: "dover",
    season: "summer",
    status: "soon",
    tag: "Summer 2027 & Beyond",
    name: "Dover",
    place: "DOVER",
    region: "Massachusetts · + more",
    cardNote: "Locations expanding · Stay tuned",
    accent: "#D2122E",
  },
  {
    id: "miami_combine_2027",
    season: "combine",
    status: "open",
    page: "combine",
    tag: "College Combine",
    name: "Boston College Combine",
    place: "BOSTON",
    region: "Middlesex School · Ages 14–18",
    cardNote: "July 9–11 · 9 AM–1 PM · $800",
    venue: "Middlesex School",
    venueShort: "Middlesex School",
    address: "Concord, MA",
    dates: "July 9 – 11, 2027",
    schedule: "9:00 AM – 1:00 PM",
    ages: "Ages 14–18",
    minAge: 14,
    maxAge: 18,
    accent: "#C9A24A",
    // Display defaults only — the combine page asks /api/site/camp-access for
    // the live state, and the dashboard's Combine settings are what's enforced.
    opensAt: "2026-11-10T00:00:00-05:00",
    closesAt: "2027-07-09T00:00:00-04:00",
    gated: false,
    // One flat price (the dashboard's Combine price steps replace it).
    priceTiers: [
      { price: 800, label: "Through July 8" },
    ],
    // One combine for everyone. Boys and girls still register into their own
    // group (the database tracks spots per group), on the same dates.
    sessions: [
      { value: "boys",  title: "Boys",  short: "Boys",  dates: "July 9 – 11, 2027", ages: "Ages 14–18", minAge: 14, maxAge: 18 },
      { value: "girls", title: "Girls", short: "Girls", dates: "July 9 – 11, 2027", ages: "Ages 14–18", minAge: 14, maxAge: 18 },
    ],
  },
];

// Order of the Upcoming Camps cards on the home page.
const HOME_CAMP_ORDER = [
  "miami_combine_2027",
  "rivier_2027",
  "brooks_2027",
  "arlington_catholic_2027",
  "watertown_2027",
  "bbn_2027",
  "union_point_2027",
  "brandeis_2027",
  "winter_sudbury",
  "dover",
];

const campById = (id) => CAMP_LIST.find((c) => c.id === id);
const SUMMER_CAMPS = CAMP_LIST.filter((c) => c.season === "summer");
const summerCampBySlug = (slug) => SUMMER_CAMPS.find((c) => c.slug && c.slug === slug);

// [page, sub] for a camp with its own page, or null for teaser-only camps.
const campRoute = (c) => {
  if (c.page) return [c.page];
  if (c.season === "summer" && c.slug) return ["summerCamp", c.slug];
  return null;
};

const passedAt = (iso, now) => !!iso && now >= Date.parse(iso);

// Same shape as GET /api/site/camp-access — the fallback when the API can't be reached.
const campRegistrationStatus = (c, now = Date.now()) => {
  const closed = passedAt(c.closesAt, now);
  return {
    open: (!c.opensAt || passedAt(c.opensAt, now)) && !closed,
    closed,
    gated: !!c.gated && !passedAt(c.gatedUntil, now),
    opensAt: c.opensAt || null,
    closesAt: c.closesAt || null,
    gatedUntil: c.gatedUntil || null,
  };
};
const campRegistrationOpen = (c, now = Date.now()) => campRegistrationStatus(c, now).open;

// Today's price tier for camps priced by registration date.
const campPriceTier = (c, now = Date.now()) =>
  (c.priceTiers || []).find((t) => !t.until || now < Date.parse(t.until)) || null;
const campPrice = (c, now = Date.now()) => {
  const tier = campPriceTier(c, now);
  return tier ? tier.price : c.price;
};
const formatUSD = (n) => `$${Number(n).toLocaleString("en-US")}`;

// Live prices from the admin dashboard (GET /api/site/catalog). Rewrites the prices
// above, including the ones inside labels like "Week 1 — July 12–16 · $415",
// so the cards, forms and checkout all agree. Returns true if anything changed.
const swapPrice = (text, from, to) =>
  typeof text === "string" && from !== to ? text.split(formatUSD(from)).join(formatUSD(to)) : text;
const applyCatalog = (catalog) => {
  if (!catalog || typeof catalog !== "object") return false;
  let changed = false;
  for (const c of CAMP_LIST) {
    const live = catalog.camps && catalog.camps[c.id];
    if (live && Array.isArray(c.sessions)) {
      for (const s of c.sessions) {
        const ls = live.sessions && live.sessions[s.value];
        if (!ls) continue;
        const full = ls.spotsLeft === 0;
        if (!!s.full !== full) { s.full = full; changed = true; }
        if (typeof ls.price !== "number" || ls.price === s.price) continue;
        s.label = swapPrice(s.label, s.price, ls.price);
        if (c.price === s.price) {
          c.priceLabel = swapPrice(c.priceLabel, c.price, ls.price);
          c.price = ls.price;
        }
        s.price = ls.price;
        changed = true;
      }
    }
    const m = catalog.miami;
    if (m && m.id === c.id && Array.isArray(m.priceTiers) && m.priceTiers.length && Array.isArray(c.priceTiers)) {
      c.priceTiers = m.priceTiers.map((t, i) => ({ ...(c.priceTiers[i] || {}), until: t.until || undefined, price: t.price }));
      changed = true;
    }
    if (m && m.id === c.id && m.sessions && Array.isArray(c.sessions)) {
      for (const s of c.sessions) {
        const full = !!m.sessions[s.value] && m.sessions[s.value].spotsLeft === 0;
        if (!!s.full !== full) { s.full = full; changed = true; }
      }
    }
  }
  if (catalog.miami && catalog.miami.options) window.MIAMI_OPTIONS = catalog.miami.options;
  if (catalog.forms) {
    window.SITE_FORMS = catalog.forms;
    changed = true;
  }
  if (catalog.trainingPackages) {
    window.TRAINING_PRICES = Object.fromEntries(Object.entries(catalog.trainingPackages).map(([id, p]) => [id, formatUSD(p.price)]));
    changed = true;
  }
  return changed;
};

Object.assign(window, {
  CAMP_LIST, HOME_CAMP_ORDER, SUMMER_CAMPS,
  campById, summerCampBySlug, campRoute,
  campRegistrationStatus, campRegistrationOpen, campPriceTier, campPrice, formatUSD, applyCatalog,
});
