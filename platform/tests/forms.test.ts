import { beforeEach, describe, it } from "node:test";
import { expect } from "./expect.js";
import { privateTraining } from "../src/handlers/private-training.js";
import { joinWaitlist } from "../src/handlers/waitlist.js";
import { call, countRows, makeDeps, post, resetDb, seed, sessionBySlug } from "./helpers.js";

const deps = makeDeps();
const { db } = deps;

const request = {
  parentName: "Morgan Lee",
  email: "morgan.lee@example.test",
  phone: "617-555-0199",
  town: "Newton",
  playerName: "Riley Lee",
  playerAge: 12,
  message: "Looking for weekly sessions focused on finishing.",
  preferredTimes: "Weekday evenings",
};

beforeEach(async () => {
  await resetDb(db);
  await seed(db);
  deps.mailer.sent.length = 0;
});

describe("POST /api/private-training (acceptance #6)", () => {
  it("saves the request, adds a contact and emails the client", async () => {
    await db`insert into public.settings (key, value) values ('notify_email', '"owner@example.test"')`;
    const res = await call(deps, privateTraining, post("/api/private-training", { ...request, website: "" }));
    expect(res.status).toBe(201);

    const [saved] = await db`select parent_name, town, player_age, status from public.private_training_requests`;
    expect(saved).toEqual({ parent_name: "Morgan Lee", town: "Newton", player_age: 12, status: "new" });
    const [contact] = await db`select sources, consent from public.contacts`;
    expect(contact).toEqual({ sources: ["private_training"], consent: "unknown" });

    expect(deps.mailer.sent).toHaveLength(1);
    expect(deps.mailer.sent[0]).toMatchObject({ to: "owner@example.test", replyTo: "morgan.lee@example.test", subject: "New private training request" });
    expect(deps.mailer.sent[0]!.text).toContain("Riley Lee (age 12)");
  });

  it("silently drops a scripted submission that fills the honeypot", async () => {
    const res = await call(deps, privateTraining, post("/api/private-training", { ...request, website: "http://spam.example" }));
    expect(res.status).toBe(201);
    expect(await countRows(db, "private_training_requests")).toBe(0);
  });

  it("rate-limits repeated submissions from one address", async () => {
    const ip = "198.51.100.7";
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) statuses.push((await call(deps, privateTraining, post("/api/private-training", request, ip))).status);
    expect(statuses).toEqual([201, 201, 201, 201, 201, 429]);
  });

  it("rejects malformed input", async () => {
    const res = await call(deps, privateTraining, post("/api/private-training", { ...request, email: "bad", playerAge: "twelve" }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/waitlist", () => {
  it("saves entries for a session or a Miami group and adds contacts", async () => {
    const week1 = await sessionBySlug(db, "arlington-catholic", "week-of-july-12");
    const base = { parentName: "Morgan Lee", email: "morgan.lee@example.test", phone: "617-555-0199", town: "Newton" };
    expect((await call(deps, joinWaitlist, post("/api/waitlist", { ...base, sessionId: week1, spots: 2 }))).status).toBe(201);
    expect((await call(deps, joinWaitlist, post("/api/waitlist", { ...base, miamiGroup: "girls", marketingOptIn: true }))).status).toBe(201);
    expect((await call(deps, joinWaitlist, post("/api/waitlist", { ...base }))).status).toBe(400);

    const rows = await db`select session_id is not null as session, miami_group, spots from public.waitlist_entries order by created_at`;
    expect(rows).toEqual([
      { session: true, miami_group: null, spots: 2 },
      { session: false, miami_group: "girls", spots: 1 },
    ]);
    const [contact] = await db`select sources, consent from public.contacts`;
    expect(contact).toEqual({ sources: ["waitlist"], consent: "granted" });
  });
});
