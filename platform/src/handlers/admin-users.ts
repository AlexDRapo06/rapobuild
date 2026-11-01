/** Settings → Admins: who can sign in to the dashboard. */
import { z } from "zod"
import { requireAdmin } from "../lib/admin-auth.js"
import { grantAdmin, inviteMode, listAdmins, revokeAdmin } from "../lib/admins.js"
import type { Deps } from "../lib/deps.js"
import { json, parse, readJson } from "../lib/http.js"

type Handler = (req: Request, deps: Deps) => Promise<Response>

const admins: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  return json({ admins: await listAdmins(deps.db, deps.env), you: user.id, inviteMode: inviteMode(deps.env) })
}

const adminAdd: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const { email } = parse(z.object({ email: z.string().trim().toLowerCase().pipe(z.email({ error: "Enter a valid email address." }).max(254)) }), await readJson(req))
  return json(await grantAdmin(deps.db, deps.env, email, user.email))
}

const adminRemove: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const { userId } = parse(z.object({ userId: z.uuid() }), await readJson(req))
  return json({ ok: true, email: await revokeAdmin(deps.db, userId, user.id) })
}

export const ADMIN_USERS_GET: Record<string, Handler> = { admins }
export const ADMIN_USERS_POST: Record<string, Handler> = { "admin-add": adminAdd, "admin-remove": adminRemove }
