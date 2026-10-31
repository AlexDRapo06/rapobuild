import { useCallback, useMemo, useState, type ReactNode } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  ClipboardListIcon,
  CreditCardIcon,
  DownloadIcon,
  FileSignatureIcon,
  MailIcon,
  PackageIcon,
  PhoneIcon,
  SearchIcon,
  ShieldAlertIcon,
  UserIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"

import type { Api } from "../api"
import { downloadCsv, stamp, type Column } from "../csv"
import { dateTime, height, label, money } from "../format"
import { programOf, type Registration } from "../types"
import { useLoad } from "../useLoad"
import { usePager } from "@/components/app/pager"
import { EmptyState, ErrorState, NameAvatar, PageHeader, TableSkeleton } from "@/components/app/states"
import { ProgramDot, StatusBadge } from "@/components/app/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type SortKey = "created_at" | "player_name" | "program" | "parent_town"

const CSV_COLUMNS: Column<Registration>[] = [
  { header: "Registered at", value: (r) => r.created_at },
  { header: "Program", value: (r) => r.camp },
  { header: "Session / group", value: (r) => r.session ?? (r.miami_group === "boys" ? "Boys" : r.miami_group === "girls" ? "Girls" : "") },
  { header: "Host-school code used", value: (r) => (r.miami_group ? (r.via_access_code ? "Yes" : "No") : "") },
  { header: "Player first name", value: (r) => r.player_first_name ?? r.player_name },
  { header: "Player last name", value: (r) => r.player_last_name ?? "" },
  { header: "Player age", value: (r) => r.player_age },
  { header: "Player sex", value: (r) => r.player_sex },
  { header: "Player email", value: (r) => r.player_email },
  { header: "Height (in)", value: (r) => r.player_height_in },
  { header: "Weight (lb)", value: (r) => r.player_weight_lb },
  { header: "Primary position", value: (r) => r.player_position },
  { header: "Current club / team", value: (r) => r.player_club },
  { header: "Shirt size", value: (r) => r.shirt_size },
  { header: "Short size", value: (r) => r.short_size },
  { header: "Parent first name", value: (r) => r.parent_first_name ?? r.parent_name },
  { header: "Parent last name", value: (r) => r.parent_last_name ?? "" },
  { header: "Parent email", value: (r) => r.parent_email },
  { header: "Parent phone", value: (r) => r.parent_phone },
  { header: "Emergency phone", value: (r) => r.emergency_phone },
  { header: "Town", value: (r) => r.parent_town },
  { header: "Shipping street", value: (r) => r.ship_line1 },
  { header: "Apt / unit", value: (r) => r.ship_line2 },
  { header: "Shipping city", value: (r) => r.ship_city },
  { header: "Shipping state", value: (r) => r.ship_state },
  { header: "Shipping ZIP", value: (r) => r.ship_postal_code },
  { header: "Other form fields", value: (r) => (Object.keys(r.extra ?? {}).length ? JSON.stringify(r.extra) : "") },
  { header: "Waiver", value: (r) => r.waiver_status },
  { header: "Waiver version", value: (r) => r.waiver_version },
  { header: "Waiver accepted at", value: (r) => r.waiver_accepted_at },
  { header: "Waiver signed name", value: (r) => r.waiver_accepted_name },
  { header: "Payment status", value: (r) => r.payment_status },
  { header: "Checkout total (USD)", value: (r) => (r.checkout_total_cents / 100).toFixed(2) },
  { header: "Refunded (USD)", value: (r) => (r.refunded_cents / 100).toFixed(2) },
  { header: "Stripe payment", value: (r) => r.stripe_payment_intent_id },
  { header: "Registration ID", value: (r) => r.id },
]

function Section({ icon: Icon, title, children, tone }: { icon: typeof UserIcon; title: string; children: ReactNode; tone?: "sensitive" }) {
  return (
    <section className={tone === "sensitive" ? "rounded-xl border border-amber-200 bg-amber-50/60 p-4" : ""}>
      <h3 className={`mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase ${tone === "sensitive" ? "text-amber-800" : "text-muted-foreground"}`}>
        <Icon className="size-3.5" />
        {title}
      </h3>
      {children}
    </section>
  )
}

function Fields({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-muted-foreground text-xs">{k}</dt>
          <dd className="mt-0.5 text-sm break-words">{v === null || v === undefined || v === "" ? <span className="text-muted-foreground">—</span> : v}</dd>
        </div>
      ))}
    </dl>
  )
}

