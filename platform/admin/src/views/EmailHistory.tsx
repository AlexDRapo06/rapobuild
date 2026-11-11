import { useCallback, useMemo, useState } from "react"
import { BellIcon, ChevronRightIcon, HistoryIcon, MailCheckIcon, SendIcon } from "lucide-react"

import type { Api } from "../api"
import { dateTime } from "../format"
import type { CampaignLog, EmailOptions } from "../types"
import { useLoad } from "../useLoad"
import { fillMergeFields, renderCampaign, SAMPLE_MERGE_VALUES } from "../../../src/email/templates"
import { usePager } from "@/components/app/pager"
import { EmptyState, ErrorState, PageHeader, TableSkeleton } from "@/components/app/states"
import { StatusBadge } from "@/components/app/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Navigate } from "./Analytics"

interface History {
  campaigns: CampaignLog[]
  automatic: { kind: string; template: string; status: string; count: number; last_sent: string }[]
}

function describeSegment(s: CampaignLog["segment"], options: EmailOptions | null) {
  if (!s) return "—"
  const names = new Map<string, string>()
  for (const c of options?.camps ?? []) {
    names.set(`camp:${c.id}`, c.name)
    for (const x of c.sessions) names.set(`session:${x.id}`, `${c.name} – ${x.name}`)
  }
  names.set("miami:boys", "Combine – Boys")
  names.set("miami:girls", "Combine – Girls")
  const parts = [
    s.programs.length ? s.programs.map((p) => names.get(p) ?? "A removed session").join(" or ") : null,
    s.towns.length ? `in ${s.towns.join(" or ")}` : null,
    s.sources.length ? `joined via ${s.sources.join("/")}` : null,
  ].filter(Boolean)
  return parts.length ? parts.join(", ") : "Everyone"
}

const AUTO_LABEL: Record<string, string> = { confirmation: "Registration confirmations", "waitlist-offer": "Waitlist offers" }

export function EmailHistory({ api, onExpired, refreshKey, navigate }: { api: Api; onExpired: () => void; refreshKey: number; navigate: Navigate }) {
  const load = useCallback(() => Promise.all([api<History>("email-history"), api<EmailOptions>("email-options")]), [api])
  const { data, error, loading, reload } = useLoad(load, onExpired, refreshKey)
  const [open, setOpen] = useState<CampaignLog | null>(null)
  const [history, options] = data ?? [null, null]
  const { rows: campaigns, pager } = usePager(history?.campaigns ?? [], "email-history")

  const auto = useMemo(() => {
    const map = new Map<string, { sent: number; skipped: number; last: string | null }>()
    for (const a of history?.automatic ?? []) {
      const label = a.kind === "reminder" ? `Reminders (${a.template.replace("reminder-", "")} day${a.template.endsWith("-1") ? "" : "s"} before)` : AUTO_LABEL[a.template] ?? a.template
      const cur = map.get(label) ?? { sent: 0, skipped: 0, last: null }
      if (a.status === "sent") cur.sent += a.count
      if (a.status === "skipped") cur.skipped += a.count
      cur.last = !cur.last || a.last_sent > cur.last ? a.last_sent : cur.last
      map.set(label, cur)
    }
    return [...map.entries()]
  }, [history])

  return (
    <div className="space-y-6">
      <PageHeader title="Email history" description="Every campaign you've sent, with who it went to, plus the automatic emails parents receive." actions={<Button onClick={() => navigate("compose")}><SendIcon /> New email</Button>} />
      {error && !data ? <Card><ErrorState message={error} onRetry={reload} /></Card> : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Automatic emails</CardTitle></CardHeader>
            <CardContent>
              {auto.length === 0 ? <p className="text-muted-foreground text-sm">None yet. Confirmations go out right after each payment; reminders go out before the first day; waitlist offers go out when a spot opens.</p> : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {auto.map(([label, v]) => (
                    <div key={label} className="flex items-center gap-3 rounded-lg border p-3">
                      <span className="bg-brand-soft text-brand-strong flex size-9 items-center justify-center rounded-lg">{label.startsWith("Reminder") ? <BellIcon className="size-4" /> : <MailCheckIcon className="size-4" />}</span>
                      <div><p className="text-sm font-medium">{label}</p><p className="text-muted-foreground text-xs">{v.sent} sent{v.skipped ? ` · ${v.skipped} skipped (test mode or no Brevo key)` : ""} · last {dateTime(v.last)}</p></div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="gap-0 overflow-hidden py-0">
            {loading && !data ? <TableSkeleton /> : !history?.campaigns.length ? (
              <EmptyState icon={HistoryIcon} title="No campaigns yet" action={<Button onClick={() => navigate("compose")}><SendIcon /> Send your first email</Button>} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent"><TableHead>Subject</TableHead><TableHead className="hidden lg:table-cell">Audience</TableHead><TableHead className="text-right">Recipients</TableHead><TableHead className="hidden md:table-cell">Sent</TableHead><TableHead>Status</TableHead><TableHead className="w-8" /></TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => setOpen(c)}>
                      <TableCell className="max-w-[320px]"><p className="truncate font-medium">{c.subject}</p><p className="text-muted-foreground text-xs">{c.sent_by_email}</p></TableCell>
                      <TableCell className="text-muted-foreground hidden max-w-[300px] truncate lg:table-cell">{c.status === "test" ? `Test to ${c.sent_by_email}` : describeSegment(c.segment, options)}</TableCell>
                      <TableCell className="text-right tabular-nums">{c.recipient_count}</TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">{dateTime(c.created_at)}</TableCell>
                      <TableCell>{c.status === "test" ? <Badge variant="secondary">Test</Badge> : <StatusBadge value={c.status === "sent" ? "paid" : c.status === "failed" ? "refunded" : "notified"} />}</TableCell>
                      <TableCell><ChevronRightIcon className="text-muted-foreground size-4" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {pager}
          </Card>
        </>
      )}
      <Sheet open={Boolean(open)} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-2xl">
          {open && (
            <>
              <SheetHeader className="border-b p-6">
                <SheetTitle>{open.subject}</SheetTitle>
                <SheetDescription>{open.status === "test" ? "Test send" : `Sent ${dateTime(open.created_at)} by ${open.sent_by_email}`}</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 p-6">
                <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                  <div><dt className="text-muted-foreground text-xs">Status</dt><dd className="capitalize">{open.status}</dd></div>
                  <div><dt className="text-muted-foreground text-xs">Recipients</dt><dd className="tabular-nums">{open.recipient_count}</dd></div>
                  <div className="col-span-2"><dt className="text-muted-foreground text-xs">Audience</dt><dd>{describeSegment(open.segment, options)}</dd></div>
                  {open.excluded && <div className="col-span-2 sm:col-span-4"><dt className="text-muted-foreground text-xs">Left out</dt><dd>{open.excluded.unsubscribed} unsubscribed · {open.excluded.unknown} unknown consent · {open.excluded.denied} said no · {open.excluded.bounced} bounced</dd></div>}
                  {open.error && <div className="col-span-2 sm:col-span-4"><dt className="text-xs text-red-700">Error</dt><dd className="text-red-700">{open.error}</dd></div>}
                </dl>
                {open.body && (
                  <iframe title="Sent email" sandbox="" className="h-[560px] w-full rounded-lg border bg-white" srcDoc={fillMergeFields(renderCampaign({ subject: open.subject, body: open.body, mailingAddress: options?.brand.mailingAddress, logoUrl: options?.brand.logoUrl, unsubscribeUrl: "#unsubscribe" }).html, SAMPLE_MERGE_VALUES)} />
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
