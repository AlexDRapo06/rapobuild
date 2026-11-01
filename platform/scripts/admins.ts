/**
 * Manage the dashboard admins from the terminal. Admins can also do this in
 * the dashboard: Settings → Admins.
 *
 *   pnpm admins add <email>      Supabase: sends an invite email to set a password, then grants admin.
 *                                Local (no SUPABASE_URL): creates the user locally for the dev login.
 *   pnpm admins list
 *   pnpm admins remove <email>   Revokes dashboard access (the Supabase login itself is kept).
 *
 * Supabase mode needs SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (server secret, never
 * in the browser) and PUBLIC_ADMIN_URL (where the invite link lands, e.g. https://.../admin/).
 */
import { grantAdmin, listAdmins, revokeAdmin } from "../src/lib/admins.js";
import { scriptDb } from "./_db.js";

const [command, rawEmail] = process.argv.slice(2);
const email = rawEmail?.trim().toLowerCase();
const sql = scriptDb();
const env = {
  supabaseUrl: process.env.SUPABASE_URL?.replace(/\/+$/, "") || undefined,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
  databaseUrl: (process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL)!,
  adminUrl: process.env.PUBLIC_ADMIN_URL || undefined,
};

const MESSAGES = {
  invited: "Invite email sent. They set their password from the link.",
  existing_login: "They already had a login; dashboard access granted.",
  local: "Local user ready. Sign in at /admin/ with the dev login.",
  already_admin: "Already an admin.",
};

try {
  if (command === "add" && email) {
    const { result } = await grantAdmin(sql, env, email, "terminal");
    const [{ n }] = (await sql<{ n: number }[]>`select count(*)::int as n from public.admin_users`) as [{ n: number }];
    console.log(`${email}: ${MESSAGES[result]} Admins now: ${n}.`);
  } else if (command === "list") {
    console.table((await listAdmins(sql, env)).map((a) => ({ email: a.email, added: a.createdAt, by: a.invitedBy ?? "", status: a.status ?? "" })));
  } else if (command === "remove" && email) {
    const [row] = await sql<{ user_id: string }[]>`select user_id from public.admin_users where lower(email) = ${email}`;
    if (!row) console.log(`${email} was not an admin.`);
    else console.log(`${await revokeAdmin(sql, row.user_id, null)} no longer has dashboard access.`);
  } else {
    console.error("Usage: pnpm admins add|remove <email> | list");
    process.exit(1);
  }
} catch (err) {
  console.error((err as Error).message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
