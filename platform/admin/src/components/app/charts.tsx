import { useState } from "react"
import { cn } from "@/lib/utils"

/** Column chart for a time series. Hover shows the exact value. */
export function ColumnChart({ data, height = 200, format = (v: number) => String(v) }: { data: { label: string; value: number; title?: string }[]; height?: number; format?: (v: number) => string }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...data.map((d) => d.value))
  const ticks = [max, Math.round(max / 2), 0]
  const labelEvery = Math.max(1, Math.ceil(data.length / 8))
  return (
    <div className="flex gap-3">
      <div className="text-muted-foreground flex flex-col justify-between pb-6 text-right text-[11px] tabular-nums" style={{ height }}>
        {ticks.map((t, i) => <span key={i}>{format(t)}</span>)}
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="absolute inset-x-0 top-0 flex flex-col justify-between" style={{ height: height - 24 }}>
          {ticks.map((_, i) => <div key={i} className="border-border/70 border-t border-dashed" />)}
        </div>
        <div className="relative flex items-end gap-[3px]" style={{ height: height - 24 }} onMouseLeave={() => setHover(null)}>
          {data.map((d, i) => (
            <div key={d.label} className="group relative flex h-full min-w-0 flex-1 items-end" onMouseEnter={() => setHover(i)}>
              <div
                className={cn("w-full rounded-t-[3px] transition-all duration-500", hover === i ? "bg-brand-strong" : "bg-brand/80")}
                style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 3 : 0 }}
              />
              {hover === i && (
                <div className="bg-popover text-popover-foreground pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-md border px-2 py-1 text-xs whitespace-nowrap shadow-md">
                  <span className="font-semibold">{format(d.value)}</span> <span className="text-muted-foreground">{d.title ?? d.label}</span>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="text-muted-foreground mt-2 flex gap-[3px] text-[11px]">
          {data.map((d, i) => (
            <span key={d.label} className="min-w-0 flex-1 truncate text-center">{i % labelEvery === 0 ? d.label : ""}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Ranked horizontal bars; each row can be clicked to drill in. */
export function BarList({ data, format = (v: number) => String(v), onSelect, color = "bg-brand/15", empty = "No data for this period" }: { data: { label: string; value: number; key?: string; sub?: string }[]; format?: (v: number) => string; onSelect?: (key: string) => void; color?: string; empty?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  if (!data.length) return <p className="text-muted-foreground py-8 text-center text-sm">{empty}</p>
  return (
    <ul className="space-y-1">
      {data.map((d) => {
        const Row = onSelect ? "button" : "div"
        return (
          <li key={d.key ?? d.label}>
            <Row
              {...(onSelect ? { onClick: () => onSelect(d.key ?? d.label), type: "button" as const } : {})}
              className={cn("relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-md px-3 py-2 text-left text-sm", onSelect && "hover:ring-1 hover:ring-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none")}
            >
              <span className={cn("absolute inset-y-0 left-0 rounded-md transition-[width] duration-700", color)} style={{ width: `${(d.value / max) * 100}%` }} />
              <span className="relative min-w-0 truncate">
                {d.label}
                {d.sub && <span className="text-muted-foreground"> · {d.sub}</span>}
              </span>
              <span className="relative shrink-0 font-semibold tabular-nums">{format(d.value)}</span>
            </Row>
          </li>
        )
      })}
    </ul>
  )
}

/** Group daily points into Monday-starting weeks. */
export function toWeeks(daily: { day: string; registrations: number }[]) {
  const weeks = new Map<string, number>()
  for (const d of daily) {
    const date = new Date(`${d.day}T12:00:00Z`)
    const monday = new Date(date.getTime() - ((date.getUTCDay() + 6) % 7) * 86_400_000).toISOString().slice(0, 10)
    weeks.set(monday, (weeks.get(monday) ?? 0) + d.registrations)
  }
  return [...weeks.entries()].map(([day, registrations]) => ({ day, registrations }))
}
