import { Badge } from "@/components/ui/badge"

type Variant = "success-light" | "warning-light" | "destructive-light" | "info-light" | "secondary"

const VARIANTS: Record<string, Variant> = {
  paid: "success-light",
  accepted: "success-light",
  converted: "success-light",
  partially_refunded: "warning-light",
  not_collected: "warning-light",
  notified: "warning-light",
  refunded: "destructive-light",
  cancelled: "destructive-light",
  removed: "destructive-light",
  lapsed: "secondary",
  new: "info-light",
  waiting: "info-light",
  contacted: "secondary",
  closed: "secondary",
}

const LABELS: Record<string, string> = {
  partially_refunded: "Part refunded",
  not_collected: "Not collected",
}

export function StatusBadge({ value }: { value: string }) {
  const label = LABELS[value] ?? value.charAt(0).toUpperCase() + value.slice(1).replaceAll("_", " ")
  return (
    <Badge variant={VARIANTS[value] ?? "secondary"} className="gap-1.5">
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {label}
    </Badge>
  )
}

/** Small colored marker that distinguishes programs at a glance. */
export function ProgramDot({ program }: { program: string }) {
  const color = program.includes("Boys")
    ? "bg-sky-500"
    : program.includes("Girls")
      ? "bg-pink-500"
      : program.toLowerCase().includes("arlington")
        ? "bg-emerald-500"
        : "bg-violet-500"
  return <span className={`inline-block size-2 shrink-0 rounded-full ${color}`} aria-hidden />
}
