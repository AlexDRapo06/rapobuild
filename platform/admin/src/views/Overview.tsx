import { useCallback, useEffect, useState } from "react"
import { AlertOctagonIcon, ArrowRightIcon, CalendarDaysIcon, ClipboardListIcon, DollarSignIcon, HourglassIcon, MessageSquareTextIcon } from "lucide-react"

import type { Api } from "../api"
import { dateRange, dateTime, money } from "../format"
import { programOf, type MiamiGroupRow, type Overview as OverviewData } from "../types"
import { useLoad } from "../useLoad"
import { StatCard } from "@/components/app/stat-card"
import { EmptyState, ErrorState, NameAvatar, PageHeader } from "@/components/app/states"
import { ProgramDot } from "@/components/app/status-badge"
import { AnimatedCircularProgressBar } from "@/components/magicui/animated-circular-progress-bar"
import { BlurFade } from "@/components/magicui/blur-fade"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function miamiPhase(data: Pick<OverviewData, "event" | "codes">): { label: string; tone: "open" | "pending" | "closed"; detail: string } | null {
  const e = data.event
  if (!e) return null
  const now = Date.now()
  if (!e.checkout_open) return { label: "Checkout paused", tone: "closed", detail: "Turned off in settings" }
  if (e.closes_at && new Date(e.closes_at).getTime() <= now) return { label: "Registration closed", tone: "closed", detail: `Closed ${dateTime(e.closes_at)}` }
  if (e.opens_at && new Date(e.opens_at).getTime() > now) return { label: "Not open yet", tone: "pending", detail: `Opens ${dateTime(e.opens_at)}` }
  if (data.codes.required) return { label: "Access-code holders only", tone: "pending", detail: e.public_opens_at ? `Public from ${dateTime(e.public_opens_at)}` : "Public opening not set" }
  return { label: "Open to everyone", tone: "open", detail: e.closes_at ? `Closes ${dateTime(e.closes_at)}` : "No closing date" }
}

