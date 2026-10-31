import { useState } from "react"
import { CheckCircle2Icon, KeyRoundIcon, LockIcon, PlusIcon, SaveIcon, Trash2Icon } from "lucide-react"

import type { Api } from "../../api"
import { dateTime, money } from "../../format"
import { EtDateTimeInput, Field, MoneyInput } from "@/components/app/kit"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Notice, Switch, Textarea } from "@/components/ui/form-controls"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { MiamiEventRow, MiamiGroupRow, SettingsData } from "./types"

const list = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean)

export function MiamiSettings({ api, miami, reload }: { api: Api; miami: NonNullable<SettingsData["miami"]>; reload: () => void }) {
  const [event, setEvent] = useState<MiamiEventRow>(miami.event)
  const [groups, setGroups] = useState<MiamiGroupRow[]>(miami.groups)
  const [tiers, setTiers] = useState(miami.event.price_tiers.map((t) => ({ until: t.until, cents: t.cents as number | null })))
  const [lists, setLists] = useState({ positions: miami.event.positions.join(", "), shirt: miami.event.shirt_sizes.join(", "), short: miami.event.short_sizes.join(", "), grad: (miami.event.grad_years ?? []).join(", ") })
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const setGroup = (grp: string, patch: Partial<MiamiGroupRow>) => setGroups(groups.map((g) => (g.grp === grp ? { ...g, ...patch } : g)))
  const samePrice = groups.every((g) => g.price_code_holder_cents === g.price_public_cents)
  const setTier = (i: number, patch: Partial<(typeof tiers)[number]>) => setTiers(tiers.map((t, j) => (j === i ? { ...t, ...patch } : t)))
  const tierProblem = tiers.some((t) => t.cents === null)
    ? "Every price step needs a price."
    : tiers.slice(0, -1).some((t) => !t.until)
      ? "Only the last price step can run with no end date."
      : tiers.some((t, i) => i > 0 && t.until && tiers[i - 1]!.until && Date.parse(t.until) <= Date.parse(tiers[i - 1]!.until!))
        ? "Price steps must be in date order."
        : null

  async function save() {
    setBusy(true)
    setStatus(null)
    try {
      await api("miami-save", {
        event: {
          name: event.name, location: event.location || null, infoText: event.info_text || null, opensAt: event.opens_at, publicOpensAt: event.public_opens_at,
          closesAt: event.closes_at, checkoutOpen: event.checkout_open, waiverRequired: event.waiver_required, reservedTotal: event.reserved_total,
          reservedUntil: event.reserved_until, positions: list(lists.positions), shirtSizes: list(lists.shirt), shortSizes: list(lists.short), gradYears: list(lists.grad),
          priceTiers: tiers.map((t) => ({ until: t.until, cents: t.cents ?? 0 })),
        },
        groups: groups.map((g) => ({
          grp: g.grp, label: g.label, cap: g.cap, startsOn: g.starts_on || null, endsOn: g.ends_on || null, dailyStartTime: g.daily_start_time || null,
          dailyEndTime: g.daily_end_time || null, reservedForCodeHolders: g.reserved_for_code_holders, reservedUntil: g.reserved_until,
          priceCodeHolderCents: g.price_code_holder_cents, pricePublicCents: g.price_public_cents, ageMin: g.age_min, ageMax: g.age_max, open: g.open,
        })),
      })
      setStatus({ tone: "success", text: "Saved. The Miami page and checkout use these settings right away." })
      reload()
    } catch (err) {
      setStatus({ tone: "error", text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Registration schedule</CardTitle><CardDescription>All times are Eastern. Empty means "no limit".</CardDescription></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field label="Checkout opens" hint="When anyone (code holders included) can start registering."><EtDateTimeInput value={event.opens_at} onChange={(v) => setEvent({ ...event, opens_at: v })} /></Field>
          <Field label="Opens to everyone" hint="Before this, only families with the access code can register."><EtDateTimeInput value={event.public_opens_at} onChange={(v) => setEvent({ ...event, public_opens_at: v })} /></Field>
          <Field label="Registration closes"><EtDateTimeInput value={event.closes_at} onChange={(v) => setEvent({ ...event, closes_at: v })} /></Field>
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3 md:col-span-3"><span className="text-sm"><span className="font-medium">Checkout switched on</span><span className="text-muted-foreground block text-xs">Turn off to pause Miami registration immediately (e.g. an emergency).</span></span><Switch checked={event.checkout_open} onCheckedChange={(v) => setEvent({ ...event, checkout_open: v })} /></label>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {groups.map((g) => (
          <Card key={g.grp}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><span className={g.grp === "boys" ? "size-2.5 rounded-full bg-sky-500" : "size-2.5 rounded-full bg-pink-500"} />{g.label}</CardTitle>
              <CardDescription>{g.taken} spots taken (paid or in checkout)</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Field label="Spot limit" hint={`Can't go below ${g.taken}`}><Input type="number" min={g.taken} value={g.cap} onChange={(e) => setGroup(g.grp, { cap: Number(e.target.value) })} /></Field>
              <Field label="Reserved for code holders" hint="Only this group"><Input type="number" min={0} value={g.reserved_for_code_holders} onChange={(e) => setGroup(g.grp, { reserved_for_code_holders: Number(e.target.value) })} /></Field>
              {tiers.length === 0 && <>
                <Field label="Price (public)"><MoneyInput cents={g.price_public_cents} onChange={(c) => setGroup(g.grp, { price_public_cents: c })} /></Field>
                <Field label="Price (host-school families)" hint="With the access code"><MoneyInput cents={g.price_code_holder_cents} onChange={(c) => setGroup(g.grp, { price_code_holder_cents: c })} /></Field>
              </>}
              <Field label="Youngest age"><Input type="number" min={0} max={25} value={g.age_min ?? ""} onChange={(e) => setGroup(g.grp, { age_min: e.target.value === "" ? null : Number(e.target.value) })} /></Field>
              <Field label="Oldest age"><Input type="number" min={0} max={25} value={g.age_max ?? ""} onChange={(e) => setGroup(g.grp, { age_max: e.target.value === "" ? null : Number(e.target.value) })} /></Field>
              <Field label="First day"><Input type="date" value={g.starts_on ?? ""} onChange={(e) => setGroup(g.grp, { starts_on: e.target.value })} /></Field>
              <Field label="Last day"><Input type="date" value={g.ends_on ?? ""} onChange={(e) => setGroup(g.grp, { ends_on: e.target.value })} /></Field>
              <Field label="Daily start"><Input type="time" value={g.daily_start_time ?? ""} onChange={(e) => setGroup(g.grp, { daily_start_time: e.target.value })} /></Field>
              <Field label="Daily end"><Input type="time" value={g.daily_end_time ?? ""} onChange={(e) => setGroup(g.grp, { daily_end_time: e.target.value })} /></Field>
              <label className="col-span-2 flex items-center justify-between gap-3 rounded-lg border p-3"><span className="text-sm font-medium">{g.label} registration open</span><Switch checked={g.open} onCheckedChange={(v) => setGroup(g.grp, { open: v })} /></label>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Price schedule</CardTitle>
          <CardDescription>
            {tiers.length ? "Everyone pays the price of the current step, boys and girls alike. The site's Miami page and Stripe both follow it." : "No schedule: each group uses its own prices above. Add a step to price by date (e.g. $1,500 until Feb 1, then $1,650)."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tiers.map((t, i) => (
            <div key={i} className="grid items-end gap-3 rounded-lg border p-3 sm:grid-cols-[10rem_1fr_auto]">
              <Field label={`Step ${i + 1} price`}><MoneyInput cents={t.cents} onChange={(c) => setTier(i, { cents: c })} /></Field>
              <Field label="Until" hint={t.until ? `Then the next step applies.` : i === tiers.length - 1 ? "No end: this price runs until registration closes." : "Needs an end date."}><EtDateTimeInput value={t.until} onChange={(v) => setTier(i, { until: v })} /></Field>
              <Button variant="ghost" size="icon" aria-label="Remove step" onClick={() => setTiers(tiers.filter((_, j) => j !== i))}><Trash2Icon /></Button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" disabled={tiers.length >= 6} onClick={() => setTiers([...tiers, { until: null, cents: tiers.at(-1)?.cents ?? groups[0]?.price_public_cents ?? null }])}><PlusIcon /> Add price step</Button>
            {tierProblem ? <span className="text-destructive text-sm">{tierProblem}</span> : tiers.length > 0 && <span className="text-muted-foreground text-sm">Now: {money(tiers.find((t) => !t.until || Date.now() < Date.parse(t.until))?.cents ?? 0)}</span>}
          </div>
        </CardContent>
      </Card>
      {tiers.length === 0 && !samePrice && <Notice tone="info">Host-school families and the public pay different prices. Stripe charges whichever applies at checkout.</Notice>}

      <Card>
        <CardHeader><CardTitle className="text-base">Host-school reserved spots</CardTitle><CardDescription>Spots the public can't take while an access code is active. Unused reserved spots open to everyone at the date below (or when codes are turned off).</CardDescription></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Reserved across both groups"><Input type="number" min={0} value={event.reserved_total} onChange={(e) => setEvent({ ...event, reserved_total: Number(e.target.value) })} /></Field>
          <Field label="Release unused reserved spots at"><EtDateTimeInput value={event.reserved_until} onChange={(v) => setEvent({ ...event, reserved_until: v })} /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Page and form</CardTitle><CardDescription>What families see, and the choices on the registration form. Separate options with commas; leave empty to allow free text.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Event name"><Input value={event.name} onChange={(e) => setEvent({ ...event, name: e.target.value })} /></Field>
          <Field label="Location"><Input value={event.location ?? ""} onChange={(e) => setEvent({ ...event, location: e.target.value })} /></Field>
          <Field label="Description" className="md:col-span-2"><Textarea rows={6} value={event.info_text ?? ""} onChange={(e) => setEvent({ ...event, info_text: e.target.value })} /></Field>
          <Field label="Positions"><Input value={lists.positions} onChange={(e) => setLists({ ...lists, positions: e.target.value })} placeholder="Goalkeeper, Defender, Midfielder, Forward" /></Field>
          <Field label="Shirt sizes"><Input value={lists.shirt} onChange={(e) => setLists({ ...lists, shirt: e.target.value })} placeholder="YM, YL, S, M, L, XL" /></Field>
          <Field label="Short sizes"><Input value={lists.short} onChange={(e) => setLists({ ...lists, short: e.target.value })} placeholder="YM, YL, S, M, L, XL" /></Field>
          <Field label="Graduation years"><Input value={lists.grad} onChange={(e) => setLists({ ...lists, grad: e.target.value })} placeholder="2027, 2028, 2029, 2030" /></Field>
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3"><span className="text-sm"><span className="font-medium">Waiver required</span><span className="text-muted-foreground block text-xs">Needs a published Miami waiver (Waivers tab).</span></span><Switch checked={event.waiver_required} onCheckedChange={(v) => setEvent({ ...event, waiver_required: v })} /></label>
        </CardContent>
      </Card>

      <div className="bg-background/85 sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-end gap-3 border-t px-1 py-3 backdrop-blur">
        {status && <span className={status.tone === "success" ? "text-sm text-emerald-700" : "text-destructive text-sm"}>{status.text}</span>}
        <Button onClick={save} disabled={busy || Boolean(tierProblem)}><SaveIcon /> {busy ? "Saving…" : "Save Miami settings"}</Button>
      </div>
    </div>
  )
}

export function AccessCodes({ api, codes, reload }: { api: Api; codes: SettingsData["codes"]; reload: () => void }) {
  const [form, setForm] = useState({ code: "", label: "Host-school families", group: "", endsAt: null as string | null })
  const [show, setShow] = useState(false)
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const now = Date.now()
  const live = codes.filter((c) => c.active && (!c.ends_at || new Date(c.ends_at).getTime() > now))

  async function add() {
    setBusy(true)
    setMsg(null)
    try {
      await api("access-code", { action: "add", code: form.code, label: form.label || null, group: form.group || null, endsAt: form.endsAt })
      setForm({ ...form, code: "" })
      setMsg({ tone: "success", text: "Code saved. Share it with host-school families yourself; it can't be shown again." })
      reload()
    } catch (err) {
      setMsg({ tone: "error", text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  async function update(id: string, active: boolean, endsAt: string | null) {
    await api("access-code", { action: "update", id, active, endsAt })
    reload()
  }

  return (
    <div className="space-y-6">
      <Notice tone={live.length ? "info" : "success"} icon={live.length ? LockIcon : CheckCircle2Icon} title={live.length ? `${live.length} active code${live.length > 1 ? "s" : ""}` : "No active codes"}>
        {live.length ? "Host-school families use the code for the reserved spots (and to register before the public opening time). Turning every code off opens Miami to everyone." : "Miami registration is open to everyone (subject to the schedule in the Miami tab)."}
      </Notice>
      <Card>
        <CardHeader><CardTitle className="text-base">Add an access code</CardTitle><CardDescription>Codes are scrambled (hashed) as soon as they're saved. Nobody, including you, can read them back, so keep a copy somewhere safe.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Field label="Code" hint="Not case-sensitive"><div className="relative"><KeyRoundIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" /><Input className="pl-9" type={show ? "text" : "password"} autoComplete="off" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div><button type="button" className="text-muted-foreground text-xs underline-offset-2 hover:underline" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"} while typing</button></Field>
          <Field label="Label"><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></Field>
          <Field label="Works for"><NativeSelect value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}><option value="">Boys and girls</option><option value="boys">Boys only</option><option value="girls">Girls only</option></NativeSelect></Field>
          <Field label="Stops working at (optional)"><EtDateTimeInput value={form.endsAt} onChange={(v) => setForm({ ...form, endsAt: v })} /></Field>
          <div className="flex items-center gap-3 md:col-span-4">
            <Button onClick={add} disabled={busy || form.code.trim().length < 4}><PlusIcon /> Save code</Button>
            {msg && <span className={msg.tone === "success" ? "text-sm text-emerald-700" : "text-destructive text-sm"}>{msg.text}</span>}
          </div>
        </CardContent>
      </Card>
      {codes.length > 0 && (
        <Card className="gap-0 overflow-hidden py-0">
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Code</TableHead><TableHead>Works for</TableHead><TableHead>Stops working</TableHead><TableHead>Added</TableHead><TableHead>Active</TableHead></TableRow></TableHeader>
            <TableBody>
              {codes.map((c) => {
                const expired = c.ends_at && new Date(c.ends_at).getTime() <= now
                return (
                  <TableRow key={c.id}>
                    <TableCell><p className="font-medium">{c.label ?? "Access code"}</p><p className="text-muted-foreground text-xs">•••••••• (hidden)</p></TableCell>
                    <TableCell>{c.grp ? (c.grp === "boys" ? "Boys" : "Girls") : "Both"}</TableCell>
                    <TableCell className="w-72"><EtDateTimeInput value={c.ends_at} onChange={(v) => update(c.id, c.active, v)} />{expired && <Badge variant="secondary" className="mt-1">Ended</Badge>}</TableCell>
                    <TableCell className="text-muted-foreground">{dateTime(c.created_at)}</TableCell>
                    <TableCell><Switch checked={c.active} onCheckedChange={(v) => update(c.id, v, c.ends_at)} aria-label="Active" /></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {live.length > 0 && <div className="flex justify-end border-t p-3"><Button variant="outline" size="sm" onClick={async () => { for (const c of live) await api("access-code", { action: "update", id: c.id, active: false, endsAt: c.ends_at }); reload() }}>Turn off all codes (open to everyone)</Button></div>}
        </Card>
      )}
    </div>
  )
}
