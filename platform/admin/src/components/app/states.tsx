import type { ReactNode } from "react"
import { AlertTriangleIcon, InboxIcon, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function EmptyState({
  icon: Icon = InboxIcon,
  title,
  children,
  action,
  className,
}: {
  icon?: LucideIcon
  title: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-16 text-center", className)}>
      <div className="bg-muted text-muted-foreground flex size-11 items-center justify-center rounded-xl border">
        <Icon className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {children && <p className="text-muted-foreground max-w-sm text-sm">{children}</p>}
      </div>
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex size-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600">
        <AlertTriangleIcon className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="font-medium">Couldn't load this</p>
        <p className="text-muted-foreground max-w-sm text-sm">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 px-5 py-3.5">
          <Skeleton className="size-8 rounded-full" />
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} className={cn("h-3.5", c === 0 ? "w-40" : "w-24", c > 2 && "hidden md:block")} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase() || "?"
}

const AVATAR_TONES = [
  "bg-emerald-100 text-emerald-800",
  "bg-sky-100 text-sky-800",
  "bg-violet-100 text-violet-800",
  "bg-amber-100 text-amber-800",
  "bg-pink-100 text-pink-800",
  "bg-teal-100 text-teal-800",
]

export function NameAvatar({ name, className }: { name: string; className?: string }) {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length],
        className
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}
