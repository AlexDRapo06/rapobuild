import { useState } from "react"
import { PencilIcon, PlusIcon, TagIcon } from "lucide-react"

import type { Api } from "../../api"
import { dateTime, money } from "../../format"
import { EtDateTimeInput, Field, MoneyInput } from "@/components/app/kit"
import { EmptyState } from "@/components/app/states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Notice, Switch } from "@/components/ui/form-controls"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CampRow, PromoRow, SettingsData } from "./types"

function promoLabel(p: { kind: string; amount: number }) {
  return p.kind === "percent" ? `${p.amount}% off` : `${money(p.amount)} off`
}

function PromoSheet({ api, promo, camps, onClose, onSaved }: { api: Api; promo: PromoRow | "new" | null; camps: CampRow[]; onClose: () => void; onSaved: () => void }) {
  const p = promo && promo !== "new" ? promo : null
  const [form, setForm] = useState({
    code: p?.code ?? "", description: p?.description ?? "", kind: p?.kind ?? "percent", amount: p?.amount ?? 10, scope: p?.scope ?? "all",
    campId: p?.camp_id ?? "", sessionId: p?.session_id ?? "", maxUses: p?.max_uses ?? null as number | null, perCustomerLimit: p?.per_customer_limit ?? 1 as number | null,
    startsAt: p?.starts_at ?? null as string | null, endsAt: p?.ends_at ?? null as string | null, active: p?.active ?? true,
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch })
  const sessions = camps.flatMap((c) => c.sessions.map((s) => ({ id: s.id, label: `${c.name} – ${s.name}` })))

  async function save() {
    setBusy(true)
    setError(null)
    try {
      await api("promo-save", { id: p?.id, ...form, description: form.description || null, campId: form.campId || null, sessionId: form.sessionId || null })
      onSaved()
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={Boolean(promo)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>{p ? "Edit promo code" : "New promo code"}</SheetTitle><SheetDescription>Parents type the code at checkout. The discount is checked on the server and shown on the Stripe checkout page.</SheetDescription></SheetHeader>
        <div className="space-y-4 px-4">
          <Field label="Code" hint="Letters, numbers, - or _. Not case-sensitive for parents."><Input value={form.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} placeholder="EARLYBIRD" /></Field>
          <Field label="Note (only you see this)"><Input value={form.description} onChange={(e) => set({ description: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Discount type"><NativeSelect value={form.kind} onChange={(e) => set({ kind: e.target.value as "percent" | "amount", amount: e.target.value === "percent" ? 10 : 5000 })}><option value="percent">Percent off</option><option value="amount">Dollars off</option></NativeSelect></Field>
            <Field label={form.kind === "percent" ? "Percent" : "Amount"} hint="Off each registration">
              {form.kind === "percent" ? <Input type="number" min={1} max={100} value={form.amount} onChange={(e) => set({ amount: Number(e.target.value) })} /> : <MoneyInput cents={form.amount} onChange={(c) => set({ amount: c ?? 0 })} />}
            </Field>
          </div>
          <Field label="Applies to">
            <NativeSelect value={form.scope} onChange={(e) => set({ scope: e.target.value as PromoRow["scope"] })}><option value="all">Everything</option><option value="miami">Miami combine only</option><option value="camp">One camp</option><option value="session">One session</option></NativeSelect>
          </Field>
          {form.scope === "camp" && <Field label="Camp"><NativeSelect value={form.campId} onChange={(e) => set({ campId: e.target.value })}><option value="">Choose…</option>{camps.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</NativeSelect></Field>}
          {form.scope === "session" && <Field label="Session"><NativeSelect value={form.sessionId} onChange={(e) => set({ sessionId: e.target.value })}><option value="">Choose…</option>{sessions.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</NativeSelect></Field>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total uses" hint="Empty = unlimited"><Input type="number" min={1} value={form.maxUses ?? ""} onChange={(e) => set({ maxUses: e.target.value ? Number(e.target.value) : null })} /></Field>
            <Field label="Uses per family" hint="Empty = unlimited"><Input type="number" min={1} value={form.perCustomerLimit ?? ""} onChange={(e) => set({ perCustomerLimit: e.target.value ? Number(e.target.value) : null })} /></Field>
          </div>
          <Field label="Starts (optional)"><EtDateTimeInput value={form.startsAt} onChange={(v) => set({ startsAt: v })} /></Field>
          <Field label="Ends (optional)"><EtDateTimeInput value={form.endsAt} onChange={(v) => set({ endsAt: v })} /></Field>
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3"><span className="text-sm font-medium">Active</span><Switch checked={form.active} onCheckedChange={(v) => set({ active: v })} /></label>
          {error && <Notice tone="error">{error}</Notice>}
        </div>
        <SheetFooter><Button onClick={save} disabled={busy || form.code.length < 3}>{busy ? "Saving…" : "Save code"}</Button></SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export function DiscountSettings({ api, data, reload }: { api: Api; data: SettingsData; reload: () => void }) {
  const [edit, setEdit] = useState<PromoRow | "new" | null>(null)
  const [sibling, setSibling] = useState(data.pricing.sibling_discount)
  const [hold, setHold] = useState(data.pricing.waitlist_hold_hours)
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null)
  const now = Date.now()

  async function savePricing() {
    setMsg(null)
    try {
      await api("pricing-settings", { sibling_discount: sibling, waitlist_hold_hours: hold })
      setMsg({ tone: "success", text: "Saved. New checkouts use these settings." })
      reload()
    } catch (err) {
      setMsg({ tone: "error", text: (err as Error).message })
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Sibling discount</CardTitle><CardDescription>Taken off automatically for the 2nd and later child in the same checkout.</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="Discount"><NativeSelect value={sibling.kind} onChange={(e) => setSibling({ ...sibling, kind: e.target.value as typeof sibling.kind, amount: e.target.value === "amount" ? 5000 : 10 })}><option value="none">No sibling discount</option><option value="percent">Percent off</option><option value="amount">Dollars off</option></NativeSelect></Field>
            {sibling.kind !== "none" && (
              <Field label={sibling.kind === "percent" ? "Percent" : "Amount"} hint="Per extra child, per session">
                {sibling.kind === "percent" ? <Input type="number" min={1} max={100} value={sibling.amount} onChange={(e) => setSibling({ ...sibling, amount: Number(e.target.value) })} /> : <MoneyInput cents={sibling.amount} onChange={(c) => setSibling({ ...sibling, amount: c ?? 0 })} />}
              </Field>
            )}
            {sibling.kind !== "none" && <Field label="Applies to" className="col-span-2"><NativeSelect value={sibling.applies} onChange={(e) => setSibling({ ...sibling, applies: e.target.value as typeof sibling.applies })}><option value="camps">Summer and winter camps</option><option value="miami">Miami combine</option><option value="all">Everything</option></NativeSelect></Field>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Waitlist hold</CardTitle><CardDescription>When a spot opens, the next family is emailed and the spot is held for them this long before passing to the next family.</CardDescription></CardHeader>
          <CardContent><Field label="Hours"><Input type="number" min={1} max={336} value={hold} onChange={(e) => setHold(Number(e.target.value))} /></Field></CardContent>
        </Card>
      </div>
      <div className="flex items-center justify-end gap-3">
        {msg && <span className={msg.tone === "success" ? "text-sm text-emerald-700" : "text-destructive text-sm"}>{msg.text}</span>}
        <Button onClick={savePricing}>Save discount settings</Button>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div><p className="font-medium">Promo codes</p><p className="text-muted-foreground text-xs">Early-bird prices are set per session in the Camps tab.</p></div>
          <Button size="sm" onClick={() => setEdit("new")}><PlusIcon /> New code</Button>
        </div>
        {data.promos.length === 0 ? <EmptyState icon={TagIcon} title="No promo codes yet" /> : (
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Code</TableHead><TableHead>Discount</TableHead><TableHead className="hidden md:table-cell">Applies to</TableHead><TableHead className="text-right">Used</TableHead><TableHead className="hidden md:table-cell">Ends</TableHead><TableHead>Status</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
            <TableBody>
              {data.promos.map((p) => {
                const expired = p.ends_at && new Date(p.ends_at).getTime() <= now
                const usedUp = p.max_uses !== null && p.uses >= p.max_uses
                const scope = p.scope === "all" ? "Everything" : p.scope === "miami" ? "Miami" : p.scope === "camp" ? data.camps.find((c) => c.id === p.camp_id)?.name ?? "A camp" : data.camps.flatMap((c) => c.sessions.map((s) => ({ ...s, camp: c.name }))).find((s) => s.id === p.session_id)?.name ?? "A session"
                return (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => setEdit(p)}>
                    <TableCell><code className="bg-muted rounded px-1.5 py-0.5 text-xs font-semibold">{p.code}</code>{p.description && <p className="text-muted-foreground mt-1 text-xs">{p.description}</p>}</TableCell>
                    <TableCell>{promoLabel(p)}</TableCell>
                    <TableCell className="hidden md:table-cell">{scope}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.uses}{p.max_uses !== null ? ` / ${p.max_uses}` : ""}</TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">{p.ends_at ? dateTime(p.ends_at) : "Never"}</TableCell>
                    <TableCell>{!p.active ? <Badge variant="secondary">Off</Badge> : expired ? <Badge variant="secondary">Expired</Badge> : usedUp ? <Badge variant="warning-light">Used up</Badge> : <Badge variant="success-light">Active</Badge>}</TableCell>
                    <TableCell><PencilIcon className="text-muted-foreground size-4" /></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>
      {edit && <PromoSheet key={edit === "new" ? "new" : edit.id} api={api} promo={edit} camps={data.camps} onClose={() => setEdit(null)} onSaved={reload} />}
    </div>
  )
}
