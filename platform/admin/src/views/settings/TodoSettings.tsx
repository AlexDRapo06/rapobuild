import { useCallback, useState } from "react"
import { AlertOctagonIcon, ArrowRightIcon, CheckCircle2Icon, CircleAlertIcon, InfoIcon, RotateCcwIcon } from "lucide-react"

import type { Api } from "../../api"
import { dateTime } from "../../format"
import { useLoad } from "../../useLoad"
import { PillTabs } from "@/components/app/kit"
import { EmptyState, ErrorState } from "@/components/app/states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Notice } from "@/components/ui/form-controls"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type Severity = "blocker" | "warning" | "info"
interface TodoOption { id: string; label: string; detail: string; source: string; current: boolean }
interface Todo {
  key: string
  kind: "decision" | "check"
  severity: Severity
  title: string
  detail: string
  options?: TodoOption[]
  section?: string
  done: boolean
  confirmed: { by: string; at: string; option?: string } | null
  confirmable: boolean
}
interface TodosData { todos: Todo[]; open: number; blockers: number }

const SEVERITY: Record<Severity, { label: string; icon: typeof InfoIcon; badge: "destructive-light" | "warning-light" | "secondary"; ring: string }> = {
  blocker: { label: "Before launch", icon: AlertOctagonIcon, badge: "destructive-light", ring: "border-l-red-500" },
  warning: { label: "Needs attention", icon: CircleAlertIcon, badge: "warning-light", ring: "border-l-amber-400" },
  info: { label: "Good to know", icon: InfoIcon, badge: "secondary", ring: "border-l-zinc-300" },
}

const SECTION_LABELS: Record<string, string> = {
  camps: "Camps & sessions", miami: "Miami combine", codes: "Access codes", discounts: "Discounts & promo codes",
  waivers: "Waivers", email: "Email", admins: "Admins", training: "Private training",
}

type Filter = "open" | "done" | "all"
const isOpen = (t: Todo) => !t.done && !t.confirmed

