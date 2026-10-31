/**
 * Copies the public website (the repo root's pages, scripts and images) into
 * ../dist, next to the dashboard that build-admin.ts puts in ../dist/admin.
 * Vercel serves ../dist; the functions in ../api are deployed separately.
 * Only what's listed here is published, so the back-end source never is.
 */
import { cp, mkdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve("..");
const out = join(root, "dist");
const SITE = ["index.html", "success.html", "cancel.html", "src", "public", "assets"];

await mkdir(out, { recursive: true });
for (const entry of SITE) {
  const from = join(root, entry);
  const exists = await stat(from).then(() => true, () => false);
  if (!exists) throw new Error(`build-site: ${entry} is missing from the repo root`);
  await cp(from, join(out, entry), { recursive: true });
}
console.log(`Site copied to dist/: ${SITE.join(", ")}`);
