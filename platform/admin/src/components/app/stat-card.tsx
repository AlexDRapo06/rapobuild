import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { NumberTicker } from "@/components/magicui/number-ticker"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/** Smooth area sparkline drawn as plain SVG (no chart library). */
function Sparkline({ values, className }: { values: number[]; className?: string }) {
  if (values.length < 2 || values.every((v) => v === 0)) return null
  const max = Math.max(...values, 1)
  const w = 120
  const h = 36
  const step = w / (values.length - 1)
  const points = values.map((v, i) => [i * step, h - 2 - (v / max) * (h - 6)] as const)
  const line = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const area = `${line} L${w},${h} L0,${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn("h-9 w-28", className)} aria-hidden>
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path d={line} fill="none" stroke="var(--brand)" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/** Stat card layout adapted from Spectrum UI's metric cards. */
export function StatCard({
  label,
  value,
  prefix,
  icon: Icon,
  hint,
  trend,
  tone = "default",
}: {
  label: string
  value: number
  prefix?: string
  icon: LucideIcon
  hint?: ReactNode
  trend?: number[]
  tone?: "default" | "brand" | "info" | "warning"
}) {
  const tile = {
    default: "bg-muted text-foreground",
    brand: "bg-brand-soft text-brand-strong",
    info: "bg-sky-50 text-sky-700",
    warning: "bg-amber-50 text-amber-700",
  }[tone]
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0 space-y-2">
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          <p className="text-[1.75rem] leading-none font-semibold tracking-tight">
            {prefix}
            <NumberTicker value={value} stiffness={320} damping={42} className="tracking-tight text-foreground" />
          </p>
        </div>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", tile)}>
          <Icon className="size-[18px]" />
        </span>
      </div>
      <div className="flex min-h-12 items-end justify-between gap-3 border-t bg-muted/30 px-5 py-2.5">
        <p className="text-muted-foreground text-xs">{hint}</p>
        {trend && <Sparkline values={trend} />}
      </div>
    </Card>
  )
}
