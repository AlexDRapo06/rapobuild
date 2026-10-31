import { useCallback, useMemo, useState } from "react"
import { BellRingIcon, DownloadIcon, HourglassIcon, SearchIcon, Trash2Icon } from "lucide-react"

import type { Api } from "../api"
import { downloadCsv, stamp, type Column } from "../csv"
import { dateTime } from "../format"
import { programOf, type WaitlistEntry } from "../types"
import { useLoad } from "../useLoad"
import { ConfirmDialog } from "@/components/app/kit"
import { Paged } from "@/components/app/pager"
import { EmptyState, ErrorState, NameAvatar, PageHeader, TableSkeleton } from "@/components/app/states"
import { ProgramDot, StatusBadge } from "@/components/app/status-badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Notice } from "@/components/ui/form-controls"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Entry extends WaitlistEntry {
  session_id: string | null
  notified_at: string | null
  offer_expires_at: string | null
  converted_at: string | null
}

const CSV: Column<Entry>[] = [
  { header: "Joined", value: (r) => r.created_at },
  { header: "Program", value: (r) => programOf(r) },
  { header: "Parent", value: (r) => r.parent_name },
  { header: "Email", value: (r) => r.email },
  { header: "Phone", value: (r) => r.phone },
  { header: "Town", value: (r) => r.town },
  { header: "Spots", value: (r) => r.spots },
  { header: "Status", value: (r) => r.status },
  { header: "Offer expires", value: (r) => r.offer_expires_at },
]

export function Waitlist({ api, onExpired, refreshKey }: { api: Api; onExpired: () => void; refreshKey: number }) {
  const load = useCallback(() => api<{ waitlist: Entry[] }>("waitlist"), [api])
  const { data, error, loading, reload } = useLoad(load, onExpired, refreshKey)
  const [search, setSearch] = useState("")
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null)
  const [remove, setRemove] = useState<Entry | null>(null)
  const [busy, setBusy] = useState(false)

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows = (data?.waitlist ?? []).filter((r) => !q || [r.parent_name, r.email, r.phone, r.town].some((v) => v.toLowerCase().includes(q)))
    const map = new Map<string, Entry[]>()
    for (const r of rows) map.set(programOf(r), [...(map.get(programOf(r)) ?? []), r])
    return [...map.entries()]
  }, [data, search])

  async function notifyNext(entry: Entry) {
    setBusy(true)
    setNotice(null)
    try {
      const res = await api<{ notified: string; until: string }>("waitlist-notify", entry.session_id ? { sessionId: entry.session_id } : { miamiGroup: entry.miami_group })
      setNotice({ tone: "success", text: `Emailed ${res.notified}. Their spot is held until ${dateTime(res.until)}.` })
      reload()
    } catch (err) {
      setNotice({ tone: "error", text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  async function confirmRemove() {
    if (!remove) return
    setBusy(true)
    try {
      await api("waitlist-remove", { id: remove.id })
      setRemove(null)
      reload()
    } catch (err) {
      setNotice({ tone: "error", text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  const rows = data?.waitlist ?? []
  return (
    <div className="space-y-6">
      <PageHeader
        title="Waitlist"
        description="When a spot frees up, the next family is emailed automatically and the spot is held for them. You can also notify the next family yourself."
        actions={<Button variant="outline" disabled={!rows.length} onClick={() => downloadCsv(`footyup-waitlist-${stamp()}.csv`, CSV, rows)}><DownloadIcon /> Export CSV</Button>}
      />
      {notice && <Notice tone={notice.tone} icon={BellRingIcon}>{notice.text}</Notice>}
      <div className="relative max-w-md">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input className="bg-card pl-9" placeholder="Search name, email, phone or town" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search waitlist" />
      </div>

      {loading && !data ? <Card><TableSkeleton rows={4} /></Card> : error && !data ? <Card><ErrorState message={error} onRetry={reload} /></Card> : groups.length === 0 ? (
        <Card><EmptyState icon={HourglassIcon} title={rows.length ? "Nobody matches your search" : "Nobody is waiting"}>When a session or Miami group fills, families can join the waitlist and appear here in order.</EmptyState></Card>
      ) : (
        groups.map(([program, entries]) => {
          const waiting = entries.filter((e) => e.status === "waiting")
          return (
            <Card key={program} className="gap-0 overflow-hidden py-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
                <div>
                  <p className="flex items-center gap-2 font-medium"><ProgramDot program={program} />{program}</p>
                  <p className="text-muted-foreground text-xs">{waiting.length} waiting · {entries.filter((e) => e.status === "notified").length} with an offer · {entries.filter((e) => e.status === "converted").length} registered</p>
                </div>
                <Button size="sm" disabled={!waiting.length || busy} onClick={() => notifyNext(waiting[0]!)}><BellRingIcon /> Notify next family</Button>
              </div>
              <Paged rows={entries} id="waitlist" resetKey={search}>{(page, offset) => (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Family</TableHead>
                    <TableHead className="hidden md:table-cell">Town</TableHead>
                    <TableHead className="hidden sm:table-cell">Joined</TableHead>
                    <TableHead className="text-right">Spots</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {page.map((r, i) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-muted-foreground tabular-nums">{offset + i + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <NameAvatar name={r.parent_name} />
                          <div className="min-w-0"><p className="font-medium">{r.parent_name}</p><p className="text-muted-foreground truncate text-xs">{r.email} · {r.phone}</p></div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{r.town}</TableCell>
                      <TableCell className="text-muted-foreground hidden sm:table-cell">{dateTime(r.created_at)}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.spots}</TableCell>
                      <TableCell>
                        <StatusBadge value={r.status} />
                        {r.status === "notified" && r.offer_expires_at && <p className="text-muted-foreground mt-1 text-xs">Held until {dateTime(r.offer_expires_at)}</p>}
                      </TableCell>
                      <TableCell>
                        {(r.status === "waiting" || r.status === "notified") && (
                          <Button variant="ghost" size="icon-sm" aria-label={`Remove ${r.parent_name}`} onClick={() => setRemove(r)}><Trash2Icon /></Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}</Paged>
            </Card>
          )
        })
      )}
      <ConfirmDialog
        open={Boolean(remove)}
        onOpenChange={(o) => !o && setRemove(null)}
        title={`Remove ${remove?.parent_name ?? ""} from the waitlist?`}
        description={remove?.status === "notified" ? "Their held spot is released and offered to the next family." : "They won't be offered a spot."}
        confirmLabel="Remove"
        destructive
        busy={busy}
        onConfirm={confirmRemove}
      />
    </div>
  )
}
