import { useCallback, useState } from "react"
import { AlertTriangleIcon, CheckCircle2Icon, CircleDashedIcon, GlobeIcon, MailIcon, RefreshCwIcon, ServerIcon, ShieldCheckIcon, WebhookIcon } from "lucide-react"

import type { Api } from "../../api"
import type { EmailSetup } from "../../types"
import { useLoad } from "../../useLoad"
import { CopyButton, Field } from "@/components/app/kit"
import { ErrorState } from "@/components/app/states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Notice, Switch, Textarea } from "@/components/ui/form-controls"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

function Check({ ok, warn, title, children }: { ok: boolean; warn?: boolean; title: string; children: React.ReactNode }) {
  const Icon = ok ? CheckCircle2Icon : warn ? AlertTriangleIcon : CircleDashedIcon
  return (
    <div className="flex gap-3 rounded-lg border p-3">
      <Icon className={cn("mt-0.5 size-5 shrink-0", ok ? "text-emerald-600" : warn ? "text-amber-600" : "text-muted-foreground")} />
      <div className="min-w-0 text-sm"><p className="font-medium">{title}</p><div className="text-muted-foreground text-xs">{children}</div></div>
    </div>
  )
}

export function EmailSettings({ api, onExpired }: { api: Api; onExpired: () => void }) {
  const load = useCallback(() => api<EmailSetup>("email-setup"), [api])
  const { data, error, loading, reload } = useLoad(load, onExpired)
  const [form, setForm] = useState<EmailSetup["settings"] | null>(null)
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null)
  const [hookMsg, setHookMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const s = form ?? data?.settings ?? null
  const set = (patch: Partial<EmailSetup["settings"]>) => setForm({ ...(s as EmailSetup["settings"]), ...patch })

  async function save() {
    if (!s) return
    setBusy(true)
    setMsg(null)
    try {
      await api("email-settings", s)
      setMsg({ tone: "success", text: "Saved." })
      setForm(null)
      reload()
    } catch (err) {
      setMsg({ tone: "error", text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  async function connectWebhook() {
    setBusy(true)
    setHookMsg(null)
    try {
      await api("email-webhook", {})
      setHookMsg({ tone: "success", text: "Connected. Brevo now reports unsubscribes and bounces to this dashboard." })
      reload()
    } catch (err) {
      setHookMsg({ tone: "error", text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  async function domain(action: "add" | "authenticate") {
    setBusy(true)
    try {
      await api("email-domain", { action })
      reload()
    } catch (err) {
      setMsg({ tone: "error", text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  if (loading && !data) return <Skeleton className="h-96 rounded-xl" />
  if (error && !data) return <Card><ErrorState message={error} onRetry={reload} /></Card>
  if (!data || !s) return null
  const p = data.provider
  const records = p.domain?.records ?? []
  const recordsText = records.map((r) => `${r.label}\nType: ${r.type}\nHost: ${r.host}\nValue: ${r.value}`).join("\n\n")

  return (
    <div className="space-y-6">
      {data.testRecipients && (
        <Notice tone="warning" icon={ShieldCheckIcon} title="Test mode: real Brevo account, test recipients only">
          This isn't the live site, so real emails only go to {data.testRecipients.length ? <strong>{data.testRecipients.join(", ")}</strong> : <strong>nobody yet</strong>}. Everyone else (like the made-up families in test data) is skipped, so the client's Brevo account never emails fake addresses. Change the list with the <code>EMAIL_TEST_RECIPIENTS</code> setting.
        </Notice>
      )}
      <Card>
        <CardHeader><CardTitle className="text-base">Sending checklist</CardTitle><CardDescription>Everything that must be green before the first campaign.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Check ok={p.connected && data.mode === "brevo"} warn={data.mode === "mock"} title={data.mode === "mock" ? "Brevo: local test mode" : p.connected ? "Brevo connected" : "Brevo not connected"}>
            {data.mode === "mock" ? "Emails are captured locally, not delivered." : p.connected ? `${p.account?.company ?? p.account?.email ?? ""}${p.account?.plan ? ` · ${p.account.plan} plan` : ""}${p.account?.credits !== null && p.account?.credits !== undefined ? ` · ${p.account.credits} email credits left` : ""}` : p.error ?? "Set BREVO_API_KEY on the server."}
          </Check>
          <Check ok={Boolean(p.senderVerified)} title={`Sender ${data.sender.name} <${data.sender.email}>`}>{p.senderVerified ? "Verified in Brevo." : "Add and verify this sender in Brevo → Senders, domains & dedicated IPs."}</Check>
          <Check ok={Boolean(s.mailing_address)} warn={!s.mailing_address} title="Mailing address in every footer">{s.mailing_address ? s.mailing_address : "Required by law for marketing email. Add it below."}</Check>
          <Check ok={Boolean(p.domain?.authenticated)} title={`Domain ${data.domain} authenticated`}>{p.domain?.authenticated ? "SPF, DKIM and DMARC verified by Brevo." : "Send the DNS records below to Ivy Devs, then click “Re-check”."}</Check>
          <Check ok={Boolean(data.webhook?.connected)} warn={data.webhookConfigured && !data.webhook?.connected} title="Unsubscribes sync back from Brevo">{data.webhook?.connected ? "Connected. Brevo reports unsubscribes and bounces here." : data.webhookConfigured ? "Not connected yet. Press Connect below." : "Set BREVO_WEBHOOK_SECRET on the server first."}</Check>
          <Check ok={data.contacts.consented > 0} title={`${data.contacts.consented} contacts can be emailed`}>{data.contacts.unknown} with unknown consent · {data.contacts.unsubscribed} unsubscribed · {data.contacts.bounced} bounced</Check>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><GlobeIcon className="size-4" />Domain authentication (SPF, DKIM, DMARC)</CardTitle>
          <CardDescription>Ivy Devs adds these to the footyup.net DNS. Copy them exactly. If an SPF record already exists, merge the include into it; there must only be one.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!p.domain?.exists && data.mode === "brevo" && <Notice tone="info" icon={ServerIcon} title={`${data.domain} isn't in Brevo yet`}><Button size="sm" className="mt-2" onClick={() => domain("add")} disabled={busy}>Add {data.domain} to Brevo</Button></Notice>}
          {records.length > 0 && (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Record</TableHead><TableHead>Type</TableHead><TableHead>Host</TableHead><TableHead>Value</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {records.map((r) => (
                    <TableRow key={r.label}>
                      <TableCell className="font-medium">{r.label}</TableCell>
                      <TableCell>{r.type}</TableCell>
                      <TableCell><code className="text-xs">{r.host}</code></TableCell>
                      <TableCell className="max-w-[340px]"><div className="flex items-center gap-2"><code className="truncate text-xs">{r.value}</code><CopyButton value={r.value} label="" /></div></TableCell>
                      <TableCell>{r.status === "verified" ? <Badge variant="success-light">Verified</Badge> : <Badge variant="warning-light">Waiting</Badge>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {records.length > 0 && <CopyButton value={`DNS records for ${data.domain} (from Brevo):\n\n${recordsText}`} label="Copy all records for Ivy Devs" />}
            {p.domain?.exists && <Button variant="outline" size="xs" onClick={() => domain("authenticate")} disabled={busy}><RefreshCwIcon /> Ask Brevo to re-check</Button>}
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">What's published right now</p>
            <div className="grid gap-2 md:grid-cols-2">
              {data.dns.map((d) => <Check key={d.name} ok={d.ok} title={d.name}>{d.found ? <code className="break-all">{d.found}</code> : d.hint}</Check>)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><MailIcon className="size-4" />Email details and automatic emails</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Business mailing address" hint="Shown in every email footer." className="md:col-span-2"><Textarea rows={2} value={s.mailing_address ?? ""} onChange={(e) => set({ mailing_address: e.target.value })} placeholder="Footy Up, 123 Main St, Arlington, MA 02474" /></Field>
          <Field label="Reply-to address" hint="Where parent replies go."><Input type="email" value={s.reply_to_email ?? ""} onChange={(e) => set({ reply_to_email: e.target.value })} /></Field>
          <Field label="Private training notifications go to"><Input type="email" value={s.notify_email ?? ""} onChange={(e) => set({ notify_email: e.target.value })} /></Field>
          <Field label="Logo image URL (optional)" hint="A hosted PNG, about 300px wide. Until then the FOOTY UP wordmark is used." className="md:col-span-2"><Input value={s.email_logo_url ?? ""} onChange={(e) => set({ email_logo_url: e.target.value })} placeholder="https://" /></Field>
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3"><span className="text-sm"><span className="font-medium">Confirmation emails</span><span className="text-muted-foreground block text-xs">Sent right after each payment.</span></span><Switch checked={s.auto_confirmations} onCheckedChange={(v) => set({ auto_confirmations: v })} /></label>
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3"><span className="text-sm"><span className="font-medium">Reminder emails</span><span className="text-muted-foreground block text-xs">Days before are set per session (Camps tab).</span></span><Switch checked={s.auto_reminders} onCheckedChange={(v) => set({ auto_reminders: v })} /></label>
          <Field label="Extra note in every reminder (optional)"><Textarea rows={3} value={s.reminder_note ?? ""} onChange={(e) => set({ reminder_note: e.target.value })} placeholder="Please bring water, cleats and shin guards." /></Field>
          <Field label="Extra note in Miami confirmations (optional)"><Textarea rows={3} value={s.miami_confirmation_note ?? ""} onChange={(e) => set({ miami_confirmation_note: e.target.value })} /></Field>
          <div className="flex items-center justify-end gap-3 md:col-span-2">
            {msg && <span className={msg.tone === "success" ? "text-sm text-emerald-700" : "text-destructive text-sm"}>{msg.text}</span>}
            <Button onClick={save} disabled={busy || !form}>Save email settings</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><WebhookIcon className="size-4" />Keep unsubscribes in sync</CardTitle>
          <CardDescription>When someone unsubscribes, marks an email as spam, or an address bounces in Brevo, Brevo tells this dashboard so they're never emailed again. After changing the site's domain, press Reconnect once.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {(data.webhook?.types.length ? data.webhook.types : (["marketing", "transactional"] as const).map((type) => ({ type, connected: false, pointsAt: null }))).map((t) => (
              <div key={t.type} className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                {t.connected ? <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <CircleDashedIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />}
                <span className="min-w-0"><span className="font-medium">{t.type === "marketing" ? "Campaign emails" : "Automatic emails"}</span>
                  <span className="text-muted-foreground block truncate text-xs">{t.connected ? "Connected" : t.pointsAt ? `Points at an old address: ${t.pointsAt}` : "Not connected"}</span></span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={connectWebhook} disabled={busy || data.mode !== "brevo" || !data.webhookConfigured}>
              <RefreshCwIcon /> {data.webhook?.types.some((t) => t.pointsAt) ? "Reconnect" : "Connect"}
            </Button>
            <span className="text-muted-foreground text-xs">Reports to <code className="bg-muted rounded px-1">{data.webhook?.address ?? data.webhookUrl.split("?")[0]}</code></span>
          </div>
          {hookMsg && <p className={hookMsg.tone === "success" ? "text-sm text-emerald-700" : "text-destructive text-sm"}>{hookMsg.text}</p>}
          {data.mode !== "brevo" && <p className="text-muted-foreground text-xs">Connect Brevo first (BREVO_API_KEY on the server).</p>}
        </CardContent>
      </Card>
    </div>
  )
}
