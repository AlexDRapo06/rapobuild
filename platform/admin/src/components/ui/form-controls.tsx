import * as React from "react"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

/** Accessible checkbox: a real input underneath, a shadcn-style box on top. */
function Checkbox({ className, checked, onCheckedChange, ...props }: Omit<React.ComponentProps<"input">, "type" | "onChange"> & { onCheckedChange?: (checked: boolean) => void }) {
  return (
    <span className={cn("relative inline-flex size-4 shrink-0", className)}>
      <input
        type="checkbox"
        className="peer absolute inset-0 m-0 cursor-pointer appearance-none rounded-[4px] border border-input bg-background shadow-xs transition-colors checked:border-primary checked:bg-primary focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
      <CheckIcon className="text-primary-foreground pointer-events-none absolute inset-0 m-auto size-3 opacity-0 peer-checked:opacity-100" strokeWidth={3} />
    </span>
  )
}

function Switch({ checked, onCheckedChange, className, ...props }: Omit<React.ComponentProps<"button">, "onChange"> & { checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50",
        checked ? "bg-brand" : "bg-input",
        className
      )}
      {...props}
    >
      <span className={cn("block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform", checked ? "translate-x-4" : "translate-x-0")} />
    </button>
  )
}

function Notice({ tone = "info", icon: Icon, title, children, className }: { tone?: "info" | "warning" | "error" | "success"; icon?: React.ComponentType<{ className?: string }>; title?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  const styles = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  }[tone]
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-lg border px-4 py-3 text-sm", styles, className)}>
      {Icon && <Icon className="mt-0.5 size-4 shrink-0" />}
      <div className="min-w-0 space-y-0.5">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className="opacity-90">{children}</div>}
      </div>
    </div>
  )
}

export { Textarea, Checkbox, Switch, Notice }
