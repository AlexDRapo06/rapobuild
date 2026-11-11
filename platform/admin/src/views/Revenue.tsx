import { useCallback, useMemo, useState } from "react"
import { BanknoteIcon, ChevronRightIcon, CreditCardIcon, DownloadIcon, ExternalLinkIcon, PercentIcon, ReceiptIcon, RotateCcwIcon, SearchIcon, XIcon } from "lucide-react"

import type { Api } from "../api"
import { downloadCsv, stamp } from "../csv"
import { dateTime, money } from "../format"
import { useLoad } from "../useLoad"
import { DateRange, PillTabs } from "@/components/app/kit"
import { StatCard } from "@/components/app/stat-card"
import { Paged } from "@/components/app/pager"
import { EmptyState, ErrorState, NameAvatar, PageHeader, TableSkeleton } from "@/components/app/states"
import { ProgramDot, StatusBadge } from "@/components/app/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Navigate } from "./Analytics"

interface ProgramRow { program: string; session_id: string | null; miami_group: string | null; registrations: number; gross_cents: number; discount_cents: number; refund_cents: number; net_cents: number }
interface PaymentRow {
  id: string; created_at: string; customer_email: string | null; family: string | null; status: string; amount_subtotal_cents: number; amount_total_cents: number
  discount_cents: number; sibling_discount_cents: number; promo_discount_cents: number; promo_code: string | null; refunded_cents: number
  stripe_payment_intent_id: string | null; stripe_checkout_session_id: string; legacy: boolean
  registrations: { player: string; program: string; price_cents: number | null; discount_cents: number; status: string }[]
}
interface Cancellation { id: string; cancelled_at: string | null; cancel_reason: string | null; player_name: string; parent_name: string; parent_email: string; program: string; payment_status: string; refunded_cents: number }
interface RevenueData {
  totals: { gross_cents: number; discount_cents: number; refund_cents: number; net_cents: number; collected_cents: number; payments: number; refunded_payments: number }
  byProgram: ProgramRow[]
  payments: PaymentRow[]
  cancellations: Cancellation[]
}

const stripeUrl = (pi: string | null) => (pi && !pi.startsWith("pi_mock") ? `https://dashboard.stripe.com/payments/${pi}` : null)

