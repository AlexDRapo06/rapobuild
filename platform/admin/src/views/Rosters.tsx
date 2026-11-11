import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangleIcon, ArrowLeftIcon, CalendarDaysIcon, CheckCircle2Icon, ClipboardCheckIcon, ClockIcon, DownloadIcon, MapPinIcon, PrinterIcon, SearchIcon, UsersIcon } from "lucide-react"

import type { Api } from "../api"
import { downloadCsv, stamp } from "../csv"
import { dateRange } from "../format"
import { useLoad } from "../useLoad"
import { PillTabs } from "@/components/app/kit"
import { EmptyState, ErrorState, PageHeader, TableSkeleton } from "@/components/app/states"
import { ProgramDot } from "@/components/app/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface RosterSummary {
  id?: string
  grp?: string
  camp_id?: string
  camp: string
  session: string
  starts_on: string | null
  ends_on: string | null
  start_time: string | null
  location: string | null
  age_min: number | null
  age_max: number | null
  capacity: number | null
  status?: "open" | "closed"
  players: number
  waivers_missing: number
}
type Player = {
  id: string
  player_name: string
  player_age: number
  player_sex: string | null
  parent_name: string
  parent_phone: string | null
  emergency_phone: string | null
  waiver_status: string
  payment_status: string
  shirt_size: string | null
  short_size: string | null
}
interface RosterData {
  header: { camp: string; session: string; starts_on: string | null; ends_on: string | null; start_time: string | null; location: string | null }
  players: Player[]
}

function lastFirst(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length > 1 ? `${parts.at(-1)}, ${parts.slice(0, -1).join(" ")}` : name
}

function timeLabel(t: string | null) {
  if (!t) return null
  const [h, m] = t.split(":").map(Number)
  return new Date(Date.UTC(2000, 0, 1, h, m)).toLocaleTimeString("en-US", { timeZone: "UTC", hour: "numeric", minute: "2-digit" })
}

const ages = (min: number | null, max: number | null) => (min === null && max === null ? "All ages" : `Ages ${min ?? "?"}–${max ?? "?"}`)
const paymentLabel = (s: string) => (s === "paid" ? "Paid" : s === "partially_refunded" ? "Part refund" : "Refunded")

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "warn" | "ok" }) {
  return (
    <div className={cn("rounded-lg border px-3 py-2", tone === "warn" && "border-amber-200 bg-amber-50", tone === "ok" && "border-emerald-200 bg-emerald-50")}>
      <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">{label}</p>
      <p className={cn("text-lg font-semibold tabular-nums", tone === "warn" && "text-amber-800", tone === "ok" && "text-emerald-800")}>{value}</p>
    </div>
  )
}

type Sort = "last" | "age" | "parent"

