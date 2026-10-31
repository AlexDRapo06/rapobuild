import { useEffect, useState, type ReactNode } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Size = 25 | 50 | 100 | "all"
const SIZES: Size[] = [25, 50, 100, "all"]

function storedSize(id: string): Size {
  try {
    const raw = localStorage.getItem(`footyup-rows-${id}`)
    const v = raw === "all" ? "all" : Number(raw)
    return SIZES.includes(v as Size) ? (v as Size) : 25
  } catch {
    return 25
  }
}

/** Splits rows into pages. `resetKey` (e.g. the filters) jumps back to page 1 when it changes. */
export function usePager<T>(rows: T[], id: string, resetKey?: unknown) {
  const [size, setSizeState] = useState<Size>(() => storedSize(id))
  const [page, setPage] = useState(0)
  useEffect(() => {
    setPage(0)
  }, [resetKey, size])

  const setSize = (s: Size) => {
    setSizeState(s)
    try {
      localStorage.setItem(`footyup-rows-${id}`, String(s))
    } catch {
      // Storage can be unavailable (private mode); the choice just isn't remembered.
    }
  }
  const pages = size === "all" ? 1 : Math.max(1, Math.ceil(rows.length / size))
  const current = Math.min(page, pages - 1)
  const start = size === "all" ? 0 : current * size
  const visible = size === "all" ? rows : rows.slice(start, start + size)

  const pager = (
    <Pager
      total={rows.length}
      from={rows.length ? start + 1 : 0}
      to={start + visible.length}
      size={size}
      onSize={setSize}
      page={current}
      pages={pages}
      onPage={setPage}
    />
  )
  return { rows: visible, pager, offset: start }
}

/** For tables rendered in a loop: pages `rows` and puts the controls under them. */
export function Paged<T>({ rows, id, resetKey, children }: { rows: T[]; id: string; resetKey?: unknown; children: (rows: T[], offset: number) => ReactNode }) {
  const { rows: visible, pager, offset } = usePager(rows, id, resetKey)
  return (
    <>
      {children(visible, offset)}
      {pager}
    </>
  )
}

function Pager({ total, from, to, size, onSize, page, pages, onPage }: { total: number; from: number; to: number; size: Size; onSize: (s: Size) => void; page: number; pages: number; onPage: (p: number) => void }) {
  if (total === 0) return null
  return (
    <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm print:hidden">
      <p className="tabular-nums">
        {from === 1 && to === total ? <>Showing all <span className="text-foreground font-medium">{total}</span></> : <>Showing <span className="text-foreground font-medium">{from}–{to}</span> of <span className="text-foreground font-medium">{total}</span></>}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {total > 25 && (
          <div className="flex items-center gap-2">
            <span className="text-xs">Rows per page</span>
            <div className="bg-muted inline-flex rounded-lg p-0.5" role="group" aria-label="Rows per page">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={size === s}
                  onClick={() => onSize(s)}
                  className={cn("rounded-md px-2.5 py-1 text-xs font-medium tabular-nums transition-colors", size === s ? "bg-background text-foreground shadow-xs ring-1 ring-border" : "hover:text-foreground")}
                >
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
          </div>
        )}
        {pages > 1 && (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => onPage(page - 1)} disabled={page === 0} aria-label="Previous page"><ChevronLeftIcon /></Button>
            <span className="px-2 text-xs tabular-nums">Page {page + 1} of {pages}</span>
            <Button variant="outline" size="sm" onClick={() => onPage(page + 1)} disabled={page >= pages - 1} aria-label="Next page"><ChevronRightIcon /></Button>
          </div>
        )}
      </div>
    </div>
  )
}
