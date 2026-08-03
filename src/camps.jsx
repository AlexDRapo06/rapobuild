// CAMP DATA — one source of truth for every camp page and the home teaser.
//
// Prices here are for DISPLAY ONLY. api/checkout.js holds the amounts Stripe
// actually charges, keyed by the same `id` and session `value` strings below.
// Change a price and you must change it in both places.
const CAMPS = {
  winterCamp: {
    id: "winter_walpole",
    page: "winterCamp",
    tag: "Winter Camp",
    place: "WALPOLE",
    region: "Massachusetts",
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
      { value: "full", label: "Winter Camp — Dec 27–31 · 9 AM–1 PM · $315", price: 315 },
    ],
  },
  summerCamp: {
    id: "watertown_2027",
    page: "summerCamp",
    tag: "Summer 2027",
    place: "WATERTOWN",
    region: "Massachusetts",
    venue: "Victory Field",
    address: "40 Orchard St, Watertown, MA",
    schedule: "9:00 AM – 2:00 PM",
    dates: "July 12 – 23, 2027",
    ages: "Ages 6–17",
    minAge: 6,
    maxAge: 17,
    priceLabel: "$415 per week",
    accent: "#C9A24A",
    sessions: [
      { value: "week1", label: "Week 1 — July 12–16 · $415", price: 415 },
      { value: "week2", label: "Week 2 — July 19–23 · $415", price: 415 },
      { value: "both",  label: "Both Weeks — July 12–23 · $830", price: 830 },
    ],
  },
};

window.CAMPS = CAMPS;
