import { useCallback, useState } from "react"
import { ClipboardListIcon, DollarSignIcon, DownloadIcon, UsersIcon, TrendingUpIcon } from "lucide-react"

import type { Api } from "../api"
import { downloadCsv, stamp } from "../csv"
import { calendarDate } from "../format"
import { useLoad } from "../useLoad"
import { BarList, ColumnChart, toWeeks } from "@/components/app/charts"
import { DateRange, PillTabs } from "@/components/app/kit"
import { StatCard } from "@/components/app/stat-card"
import { ErrorState, PageHeader } from "@/components/app/states"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export interface Navigate {
  (tab: string, params?: Record<string, string>): void
}

interface AnalyticsData {
  totals: { registrations: number; families: number; revenue_cents: number }
  daily: { day: string; registrations: number }[]
  byProgram: { program: string; session_id: string | null; miami_group: string | null; registrations: number }[]
  byTown: { town: string; registrations: number }[]
  miami: { grp: string; label: string; cap: number; paid: number }[]
}

export function Analytics({ api, onExpired, refreshKey, navigate }: { api: Api; onExpired: () => void; refreshKey: number; navigate: Navigate }) {
  const [range, setRange] = useState({ from: "", to: "" })
  const [grain, setGrain] = useState<"daily" | "weekly">("weekly")
  const load = useCallback(() => api<AnalyticsData>(`analytics?from=${range.from}&to=${range.to}`), [api, range])
  const { data, error, loading, reload } = useLoad(load, onExpired, refreshKey)

  const series = data ? (grain === "weekly" ? toWeeks(data.daily) : data.daily.slice(-60)) : []
  const avg = data && data.totals.registrations ? Math.round(data.totals.revenue_cents / data.totals.registrations / 100) : 0
  const rangeParams = { ...(range.from ? { from: range.from } : {}), ...(range.to ? { to: range.to } : {}) }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Where registrations come from. Paid registrations only; refunds and cancellations are left out."
        actions={<DateRange from={range.from} to={range.to} onChange={setRange} />}
      />

      {loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
      ) : error && !data ? (
        <Card><ErrorState message={error} onRetry={reload} /></Card>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Registrations" value={data.totals.registrations} icon={ClipboardListIcon} tone="brand" hint="Players registered (one per session)" />
            <StatCard label="Families" value={data.totals.families} icon={UsersIcon} tone="info" hint="Distinct parent emails" />
            <StatCard label="Registration revenue" prefix="$" value={Math.round(data.totals.revenue_cents / 100)} icon={DollarSignIcon} hint="After discounts, before refunds" />
            <StatCard label="Average per registration" prefix="$" value={avg} icon={TrendingUpIcon} tone="warning" hint="Revenue ÷ registrations" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Registrations over time</CardTitle>
              <CardDescription>{grain === "weekly" ? "Per week (weeks start Monday)" : "Per day, last 60 days of the range"}</CardDescription>
              <CardAction className="flex items-center gap-2">
                <PillTabs id="grain" value={grain} onChange={setGrain} options={[{ value: "daily", label: "Daily" }, { value: "weekly", label: "Weekly" }]} />
                <Button variant="outline" size="sm" onClick={() => downloadCsv(`footyup-registrations-${grain}-${stamp()}.csv`, [{ header: grain === "weekly" ? "Week of" : "Day", value: (r: { day: string }) => r.day }, { header: "Registrations", value: (r: { registrations: number }) => r.registrations }], series)}>
                  <DownloadIcon /> CSV
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <ColumnChart
                data={series.map((d) => ({ label: calendarDate(d.day).replace(/, \d{4}$/, ""), title: grain === "weekly" ? `week of ${calendarDate(d.day)}` : calendarDate(d.day), value: d.registrations }))}
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle className="text-base">By camp and session</CardTitle>
                <CardDescription>Click a row to see those registrations</CardDescription>
                <CardAction>
                  <Button variant="outline" size="sm" onClick={() => downloadCsv(`footyup-by-program-${stamp()}.csv`, [{ header: "Program", value: (r: AnalyticsData["byProgram"][number]) => r.program }, { header: "Registrations", value: (r: AnalyticsData["byProgram"][number]) => r.registrations }], data.byProgram)}>
                    <DownloadIcon /> CSV
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <BarList data={data.byProgram.map((p) => ({ label: p.program, value: p.registrations }))} onSelect={(program) => navigate("registrations", { program, ...rangeParams })} />
              </CardContent>
            </Card>
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle className="text-base">Top towns</CardTitle>
                <CardDescription>Parent's town. Click to see those families</CardDescription>
                <CardAction>
                  <Button variant="outline" size="sm" onClick={() => downloadCsv(`footyup-by-town-${stamp()}.csv`, [{ header: "Town", value: (r: { town: string }) => r.town }, { header: "Registrations", value: (r: { registrations: number }) => r.registrations }], data.byTown)}>
                    <DownloadIcon /> CSV
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <BarList data={data.byTown.map((t) => ({ label: t.town, value: t.registrations }))} color="bg-sky-500/15" onSelect={(town) => navigate("registrations", { town, ...rangeParams })} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Miami combine: how full each group is</CardTitle>
              <CardDescription>Paid registrations against the spot limit (all time)</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              {data.miami.map((g) => (
                <button key={g.grp} onClick={() => navigate("registrations", { program: `Miami – ${g.label}` })} className="hover:bg-muted/40 rounded-lg p-3 text-left transition-colors">
                  <div className="mb-2 flex items-baseline justify-between text-sm">
                    <span className="font-medium">{g.label}</span>
                    <span className="tabular-nums"><span className="font-semibold">{g.paid}</span> <span className="text-muted-foreground">/ {g.cap} · {g.cap ? Math.round((g.paid / g.cap) * 100) : 0}%</span></span>
                  </div>
                  <div className="bg-muted h-2.5 overflow-hidden rounded-full">
                    <div className={g.grp === "boys" ? "h-full rounded-full bg-sky-500" : "h-full rounded-full bg-pink-500"} style={{ width: `${g.cap ? Math.min(100, (g.paid / g.cap) * 100) : 0}%` }} />
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
          <p className="text-muted-foreground text-xs">Totals here always match the Registrations page for the same filters. Revenue figures: see <button className="text-foreground underline underline-offset-2" onClick={() => navigate("revenue", rangeParams)}>Revenue</button> for gross, discounts, refunds and net.</p>
        </>
      ) : null}
    </div>
  )
}
