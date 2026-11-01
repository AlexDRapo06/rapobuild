import { useCallback, useState } from "react"
import { MailIcon, ShieldCheckIcon, UserPlusIcon, UserXIcon } from "lucide-react"

import type { Api } from "../../api"
import { dateTime } from "../../format"
import { useLoad } from "../../useLoad"
import { ConfirmDialog, Field } from "@/components/app/kit"
import { ErrorState, NameAvatar } from "@/components/app/states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Notice } from "@/components/ui/form-controls"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

interface AdminRow {
  userId: string
  email: string
  createdAt: string
  invitedBy: string | null
  status: "active" | "invite_pending" | null
  lastSignInAt: string | null
}

interface AdminsData {
  admins: AdminRow[]
  you: string
  inviteMode: "supabase" | "local" | "unavailable"
}

const ADDED: Record<string, (email: string) => string> = {
  invited: (e) => `Invite sent to ${e}. They choose a password from the link in that email, then sign in here.`,
  existing_login: (e) => `${e} already had a login, so they can sign in now with their password. Let them know.`,
  local: (e) => `${e} can sign in now (local test mode: no password).`,
  already_admin: (e) => `${e} is already an admin.`,
}

export function AdminSettings({ api, onExpired }: { api: Api; onExpired: () => void }) {
  const load = useCallback(() => api<AdminsData>("admins"), [api])
  const { data, error, loading, reload } = useLoad(load, onExpired)
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null)
  const [removing, setRemoving] = useState<AdminRow | null>(null)

  async function add() {
    setBusy(true)
    setMsg(null)
    try {
      const res = await api<{ email: string; result: string }>("admin-add", { email })
      setMsg({ tone: "success", text: ADDED[res.result]?.(res.email) ?? `${res.email} added.` })
      setEmail("")
      reload()
    } catch (err) {
      setMsg({ tone: "error", text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!removing) return
    setBusy(true)
    try {
      await api("admin-remove", { userId: removing.userId })
      setMsg({ tone: "success", text: `${removing.email} can no longer open the dashboard.` })
      setRemoving(null)
      reload()
    } catch (err) {
      setMsg({ tone: "error", text: (err as Error).message })
      setRemoving(null)
    } finally {
      setBusy(false)
    }
  }

  if (loading && !data) return <Skeleton className="h-72 rounded-xl" />
  if (error && !data) return <Card><ErrorState message={error} onRetry={reload} /></Card>
  if (!data) return null
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add an admin</CardTitle>
          <CardDescription>Admins see everything in this dashboard (families, payments, contacts) and can change settings and send email. Only add people who work for Footy Up.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.inviteMode === "unavailable" ? (
            <Notice tone="info" title="Invites aren't switched on for this deployment">
              Ivy Devs needs to add <code>SUPABASE_SERVICE_ROLE_KEY</code> to this project's environment variables on Vercel. Until then, admins are added from the terminal with <code>pnpm admins add &lt;email&gt;</code>.
            </Notice>
          ) : (
            <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(e) => { e.preventDefault(); if (validEmail) add() }}>
              <Field label="Email" className="flex-1" hint={data.inviteMode === "supabase" ? "They get an email from Footy Up's login service with a link to choose a password." : "Local test mode: they can sign in right away, no password."}>
                <div className="relative"><MailIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" /><Input className="pl-9" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="chris@footyup.net" /></div>
              </Field>
              <Button type="submit" disabled={busy || !validEmail} className="sm:mb-6"><UserPlusIcon /> {busy ? "Adding…" : data.inviteMode === "supabase" ? "Send invite" : "Add admin"}</Button>
            </form>
          )}
          {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="flex items-center gap-2 text-base"><ShieldCheckIcon className="size-4 text-emerald-600" />{data.admins.length} admin{data.admins.length === 1 ? "" : "s"}</CardTitle>
          <CardDescription>Removing someone takes effect immediately. Their login is kept, so you can add them back later.</CardDescription>
        </CardHeader>
        <ul className="divide-y">
          {data.admins.map((a) => {
            const you = a.userId === data.you
            return (
              <li key={a.userId} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <NameAvatar name={a.email} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 truncate font-medium">
                    {a.email}
                    {you && <Badge variant="secondary">You</Badge>}
                    {a.status === "invite_pending" && <Badge variant="warning-light">Invite not accepted yet</Badge>}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Added {dateTime(a.createdAt)}{a.invitedBy && a.invitedBy !== "terminal" ? ` by ${a.invitedBy}` : ""}
                    {a.lastSignInAt ? ` · last signed in ${dateTime(a.lastSignInAt)}` : ""}
                  </p>
                  {a.status === "invite_pending" && <p className="text-muted-foreground text-xs">If the invite link expired, they can use "Forgot password?" on the sign-in page.</p>}
                </div>
                {!you && data.admins.length > 1 && (
                  <Button variant="outline" size="sm" onClick={() => setRemoving(a)}><UserXIcon /> Remove</Button>
                )}
              </li>
            )
          })}
        </ul>
      </Card>

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Remove ${removing?.email ?? ""}?`}
        description="They'll be signed out of the dashboard on their next click and won't be able to open it again unless an admin adds them back."
        confirmLabel="Remove access"
        destructive
        busy={busy}
        onConfirm={remove}
      />
    </div>
  )
}