function RegistrationSheet({ r, onClose, api, onChanged }: { r: Registration | null; onClose: () => void; api: Api; onChanged: () => void }) {
  const miami = Boolean(r?.miami_group)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  async function setCancelled(cancel: boolean) {
    if (!r) return
    setBusy(true)
    try {
      await api("registration-cancel", { id: r.id, cancel, reason: reason || null })
      setCancelOpen(false)
      onChanged()
      onClose()
    } finally {
      setBusy(false)
    }
  }
  return (
    <Sheet open={Boolean(r)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
        {r && (
          <>
            <SheetHeader className="border-b p-6">
              <div className="flex items-center gap-3">
                <NameAvatar name={r.player_name} className="size-11 text-sm" />
                <div className="min-w-0">
                  <SheetTitle className="truncate text-lg">{r.player_name}</SheetTitle>
                  <SheetDescription className="flex items-center gap-1.5">
                    <ProgramDot program={programOf(r)} />
                    {programOf(r)}
                  </SheetDescription>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {r.status === "cancelled" && <StatusBadge value="cancelled" />}
                <StatusBadge value={r.payment_status} />
                <StatusBadge value={r.waiver_status} />
                {miami && r.via_access_code && <Badge variant="info-light">Host-school code</Badge>}
              </div>
            </SheetHeader>
            <div className="space-y-7 p-6">
              <Section icon={UserIcon} title="Player">
                <Fields
                  rows={[
                    ["Name", r.player_name],
                    ["Age", r.player_age],
                    ...(miami
                      ? ([
                          ["Email", r.player_email],
                          ["Primary position", r.player_position],
                          ["Current club / team", r.player_club],
                          ["Shirt / short size", `${r.shirt_size ?? "—"} / ${r.short_size ?? "—"}`],
                        ] as [string, ReactNode][])
                      : ([["Sex", label(r.player_sex)]] as [string, ReactNode][])),
                  ]}
                />
              </Section>
              {miami && (
                <Section icon={ShieldAlertIcon} title="Sensitive · shipping and measurements" tone="sensitive">
                  <Fields
                    rows={[
                      ["Height", height(r.player_height_in)],
                      ["Weight", r.player_weight_lb ? `${r.player_weight_lb} lb` : null],
                      [
                        "Ship package to",
                        r.ship_line1 ? (
                          <span className="flex gap-2">
                            <PackageIcon className="text-amber-700 mt-0.5 size-4 shrink-0" />
                            <span>
                              {r.ship_line1}
                              {r.ship_line2 ? `, ${r.ship_line2}` : ""}
                              <br />
                              {r.ship_city}, {r.ship_state} {r.ship_postal_code}
                            </span>
                          </span>
                        ) : null,
                      ],
                    ]}
                  />
                </Section>
              )}
              <Section icon={UsersIcon} title="Parent / guardian">
                <Fields
                  rows={[
                    ["Name", r.parent_name],
                    ["Town", r.parent_town],
                    ["Email", r.parent_email],
                    ["Phone", r.parent_phone],
                    ...(r.emergency_phone ? ([["Emergency phone", r.emergency_phone]] as [string, ReactNode][]) : []),
                  ]}
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${r.parent_email}`}>
                      <MailIcon /> Email
                    </a>
                  </Button>
                  {r.parent_phone && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`tel:${r.parent_phone}`}>
                        <PhoneIcon /> Call
                      </a>
                    </Button>
                  )}
                </div>
              </Section>
              {Object.keys(r.extra ?? {}).length > 0 && (
                <Section icon={ClipboardListIcon} title="Other form fields">
                  <Fields rows={Object.entries(r.extra).map(([k, v]) => [k, String(v)])} />
                </Section>
              )}
              <Section icon={CreditCardIcon} title="Payment">
                <Fields
                  rows={[
                    ["Registered", dateTime(r.created_at)],
                    ["Paid for this registration", r.price_cents !== null ? money(r.price_cents) : null],
                    ...(r.discount_cents ? ([["Discount", `${money(r.discount_cents)}${r.promo_code ? ` (code ${r.promo_code})` : ""}`]] as [string, ReactNode][]) : []),
                    ["Checkout total", money(r.checkout_total_cents)],
                    ["Refunded", money(r.refunded_cents)],
                    ["Stripe payment", <code className="bg-muted rounded px-1.5 py-0.5 text-xs">{r.stripe_payment_intent_id ?? "—"}</code>],
                  ]}
                />
                <p className="text-muted-foreground mt-3 text-xs">The checkout total covers every player and session paid for together.</p>
              </Section>
              <Section icon={XIcon} title={r.status === "cancelled" ? "Cancelled" : "Cancel registration"}>
                {r.status === "cancelled" ? (
                  <div className="space-y-3">
                    <p className="text-sm">Cancelled {dateTime(r.cancelled_at)}{r.cancel_reason ? `: ${r.cancel_reason}` : ""}.</p>
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => setCancelled(false)}>Restore registration</Button>
                  </div>
                ) : cancelOpen ? (
                  <div className="space-y-3">
                    <Input placeholder="Reason (optional), e.g. family moved" value={reason} onChange={(e) => setReason(e.target.value)} />
                    <p className="text-muted-foreground text-xs">This frees the spot (and offers it to the waitlist). It doesn't refund money: issue refunds in Stripe, and they show here automatically.</p>
                    <div className="flex gap-2">
                      <Button variant="destructive" size="sm" disabled={busy} onClick={() => setCancelled(true)}>{busy ? "Cancelling…" : "Cancel registration"}</Button>
                      <Button variant="ghost" size="sm" onClick={() => setCancelOpen(false)}>Keep it</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setCancelOpen(true)}>Cancel this registration…</Button>
                )}
              </Section>
              <Section icon={FileSignatureIcon} title="Waiver">
                <Fields
                  rows={[
                    ["Status", <StatusBadge value={r.waiver_status} />],
                    ["Accepted", r.waiver_accepted_at ? `${dateTime(r.waiver_accepted_at)} by ${r.waiver_accepted_name} (v${r.waiver_version})` : null],
                  ]}
                />
              </Section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

export function Registrations({ api, onExpired, refreshKey, params = {} }: { api: Api; onExpired: () => void; refreshKey: number; params?: Record<string, string> }) {
  const load = useCallback(() => api<{ registrations: Registration[] }>("registrations"), [api])
  const { data, error, loading, reload } = useLoad(load, onExpired, refreshKey)

  const [search, setSearch] = useState("")
  const [program, setProgram] = useState(params.program ?? "")
  const [town, setTown] = useState(params.town ?? "")
  const [payment, setPayment] = useState(params.payment ?? "")
  const [waiver, setWaiver] = useState(params.waiver ?? "")
  const [from, setFrom] = useState(params.from ?? "")
  const [to, setTo] = useState(params.to ?? "")
  const [showCancelled, setShowCancelled] = useState(false)
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "created_at", dir: -1 })
  const [open, setOpen] = useState<Registration | null>(null)

  const rows = data?.registrations ?? []
  const programs = useMemo(() => [...new Set(rows.map(programOf))].sort(), [rows])
  const towns = useMemo(() => [...new Set(rows.map((r) => r.parent_town.trim()))].sort((a, b) => a.localeCompare(b)), [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const fromTs = from ? new Date(`${from}T00:00:00`).getTime() : null
    const toTs = to ? new Date(`${to}T23:59:59`).getTime() : null
    const list = rows.filter((r) => {
      if (!showCancelled && r.status === "cancelled") return false
      if (q && ![r.player_name, r.parent_name, r.parent_email, r.parent_phone ?? "", r.player_email ?? ""].some((v) => v.toLowerCase().includes(q))) return false
      if (program && programOf(r) !== program) return false
      if (town && r.parent_town.trim().toLowerCase() !== town.trim().toLowerCase()) return false
      if (payment && r.payment_status !== payment) return false
      if (waiver && r.waiver_status !== waiver) return false
      const ts = new Date(r.created_at).getTime()
      if (fromTs && ts < fromTs) return false
      if (toTs && ts > toTs) return false
      return true
    })
    const value = (r: Registration) => (sort.key === "program" ? programOf(r) : String(r[sort.key] ?? ""))
    return list.sort((a, b) => value(a).localeCompare(value(b)) * sort.dir)
  }, [rows, search, program, town, payment, waiver, from, to, sort, showCancelled])

  const { rows: visible, pager } = usePager(filtered, "registrations", [search, program, town, payment, waiver, from, to, showCancelled].join("|"))
  const activeFilters = [search, program, town, payment, waiver, from, to].filter(Boolean).length

  const reset = () => {
    setSearch(""); setProgram(""); setTown(""); setPayment(""); setWaiver(""); setFrom(""); setTo("")
  }
  const set = <T,>(fn: (v: T) => void) => (v: T) => fn(v)
  const sortBy = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === "created_at" ? -1 : 1 }))

  const SortHead = ({ k, children, className }: { k: SortKey; children: ReactNode; className?: string }) => (
    <TableHead className={className}>
      <button className="hover:text-foreground inline-flex items-center gap-1 rounded transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" onClick={() => sortBy(k)}>
        {children}
        {sort.key === k ? sort.dir === 1 ? <ArrowUpIcon className="size-3" /> : <ArrowDownIcon className="size-3" /> : <ChevronsUpDownIcon className="size-3 opacity-50" />}
      </button>
    </TableHead>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registrations"
        description="Every paid registration, saved automatically when Stripe confirms the payment."
        actions={
          <Button disabled={!filtered.length} onClick={() => downloadCsv(`footyup-registrations-${stamp()}.csv`, CSV_COLUMNS, filtered)}>
            <DownloadIcon />
            Export CSV{activeFilters ? ` (${filtered.length})` : ""}
          </Button>
        }
      />

      <Card className="gap-0 overflow-hidden py-0">
        <div className="space-y-3 border-b p-4">
          <div className="relative">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input className="bg-background pl-9" placeholder="Search player, parent, email or phone" value={search} onChange={(e) => set(setSearch)(e.target.value)} aria-label="Search registrations" />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto_auto]">
            <NativeSelect value={program} onChange={(e) => set(setProgram)(e.target.value)} aria-label="Program">
              <option value="">All programs</option>
              {programs.map((p) => <option key={p}>{p}</option>)}
            </NativeSelect>
            <NativeSelect value={town} onChange={(e) => set(setTown)(e.target.value)} aria-label="Town">
              <option value="">All towns</option>
              {towns.map((t) => <option key={t}>{t}</option>)}
            </NativeSelect>
            <NativeSelect value={payment} onChange={(e) => set(setPayment)(e.target.value)} aria-label="Payment status">
              <option value="">Any payment</option>
              <option value="paid">Paid</option>
              <option value="partially_refunded">Partially refunded</option>
              <option value="refunded">Refunded</option>
            </NativeSelect>
            <NativeSelect value={waiver} onChange={(e) => set(setWaiver)(e.target.value)} aria-label="Waiver">
              <option value="">Any waiver</option>
              <option value="accepted">Accepted</option>
              <option value="not_collected">Not collected</option>
            </NativeSelect>
            <Input type="date" className="bg-background lg:w-36" value={from} onChange={(e) => set(setFrom)(e.target.value)} aria-label="Registered from" />
            <Input type="date" className="bg-background lg:w-36" value={to} onChange={(e) => set(setTo)(e.target.value)} aria-label="Registered to" />
          </div>
          <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-3">
              <span>Showing <span className="text-foreground font-medium">{filtered.length}</span> of {rows.length} registrations</span>
              {rows.some((r) => r.status === "cancelled") && (
                <label className="flex items-center gap-1.5"><input type="checkbox" className="accent-[var(--brand)]" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} />Show cancelled</label>
              )}
            </span>
            {activeFilters > 0 && (
              <Button variant="ghost" size="xs" onClick={reset}>
                <XIcon /> Clear {activeFilters} filter{activeFilters > 1 ? "s" : ""}
              </Button>
            )}
          </div>
        </div>

        {loading && !data ? (
          <TableSkeleton />
        ) : error && !data ? (
          <ErrorState message={error} onRetry={reload} />
        ) : rows.length === 0 ? (
          <EmptyState icon={ClipboardListIcon} title="No registrations yet">They appear here as soon as a family completes payment.</EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState icon={SearchIcon} title="Nothing matches these filters" action={<Button variant="outline" size="sm" onClick={reset}>Clear filters</Button>} />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <SortHead k="player_name">Player</SortHead>
                  <SortHead k="program">Program</SortHead>
                  <TableHead className="hidden md:table-cell">Parent</TableHead>
                  <SortHead k="parent_town" className="hidden lg:table-cell">Town</SortHead>
                  <SortHead k="created_at" className="hidden sm:table-cell">Registered</SortHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="hidden xl:table-cell">Waiver</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => setOpen(r)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setOpen(r)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <NameAvatar name={r.player_name} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{r.player_name}</p>
                          <p className="text-muted-foreground text-xs">Age {r.player_age}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        <ProgramDot program={programOf(r)} />
                        <span className="max-w-[220px] truncate">{programOf(r)}</span>
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <p>{r.parent_name}</p>
                      <p className="text-muted-foreground text-xs">{r.parent_email}</p>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{r.parent_town}</TableCell>
                    <TableCell className="text-muted-foreground hidden sm:table-cell">{dateTime(r.created_at)}</TableCell>
                    <TableCell>{r.status === "cancelled" ? <StatusBadge value="cancelled" /> : <StatusBadge value={r.payment_status} />}</TableCell>
                    <TableCell className="hidden xl:table-cell"><StatusBadge value={r.waiver_status} /></TableCell>
                    <TableCell><ChevronRightIcon className="text-muted-foreground size-4" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {pager}
          </>
        )}
      </Card>
      <RegistrationSheet r={open} onClose={() => setOpen(null)} api={api} onChanged={reload} />
    </div>
  )
}