function RosterSheet({ api, onExpired, target, onBack }: { api: Api; onExpired: () => void; target: RosterSummary; onBack: () => void }) {
  const query = target.id ? `session=${target.id}` : `group=${target.grp}`
  const load = useCallback(() => api<RosterData>(`roster?${query}`), [api, query])
  const { data, error, loading, reload } = useLoad(load, onExpired)
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<Sort>("last")
  const miami = Boolean(target.grp)

  const players = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = (data?.players ?? []).filter((p) => !q || `${p.player_name} ${p.parent_name} ${p.parent_phone ?? ""}`.toLowerCase().includes(q))
    if (sort === "age") return [...list].sort((a, b) => a.player_age - b.player_age || lastFirst(a.player_name).localeCompare(lastFirst(b.player_name)))
    if (sort === "parent") return [...list].sort((a, b) => a.parent_name.localeCompare(b.parent_name))
    return list
  }, [data, search, sort])

  const all = data?.players ?? []
  const missingWaivers = all.filter((p) => p.waiver_status !== "accepted").length
  const notPaid = all.filter((p) => p.payment_status !== "paid").length
  const youngest = all.length ? Math.min(...all.map((p) => p.player_age)) : null
  const oldest = all.length ? Math.max(...all.map((p) => p.player_age)) : null

  function csv() {
    if (!data) return
    downloadCsv(`roster-${target.session.replace(/\W+/g, "-")}-${stamp()}.csv`, [
      { header: "Player", value: (p: Player) => lastFirst(p.player_name) },
      { header: "Age", value: (p) => p.player_age },
      { header: "Parent", value: (p) => p.parent_name },
      { header: "Phone", value: (p) => p.parent_phone },
      ...(miami ? [{ header: "Emergency phone", value: (p: Player) => p.emergency_phone }, { header: "Shirt", value: (p: Player) => p.shirt_size }, { header: "Shorts", value: (p: Player) => p.short_size }] : []),
      { header: "Waiver", value: (p) => (p.waiver_status === "accepted" ? "Signed" : "Missing") },
      { header: "Payment", value: (p) => paymentLabel(p.payment_status) },
      { header: "Checked in", value: () => "" },
      { header: "Notes", value: () => "" },
    ], data.players)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" onClick={onBack}><ArrowLeftIcon /> All rosters</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={csv} disabled={!data}><DownloadIcon /> Download CSV</Button>
          <Button onClick={() => window.print()} disabled={!data}><PrinterIcon /> Print check-in sheet</Button>
        </div>
      </div>
      {loading && !data ? <Card><TableSkeleton /></Card> : error && !data ? <Card><ErrorState message={error} onRetry={reload} /></Card> : data ? (
        <Card className="roster-print gap-0 py-0 print:border-0 print:shadow-none">
          <div className="space-y-4 border-b p-6 print:px-0 print:pt-0">
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Check-in sheet</p>
              <h2 className="mt-1 text-xl font-semibold">{data.header.camp}</h2>
              <p className="text-base">{data.header.session}</p>
              <p className="text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="inline-flex items-center gap-1"><CalendarDaysIcon className="size-3.5" />{dateRange(data.header.starts_on, data.header.ends_on)}</span>
                {data.header.start_time && <span className="inline-flex items-center gap-1"><ClockIcon className="size-3.5" />Starts {timeLabel(data.header.start_time)}</span>}
                {data.header.location && <span className="inline-flex items-center gap-1"><MapPinIcon className="size-3.5" />{data.header.location}</span>}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Players" value={`${all.length}${target.capacity ? ` / ${target.capacity}` : ""}`} />
              <Stat label="Ages" value={youngest === null ? "—" : youngest === oldest ? youngest : `${youngest}–${oldest}`} />
              <Stat label="Waivers missing" value={missingWaivers} tone={missingWaivers ? "warn" : "ok"} />
              <Stat label="Not fully paid" value={notPaid} tone={notPaid ? "warn" : "ok"} />
            </div>
          </div>
          {all.length === 0 ? <EmptyState icon={UsersIcon} title="No players registered yet">Players appear here as soon as their payment goes through.</EmptyState> : (
            <>
              <div className="flex flex-wrap items-center gap-3 border-b px-6 py-3 print:hidden">
                <div className="relative min-w-48 flex-1">
                  <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                  <Input className="h-8 pl-8 text-sm" placeholder="Find a player, parent or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <span className="text-muted-foreground text-xs">Sort by</span>
                <PillTabs id="roster-sort" value={sort} onChange={setSort} options={[{ value: "last", label: "Last name" }, { value: "age", label: "Age" }, { value: "parent", label: "Parent" }]} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b text-left text-xs">
                      <th className="w-10 px-3 py-2.5 pl-6 font-medium print:pl-0">#</th>
                      <th className="px-3 py-2.5 font-medium">Player</th>
                      <th className="px-3 py-2.5 font-medium">Age</th>
                      <th className="px-3 py-2.5 font-medium">Parent</th>
                      <th className="px-3 py-2.5 font-medium">Phone</th>
                      {miami && <th className="px-3 py-2.5 font-medium">Shirt / shorts</th>}
                      <th className="px-3 py-2.5 font-medium">Waiver</th>
                      <th className="px-3 py-2.5 font-medium">Payment</th>
                      <th className="w-16 px-3 py-2.5 text-center font-medium">Here</th>
                      <th className="w-40 px-3 py-2.5 pr-6 font-medium print:pr-0">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((p, i) => (
                      <tr key={p.id} className="border-b last:border-0 break-inside-avoid">
                        <td className="text-muted-foreground px-3 py-2.5 pl-6 tabular-nums print:pl-0">{i + 1}</td>
                        <td className="px-3 py-2.5 font-medium whitespace-nowrap">{lastFirst(p.player_name)}</td>
                        <td className="px-3 py-2.5 tabular-nums">{p.player_age}</td>
                        <td className="px-3 py-2.5">{p.parent_name}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{p.parent_phone ?? <span className="text-muted-foreground">—</span>}{p.emergency_phone && <div className="text-muted-foreground text-xs">Emergency {p.emergency_phone}</div>}</td>
                        {miami && <td className="px-3 py-2.5 whitespace-nowrap">{p.shirt_size ?? "—"} / {p.short_size ?? "—"}</td>}
                        <td className="px-3 py-2.5">{p.waiver_status === "accepted" ? "Signed" : <span className="font-medium text-amber-700">Missing</span>}</td>
                        <td className="px-3 py-2.5">{p.payment_status === "paid" ? "Paid" : <span className="font-medium text-amber-700">{paymentLabel(p.payment_status)}</span>}</td>
                        <td className="px-3 py-2.5 text-center"><span className="inline-block size-5 rounded border-2 border-zinc-400" aria-label="Check-in box" /></td>
                        <td className="px-3 py-2.5 pr-6 print:pr-0"><span className="block h-5 border-b border-zinc-300" /></td>
                      </tr>
                    ))}
                    {players.length === 0 && <tr><td colSpan={miami ? 10 : 9} className="text-muted-foreground px-6 py-8 text-center">No players match “{search}”.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <p className="text-muted-foreground border-t px-6 py-3 text-xs print:px-0">
            Tick “Here” as each player arrives. Printed {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}. Heights, weights and home addresses are never printed on rosters.
          </p>
        </Card>
      ) : null}
    </div>
  )
}

function SessionCard({ r, onOpen }: { r: RosterSummary; onOpen: () => void }) {
  const program = r.grp ? `Combine – ${r.session}` : `${r.camp} – ${r.session}`
  const pct = r.capacity ? Math.min(100, Math.round((r.players / r.capacity) * 100)) : null
  return (
    <button onClick={onOpen} className={cn("bg-card hover:border-foreground/20 flex flex-col gap-3 rounded-xl border p-5 text-left shadow-xs transition-all hover:shadow-md", r.players === 0 && "opacity-75")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-medium"><ProgramDot program={program} />{r.session}</p>
          <p className="text-muted-foreground mt-1 text-xs">{ages(r.age_min, r.age_max)}{r.start_time ? ` · starts ${timeLabel(r.start_time)}` : ""}</p>
        </div>
        {r.status === "closed" && <Badge variant="secondary">Registration closed</Badge>}
      </div>
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs"><CalendarDaysIcon className="size-3.5 shrink-0" />{dateRange(r.starts_on, r.ends_on)}</p>
      {r.location && <p className="text-muted-foreground flex items-center gap-1.5 truncate text-xs"><MapPinIcon className="size-3.5 shrink-0" />{r.location}</p>}
      <div className="space-y-1.5">
        <p className="flex items-baseline justify-between text-sm">
          <span><span className="text-lg font-semibold tabular-nums">{r.players}</span> <span className="text-muted-foreground">{r.capacity ? `of ${r.capacity} spots` : r.players === 1 ? "player" : "players"}</span></span>
          {pct !== null && <span className="text-muted-foreground text-xs tabular-nums">{pct}% full</span>}
        </p>
        {pct !== null && <div className="bg-muted h-1.5 overflow-hidden rounded-full"><div className={cn("h-full rounded-full", pct >= 100 ? "bg-red-500" : pct >= 85 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${pct}%` }} /></div>}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
        {r.players === 0 ? <span className="text-muted-foreground text-xs">No players yet</span>
          : r.waivers_missing ? <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700"><AlertTriangleIcon className="size-3.5" />{r.waivers_missing} waiver{r.waivers_missing === 1 ? "" : "s"} missing</span>
          : <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><CheckCircle2Icon className="size-3.5" />All waivers signed</span>}
        <span className="text-brand-strong inline-flex items-center gap-1 text-xs font-medium"><PrinterIcon className="size-3.5" /> Open sheet</span>
      </div>
    </button>
  )
}

export function Rosters({ api, onExpired, refreshKey }: { api: Api; onExpired: () => void; refreshKey: number }) {
  const load = useCallback(() => api<{ sessions: RosterSummary[]; groups: RosterSummary[] }>("rosters"), [api])
  const { data, error, loading, reload } = useLoad(load, onExpired, refreshKey)
  const [target, setTarget] = useState<RosterSummary | null>(null)
  const [search, setSearch] = useState("")
  const [onlyWithPlayers, setOnlyWithPlayers] = useState(false)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [target])

  const sections = useMemo(() => {
    const q = search.trim().toLowerCase()
    const keep = (r: RosterSummary) => (!onlyWithPlayers || r.players > 0) && (!q || `${r.camp} ${r.session}`.toLowerCase().includes(q))
    const out: { key: string; title: string; rows: RosterSummary[] }[] = []
    const groups = (data?.groups ?? []).filter(keep)
    if (groups.length) out.push({ key: "miami", title: groups[0]!.camp, rows: groups })
    for (const s of (data?.sessions ?? []).filter(keep)) {
      const key = s.camp_id ?? s.camp
      const section = out.find((o) => o.key === key)
      if (section) section.rows.push(s)
      else out.push({ key, title: s.camp, rows: [s] })
    }
    return out
  }, [data, search, onlyWithPlayers])

  if (target) return <RosterSheet api={api} onExpired={onExpired} target={target} onBack={() => setTarget(null)} />
  const total = [...(data?.groups ?? []), ...(data?.sessions ?? [])]
  return (
    <div className="space-y-6">
      <PageHeader title="Rosters" description="One check-in sheet per session and Combine group. Open one to see every player, print it for coaches, or download it as a spreadsheet." />
      {loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}</div>
      ) : error && !data ? <Card><ErrorState message={error} onRetry={reload} /></Card> : total.length === 0 ? (
        <Card><EmptyState icon={ClipboardCheckIcon} title="No sessions yet">Add camps and sessions in Settings → Camps & sessions.</EmptyState></Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-56 flex-1 sm:max-w-sm">
              <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input className="pl-8" placeholder="Find a camp or session" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <PillTabs id="roster-filter" value={onlyWithPlayers ? "players" : "all"} onChange={(v) => setOnlyWithPlayers(v === "players")} options={[{ value: "all", label: `All sessions (${total.length})` }, { value: "players", label: `With players (${total.filter((r) => r.players > 0).length})` }]} />
          </div>
          {sections.length === 0 ? <Card><EmptyState icon={SearchIcon} title="Nothing matches">Try a different name or show all sessions.</EmptyState></Card> : sections.map((section) => (
            <section key={section.key} className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-semibold">{section.title}</h2>
                <p className="text-muted-foreground text-sm tabular-nums">{section.rows.reduce((n, r) => n + r.players, 0)} players · {section.rows.length} {section.rows.length === 1 ? "session" : "sessions"}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {section.rows.map((r) => <SessionCard key={r.id ?? r.grp} r={r} onOpen={() => setTarget(r)} />)}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  )
}
