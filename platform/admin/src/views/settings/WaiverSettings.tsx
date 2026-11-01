import { useState } from "react"
import { FileSignatureIcon } from "lucide-react"

import type { Api } from "../../api"
import { dateTime } from "../../format"
import { Field } from "@/components/app/kit"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Notice, Switch, Textarea } from "@/components/ui/form-controls"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import type { SettingsData } from "./types"

const FLOW: Record<string, string> = { camp: "Summer & winter camps", miami: "Miami combine", all: "Everything (fallback)" }

export function WaiverSettings({ api, data, reload }: { api: Api; data: SettingsData; reload: () => void }) {
  const [required, setRequired] = useState({ camp: data.pricing.camp_waiver_required, miami: data.miami?.event.waiver_required ?? false })
  const [form, setForm] = useState({ flow: "miami" as "camp" | "miami" | "all", title: "Participant waiver and release", body: "", url: "" })
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const current = (flow: string) => data.waivers.find((w) => w.flow === flow && w.active)

  async function saveRequired(next: typeof required) {
    setRequired(next)
    await api("waiver-required", next)
    reload()
  }

  async function publish() {
    setBusy(true)
    setMsg(null)
    try {
      const res = await api<{ version: number }>("waiver-publish", form)
      setMsg({ tone: "success", text: `Published version ${res.version}. New checkouts show this text; past registrations keep the version they accepted.` })
      setForm({ ...form, body: "" })
      reload()
    } catch (err) {
      setMsg({ tone: "error", text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {(["camp", "miami"] as const).map((flow) => {
          const w = current(flow) ?? current("all")
          return (
            <Card key={flow}>
              <CardHeader>
                <CardTitle className="text-base">{FLOW[flow]}</CardTitle>
                <CardDescription>{w ? `Current: "${w.title}" v${w.version}, published ${dateTime(w.created_at)}` : "No waiver published yet. Registrations are marked “waiver not collected”."}</CardDescription>
              </CardHeader>
              <CardContent>
                <label className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <span className="text-sm"><span className="font-medium">Require acceptance at checkout</span><span className="text-muted-foreground block text-xs">{w ? "Parents must tick the box and type their name." : "Publish a waiver first."}</span></span>
                  <Switch checked={required[flow]} disabled={!w} onCheckedChange={(v) => saveRequired({ ...required, [flow]: v })} />
                </label>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Publish waiver wording</CardTitle><CardDescription>Each publish creates a new version. Old versions are never changed, so every registration keeps the exact text that parent accepted.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="For"><NativeSelect value={form.flow} onChange={(e) => setForm({ ...form, flow: e.target.value as typeof form.flow })}>{Object.entries(FLOW).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</NativeSelect></Field>
            <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          </div>
          <Field label="Waiver text" hint="Paste the wording exactly as the client supplied it."><Textarea rows={10} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></Field>
          <Field label="Link to a PDF version (optional)"><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://" /></Field>
          {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
          <div className="flex justify-end"><Button onClick={publish} disabled={busy || form.body.trim().length < 20}><FileSignatureIcon /> Publish new version</Button></div>
        </CardContent>
      </Card>
      {data.waivers.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">All versions</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {data.waivers.map((w) => (
              <details key={w.id} className="py-3">
                <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm"><span><span className="font-medium">{w.title}</span> <span className="text-muted-foreground">· {FLOW[w.flow]} · v{w.version} · {dateTime(w.created_at)}</span></span>{w.active ? <Badge variant="success-light">Current</Badge> : <Badge variant="secondary">Retired</Badge>}</summary>
                <p className="bg-muted/50 mt-3 rounded-lg p-3 text-sm whitespace-pre-wrap">{w.body}</p>
              </details>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
