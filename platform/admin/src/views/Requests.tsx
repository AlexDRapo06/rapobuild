import { useCallback, useMemo, useState } from "react"
import { ClockIcon, DownloadIcon, MailIcon, MapPinIcon, MessageSquareTextIcon, PackageIcon, PhoneIcon, SearchIcon, UsersIcon } from "lucide-react"

import type { Api } from "../api"
import { downloadCsv, stamp, type Column } from "../csv"
import { dateTime, money } from "../format"
import type { TrainingPurchase, TrainingRequest } from "../types"
import { useLoad } from "../useLoad"
import { PillTabs } from "@/components/app/kit"
import { Paged } from "@/components/app/pager"
import { EmptyState, ErrorState, NameAvatar, PageHeader, TableSkeleton } from "@/components/app/states"
import { StatusBadge } from "@/components/app/status-badge"
import { BlurFade } from "@/components/magicui/blur-fade"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const CSV: Column<TrainingRequest>[] = [
  { header: "Received", value: (r) => r.created_at },
  { header: "Parent", value: (r) => r.parent_name },
  { header: "Email", value: (r) => r.email },
  { header: "Phone", value: (r) => r.phone },
  { header: "Bundle", value: (r) => r.bundle },
  { header: "Players", value: (r) => r.players },
  { header: "Player ages", value: (r) => r.player_ages ?? r.player_age },
  { header: "Player", value: (r) => r.player_name },
  { header: "Town", value: (r) => r.town },
  { header: "Preferred times", value: (r) => r.preferred_times },
  { header: "Message", value: (r) => r.message },
  { header: "Status", value: (r) => r.status },
]

const PURCHASE_CSV: Column<TrainingPurchase>[] = [
  { header: "Bought", value: (r) => r.created_at },
  { header: "Package", value: (r) => r.package_name },
  { header: "Parent", value: (r) => r.parent_name },
  { header: "Email", value: (r) => r.email },
  { header: "Phone", value: (r) => r.phone },
  { header: "Player", value: (r) => r.player_name },
  { header: "Player age", value: (r) => r.player_age },
  { header: "Paid (USD)", value: (r) => (r.amount_total_cents / 100).toFixed(2) },
  { header: "Payment", value: (r) => r.payment_status },
]

function playersLine(r: TrainingRequest) {
  if (r.player_name) return `For ${r.player_name}${r.player_age !== null ? `, age ${r.player_age}` : ""}`
  const n = r.players ? `${r.players} player${r.players === "1" ? "" : "s"}` : null
  return [n, r.player_ages ? `age ${r.player_ages}` : null].filter(Boolean).join(" · ") || "—"
}

