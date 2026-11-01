import { createSql } from "../src/lib/db.js";

/** Scripts prefer the direct (non-pooled) connection when one is configured. */
export function scriptDb() {
  const url = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error("Set DATABASE_URL (or DIRECT_DATABASE_URL) in .env first. See .env.example.");
    process.exit(1);
  }
  return createSql(url, { max: 1 });
}

export function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
}
