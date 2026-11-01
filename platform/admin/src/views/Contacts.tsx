import { useCallback, useMemo, useState } from "react"
import { CheckCircle2Icon, DownloadIcon, FileUpIcon, MailCheckIcon, MailXIcon, SearchIcon, ShieldQuestionIcon, UploadIcon, UsersIcon } from "lucide-react"

import type { Api } from "../api"
import { downloadCsv, stamp, type Column } from "../csv"
import { dateOnly, dateTime } from "../format"
import type { Contact, ContactImport, ImportReport } from "../types"
import { useLoad } from "../useLoad"
import { ConfirmDialog, Field } from "@/components/app/kit"
import { StatCard } from "@/components/app/stat-card"
import { usePager } from "@/components/app/pager"
import { EmptyState, ErrorState, NameAvatar, PageHeader, TableSkeleton } from "@/components/app/states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Notice, Textarea } from "@/components/ui/form-controls"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

const SOURCE_LABEL: Record<string, string> = { registration: "Registered", imported: "Imported", private_training: "Training request", waitlist: "Waitlist" }
const CONSENT_BADGE: Record<string, { variant: "success-light" | "warning-light" | "destructive-light"; label: string }> = {
  granted: { variant: "success-light", label: "Agreed" },
  unknown: { variant: "warning-light", label: "Unknown" },
  denied: { variant: "destructive-light", label: "Said no" },
}

const CSV: Column<Contact>[] = [
  { header: "Email", value: (c) => c.email }, { header: "Name", value: (c) => c.name }, { header: "Phone", value: (c) => c.phone }, { header: "Town", value: (c) => c.town },
  { header: "Joined via", value: (c) => c.sources.map((s) => SOURCE_LABEL[s] ?? s).join(", ") }, { header: "Consent", value: (c) => c.consent },
  { header: "Unsubscribed", value: (c) => (c.unsubscribed ? "yes" : "no") }, { header: "Bounced", value: (c) => (c.bounced ? "yes" : "no") },
  { header: "Registrations", value: (c) => c.registrations }, { header: "Added", value: (c) => c.created_at },
]

function status(c: Contact) {
  if (c.unsubscribed) return <Badge variant="destructive-light">Unsubscribed</Badge>
  if (c.bounced) return <Badge variant="destructive-light">Bounced</Badge>
  return <Badge variant="success-light">Active</Badge>
}