function TodoCard({ todo, busy, onApply, onConfirm, onReopen, onSection }: {
  todo: Todo
  busy: boolean
  onApply: (option: string) => void
  onConfirm: () => void
  onReopen: () => void
  onSection: (section: string) => void
}) {
  const sev = SEVERITY[todo.severity]
  const open = isOpen(todo)
  const Icon = open ? sev.icon : CheckCircle2Icon
  return (
    <Card className={cn("gap-0 border-l-4 py-0", open ? sev.ring : "border-l-emerald-500 opacity-80")}>
      <div className="flex flex-wrap items-start gap-3 px-5 pt-4">
        <Icon className={cn("mt-0.5 size-5 shrink-0", open ? (todo.severity === "blocker" ? "text-red-600" : todo.severity === "warning" ? "text-amber-600" : "text-zinc-500") : "text-emerald-600")} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 font-medium">
            {todo.title}
            {open ? <Badge variant={sev.badge}>{sev.label}</Badge> : <Badge variant="success-light">{todo.done ? "Done" : "Confirmed"}</Badge>}
            {todo.kind === "decision" && <Badge variant="outline">Site vs Kickoff Form</Badge>}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">{todo.detail}</p>
          {todo.confirmed && (
            <p className="mt-1 text-xs text-emerald-700">
              Confirmed by {todo.confirmed.by} on {dateTime(todo.confirmed.at)}
              {todo.confirmed.option && todo.options ? `: ${todo.options.find((o) => o.id === todo.confirmed!.option)?.label ?? ""}` : ""}
            </p>
          )}
        </div>
      </div>

      {todo.options && (
        <div className="grid gap-3 px-5 pt-4 sm:grid-cols-2">
          {todo.options.map((o) => (
            <div key={o.id} className={cn("flex flex-col gap-2 rounded-lg border p-3", o.current && "border-emerald-500 bg-emerald-50/60")}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{o.label}</span>
                <Badge variant="outline" className="text-[11px]">{o.source}</Badge>
                {o.current && <Badge variant="success-light" className="text-[11px]">In use now</Badge>}
              </div>
              <p className="text-muted-foreground text-xs">{o.detail}</p>
              {!o.current && (
                <Button size="sm" variant="outline" className="self-start" disabled={busy} onClick={() => onApply(o.id)}>Use this</Button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 px-5 py-4">
        {open && todo.confirmable && (
          <Button size="sm" disabled={busy || (todo.options ? !todo.options.some((o) => o.current) : false)} onClick={onConfirm}>
            <CheckCircle2Icon /> {todo.options ? "Confirmed with the client" : "Mark done"}
          </Button>
        )}
        {open && todo.options && !todo.options.some((o) => o.current) && (
          <span className="text-muted-foreground text-xs">The current setting matches neither; pick one or edit it by hand.</span>
        )}
        {todo.confirmed && (
          <Button size="sm" variant="ghost" disabled={busy} onClick={onReopen}><RotateCcwIcon /> Reopen</Button>
        )}
        {todo.section && (
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => onSection(todo.section!)}>
            {SECTION_LABELS[todo.section] ?? "Open"} <ArrowRightIcon />
          </Button>
        )}
      </div>
    </Card>
  )
}

export function TodoSettings({ api, onExpired, onSection, onChanged }: { api: Api; onExpired: () => void; onSection: (section: string) => void; onChanged: () => void }) {
  const load = useCallback(() => api<TodosData>("todos"), [api])
  const { data, error, loading, reload } = useLoad(load, onExpired)
  const [filter, setFilter] = useState<Filter>("open")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null)

  async function run(fn: () => Promise<unknown>, success: string) {
    setBusy(true)
    setMsg(null)
    try {
      await fn()
      setMsg({ tone: "success", text: success })
      reload()
      onChanged()
    } catch (err) {
      setMsg({ tone: "error", text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  if (loading && !data) return <Skeleton className="h-96 rounded-xl" />
  if (error && !data) return <Card><ErrorState message={error} onRetry={reload} /></Card>
  if (!data) return null

  const shown = data.todos.filter((t) => (filter === "all" ? true : filter === "open" ? isOpen(t) : !isOpen(t)))
  const decisions = shown.filter((t) => t.kind === "decision")
  const checks = shown.filter((t) => t.kind === "check")
  const doneCount = data.todos.length - data.open

  const card = (t: Todo) => (
    <TodoCard
      key={t.key}
      todo={t}
      busy={busy}
      onApply={(option) => run(() => api("todo-apply", { key: t.key, option }), "Applied. The site and checkout use it now.")}
      onConfirm={() => run(() => api("todo-confirm", { key: t.key }), "Marked as confirmed.")}
      onReopen={() => run(() => api("todo-confirm", { key: t.key, reopen: true }), "Reopened.")}
      onSection={onSection}
    />
  )

  return (
    <div className="space-y-6">
      <Notice
        tone={data.blockers ? "error" : data.open ? "warning" : "success"}
        title={data.open ? `${data.open} open item${data.open === 1 ? "" : "s"}${data.blockers ? `, ${data.blockers} before launch` : ""}` : "Nothing left to do"}
      >
        Where the live site, the client's Kickoff Form and the Developer Brief disagree, pick the answer here and it's applied to the site and Stripe checkout straight away. Setup checks clear themselves once they're fixed.
      </Notice>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PillTabs id="todo-filter" value={filter} onChange={setFilter} options={[
          { value: "open", label: `Open (${data.open})` },
          { value: "done", label: `Done (${doneCount})` },
          { value: "all", label: "All" },
        ]} />
        {msg && <span className={msg.tone === "success" ? "text-sm text-emerald-700" : "text-destructive text-sm"}>{msg.text}</span>}
      </div>
      {shown.length === 0 && <Card><EmptyState icon={CheckCircle2Icon} title={filter === "open" ? "All done" : "Nothing here yet"} /></Card>}
      {decisions.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Decisions: the live site vs the Kickoff Form</h3>
          {decisions.map(card)}
        </section>
      )}
      {checks.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Setup and launch checks</h3>
          {checks.map(card)}
        </section>
      )}
    </div>
  )
}
