/** Settings → To do, and the private-training packages editor. */
import { z } from "zod"
import { asAdmin, requireAdmin } from "../lib/admin-auth.js"
import type { Deps } from "../lib/deps.js"
import { ApiError, json, parse, readJson } from "../lib/http.js"
import { applyDecision, confirmTodo, isOpen, listTodos, reopenTodo, sortTodos } from "../lib/todos.js"

type Handler = (req: Request, deps: Deps) => Promise<Response>

const todos: Handler = async (req, deps) => {
  await requireAdmin(req, deps)
  const items = sortTodos(await listTodos(deps.db, deps.env))
  const open = items.filter(isOpen)
  return json({ todos: items, open: open.length, blockers: open.filter((t) => t.severity === "blocker").length })
}

const Key = z.string().regex(/^[a-z_]{2,40}$/)

const todoApply: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const { key, option, confirm } = parse(z.object({ key: Key, option: z.string().regex(/^[a-z]{2,20}$/), confirm: z.boolean().default(false) }), await readJson(req))
  await asAdmin(deps, user, async (tx) => {
    await applyDecision(tx, key, option)
    if (confirm) await confirmTodo(tx, key, user.email, option)
  })
  return json({ ok: true })
}

const todoConfirm: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const { key, reopen } = parse(z.object({ key: Key, reopen: z.boolean().default(false) }), await readJson(req))
  const known = (await listTodos(deps.db, deps.env)).find((t) => t.key === key)
  if (!known) throw new ApiError(404, "not_found", "Unknown item.")
  if (!reopen && !known.confirmable) throw new ApiError(422, "validation_failed", "This one clears itself once it's fixed.")
  await asAdmin(deps, user, (tx) => (reopen ? reopenTodo(tx, key) : confirmTodo(tx, key, user.email, known.options?.find((o) => o.current)?.id)))
  return json({ ok: true })
}

const Packages = z
  .array(
    z.object({
      id: z.string().trim().regex(/^[a-z0-9_]{2,40}$/, "Package ids use lowercase letters, numbers and _ (they must match the site's buttons)."),
      name: z.string().trim().min(2).max(100),
      cents: z.int().min(50).max(10_000_000),
    }),
  )
  .max(20)
  .refine((list) => new Set(list.map((p) => p.id)).size === list.length, { message: "Each package needs its own id." })

const trainingPackagesSave: Handler = async (req, deps) => {
  const user = await requireAdmin(req, deps)
  const { packages } = parse(z.object({ packages: Packages }), await readJson(req))
  await asAdmin(deps, user, (tx) => tx`
    insert into public.settings (key, value) values ('training_packages', ${tx.json(packages)})
    on conflict (key) do update set value = excluded.value, updated_at = now()`)
  return json({ ok: true })
}

export const TODO_GET: Record<string, Handler> = { todos }
export const TODO_POST: Record<string, Handler> = { "todo-apply": todoApply, "todo-confirm": todoConfirm, "training-packages-save": trainingPackagesSave }