function GroupPanel({ g, codesActive }: { g: MiamiGroupRow; codesActive: boolean }) {
  const filled = g.paid + g.held
  const pct = g.cap ? Math.min(100, Math.round((filled / g.cap) * 100)) : 0
  const samePrice = g.price_code_holder_cents == null || g.price_code_holder_cents === g.price_public_cents
  const accent = g.grp === "boys" ? "var(--color-sky-500)" : "var(--color-pink-500)"
  return (
    <div className="flex flex-col gap-5 rounded-xl border bg-gradient-to-b from-muted/40 to-card p-5 sm:flex-row sm:items-center">
      <AnimatedCircularProgressBar
        value={pct}
        gaugePrimaryColor={accent}
        gaugeSecondaryColor="var(--color-zinc-200)"
        label="full"
        className="size-28 shrink-0 self-center text-xl"
      />
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <span className="size-2.5 rounded-full" style={{ background: accent }} aria-hidden />
            {g.label}
          </h3>
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <CalendarDaysIcon className="size-3.5" />
            {dateRange(g.starts_on, g.ends_on)}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground text-xs">Paid</dt>
            <dd className="font-semibold tabular-nums">
              {g.paid} <span className="text-muted-foreground font-normal">/ {g.cap}</span>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">In checkout now</dt>
            <dd className="font-semibold tabular-nums">{g.held}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Open to public</dt>
            <dd className="font-semibold tabular-nums">{g.left_for_public}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Open to code holders</dt>
            <dd className="font-semibold tabular-nums">{codesActive ? g.left_for_code_holders : "—"}</dd>
          </div>
        </dl>
        <p className="text-muted-foreground border-t pt-3 text-xs">
          Price <span className="text-foreground font-medium">{samePrice ? money(g.price_public_cents) : `${money(g.price_public_cents)} public · ${money(g.price_code_holder_cents)} host families`}</span>
        </p>
      </div>
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[134px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  )
}

export function Overview({ api, onExpired, refreshKey, navigate }: { api: Api; onExpired: () => void; refreshKey: number; navigate: (tab: string, params?: Record<string, string>) => void }) {
  const load = useCallback(() => api<OverviewData>("overview"), [api])
  const { data, error, loading, reload } = useLoad(load, onExpired, refreshKey)
  const [todos, setTodos] = useState<{ open: number; blockers: number } | null>(null)
  useEffect(() => {
    let alive = true
    api<{ open: number; blockers: number }>("todos").then((d) => alive && setTodos(d)).catch(() => {})
    return () => {
      alive = false
    }
  }, [api, refreshKey])

  if (loading && !data) return <OverviewSkeleton />
  if (error && !data) return <Card><ErrorState message={error} onRetry={reload} /></Card>
  if (!data) return null

  const phase = miamiPhase(data)
  const daily = data.daily ?? []
  const recent = data.recent ?? []
  const weekTotal = daily.slice(-7).reduce((s, d) => s + d.registrations, 0)
  const maxProgram = Math.max(1, ...data.byCamp.map((r) => r.registrations))
  const reserved = data.event?.reserved_total ?? 0

  return (
    <div className="space-y-6">
      <PageHeader title="Overview" description="Paid registrations only. Refunds are taken out automatically." />

      {todos && todos.open > 0 && (
        <button
          onClick={() => navigate("settings", { section: "todo" })}
          className={`flex w-full flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${todos.blockers ? "border-red-200 bg-red-50 hover:bg-red-100/70" : "border-amber-200 bg-amber-50 hover:bg-amber-100/70"}`}
        >
          <AlertOctagonIcon className={`size-5 shrink-0 ${todos.blockers ? "text-red-600" : "text-amber-600"}`} />
          <span className="min-w-0 flex-1">
            <span className="font-medium">{todos.open} thing{todos.open === 1 ? "" : "s"} to sort out{todos.blockers ? `, ${todos.blockers} before launch` : ""}</span>
            <span className="text-muted-foreground block text-xs">Including where the live site and the Kickoff Form disagree. Fix them in one click in Settings → To do.</span>
          </span>
          <span className="inline-flex items-center gap-1 font-medium">Open to-do list <ArrowRightIcon className="size-4" /></span>
        </button>
      )}

      <BlurFade delay={0.05} inView={false}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <button className="text-left" onClick={() => navigate("analytics")}><StatCard
            label="Registrations"
            value={data.totals.registrations}
            icon={ClipboardListIcon}
            tone="brand"
            trend={daily.map((d) => d.registrations)}
            hint={`${weekTotal} in the last 7 days · see analytics`}
          /></button>
          <button className="text-left" onClick={() => navigate("revenue")}><StatCard label="Collected" prefix="$" value={Math.round(data.totals.net_cents / 100)} icon={DollarSignIcon} hint="After refunds · see revenue" /></button>
          <button className="text-left" onClick={() => navigate("requests")}><StatCard label="New training requests" value={data.totals.new_requests} icon={MessageSquareTextIcon} tone="info" hint="From the website form" /></button>
          <button className="text-left" onClick={() => navigate("waitlist")}><StatCard label="On waitlists" value={data.totals.waiting} icon={HourglassIcon} tone="warning" hint="Waiting for a spot" /></button>
        </div>
      </BlurFade>

      {data.event && (
        <BlurFade delay={0.12} inView={false}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{data.event.name}</CardTitle>
              <CardDescription>
                {reserved > 0 && data.codes.active ? `${reserved} spots across both groups are held for host-school families. ` : ""}
                {phase?.detail}
              </CardDescription>
              {phase && (
                <CardAction>
                  <Badge
                    variant={phase.tone === "open" ? "success-light" : phase.tone === "pending" ? "warning-light" : "secondary"}
                    size="lg"
                    className="gap-1.5"
                  >
                    <span className="relative flex size-2">
                      {phase.tone === "open" && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
                      <span className="relative inline-flex size-2 rounded-full bg-current" />
                    </span>
                    {phase.label}
                  </Badge>
                </CardAction>
              )}
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              {data.miami.map((g) => (
                <button key={g.grp} className="text-left transition-transform hover:-translate-y-0.5" onClick={() => navigate("registrations", { program: `Miami – ${g.label}` })}>
                  <GroupPanel g={g} codesActive={data.codes.active} />
                </button>
              ))}
            </CardContent>
          </Card>
        </BlurFade>
      )}

      <BlurFade delay={0.18} inView={false}>
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="min-w-0 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Registrations by program</CardTitle>
              <CardDescription>Paid registrations per session and Miami group</CardDescription>
            </CardHeader>
            <CardContent>
              {data.byCamp.length === 0 ? (
                <EmptyState icon={ClipboardListIcon} title="No registrations yet" className="py-10">
                  They appear here as soon as Stripe confirms a payment.
                </EmptyState>
              ) : (
                <ul className="space-y-4">
                  {data.byCamp.map((row) => {
                    const program = row.kind === "miami" ? `Miami – ${row.session}` : `${row.camp} – ${row.session}`
                    return (
                      <li key={`${row.camp}-${row.session}`} className="hover:bg-muted/40 -mx-2 cursor-pointer space-y-1.5 rounded-md px-2 py-1" onClick={() => navigate("registrations", { program })}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="flex min-w-0 items-center gap-2">
                            <ProgramDot program={program} />
                            <span className="truncate">
                              <span className="font-medium">{row.kind === "miami" ? "Miami combine" : row.camp}</span>
                              <span className="text-muted-foreground"> · {row.session}</span>
                            </span>
                          </span>
                          <span className="font-semibold tabular-nums">{row.registrations}</span>
                        </div>
                        <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                          <div className="h-full rounded-full bg-brand transition-[width] duration-700" style={{ width: `${(row.registrations / maxProgram) * 100}%` }} />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
              {data.totals.legacy_payments > 0 && (
                <p className="text-muted-foreground mt-5 border-t pt-4 text-xs">
                  {data.totals.legacy_payments} payment(s) came through the old site checkout and are saved with their Stripe details.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="min-w-0 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Latest registrations</CardTitle>
              <CardDescription>Most recent first</CardDescription>
            </CardHeader>
            <CardContent>
              {recent.length === 0 ? (
                <EmptyState title="Nothing yet" className="py-10" />
              ) : (
                <ul className="divide-y">
                  {recent.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <NameAvatar name={r.player_name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.player_name}</p>
                        <p className="text-muted-foreground truncate text-xs">
                          {programOf(r)} · {r.parent_town}
                        </p>
                      </div>
                      <span className="text-muted-foreground shrink-0 text-xs">{dateTime(r.created_at).replace(/, \d{4}/, "")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </BlurFade>
    </div>
  )
}
