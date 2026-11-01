import { useState, type ReactNode } from "react"
import { motion } from "motion/react"
import { CheckIcon, CopyIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function Field({ label, hint, error, children, className }: { label: ReactNode; hint?: ReactNode; error?: string | null; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-[13px]">{label}</Label>
      {children}
      {error ? <p className="text-destructive text-xs">{error}</p> : hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  )
}

/** Pill tabs with a gliding highlight. */
export function PillTabs<T extends string>({ value, onChange, options, id }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; id: string }) {
  return (
    <div className="bg-muted inline-flex max-w-full overflow-x-auto rounded-lg p-1" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn("relative rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors", value === o.value ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          {value === o.value && <motion.span layoutId={`pill-${id}`} className="bg-background absolute inset-0 rounded-md shadow-xs ring-1 ring-border" transition={{ type: "spring", stiffness: 450, damping: 36 }} />}
          <span className="relative z-10">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  busy,
  onConfirm,
  children,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description?: ReactNode
  confirmLabel: string
  destructive?: boolean
  busy?: boolean
  onConfirm: () => void
  children?: ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm} disabled={busy}>{busy ? "Working…" : confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      onClick={async () => {
        await navigator.clipboard.writeText(value)
        setDone(true)
        setTimeout(() => setDone(false), 1500)
      }}
    >
      {done ? <CheckIcon /> : <CopyIcon />} {done ? "Copied" : label}
    </Button>
  )
}

/** Dollars in the input, cents in state. */
export function MoneyInput({ cents, onChange, placeholder, ...props }: { cents: number | null; onChange: (c: number | null) => void; placeholder?: string } & Omit<React.ComponentProps<typeof Input>, "value" | "onChange">) {
  const [text, setText] = useState(cents === null ? "" : (cents / 100).toFixed(cents % 100 ? 2 : 0))
  return (
    <div className="relative">
      <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">$</span>
      <Input
        inputMode="decimal"
        className="pl-7 tabular-nums"
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          const v = e.target.value.replace(/[^0-9.]/g, "")
          setText(v)
          onChange(v === "" ? null : Math.round(Number(v) * 100))
        }}
        {...props}
      />
    </div>
  )
}

const TZ = "America/New_York"

function etOffsetMinutes(at: Date) {
  const part = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "shortOffset" }).formatToParts(at).find((p) => p.type === "timeZoneName")?.value ?? "GMT-5"
  const m = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(part)
  return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) : -300
}

/** "2026-11-01T10:00" typed in Eastern time -> ISO with the right offset (handles daylight saving). */
export function etLocalToIso(local: string): string | null {
  if (!local) return null
  const [d, t] = local.split("T")
  const [y, mo, da] = d!.split("-").map(Number)
  const [h, mi] = (t ?? "00:00").split(":").map(Number)
  const guess = Date.UTC(y!, mo! - 1, da!, h!, mi!)
  const offset = etOffsetMinutes(new Date(guess))
  return new Date(guess - offset * 60_000).toISOString()
}

export function isoToEtLocal(iso: string | null | undefined): string {
  if (!iso) return ""
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso))
  const get = (k: string) => parts.find((p) => p.type === k)?.value ?? "00"
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`
}

export function EtDateTimeInput({ value, onChange }: { value: string | null; onChange: (iso: string | null) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Input type="datetime-local" value={isoToEtLocal(value)} onChange={(e) => onChange(etLocalToIso(e.target.value))} />
      <span className="text-muted-foreground shrink-0 text-xs">ET</span>
      {value && <Button type="button" variant="ghost" size="xs" onClick={() => onChange(null)}>Clear</Button>}
    </div>
  )
}

export function DateRange({ from, to, onChange }: { from: string; to: string; onChange: (r: { from: string; to: string }) => void }) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: TZ })
  const ago = (days: number) => new Date(Date.now() - days * 86_400_000).toLocaleDateString("en-CA", { timeZone: TZ })
  const presets = [
    { label: "All time", from: "", to: "" },
    { label: "7 days", from: ago(6), to: today },
    { label: "30 days", from: ago(29), to: today },
    { label: "90 days", from: ago(89), to: today },
  ]
  const active = presets.find((p) => p.from === from && p.to === to)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="bg-muted inline-flex rounded-lg p-1">
        {presets.map((p) => (
          <button key={p.label} onClick={() => onChange(p)} className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-colors", active?.label === p.label ? "bg-background text-foreground shadow-xs ring-1 ring-border" : "text-muted-foreground hover:text-foreground")}>
            {p.label}
          </button>
        ))}
      </div>
      <Input type="date" className="h-8 w-36 bg-card text-xs" value={from} onChange={(e) => onChange({ from: e.target.value, to })} aria-label="From" />
      <span className="text-muted-foreground text-xs">to</span>
      <Input type="date" className="h-8 w-36 bg-card text-xs" value={to} onChange={(e) => onChange({ from, to: e.target.value })} aria-label="To" />
    </div>
  )
}