export function Revenue({ api, onExpired, refreshKey, params }: { api: Api; onExpired: () => void; refreshKey: number; navigate: Navigate; params: Record<string, string> }) {
  const [range, setRange] = useState({ from: params.from ?? "", to: params.to ?? "" })
  const [tab, setTab] = useState<"payments" | "refunds">("payments")
  const [program, setProgram] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState<PaymentRow | null>(null)
  const load = useCallback(() => api<RevenueData>(`revenue?from=${range.from}&to=${range.to}`), [api, range])
  const { data, error, loading, reload } = useLoad(load, onExpired, refreshKey)

  const payments = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data?.payments ?? []).filter((p) => {
      if (tab === "refunds" && p.refunded_cents <= 0) return false
      if (program && !p.registrations.some((r) => r.program === program)) return false
      if (q && ![p.customer_email ?? "", p.family ?? "", p.promo_code ?? "", ...p.registrations.map((r) => r.player)].some((v) => v.toLowerCase().includes(q))) return false
      return true
    })
  }, [data, tab, program, search])

  const t = data?.totals
  return (
    <div className="space-y-6">
      <PageHeader title="Revenue" description="Payment status and revenue by camp, session and Combine group. Amounts are before Stripe fees." actions={<DateRange from={range.from} to={range.to} onChange={setRange} />} />

      {loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="bg-muted h-32 animate-pulse rounded-xl" />)}</div>
      ) : error && !data ? (
        <Card><ErrorState message={error} onRetry={reload} /></Card>
      ) : data && t ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Gross" prefix="$" value={Math.round(t.gross_cents / 100)} icon={ReceiptIcon} hint="List prices before discounts" />
            <StatCard label="Discounts" prefix="$" value={Math.round(t.discount_cents / 100)} icon={PercentIcon} tone="info" hint="Sibling, promo and early-bird savings" />
            <StatCard label="Refunds" prefix="$" value={Math.round(t.refund_cents / 100)} icon={RotateCcwIcon} tone="warning" hint={`${t.refunded_payments} refunded payment${t.refunded_payments === 1 ? "" : "s"}`} />
            <StatCard label="Net" prefix="$" value={Math.round(t.net_cents / 100)} icon={BanknoteIcon} tone="brand" hint={`${t.payments} payments · collected ${money(t.collected_cents)}`} />
          </div>

          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b py-5">
              <CardTitle className="text-base">By camp, session and Combine group</CardTitle>
              <CardDescription>Click a row to see its payments below. Refunds are split across a payment's registrations by price.</CardDescription>
              <CardAction>
                <Button variant="outline" size="sm" onClick={() => downloadCsv(`footyup-revenue-${stamp()}.csv`, [
                  { header: "Program", value: (r: ProgramRow) => r.program },
                  { header: "Registrations", value: (r: ProgramRow) => r.registrations },
                  { header: "Gross (USD)", value: (r: ProgramRow) => (r.gross_cents / 100).toFixed(2) },
                  { header: "Discounts (USD)", value: (r: ProgramRow) => (r.discount_cents / 100).toFixed(2) },
                  { header: "Refunds (USD)", value: (r: ProgramRow) => (r.refund_cents / 100).toFixed(2) },
                  { header: "Net (USD)", value: (r: ProgramRow) => (r.net_cents / 100).toFixed(2) },
                ], data.byProgram)}>
                  <DownloadIcon /> CSV
                </Button>
              </CardAction>
            </CardHeader>
            {data.byProgram.length === 0 ? (
              <EmptyState icon={ReceiptIcon} title="No payments in this period" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Program</TableHead>
                    <TableHead className="text-right">Registrations</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">Discounts</TableHead>
                    <TableHead className="hidden text-right sm:table-cell">Refunds</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.byProgram.map((r) => (
                    <TableRow key={r.program} className={`cursor-pointer ${program === r.program ? "bg-brand-soft/60" : ""}`} onClick={() => setProgram(program === r.program ? null : r.program)}>
                      <TableCell><span className="inline-flex items-center gap-2"><ProgramDot program={r.program} />{r.program}</span></TableCell>
                      <TableCell className="text-right tabular-nums">{r.registrations}</TableCell>
                      <TableCell className="text-right tabular-nums">{money(r.gross_cents)}</TableCell>
                      <TableCell className="text-muted-foreground hidden text-right tabular-nums sm:table-cell">{r.discount_cents ? `−${money(r.discount_cents)}` : "—"}</TableCell>
                      <TableCell className="text-muted-foreground hidden text-right tabular-nums sm:table-cell">{r.refund_cents ? `−${money(r.refund_cents)}` : "—"}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{money(r.net_cents)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <Card className="gap-0 overflow-hidden py-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
              <PillTabs id="rev-tab" value={tab} onChange={setTab} options={[{ value: "payments", label: `Payments (${data.payments.length})` }, { value: "refunds", label: `Refunds & cancellations (${data.payments.filter((p) => p.refunded_cents > 0).length + data.cancellations.length})` }]} />
              <div className="flex flex-wrap items-center gap-2">
                {program && <Badge variant="secondary" className="gap-1">{program}<button onClick={() => setProgram(null)} aria-label="Clear program filter"><XIcon className="size-3" /></button></Badge>}
                <div className="relative">
                  <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                  <Input className="h-8 w-56 pl-8 text-xs" placeholder="Family, email, player or code" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Button variant="outline" size="sm" onClick={() => downloadCsv(`footyup-payments-${stamp()}.csv`, [
                  { header: "Date", value: (p: PaymentRow) => p.created_at }, { header: "Family", value: (p: PaymentRow) => p.family }, { header: "Email", value: (p: PaymentRow) => p.customer_email },
                  { header: "Registrations", value: (p: PaymentRow) => p.registrations.map((r) => `${r.player} (${r.program})`).join("; ") },
                  { header: "Gross (USD)", value: (p: PaymentRow) => (p.amount_subtotal_cents / 100).toFixed(2) }, { header: "Discount (USD)", value: (p: PaymentRow) => (p.discount_cents / 100).toFixed(2) },
                  { header: "Promo code", value: (p: PaymentRow) => p.promo_code }, { header: "Paid (USD)", value: (p: PaymentRow) => (p.amount_total_cents / 100).toFixed(2) },
                  { header: "Refunded (USD)", value: (p: PaymentRow) => (p.refunded_cents / 100).toFixed(2) }, { header: "Status", value: (p: PaymentRow) => p.status },
                  { header: "Stripe payment", value: (p: PaymentRow) => p.stripe_payment_intent_id },
                ], payments)}>
                  <DownloadIcon /> CSV
                </Button>
              </div>
            </div>
            {loading && !data ? <TableSkeleton /> : payments.length === 0 && (tab === "payments" || data.cancellations.length === 0) ? (
              <EmptyState icon={CreditCardIcon} title={tab === "refunds" ? "No refunds or cancellations" : "No payments match"} />
            ) : (
              <>
                {payments.length > 0 && (
                  <Paged rows={payments} id="revenue-payments" resetKey={tab}>{(page) => (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Family</TableHead>
                        <TableHead className="hidden md:table-cell">Registrations</TableHead>
                        <TableHead className="hidden sm:table-cell">Date</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="hidden text-right lg:table-cell">Refunded</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-8" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {page.map((p) => (
                        <TableRow key={p.id} className="cursor-pointer" onClick={() => setOpen(p)}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <NameAvatar name={p.family ?? p.customer_email ?? "?"} />
                              <div className="min-w-0"><p className="truncate font-medium">{p.family ?? "Old site checkout"}</p><p className="text-muted-foreground text-xs">{p.customer_email}</p></div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden max-w-[280px] truncate md:table-cell">{p.registrations.map((r) => r.player).join(", ") || "—"}</TableCell>
                          <TableCell className="text-muted-foreground hidden sm:table-cell">{dateTime(p.created_at)}</TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{money(p.amount_total_cents)}{p.promo_code && <div className="text-muted-foreground text-xs">code {p.promo_code}</div>}</TableCell>
                          <TableCell className="hidden text-right tabular-nums lg:table-cell">{p.refunded_cents ? `−${money(p.refunded_cents)}` : "—"}</TableCell>
                          <TableCell><StatusBadge value={p.status} /></TableCell>
                          <TableCell><ChevronRightIcon className="text-muted-foreground size-4" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  )}</Paged>
                )}
                {tab === "refunds" && data.cancellations.length > 0 && (
                  <div className="border-t">
                    <p className="text-muted-foreground px-5 pt-4 pb-2 text-xs font-semibold tracking-wide uppercase">Cancelled registrations</p>
                    <Table>
                      <TableBody>
                        {data.cancellations.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell><p className="font-medium">{c.player_name}</p><p className="text-muted-foreground text-xs">{c.parent_name} · {c.parent_email}</p></TableCell>
                            <TableCell><span className="inline-flex items-center gap-2"><ProgramDot program={c.program} />{c.program}</span></TableCell>
                            <TableCell className="text-muted-foreground">{c.cancel_reason ?? "No reason given"}</TableCell>
                            <TableCell className="text-muted-foreground">{dateTime(c.cancelled_at)}</TableCell>
                            <TableCell><StatusBadge value={c.payment_status} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </Card>
          <p className="text-muted-foreground text-xs">
            Reconciling with Stripe: for the same dates, <strong>Collected</strong> ({money(t.collected_cents)}) matches Stripe's gross volume and <strong>Refunds</strong> ({money(t.refund_cents)}) matches Stripe's refunds. Stripe fees are taken out separately by Stripe.
          </p>
        </>
      ) : null}

      <Sheet open={Boolean(open)} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
          {open && (
            <>
              <SheetHeader className="border-b p-6">
                <SheetTitle>{open.family ?? "Payment"}</SheetTitle>
                <SheetDescription>{open.customer_email} · {dateTime(open.created_at)}</SheetDescription>
                <div className="mt-2"><StatusBadge value={open.status} /></div>
              </SheetHeader>
              <div className="space-y-6 p-6">
                <div className="rounded-xl border">
                  {open.registrations.length ? open.registrations.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 border-b px-4 py-3 last:border-0">
                      <div className="min-w-0"><p className="font-medium">{r.player}</p><p className="text-muted-foreground flex items-center gap-1.5 text-xs"><ProgramDot program={r.program} />{r.program}{r.status === "cancelled" && " · cancelled"}</p></div>
                      <div className="text-right text-sm tabular-nums">{r.price_cents !== null ? money(r.price_cents) : "—"}{r.discount_cents > 0 && <p className="text-muted-foreground text-xs">−{money(r.discount_cents)} discount</p>}</div>
                    </div>
                  )) : <p className="text-muted-foreground p-4 text-sm">Paid through the old site checkout; details are in Stripe.</p>}
                </div>
                <dl className="space-y-2 text-sm">
                  {[
                    ["Subtotal", money(open.legacy ? open.amount_total_cents : open.amount_subtotal_cents)],
                    ...(open.sibling_discount_cents ? [["Sibling discount", `−${money(open.sibling_discount_cents)}`]] : []),
                    ...(open.promo_discount_cents ? [[`Promo code ${open.promo_code}`, `−${money(open.promo_discount_cents)}`]] : []),
                    ["Paid", money(open.amount_total_cents)],
                    ...(open.refunded_cents ? [["Refunded", `−${money(open.refunded_cents)}`]] : []),
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium tabular-nums">{v}</dd></div>
                  ))}
                </dl>
                <div className="bg-muted/50 space-y-1 rounded-lg p-3 text-xs">
                  <p><span className="text-muted-foreground">Stripe payment:</span> <code>{open.stripe_payment_intent_id ?? "—"}</code></p>
                  <p><span className="text-muted-foreground">Checkout session:</span> <code className="break-all">{open.stripe_checkout_session_id}</code></p>
                </div>
                {stripeUrl(open.stripe_payment_intent_id) && (
                  <Button asChild variant="outline" className="w-full"><a href={stripeUrl(open.stripe_payment_intent_id)!} target="_blank" rel="noreferrer"><ExternalLinkIcon /> Open in Stripe (refunds are issued there)</a></Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
