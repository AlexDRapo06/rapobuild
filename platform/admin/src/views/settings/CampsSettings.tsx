import { useState } from "react"
import { CalendarDaysIcon, EyeOffIcon, InfoIcon, PencilIcon, PlusIcon, TentIcon, UsersIcon } from "lucide-react"

import type { Api } from "../../api"
import { dateRange, dateTime, money } from "../../format"
import { EtDateTimeInput, Field, MoneyInput } from "@/components/app/kit"
import { EmptyState } from "@/components/app/states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Notice, Switch, Textarea } from "@/components/ui/form-controls"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CampRow, SessionRow } from "./types"

function timeLabel(t: string | null) {
  if (!t) return null
  const [h, m] = t.split(":").map(Number)
  return new Date(Date.UTC(2000, 0, 1, h, m)).toLocaleTimeString("en-US", { timeZone: "UTC", hour: "numeric", minute: "2-digit" })
}

function CampSheet({ api, camp, onClose, onSaved }: { api: Api; camp: CampRow | "new" | null; onClose: () => void; onSaved: () => void }) {
  const initial = camp && camp !== "new" ? camp : null
  const [form, setForm] = useState({
    name: initial?.name ?? "", host: initial?.host ?? "", kind: initial?.kind ?? "summer", infoOnly: initial?.info_only ?? false, active: initial?.active ?? true,
    description: initial?.description ?? "", infoUrl: initial?.info_url ?? "", siteRoute: initial?.site_route ?? "", slug: "", sortOrder: initial?.sort_order ?? 0,
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch })

  async function save() {
    setBusy(true)
    setError(null)
    try {
      await api("camp-save", { id: initial?.id, ...form, slug: initial ? undefined : form.slug.trim() || undefined, host: form.host || null, description: form.description || null, siteRoute: form.siteRoute.trim() || null })
      onSaved()
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={Boolean(camp)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>{initial ? "Edit camp" : "Add a camp"}</SheetTitle><SheetDescription>A camp is a school or location. Add its weeks as sessions.</SheetDescription></SheetHeader>
        <div className="space-y-4 px-4">
          <Field label="Camp name"><Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Dover Summer Camp" /></Field>
          <Field label="Host school or location"><Input value={form.host} onChange={(e) => set({ host: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type"><NativeSelect value={form.kind} onChange={(e) => set({ kind: e.target.value as CampRow["kind"] })}><option value="summer">Summer</option><option value="winter">Winter</option><option value="other">Other</option></NativeSelect></Field>
            <Field label="Order on site" hint="Lower shows first"><Input type="number" min={0} value={form.sortOrder} onChange={(e) => set({ sortOrder: Number(e.target.value) })} /></Field>
          </div>
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3"><span className="text-sm"><span className="font-medium">Shown on the site</span><span className="text-muted-foreground block text-xs">Turn off to hide the camp without deleting it.</span></span><Switch checked={form.active} onCheckedChange={(v) => set({ active: v })} /></label>
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3"><span className="text-sm"><span className="font-medium">Information only</span><span className="text-muted-foreground block text-xs">No checkout (like BB&N, which handles its own sign-ups).</span></span><Switch checked={form.infoOnly} onCheckedChange={(v) => set({ infoOnly: v })} /></label>
          <Field label="Description"><Textarea rows={4} value={form.description} onChange={(e) => set({ description: e.target.value })} /></Field>
          <Field label="Sign-up or info link (optional)"><Input value={form.infoUrl} onChange={(e) => set({ infoUrl: e.target.value })} placeholder="https://" /></Field>
          {initial ? (
            <Field label="Camp id on the site" hint="Matches the id in the site's code (src/camps.jsx). It can't change."><Input value={initial.slug} readOnly disabled /></Field>
          ) : (
            <Field label="Camp id on the site" hint="Must match the id in the site's code (src/camps.jsx), e.g. dover_2027. Leave empty for a camp the site doesn't sell."><Input value={form.slug} onChange={(e) => set({ slug: e.target.value })} placeholder="dover_2027" /></Field>
          )}
          <Field label="Page on footyup.net" hint="The page families return to if they cancel checkout."><Input value={form.siteRoute} onChange={(e) => set({ siteRoute: e.target.value })} placeholder="summerCamp/dover" /></Field>
          {error && <Notice tone="error">{error}</Notice>}
        </div>
        <SheetFooter><Button onClick={save} disabled={busy || form.name.trim().length < 2}>{busy ? "Saving…" : "Save camp"}</Button></SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function SessionSheet({ api, target, onClose, onSaved }: { api: Api; target: { camp: CampRow; session: SessionRow | null } | null; onClose: () => void; onSaved: () => void }) {
  const s = target?.session
  const [form, setForm] = useState({
    name: s?.name ?? "", startsOn: s?.starts_on ?? "", endsOn: s?.ends_on ?? "", startTime: s?.start_time ?? "", location: s?.location ?? target?.camp.host ?? "",
    ageMin: s?.age_min ?? null as number | null, ageMax: s?.age_max ?? null as number | null, priceCents: s?.price_cents ?? null as number | null,
    earlyBirdPriceCents: s?.early_bird_price_cents ?? null as number | null, earlyBirdUntil: s?.early_bird_until ?? "", capacity: s?.capacity ?? null as number | null,
    status: s?.status ?? "open", slug: "", closesAt: s?.closes_at ?? null as string | null, infoText: s?.info_text ?? "", reminderDays: (s?.reminder_days ?? [7, 1]).join(", "), sortOrder: s?.sort_order ?? 0,
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch })

  async function save() {
    if (!target) return
    setBusy(true)
    setError(null)
    try {
      await api("session-save", {
        id: s?.id, campId: target.camp.id, name: form.name, startsOn: form.startsOn || null, endsOn: form.endsOn || null, startTime: form.startTime || null,
        location: form.location || null, ageMin: form.ageMin, ageMax: form.ageMax, priceCents: form.priceCents ?? 0,
        earlyBirdPriceCents: form.earlyBirdPriceCents, earlyBirdUntil: form.earlyBirdUntil || null, capacity: form.capacity,
        status: form.status, closesAt: form.closesAt, slug: s ? undefined : form.slug.trim() || undefined, infoText: form.infoText || null, sortOrder: form.sortOrder,
        reminderDays: form.reminderDays.split(/[,\s]+/).filter(Boolean).map(Number).filter((n) => Number.isInteger(n) && n >= 0),
      })
      onSaved()
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const num = (v: string) => (v === "" ? null : Number(v))
  return (
    <Sheet open={Boolean(target)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader><SheetTitle>{s ? "Edit session" : "Add a session"}</SheetTitle><SheetDescription>{target?.camp.name}. Changes apply to the next checkout immediately; families already paying keep the price they saw.</SheetDescription></SheetHeader>
        <div className="space-y-4 px-4">
          <Field label="Session name"><Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Week of July 12 (ages 6-13)" /></Field>
          {s ? (
            <Field label="Session id on the site" hint="The session value in the site's code. It can't change."><Input value={s.slug} readOnly disabled /></Field>
          ) : (
            <Field label="Session id on the site" hint="Must match the session value in the site's code, e.g. full, week1. Leave empty if the site doesn't sell it."><Input value={form.slug} onChange={(e) => set({ slug: e.target.value })} placeholder="full" /></Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts"><Input type="date" value={form.startsOn} onChange={(e) => set({ startsOn: e.target.value })} /></Field>
            <Field label="Ends"><Input type="date" value={form.endsOn} onChange={(e) => set({ endsOn: e.target.value })} /></Field>
            <Field label="Daily start time"><Input type="time" value={form.startTime} onChange={(e) => set({ startTime: e.target.value })} /></Field>
            <Field label="Location"><Input value={form.location} onChange={(e) => set({ location: e.target.value })} /></Field>
            <Field label="Youngest age"><Input type="number" min={0} max={25} value={form.ageMin ?? ""} onChange={(e) => set({ ageMin: num(e.target.value) })} /></Field>
            <Field label="Oldest age"><Input type="number" min={0} max={25} value={form.ageMax ?? ""} onChange={(e) => set({ ageMax: num(e.target.value) })} /></Field>
          </div>
          <div className="space-y-3 rounded-xl border p-4">
            <p className="text-sm font-medium">Price and spots</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price per player"><MoneyInput cents={form.priceCents} onChange={(c) => set({ priceCents: c })} placeholder="500" /></Field>
              <Field label="Spot limit" hint={s ? `${s.taken} taken now. Empty = no limit` : "Empty = no limit"}><Input type="number" min={1} value={form.capacity ?? ""} onChange={(e) => set({ capacity: num(e.target.value) })} /></Field>
              <Field label="Early-bird price (optional)"><MoneyInput cents={form.earlyBirdPriceCents} onChange={(c) => set({ earlyBirdPriceCents: c })} /></Field>
              <Field label="Early-bird ends"><Input type="date" value={form.earlyBirdUntil} onChange={(e) => set({ earlyBirdUntil: e.target.value })} /></Field>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Registration"><NativeSelect value={form.status} onChange={(e) => set({ status: e.target.value as "open" | "closed" })}><option value="open">Open</option><option value="closed">Closed</option></NativeSelect></Field>
            <Field label="Reminder emails" hint="Days before start, e.g. 7, 1"><Input value={form.reminderDays} onChange={(e) => set({ reminderDays: e.target.value })} /></Field>
            <Field label="Registration closes automatically (optional)" hint="Eastern time. Checkout stops at this moment." className="col-span-2"><EtDateTimeInput value={form.closesAt} onChange={(v) => set({ closesAt: v })} /></Field>
          </div>
          <Field label="Info for parents" hint="Shown on the site and in the confirmation email (what to bring, drop-off…)."><Textarea rows={3} value={form.infoText} onChange={(e) => set({ infoText: e.target.value })} /></Field>
          {error && <Notice tone="error">{error}</Notice>}
        </div>
        <SheetFooter><Button onClick={save} disabled={busy || form.name.trim().length < 2 || form.priceCents === null}>{busy ? "Saving…" : "Save session"}</Button></SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export function CampsSettings({ api, camps, reload }: { api: Api; camps: CampRow[]; reload: () => void }) {
  const [editCamp, setEditCamp] = useState<CampRow | "new" | null>(null)
  const [editSession, setEditSession] = useState<{ camp: CampRow; session: SessionRow | null } | null>(null)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground max-w-2xl text-sm">Camps and their sessions as they appear on the site. Prices and limits here are what Stripe charges and enforces at checkout.</p>
        <Button onClick={() => setEditCamp("new")}><PlusIcon /> Add camp</Button>
      </div>
      {camps.length === 0 && <Card><EmptyState icon={TentIcon} title="No camps yet" /></Card>}
      {camps.map((c) => (
        <Card key={c.id} className="gap-0 overflow-hidden py-0">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-medium">{c.name}{!c.active && <Badge variant="secondary"><EyeOffIcon className="size-3" />Hidden</Badge>}{c.info_only && <Badge variant="info-light"><InfoIcon className="size-3" />Info only</Badge>}</p>
              <p className="text-muted-foreground text-xs">{c.host ?? "No host set"} · {c.kind}{c.site_route ? ` · footyup.net/${c.site_route}` : ""}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditCamp(c)}><PencilIcon /> Edit camp</Button>
              {!c.info_only && <Button size="sm" onClick={() => setEditSession({ camp: c, session: null })}><PlusIcon /> Add session</Button>}
            </div>
          </div>
          {c.info_only ? <p className="text-muted-foreground px-5 py-4 text-sm">{c.description ?? "Information only, no checkout."}</p> : c.sessions.length === 0 ? (
            <p className="text-muted-foreground px-5 py-4 text-sm">No sessions yet.</p>
          ) : (
            <Table>
              <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Session</TableHead><TableHead className="hidden md:table-cell">Dates</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Taken / limit</TableHead><TableHead>Registration</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
              <TableBody>
                {c.sessions.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => setEditSession({ camp: c, session: s })}>
                    <TableCell><p className="font-medium">{s.name}</p><p className="text-muted-foreground text-xs">{s.age_min !== null ? `Ages ${s.age_min}–${s.age_max ?? "+"}` : "All ages"}{s.start_time ? ` · ${timeLabel(s.start_time)}` : ""}</p></TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell"><span className="inline-flex items-center gap-1"><CalendarDaysIcon className="size-3.5" />{dateRange(s.starts_on, s.ends_on)}</span></TableCell>
                    <TableCell className="text-right tabular-nums">{money(s.price_cents)}{s.early_bird_price_cents !== null && <p className="text-muted-foreground text-xs">early {money(s.early_bird_price_cents)}</p>}</TableCell>
                    <TableCell className="text-right tabular-nums"><span className="inline-flex items-center gap-1"><UsersIcon className="text-muted-foreground size-3.5" />{s.taken}{s.capacity !== null ? ` / ${s.capacity}` : ""}</span></TableCell>
                    <TableCell>{s.status === "open" && !(s.closes_at && new Date(s.closes_at).getTime() <= Date.now()) ? <Badge variant="success-light">Open</Badge> : <Badge variant="secondary">Closed</Badge>}{s.status === "open" && s.closes_at && new Date(s.closes_at).getTime() > Date.now() && <p className="text-muted-foreground mt-1 text-xs">until {dateTime(s.closes_at)}</p>}</TableCell>
                    <TableCell><PencilIcon className="text-muted-foreground size-4" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      ))}
      {editCamp && <CampSheet key={editCamp === "new" ? "new" : editCamp.id} api={api} camp={editCamp} onClose={() => setEditCamp(null)} onSaved={reload} />}
      {editSession && <SessionSheet key={editSession.session?.id ?? `new-${editSession.camp.id}`} api={api} target={editSession} onClose={() => setEditSession(null)} onSaved={reload} />}
    </div>
  )
}
