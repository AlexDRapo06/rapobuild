/**
 * Creates fake registrations the way footyup.net will in production: the
 * site's own form payloads sent to /api/site/*, paid through mock Stripe. Local
 * only (PAYMENTS_MODE=mock). All names, emails and addresses are invented.
 *
 *   pnpm dev            (in another terminal)
 *   pnpm demo:data [http://localhost:4319]
 */
const base = (process.argv[2] ?? "http://localhost:4319").replace(/\/+$/, "");
if (!/^http:\/\/(localhost|127\.0\.0\.1)/.test(base)) {
  console.error("Demo data only runs against a local server.");
  process.exit(1);
}

const first = ["Liam", "Ava", "Noah", "Mia", "Lucas", "Sofia", "Ethan", "Chloe", "Owen", "Grace", "Leo", "Nora", "Caleb", "Ella", "Mason", "Lily"];
const last = ["Carter", "Nguyen", "Patel", "Brooks", "Silva", "Murphy", "Kim", "Rossi", "Hughes", "Ortiz", "Walsh", "Cohen"];
const towns = ["Arlington", "Brookline", "Newton", "Watertown", "Lexington", "Belmont", "Winchester", "Needham"];
const pick = <T>(list: T[], i: number) => list[i % list.length]!;

async function pay(url: string) {
  const id = url.split("/").pop();
  const res = await fetch(`${base}/__mock/checkout/${id}/pay`, { method: "POST", redirect: "manual" });
  if (res.status !== 303) throw new Error(`Mock payment failed (${res.status})`);
}

async function post(path: string, body: unknown, ip: string) {
  const res = await fetch(`${base}${path}`, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": ip }, body: JSON.stringify(body) });
  const json = (await res.json()) as { url?: string; error?: string };
  if (!res.ok) throw new Error(`${path}: ${json.error ?? res.status}`);
  return json;
}

type Catalog = {
  camps: Record<string, { sessions: Record<string, { minAge: number | null; maxAge: number | null; open: boolean }> }>;
  miami: { id: string; open: boolean; gated: boolean; options: { positions: string[]; clothingSizes: string[] } } | null;
};
const catalog = (await (await fetch(`${base}/api/site/catalog`)).json()) as Catalog;
const sessions = Object.entries(catalog.camps).flatMap(([campId, c]) =>
  Object.entries(c.sessions).filter(([, s]) => s.open).map(([session, s]) => ({ campId, session, min: s.minAge ?? 6, max: s.maxAge ?? 17 })),
);

let made = 0;
for (let i = 0; i < 16 && sessions.length; i++) {
  const ln = pick(last, i);
  const s = pick(sessions, i * 3);
  const parentFirst = pick(first, i + 5);
  await pay(
    (await post("/api/site/checkout", {
      campId: s.campId, session: s.session, playerName: `${pick(first, i)} ${ln}`, playerAge: String(s.min + (i % (s.max - s.min + 1))),
      parentName: `${parentFirst} ${ln}`, parentEmail: `${parentFirst.toLowerCase()}.${ln.toLowerCase()}${i}@example.test`, town: pick(towns, i),
    }, `10.0.1.${i}`)).url!,
  );
  made += s.session === "both" ? 2 : 1;
}

if (!catalog.miami?.open || catalog.miami.gated) {
  console.warn("Miami demo skipped: registration isn't open to the public yet. Set the schedule in Dashboard → Settings → Miami (locally) to try it.");
} else {
  for (let i = 0; i < 12; i++) {
    const ln = pick(last, i + 2);
    const city = pick(towns, i + 1);
    try {
      const { url } = await post("/api/site/checkout", {
        campId: catalog.miami.id, session: i % 2 ? "girls" : "boys", playerName: `${pick(first, i + 1)} ${ln}`, playerEmail: `player${i}@example.test`,
        playerAge: String(14 + (i % 5)), heightFt: "5", heightIn: String(2 + (i % 10)), weight: String(115 + i * 3), gradYear: String(2027 + (i % 4)),
        position: pick(catalog.miami.options.positions, i), club: `${city} FC`, clothingSize: pick(catalog.miami.options.clothingSizes, i + 2),
        parentName: `${pick(first, i + 7)} ${ln}`, parentEmail: `${ln.toLowerCase()}.family${i}@example.test`, parentPhone: `781-555-02${String(10 + i)}`,
        address1: `${12 + i} Example Street`, address2: i % 3 === 0 ? `Apt ${i + 1}` : "", city, state: "MA", zip: "02474",
      }, `10.0.2.${i}`);
      if (i !== 11) await pay(url!); // leave one in checkout to show a live hold
      made += 1;
    } catch (err) {
      console.warn(`Miami demo stopped: ${(err as Error).message}`);
      break;
    }
  }
}

await post("/api/site/inquiry", { name: "Dana Walsh", email: "dana.walsh@example.test", phone: "617-555-0190", players: "1", bundle: "Individual — 7 Sessions", ages: "12", notes: "Weekly 1:1 sessions on first touch and finishing, ideally before the spring season." }, "10.0.3.1");
await post("/api/site/inquiry", { name: "Sam Ortiz", email: "sam.ortiz@example.test", phone: "617-555-0191", players: "2", bundle: "Group of 2 — 5 Sessions", ages: "13, 15" }, "10.0.3.2");
await pay((await post("/api/site/checkout-training", { packageId: "individual_5" }, "10.0.3.3")).url!);
await pay((await post("/api/site/checkout-training", { packageId: "group2_7" }, "10.0.3.4")).url!);
console.log(`Created ${made} fake registrations, 2 training inquiries and 2 training packages.`);
