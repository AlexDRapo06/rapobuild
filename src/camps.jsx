// CAMP DATA — one source of truth for every camp page, the summer hub, the
// Miami combine, and the home page's Upcoming Camps cards.
//
// Prices, ages and session labels here are for DISPLAY ONLY. api/_camps.js holds
// what Stripe actually charges and what the server accepts, keyed by the same
// `id` and session `value` strings below. Change a price and you must change it
// in both places.
//
// status: "open"     — registers and pays on this site
//         "external" — info page only; the host school runs sign-ups
//         "soon"     — teaser card, no page yet
const CAMP_LIST = [
  {
    id: "winter_walpole",
    season: "winter",
    status: "open",
    page: "winterCamp",
    tag: "Winter Camp",
    name: "Walpole",
    place: "WALPOLE",
    region: "Massachusetts",
    cardNote: "Dec 27–31 · 9 AM–1 PM",
    venue: "24 Industrial Road, Walpole, MA",
    address: "24 Industrial Road, Walpole, MA",
    schedule: "9:00 AM – 1:00 PM",
    dates: "December 27 – 31",
    ages: "Ages 6–17",
    minAge: 6,
    maxAge: 17,
    priceLabel: "$315 per player",
    accent: "#D2122E",
    sessions: [
      { value: "full", label: "Winter Camp — Dec 27–31 · 9 AM–1 PM · $315", price: 315, minAge: 6, maxAge: 17 },
    ],
  },
  {
    id: "norfolk_clinic",
    season: "winter",
    status: "soon",
    tag: "Winter Clinic",
    place: "NORFOLK",
    region: "8 Sharon Ave · Ages 12–17",
    cardNote: "Dec 28–31 · 9 AM–12 PM",
    accent: "#C9A24A",
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
    page: "miami",
    tag: "College Combine",
    name: "Miami College Combine",
    place: "MIAMI",
    region: "Gulliver Prep · Ages 14–18",
    cardNote: "Boys May 21–23 · Girls May 24–26",
    venue: "Gulliver Prep",
    address: "Miami, FL",
    dates: "May 21 – 26, 2027",
    ages: "Ages 14–18",
    minAge: 14,
    maxAge: 18,
    priceLabel: "$1,300 per player",
    accent: "#C9A24A",
    // Display defaults only — the Miami page asks /api/camp-access for the live
    // state, and api/_camps.js is what actually enforces it.
    opensAt: "2026-11-01T00:00:00-04:00",
    gated: true,
    sessions: [
      { value: "boys",  title: "Boys Combine",  short: "Boys",  dates: "May 21 – 23, 2027", ages: "Ages 14–18", minAge: 14, maxAge: 18, price: 1300, label: "Boys Combine — May 21–23, 2027 · $1,300" },
      { value: "girls", title: "Girls Combine", short: "Girls", dates: "May 24 – 26, 2027", ages: "Ages 14–18", minAge: 14, maxAge: 18, price: 1300, label: "Girls Combine — May 24–26, 2027 · $1,300" },
    ],
  },
];

// Order of the Upcoming Camps cards on the home page.
const HOME_CAMP_ORDER = [
  "miami_combine_2027",
  "arlington_catholic_2027",
  "watertown_2027",
  "bbn_2027",
  "winter_walpole",
  "norfolk_clinic",
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

const campRegistrationOpen = (c, now = Date.now()) => !c.opensAt || now >= Date.parse(c.opensAt);
const formatUSD = (n) => `$${Number(n).toLocaleString("en-US")}`;

Object.assign(window, {
  CAMP_LIST, HOME_CAMP_ORDER, SUMMER_CAMPS,
  campById, summerCampBySlug, campRoute, campRegistrationOpen, formatUSD,
});
