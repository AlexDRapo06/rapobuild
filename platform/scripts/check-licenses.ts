/**
 * Fails if any installed package (direct or transitive, dev included) uses a
 * license outside the agreement's allow-list: MIT, Apache, BSD, ISC.
 */
import { execFileSync } from "node:child_process";

const ALLOWED = /^(MIT|ISC|Apache-2\.0|BSD-2-Clause|BSD-3-Clause|0BSD)$/;

const report = JSON.parse(execFileSync("pnpm", ["licenses", "list", "--json"], { encoding: "utf8" })) as Record<
  string,
  { name: string; versions: string[] }[]
>;

let bad = 0;
for (const [license, packages] of Object.entries(report).sort()) {
  const ok = ALLOWED.test(license);
  if (!ok) bad += packages.length;
  console.log(`${ok ? "ok  " : "FAIL"} ${license}: ${packages.map((p) => `${p.name}@${p.versions.join("/")}`).join(", ")}`);
}

if (bad) {
  console.error(`\n${bad} package(s) use a license outside MIT/Apache/BSD/ISC.`);
  process.exit(1);
}
console.log("\nAll packages use permitted licenses.");