export function Requests({ api, onExpired, refreshKey }: { api: Api; onExpired: () => void; refreshKey: number }) {
  const load = useCallback(() => api<{ requests: TrainingRequest[]; purchases: TrainingPurchase[] }>("requests"), [api])
  const { data, error, loading, reload } = useLoad(load, onExpired, refreshKey)
  const [tab, setTab] = useState<"inquiries" | "purchases">("inquiries")
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState<TrainingRequest | null>(null)

  const rows = data?.requests ?? []
  const purchases = data?.purchases ?? []
  const q = search.trim().toLowerCase()
  const filtered = useMemo(() => (q ? rows.filter((r) => [r.parent_name, r.player_name ?? "", r.email, r.phone, r.town ?? "", r.bundle ?? ""].some((v) => v.toLowerCase().includes(q))) : rows), [rows, q])
  const filteredPurchases = useMemo(() => (q ? purchases.filter((r) => [r.parent_name ?? "", r.player_name ?? "", r.email ?? "", r.phone ?? "", r.package_name].some((v) => v.toLowerCase().includes(q))) : purchases), [purchases, q])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Private training"
        description="Inquiries from the website form (each is also emailed to your notification address) and packages bought online."
        actions={
          <Button
            variant="outline"
            disabled={tab === "inquiries" ? !filtered.length : !filteredPurchases.length}
            onClick={() => (tab === "inquiries" ? downloadCsv(`footyup-training-requests-${stamp()}.csv`, CSV, filtered) : downloadCsv(`footyup-training-purchases-${stamp()}.csv`, PURCHASE_CSV, filteredPurchases))}
          >
            <DownloadIcon /> Export CSV
          </Button>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PillTabs id="training" value={tab} onChange={setTab} options={[{ value: "inquiries", label: `Inquiries (${rows.length})` }, { value: "purchases", label: `Packages bought (${purchases.length})` }]} />
        <div className="relative w-full max-w-sm">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input className="bg-card pl-9" placeholder="Search name, email, phone or package" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" />
        </div>
      </div>

      {loading && !data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}</div>
      ) : error && !data ? (
        <Card><ErrorState message={error} onRetry={reload} /></Card>
      ) : tab === "purchases" ? (
        <Card className="gap-0 overflow-hidden py-0">
          {filteredPurchases.length === 0 ? <EmptyState icon={PackageIcon} title="No packages bought yet">Packages bought with the site's "Buy" buttons appear here.</EmptyState> : loading && !data ? <TableSkeleton /> : (
            <Paged rows={filteredPurchases} id="training-purchases" resetKey={q}>{(page) => (
            <Table>
              <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Family</TableHead><TableHead>Package</TableHead><TableHead className="hidden md:table-cell">Player</TableHead><TableHead className="hidden sm:table-cell">Bought</TableHead><TableHead className="text-right">Paid</TableHead><TableHead>Payment</TableHead></TableRow></TableHeader>
              <TableBody>
                {page.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell><div className="flex items-center gap-3"><NameAvatar name={p.parent_name ?? p.email ?? "?"} /><div className="min-w-0"><p className="truncate font-medium">{p.parent_name ?? "—"}</p><p className="text-muted-foreground truncate text-xs">{p.email}{p.phone ? ` · ${p.phone}` : ""}</p></div></div></TableCell>
                    <TableCell className="max-w-[260px] truncate">{p.package_name}</TableCell>
                    <TableCell className="hidden md:table-cell">{p.player_name ?? "—"}{p.player_age && <span className="text-muted-foreground"> · age {p.player_age}</span>}</TableCell>
                    <TableCell className="text-muted-foreground hidden sm:table-cell">{dateTime(p.created_at)}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(p.amount_total_cents)}</TableCell>
                    <TableCell><StatusBadge value={p.payment_status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}</Paged>
          )}
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState icon={rows.length ? SearchIcon : MessageSquareTextIcon} title={rows.length ? "Nothing matches your search" : "No requests yet"}>
            {rows.length ? null : "New private training inquiries from the website show up here."}
          </EmptyState>
        </Card>
      ) : (
        <Paged rows={filtered} id="training-requests" resetKey={q}>{(page) => (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {page.map((r, i) => (
            <BlurFade key={r.id} delay={0.04 * Math.min(i, 8)} inView={false}>
              <button
                onClick={() => setOpen(r)}
                className="bg-card hover:border-foreground/15 focus-visible:ring-ring/50 flex h-full w-full flex-col gap-4 rounded-xl border p-5 text-left shadow-xs transition-all hover:shadow-md focus-visible:ring-[3px] focus-visible:outline-none"
              >
                <div className="flex w-full items-start gap-3">
                  <NameAvatar name={r.parent_name} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.parent_name}</p>
                    <p className="text-muted-foreground truncate text-xs">{playersLine(r)}</p>
                  </div>
                  <StatusBadge value={r.status} />
                </div>
                {r.bundle && <p className="text-sm font-medium">{r.bundle}</p>}
                <p className="text-muted-foreground line-clamp-3 min-h-[3.75rem] text-sm">{r.message || "No message included."}</p>
                <div className="text-muted-foreground mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-xs">
                  {r.town && <span className="flex items-center gap-1"><MapPinIcon className="size-3.5" />{r.town}</span>}
                  {r.players && <span className="flex items-center gap-1"><UsersIcon className="size-3.5" />{r.players}</span>}
                  {r.preferred_times && <span className="flex items-center gap-1"><ClockIcon className="size-3.5" />{r.preferred_times}</span>}
                  <span className="ml-auto">{dateTime(r.created_at).replace(/, \d{4}/, "")}</span>
                </div>
              </button>
            </BlurFade>
          ))}
        </div>
        )}</Paged>
      )}

      <Sheet open={Boolean(open)} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
          {open && (
            <>
              <SheetHeader className="border-b p-6">
                <div className="flex items-center gap-3">
                  <NameAvatar name={open.parent_name} className="size-11 text-sm" />
                  <div>
                    <SheetTitle>{open.parent_name}</SheetTitle>
                    <SheetDescription>Received {dateTime(open.created_at)}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="space-y-6 p-6">
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  {open.bundle && <div className="col-span-2"><dt className="text-muted-foreground text-xs">Preferred bundle</dt><dd className="font-medium">{open.bundle}</dd></div>}
                  <div><dt className="text-muted-foreground text-xs">Players</dt><dd>{playersLine(open)}</dd></div>
                  <div><dt className="text-muted-foreground text-xs">Town</dt><dd>{open.town ?? "—"}</dd></div>
                  <div><dt className="text-muted-foreground text-xs">Phone</dt><dd>{open.phone}</dd></div>
                  <div className="min-w-0"><dt className="text-muted-foreground text-xs">Email</dt><dd className="break-words">{open.email}</dd></div>
                  {open.preferred_times && <div className="col-span-2"><dt className="text-muted-foreground text-xs">Preferred times</dt><dd>{open.preferred_times}</dd></div>}
                </dl>
                <div>
                  <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">Notes</p>
                  <p className="bg-muted/50 rounded-lg border p-4 text-sm whitespace-pre-wrap">{open.message || "No message included."}</p>
                </div>
                <div className="flex gap-2">
                  <Button asChild className="flex-1"><a href={`mailto:${open.email}?subject=${encodeURIComponent("Footy Up private training")}`}><MailIcon /> Reply by email</a></Button>
                  <Button asChild variant="outline"><a href={`tel:${open.phone}`}><PhoneIcon /> Call</a></Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