function ImportSheet({ api, open, onClose, onDone }: { api: Api; open: boolean; onClose: () => void; onDone: () => void }) {
  const [file, setFile] = useState<{ name: string; data: string } | null>(null)
  const [text, setText] = useState("")
  const [consent, setConsent] = useState<"unknown" | "granted">("unknown")
  const [report, setReport] = useState<ImportReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reset = () => { setFile(null); setText(""); setReport(null); setError(null); setConsent("unknown") }

  async function pick(f: File | undefined) {
    if (!f) return
    if (f.size > 4_000_000) return setError("That file is over 4 MB. Split it into smaller files.")
    const buf = new Uint8Array(await f.arrayBuffer())
    let bin = ""
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000))
    setFile({ name: f.name, data: btoa(bin) })
    setText("")
    setReport(null)
    setError(null)
  }

  async function run(dryRun: boolean) {
    setBusy(true)
    setError(null)
    try {
      const res = await api<ImportReport>("contacts-import", { filename: file?.name ?? "pasted text", ...(file ? { data: file.data } : { text }), consent, dryRun })
      setReport(res)
      if (!dryRun) onDone()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { reset(); onClose() } }}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
        <SheetHeader className="border-b p-6">
          <SheetTitle>Import contacts</SheetTitle>
          <SheetDescription>Word (.docx), spreadsheet (.csv) or a text file, or paste the list. Emails are cleaned up, checked and de-duplicated. Importing the same list again never creates duplicates.</SheetDescription>
        </SheetHeader>
        <div className="space-y-5 p-6">
          {report && !report.dryRun ? (
            <div className="space-y-4">
              <Notice tone="success" icon={CheckCircle2Icon} title="Import finished">{report.imported} new contacts added, {report.merged} existing contacts updated.</Notice>
              <Report report={report} />
              <Button className="w-full" onClick={() => { reset(); onClose() }}>Done</Button>
            </div>
          ) : (
            <>
              <label className={cn("hover:bg-muted/50 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors", file && "border-brand bg-brand-soft/40")}>
                <FileUpIcon className="text-muted-foreground size-6" />
                <span className="text-sm font-medium">{file ? file.name : "Choose a file"}</span>
                <span className="text-muted-foreground text-xs">.docx, .csv or .txt, up to 4 MB</span>
                <input type="file" accept=".docx,.csv,.txt,text/csv,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
              </label>
              <Field label="…or paste the list" hint="One contact per line works best, e.g. “Jane Smith, jane@example.com”.">
                <Textarea rows={5} value={text} onChange={(e) => { setText(e.target.value); setFile(null); setReport(null) }} placeholder={"Jane Smith, jane@example.com\nsam@example.com"} />
              </Field>
              <fieldset className="space-y-2">
                <legend className="mb-1 text-sm font-medium">Have these people agreed to get Footy Up emails?</legend>
                {([["unknown", "Not sure yet", "They won't be emailed until you confirm (recommended)."], ["granted", "Yes, they agreed", "For example, they signed up at a camp or on a newsletter form."]] as const).map(([v, label, hint]) => (
                  <label key={v} className={cn("flex cursor-pointer gap-3 rounded-lg border p-3", consent === v && "border-brand bg-brand-soft/40")}>
                    <input type="radio" name="consent" className="accent-[var(--brand)] mt-0.5" checked={consent === v} onChange={() => setConsent(v)} />
                    <span className="text-sm"><span className="font-medium">{label}</span><span className="text-muted-foreground block text-xs">{hint}</span></span>
                  </label>
                ))}
              </fieldset>
              {error && <Notice tone="error">{error}</Notice>}
              {report?.dryRun && <Report report={report} />}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" disabled={busy || (!file && !text.trim())} onClick={() => run(true)}>{busy && !report ? "Checking…" : "Preview import"}</Button>
                <Button className="flex-1" disabled={busy || !report?.dryRun || report.imported + report.merged === 0} onClick={() => run(false)}><UploadIcon /> Import {report?.dryRun ? report.imported + report.merged : ""} contacts</Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Report({ report }: { report: ImportReport }) {
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        {[["Found", report.found], ["New", report.imported], ["Already had", report.merged], ["Duplicates", report.duplicates]].map(([k, v]) => (
          <div key={k}><p className="text-muted-foreground text-xs">{k}</p><p className="text-lg font-semibold tabular-nums">{v}</p></div>
        ))}
      </div>
      {report.rejected.length > 0 && (
        <div>
          <p className="text-sm font-medium text-red-700">{report.rejected.length} rejected</p>
          <ul className="text-muted-foreground mt-1 max-h-32 space-y-0.5 overflow-y-auto text-xs">
            {report.rejected.slice(0, 100).map((r, i) => <li key={i}><code>{r.value}</code>: {r.reason}</li>)}
          </ul>
        </div>
      )}
      {report.sample.length > 0 && (
        <div>
          <p className="text-muted-foreground mb-1 text-xs">First few</p>
          <ul className="space-y-0.5 text-xs">{report.sample.map((s) => <li key={s.email}>{s.name ? `${s.name} · ` : ""}{s.email}{s.town ? ` · ${s.town}` : ""}</li>)}</ul>
        </div>
      )}
    </div>
  )
}

export function Contacts({ api, onExpired, refreshKey }: { api: Api; onExpired: () => void; refreshKey: number }) {
  const load = useCallback(() => api<{ contacts: Contact[]; imports: ContactImport[] }>("contacts"), [api])
  const { data, error, loading, reload } = useLoad(load, onExpired, refreshKey)
  const [search, setSearch] = useState("")
  const [consent, setConsent] = useState("")
  const [state, setState] = useState("")
  const [source, setSource] = useState("")
  const [open, setOpen] = useState<Contact | null>(null)
  const [importing, setImporting] = useState(false)
  const [batch, setBatch] = useState<ContactImport | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const rows = data?.contacts ?? []
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((c) => {
      if (q && ![c.email, c.name ?? "", c.town ?? "", c.phone ?? ""].some((v) => v.toLowerCase().includes(q))) return false
      if (consent && c.consent !== consent) return false
      if (state === "active" && (c.unsubscribed || c.bounced)) return false
      if (state === "unsubscribed" && !c.unsubscribed) return false
      if (state === "bounced" && !c.bounced) return false
      if (source && !c.sources.includes(source)) return false
      return true
    })
  }, [rows, search, consent, state, source])
  const { rows: visible, pager } = usePager(filtered, "contacts", [search, consent, state, source].join("|"))
  const counts = {
    total: rows.length,
    agreed: rows.filter((c) => c.consent === "granted" && !c.unsubscribed && !c.bounced).length,
    unknown: rows.filter((c) => c.consent === "unknown" && !c.unsubscribed && !c.bounced).length,
    out: rows.filter((c) => c.unsubscribed || c.bounced).length,
  }

  async function update(c: Contact, change: { consent?: Contact["consent"]; unsubscribed?: boolean }) {
    setBusy(true)
    try {
      await api("contact-update", { id: c.id, ...change })
      setOpen({ ...c, ...change })
      reload()
    } finally {
      setBusy(false)
    }
  }

  async function markBatch() {
    if (!batch) return
    setBusy(true)
    try {
      const res = await api<{ updated: number }>("contacts-consent", { importId: batch.id, consent: "granted" })
      setNotice(`${res.updated} contacts from ${batch.filename ?? "that import"} can now be emailed.`)
      setBatch(null)
      reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description="Everyone who can be emailed: registered families, training requests, waitlist sign-ups and imported lists."
        actions={
          <>
            <Button variant="outline" disabled={!filtered.length} onClick={() => downloadCsv(`footyup-contacts-${stamp()}.csv`, CSV, filtered)}><DownloadIcon /> Export CSV</Button>
            <Button onClick={() => setImporting(true)}><UploadIcon /> Import contacts</Button>
          </>
        }
      />
      {notice && <Notice tone="success" icon={CheckCircle2Icon}>{notice}</Notice>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="All contacts" value={counts.total} icon={UsersIcon} />
        <StatCard label="Can be emailed" value={counts.agreed} icon={MailCheckIcon} tone="brand" hint="Agreed, not unsubscribed" />
        <StatCard label="Consent unknown" value={counts.unknown} icon={ShieldQuestionIcon} tone="warning" hint="Left out of sends by default" />
        <StatCard label="Unsubscribed or bounced" value={counts.out} icon={MailXIcon} tone="info" hint="Never emailed" />
      </div>

      {data && data.imports.length > 0 && (
        <Card className="gap-0 py-0">
          <div className="border-b px-5 py-3"><p className="text-sm font-medium">Recent imports</p></div>
          <div className="divide-y">
            {data.imports.slice(0, 5).map((i) => (
              <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{i.filename ?? "Pasted list"}</p>
                  <p className="text-muted-foreground text-xs">{dateTime(i.created_at)} by {i.created_by_email} · {i.imported} new, {i.merged} updated, {i.duplicates} duplicates, {i.rejected_count} rejected</p>
                </div>
                {i.still_unknown > 0 ? (
                  <Button variant="outline" size="sm" onClick={() => setBatch(i)}>Mark {i.still_unknown} as agreed</Button>
                ) : <Badge variant="success-light">Consent set</Badge>}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="gap-0 overflow-hidden py-0">
        <div className="grid gap-2 border-b p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <div className="relative">
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input className="pl-9" placeholder="Search name, email, phone or town" value={search} onChange={(e) => { setSearch(e.target.value) }} />
          </div>
          <NativeSelect value={consent} onChange={(e) => { setConsent(e.target.value) }} aria-label="Consent">
            <option value="">Any consent</option><option value="granted">Agreed</option><option value="unknown">Unknown</option><option value="denied">Said no</option>
          </NativeSelect>
          <NativeSelect value={state} onChange={(e) => { setState(e.target.value) }} aria-label="Status">
            <option value="">Any status</option><option value="active">Active</option><option value="unsubscribed">Unsubscribed</option><option value="bounced">Bounced</option>
          </NativeSelect>
          <NativeSelect value={source} onChange={(e) => { setSource(e.target.value) }} aria-label="Joined via">
            <option value="">Joined any way</option>{Object.entries(SOURCE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </NativeSelect>
        </div>
        {loading && !data ? <TableSkeleton /> : error && !data ? <ErrorState message={error} onRetry={reload} /> : filtered.length === 0 ? (
          <EmptyState icon={UsersIcon} title={rows.length ? "Nobody matches these filters" : "No contacts yet"} action={!rows.length ? <Button onClick={() => setImporting(true)}><UploadIcon /> Import your list</Button> : undefined}>
            {!rows.length && "Families are added automatically when they register. Import the existing parent list to get started."}
          </EmptyState>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Contact</TableHead><TableHead className="hidden md:table-cell">Town</TableHead><TableHead className="hidden lg:table-cell">Joined via</TableHead>
                  <TableHead>Consent</TableHead><TableHead className="hidden sm:table-cell">Status</TableHead><TableHead className="hidden xl:table-cell">Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => setOpen(c)}>
                    <TableCell><div className="flex items-center gap-3"><NameAvatar name={c.name ?? c.email} /><div className="min-w-0"><p className="truncate font-medium">{c.name ?? "—"}</p><p className="text-muted-foreground truncate text-xs">{c.email}</p></div></div></TableCell>
                    <TableCell className="hidden md:table-cell">{c.town ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="hidden lg:table-cell"><div className="flex flex-wrap gap-1">{c.sources.map((s) => <Badge key={s} variant="outline" className="font-normal">{SOURCE_LABEL[s] ?? s}</Badge>)}</div></TableCell>
                    <TableCell><Badge variant={CONSENT_BADGE[c.consent]!.variant}>{CONSENT_BADGE[c.consent]!.label}</Badge></TableCell>
                    <TableCell className="hidden sm:table-cell">{status(c)}</TableCell>
                    <TableCell className="text-muted-foreground hidden xl:table-cell">{dateOnly(c.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {pager}
          </>
        )}
      </Card>

      <Sheet open={Boolean(open)} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
          {open && (
            <>
              <SheetHeader className="border-b p-6">
                <div className="flex items-center gap-3"><NameAvatar name={open.name ?? open.email} className="size-11 text-sm" /><div className="min-w-0"><SheetTitle className="truncate">{open.name ?? open.email}</SheetTitle><SheetDescription className="truncate">{open.email}</SheetDescription></div></div>
                <div className="mt-2 flex gap-2">{status(open)}<Badge variant={CONSENT_BADGE[open.consent]!.variant}>Consent: {CONSENT_BADGE[open.consent]!.label}</Badge></div>
              </SheetHeader>
              <div className="space-y-6 p-6">
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div><dt className="text-muted-foreground text-xs">Town</dt><dd>{open.town ?? "—"}</dd></div>
                  <div><dt className="text-muted-foreground text-xs">Phone</dt><dd>{open.phone ?? "—"}</dd></div>
                  <div><dt className="text-muted-foreground text-xs">Joined via</dt><dd>{open.sources.map((s) => SOURCE_LABEL[s] ?? s).join(", ") || "—"}</dd></div>
                  <div><dt className="text-muted-foreground text-xs">Registrations</dt><dd>{open.registrations}</dd></div>
                  <div><dt className="text-muted-foreground text-xs">Added</dt><dd>{dateOnly(open.created_at)}</dd></div>
                  <div><dt className="text-muted-foreground text-xs">Synced to Brevo</dt><dd>{open.provider_synced_at ? dateOnly(open.provider_synced_at) : "Not yet"}</dd></div>
                </dl>
                <Field label="Email consent" hint="Contacts with unknown consent are left out of sends unless you include them.">
                  <NativeSelect value={open.consent} disabled={busy} onChange={(e) => update(open, { consent: e.target.value as Contact["consent"] })}>
                    <option value="granted">Agreed to Footy Up emails</option><option value="unknown">Unknown</option><option value="denied">Said no</option>
                  </NativeSelect>
                </Field>
                {open.unsubscribed ? (
                  <div className="space-y-2">
                    <Notice tone="warning">Unsubscribed {open.unsubscribed_at ? dateTime(open.unsubscribed_at) : ""}. Only resubscribe if they asked you to.</Notice>
                    <Button variant="outline" className="w-full" disabled={busy} onClick={() => update(open, { unsubscribed: false })}><MailCheckIcon /> Resubscribe</Button>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full" disabled={busy} onClick={() => update(open, { unsubscribed: true })}><MailXIcon /> Unsubscribe from marketing emails</Button>
                )}
                <p className="text-muted-foreground text-xs">Registration confirmations and reminders still go out; they aren't marketing.</p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ImportSheet api={api} open={importing} onClose={() => setImporting(false)} onDone={reload} />
      <ConfirmDialog open={Boolean(batch)} onOpenChange={(o) => !o && setBatch(null)} title="Mark this import as agreed?" description="Only do this once you've confirmed how these people agreed to hear from Footy Up (for example, past camp sign-ups). They'll be included in future sends." confirmLabel={`Mark ${batch?.still_unknown ?? 0} as agreed`} busy={busy} onConfirm={markBatch} />
    </div>
  )
}
