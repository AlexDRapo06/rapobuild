import { useState } from "react"
import { PlusIcon, SaveIcon, Trash2Icon } from "lucide-react"

import type { Api } from "../../api"
import { Field, MoneyInput } from "@/components/app/kit"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Notice } from "@/components/ui/form-controls"
import { Input } from "@/components/ui/input"
import type { SettingsData } from "./types"

type Row = { id: string; name: string; cents: number | null; saved: boolean }

export function TrainingSettings({ api, packages, reload }: { api: Api; packages: SettingsData["trainingPackages"]; reload: () => void }) {
  const [rows, setRows] = useState<Row[]>(packages.map((p) => ({ ...p, saved: true })))
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null)
  const set = (i: number, patch: Partial<Row>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const invalid = rows.some((r) => !/^[a-z0-9_]{2,40}$/.test(r.id) || r.name.trim().length < 2 || r.cents === null)

  async function save() {
    setBusy(true)
    setMsg(null)
    try {
      await api("training-packages-save", { packages: rows.map((r) => ({ id: r.id, name: r.name, cents: r.cents ?? 0 })) })
      setMsg({ tone: "success", text: "Saved. The site's Private Training prices and Stripe checkout use these now." })
      setRows(rows.map((r) => ({ ...r, saved: true })))
      reload()
    } catch (err) {
      setMsg({ tone: "error", text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Private training packages</CardTitle>
        <CardDescription>The "Buy" buttons on footyup.net's Private Training page. The id must match the button on the site; a new package also needs a button added to the site's page.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="grid items-end gap-3 rounded-lg border p-3 sm:grid-cols-[12rem_1fr_9rem_auto]">
            <Field label="Id on the site">
              <Input value={r.id} disabled={r.saved} onChange={(e) => set(i, { id: e.target.value.trim() })} placeholder="group2_10" />
            </Field>
            <Field label="Name (shown in Stripe and the dashboard)"><Input value={r.name} onChange={(e) => set(i, { name: e.target.value })} /></Field>
            <Field label="Price"><MoneyInput cents={r.cents} onChange={(c) => set(i, { cents: c })} /></Field>
            <Button variant="ghost" size="icon" aria-label="Remove package" onClick={() => setRows(rows.filter((_, j) => j !== i))}><Trash2Icon /></Button>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setRows([...rows, { id: "", name: "", cents: null, saved: false }])}><PlusIcon /> Add package</Button>
          <Button size="sm" onClick={save} disabled={busy || invalid}><SaveIcon /> {busy ? "Saving…" : "Save packages"}</Button>
          {invalid && <span className="text-muted-foreground text-xs">Each package needs an id (lowercase, numbers, _), a name and a price.</span>}
        </div>
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      </CardContent>
    </Card>
  )
}
