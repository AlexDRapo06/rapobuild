import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangleIcon, CheckCircle2Icon, CheckIcon, MailIcon, MonitorIcon, SearchIcon, SendIcon, SmartphoneIcon, SparklesIcon, UsersIcon, XIcon } from "lucide-react"

import type { Api } from "../api"
import { dateRange } from "../format"
import type { AudienceSummary, EmailOptions, Segment } from "../types"
import { useLoad } from "../useLoad"
import { fillMergeFields, MERGE_FIELDS, renderCampaign, SAMPLE_MERGE_VALUES, unknownMergeTags } from "../../../src/email/templates"
import { ConfirmDialog, Field, PillTabs } from "@/components/app/kit"
import { ErrorState, PageHeader } from "@/components/app/states"
import { NumberTicker } from "@/components/magicui/number-ticker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox, Notice, Switch, Textarea } from "@/components/ui/form-controls"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { Navigate } from "./Analytics"

const DRAFT_KEY = "footyup-email-draft"
const SOURCES: { value: Segment["sources"][number]; label: string }[] = [
  { value: "registration", label: "Registered families" },
  { value: "imported", label: "Imported list" },
  { value: "private_training", label: "Private training" },
  { value: "waitlist", label: "Waitlist" },
]

interface Draft { subject: string; preheader: string; heading: string; body: string }
type DraftField = keyof Draft
const emptyDraft: Draft = { subject: "", preheader: "", heading: "", body: "" }

function toggle<T>(list: T[], v: T) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
}

const ageText = (min: number | null, max: number | null) => (min === null && max === null ? null : `ages ${min ?? "?"}–${max ?? "?"}`)
const families = (n: number) => `${n} ${n === 1 ? "family" : "families"}`
const orList = (items: string[]) => (items.length <= 1 ? items[0] ?? "" : `${items.slice(0, -1).join(", ")} or ${items.at(-1)}`)

/** Human name for a "camp:<id>" / "session:<id>" / "miami:<grp>" choice. */
function programName(p: string, options: EmailOptions | null) {
  const [kind, id] = p.split(":") as [string, string]
  if (kind === "miami") return `Combine ${options?.miami?.groups.find((g) => g.grp === id)?.label ?? id}`
  for (const c of options?.camps ?? []) {
    if (kind === "camp" && c.id === id) return `${c.name} (whole camp)`
    const s = c.sessions.find((x) => x.id === id)
    if (kind === "session" && s) return `${c.name} – ${s.name}`
  }
  return "A removed session"
}

function describeAudience(segment: Segment, options: EmailOptions | null) {
  const parts = [segment.programs.length ? `families registered for ${orList(segment.programs.map((p) => programName(p, options)))}` : "everyone on your list"]
  if (segment.towns.length) parts.push(`in ${orList(segment.towns)}`)
  if (segment.sources.length) parts.push(`who joined as ${orList(segment.sources.map((s) => SOURCES.find((x) => x.value === s)?.label.toLowerCase() ?? s))}`)
  parts.push(segment.includeUnknownConsent ? "including people whose consent is unknown" : "who agreed to emails")
  return parts.join(", ")
}

function Tile({ checked, disabled, onClick, title, detail, count }: { checked: boolean; disabled?: boolean; onClick: () => void; title: string; detail?: string | null; count: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={checked}
      className={cn(
        "flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left text-sm transition-colors",
        checked ? "border-brand bg-brand-soft/60" : "hover:bg-muted/60",
        disabled && "cursor-default opacity-70",
      )}
    >
      <span className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border", checked ? "border-brand bg-brand text-white" : "border-zinc-300 bg-white")}>{checked && <CheckIcon className="size-3" />}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        {detail && <span className="text-muted-foreground block text-xs">{detail}</span>}
      </span>
      <span className={cn("shrink-0 text-xs tabular-nums", count ? "text-foreground" : "text-muted-foreground")}>{families(count)}</span>
    </button>
  )
}

function ProgramPicker({ options, segment, setSegment }: { options: EmailOptions; segment: Segment; setSegment: (s: Segment) => void }) {
  const [search, setSearch] = useState("")
  const q = search.trim().toLowerCase()
  const pick = (p: string) => setSegment({ ...segment, programs: toggle(segment.programs, p) })
  const pickCamp = (campId: string, sessionIds: string[]) =>
    setSegment({ ...segment, programs: segment.programs.includes(`camp:${campId}`) ? segment.programs.filter((p) => p !== `camp:${campId}`) : [...segment.programs.filter((p) => !sessionIds.includes(p.slice(8))), `camp:${campId}`] })
  const camps = options.camps.filter((c) => !q || c.name.toLowerCase().includes(q) || c.sessions.some((s) => s.name.toLowerCase().includes(q)))
  const showMiami = options.miami && (!q || ("college combine".includes(q) || "boston".includes(q)) || options.miami.name.toLowerCase().includes(q))

  return (
    <div className="space-y-3">
      {segment.programs.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {segment.programs.map((p) => (
            <Badge key={p} variant="outline" className="gap-1 py-1 pr-1 font-normal">
              {programName(p, options)}
              <button type="button" className="hover:bg-muted rounded p-0.5" onClick={() => pick(p)} aria-label={`Remove ${programName(p, options)}`}><XIcon className="size-3" /></button>
            </Badge>
          ))}
          <button type="button" className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline" onClick={() => setSegment({ ...segment, programs: [] })}>Clear</button>
        </div>
      )}
      {options.camps.length > 4 && (
        <div className="relative">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <Input className="h-8 pl-8 text-sm" placeholder="Find a camp or session" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      )}
      <div className="max-h-[440px] space-y-4 overflow-y-auto pr-1">
        {showMiami && options.miami && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">{options.miami.name}</p>
            {options.miami.groups.map((g) => (
              <Tile key={g.grp} checked={segment.programs.includes(`miami:${g.grp}`)} onClick={() => pick(`miami:${g.grp}`)} title={`Combine – ${g.label}`} detail={dateRange(g.starts_on, g.ends_on)} count={g.families} />
            ))}
          </div>
        )}
        {camps.map((c) => {
          const whole = segment.programs.includes(`camp:${c.id}`)
          return (
            <div key={c.id} className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold">{c.name}{!c.active && <span className="text-muted-foreground ml-1.5 text-xs font-normal">(hidden on site)</span>}</p>
              </div>
              <Tile checked={whole} onClick={() => pickCamp(c.id, c.sessions.map((s) => s.id))} title="Whole camp (every session)" count={c.families} />
              {c.sessions.map((s) => (
                <Tile
                  key={s.id}
                  checked={whole || segment.programs.includes(`session:${s.id}`)}
                  disabled={whole}
                  onClick={() => pick(`session:${s.id}`)}
                  title={s.name}
                  detail={[dateRange(s.starts_on, s.ends_on), ageText(s.age_min, s.age_max)].filter(Boolean).join(" · ")}
                  count={s.families}
                />
              ))}
            </div>
          )
        })}
        {!camps.length && !showMiami && <p className="text-muted-foreground text-sm">Nothing matches “{search}”.</p>}
      </div>
    </div>
  )
}

export function Compose({ api, onExpired, refreshKey, navigate }: { api: Api; onExpired: () => void; refreshKey: number; navigate: Navigate }) {
  const load = useCallback(() => api<EmailOptions>("email-options"), [api])
  const { data: options, error, reload } = useLoad(load, onExpired, refreshKey)

  const [segment, setSegment] = useState<Segment>({ programs: [], towns: [], sources: [], includeUnknownConsent: false })
  const [draft, setDraft] = useState<Draft>(() => {
    try { return { ...emptyDraft, ...JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}") } } catch { return emptyDraft }
  })
  const [audience, setAudience] = useState<AudienceSummary | null>(null)
  const [counting, setCounting] = useState(false)
  const [townSearch, setTownSearch] = useState("")
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop")
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState<"test" | "send" | null>(null)
  const [result, setResult] = useState<{ tone: "success" | "error"; text: string } | null>(null)
  const [testTo, setTestTo] = useState(() => localStorage.getItem("footyup-test-to") ?? "")
  const requestId = useRef(crypto.randomUUID())
  const fields = useRef<Partial<Record<DraftField, HTMLInputElement | HTMLTextAreaElement | null>>>({})
  const lastField = useRef<DraftField>("body")

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }, [draft])

  useEffect(() => {
    setCounting(true)
    const t = setTimeout(() => {
      api<AudienceSummary>("email-audience", segment).then(setAudience, () => setAudience(null)).finally(() => setCounting(false))
    }, 250)
    return () => clearTimeout(t)
  }, [api, segment])

  const preview = useMemo(() => {
    const rendered = renderCampaign({
      subject: draft.subject || "Your subject",
      body: draft.body || "Your message appears here.",
      preheader: draft.preheader,
      heading: draft.heading || undefined,
      mailingAddress: options?.brand.mailingAddress ?? "Your mailing address (add it in Settings → Email)",
      logoUrl: options?.brand.logoUrl,
      unsubscribeUrl: "#unsubscribe",
    })
    return fillMergeFields(rendered.html, SAMPLE_MERGE_VALUES)
  }, [draft, options])

  const badTags = unknownMergeTags([draft.subject, draft.preheader, draft.heading, draft.body].join("\n"))
  const ready = draft.subject.trim() && draft.body.trim() && badTags.length === 0
  const missingAddress = options && !options.brand.mailingAddress
  const notConnected = options?.mode === "none"

  async function sendTest() {
    setBusy("test")
    setResult(null)
    try {
      localStorage.setItem("footyup-test-to", testTo.trim())
      const res = await api<{ to: string }>("email-test", { subject: draft.subject, preheader: draft.preheader || undefined, heading: draft.heading || undefined, body: draft.body, to: testTo.trim() || undefined })
      setResult({ tone: "success", text: `Test sent to ${res.to}. Check your inbox (and spam folder the first time). Tags show their fallback in tests, e.g. "Hi there".` })
    } catch (err) {
      setResult({ tone: "error", text: (err as Error).message })
    } finally {
      setBusy(null)
    }
  }

  async function send() {
    setBusy("send")
    setResult(null)
    try {
      const res = await api<{ recipients: number; duplicate: boolean }>("email-send", {
        requestId: requestId.current,
        segment,
        draft: { subject: draft.subject, preheader: draft.preheader || undefined, heading: draft.heading || undefined, body: draft.body },
      })
      setConfirm(false)
      setResult({ tone: "success", text: `${res.duplicate ? "Already sent" : "Sent"} to ${res.recipients} ${res.recipients === 1 ? "person" : "people"}. It's in Email history.` })
      requestId.current = crypto.randomUUID()
      setDraft(emptyDraft)
    } catch (err) {
      setConfirm(false)
      setResult({ tone: "error", text: (err as Error).message })
    } finally {
      setBusy(null)
    }
  }

  function insertTag(token: string) {
    const key = lastField.current
    const el = fields.current[key]
    const text = draft[key]
    const start = el?.selectionStart ?? text.length
    const end = el?.selectionEnd ?? start
    setDraft({ ...draft, [key]: text.slice(0, start) + token + text.slice(end) })
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + token.length, start + token.length)
    })
  }
  const bind = (key: DraftField) => ({
    ref: (el: HTMLInputElement | HTMLTextAreaElement | null) => { fields.current[key] = el },
    onFocus: () => { lastField.current = key },
  })

  if (error && !options) return <Card><ErrorState message={error} onRetry={reload} /></Card>
  const towns = (options?.towns ?? []).filter((t) => !townSearch || t.town.toLowerCase().includes(townSearch.toLowerCase()))
  const ex = audience?.excluded

  return (
    <div className="space-y-6">
      <PageHeader title="Send email" description="1. Pick who it goes to. 2. Write it. 3. Send yourself a test. 4. Send. Every email includes an unsubscribe link and your mailing address." />
      {notConnected && <Notice tone="warning" icon={AlertTriangleIcon} title="Brevo isn't connected yet">Sending needs the Brevo API key on the server. See Settings → Email for the steps.</Notice>}
      {missingAddress && (
        <Notice tone="warning" icon={AlertTriangleIcon} title="Add your mailing address first">
          The law requires it in every marketing email. <button className="underline underline-offset-2" onClick={() => navigate("settings", { section: "email" })}>Add it in Settings → Email</button>.
        </Notice>
      )}
      {options?.mode === "mock" && <Notice tone="info" icon={MailIcon}>Local test mode: emails are captured, not delivered. Open <a className="underline" href="/__mock/outbox" target="_blank" rel="noreferrer">the test outbox</a> to see them.</Notice>}
      {result && <Notice tone={result.tone} icon={result.tone === "success" ? CheckCircle2Icon : AlertTriangleIcon}>{result.text}</Notice>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. Who gets it</CardTitle>
              <CardDescription>Choose nothing to email everyone. Picking several options in one section means <em>any</em> of them; filling several sections means <em>all</em> of them must match.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!options ? <Skeleton className="h-40" /> : (
                <>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Registered for</p>
                      <p className="text-muted-foreground text-xs">Families with a paid, active registration. Tick a whole camp, or only the sessions you want.</p>
                    </div>
                    <ProgramPicker options={options} segment={segment} setSegment={setSegment} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">In town</p>
                        <p className="text-muted-foreground text-xs">From registrations and imported contacts.</p>
                      </div>
                      {segment.towns.length > 0 && <button type="button" className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline" onClick={() => setSegment({ ...segment, towns: [] })}>Clear {segment.towns.length}</button>}
                    </div>
                    <div className="relative">
                      <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                      <Input className="h-8 pl-8 text-sm" placeholder="Find a town" value={townSearch} onChange={(e) => setTownSearch(e.target.value)} />
                    </div>
                    <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border p-3">
                      {towns.length === 0 ? <p className="text-muted-foreground text-xs">No towns yet.</p> : towns.map((t) => (
                        <label key={t.town} className="flex items-center justify-between gap-2 text-sm">
                          <span className="flex items-center gap-2"><Checkbox checked={segment.towns.includes(t.town)} onCheckedChange={() => setSegment({ ...segment, towns: toggle(segment.towns, t.town) })} />{t.town}</span>
                          <span className="text-muted-foreground text-xs tabular-nums">{t.contacts}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">How they joined</p>
                    <div className="flex flex-wrap gap-2">
                      {SOURCES.map((s) => (
                        <button key={s.value} onClick={() => setSegment({ ...segment, sources: toggle(segment.sources, s.value) })} className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors", segment.sources.includes(s.value) ? "border-brand bg-brand-soft text-brand-strong" : "hover:bg-muted")}>{s.label}</button>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-start justify-between gap-3 rounded-lg border p-3">
                    <span className="text-sm"><span className="font-medium">Include contacts with unknown consent</span><span className="text-muted-foreground block text-xs">Off by default. Only turn on once you've confirmed how these people agreed to hear from Footy Up.</span></span>
                    <Switch checked={segment.includeUnknownConsent} onCheckedChange={(v) => setSegment({ ...segment, includeUnknownConsent: v })} />
                  </label>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-b from-brand-soft/60 to-card">
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="bg-brand-soft text-brand-strong flex size-10 items-center justify-center rounded-xl"><UsersIcon className="size-5" /></span>
                <div>
                  <p className="text-3xl leading-none font-semibold tabular-nums">{audience ? <NumberTicker key={audience.sendable} value={audience.sendable} stiffness={320} damping={42} /> : "—"}</p>
                  <p className="text-muted-foreground text-sm">{counting ? "Counting…" : "will receive this email"}</p>
                </div>
              </div>
              <p className="text-sm"><span className="text-muted-foreground">Sending to </span>{describeAudience(segment, options ?? null)}.</p>
              {ex && (ex.unsubscribed + ex.bounced + ex.denied + ex.unknown > 0) && (
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground text-xs font-medium">Left out ({audience!.matched - audience!.sendable} of {audience!.matched})</p>
                  {ex.unsubscribed > 0 && <p className="flex justify-between"><span>Unsubscribed</span><span className="tabular-nums">{ex.unsubscribed}</span></p>}
                  {ex.unknown > 0 && <p className="flex justify-between"><span>Consent unknown</span><span className="tabular-nums">{ex.unknown}</span></p>}
                  {ex.denied > 0 && <p className="flex justify-between"><span>Said no to emails</span><span className="tabular-nums">{ex.denied}</span></p>}
                  {ex.bounced > 0 && <p className="flex justify-between"><span>Email bounced</span><span className="tabular-nums">{ex.bounced}</span></p>}
                </div>
              )}
              {audience && audience.sample.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-xs font-medium">For example</p>
                  <ul className="space-y-1 text-sm">
                    {audience.sample.slice(0, 4).map((s) => (
                      <li key={s.email} className="truncate"><span className="font-medium">{s.name ?? s.email}</span>{s.kids.length > 0 && <span className="text-muted-foreground"> · {s.kids.join(", ")}</span>}{s.town && <span className="text-muted-foreground"> · {s.town}</span>}</li>
                    ))}
                  </ul>
                  {audience.sendable > 4 && <p className="text-muted-foreground text-xs">and {audience.sendable - 4} more</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">2. Write it</CardTitle>
              <CardDescription>Uses the Footy Up campaign template. Personalize with the buttons below: click into the subject or message, then click a button to drop it in where your cursor is.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/40 space-y-2 rounded-lg border p-3">
                <p className="flex items-center gap-1.5 text-xs font-medium"><SparklesIcon className="text-brand-strong size-3.5" />Personalize: filled in for each person</p>
                <div className="flex flex-wrap gap-1.5">
                  {MERGE_FIELDS.map((f) => (
                    <button
                      key={f.token}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => insertTag(f.token)}
                      title={`${f.description}. If we don't know it: ${f.fallback ? `"${f.fallback}"` : "left blank"}.`}
                      className="bg-background hover:border-brand hover:text-brand-strong rounded-md border px-2 py-1 text-xs font-medium transition-colors"
                    >
                      + {f.label}
                    </button>
                  ))}
                </div>
                <details className="text-xs">
                  <summary className="text-muted-foreground hover:text-foreground cursor-pointer select-none">What each one becomes</summary>
                  <table className="mt-2 w-full">
                    <tbody>
                      {MERGE_FIELDS.map((f) => (
                        <tr key={f.token} className="border-t align-top">
                          <td className="py-1.5 pr-3"><code className="bg-background rounded px-1">{f.token}</code></td>
                          <td className="py-1.5 pr-3">{f.description}</td>
                          <td className="text-muted-foreground py-1.5">e.g. {f.sample}{f.fallback ? `; "${f.fallback}" if unknown` : "; blank if unknown"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              </div>
              <Field label="Subject">
                <Input {...bind("subject")} value={draft.subject} maxLength={150} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} placeholder="Summer camp registration is open, {{first_name}}" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Preview text (optional)" hint="Shown next to the subject in the inbox.">
                  <Input {...bind("preheader")} value={draft.preheader} maxLength={150} onChange={(e) => setDraft({ ...draft, preheader: e.target.value })} />
                </Field>
                <Field label="Heading (optional)" hint="Big title at the top of the email.">
                  <Input {...bind("heading")} value={draft.heading} maxLength={120} onChange={(e) => setDraft({ ...draft, heading: e.target.value })} />
                </Field>
              </div>
              <Field label="Message" hint="Blank line = new paragraph · start lines with - for bullets · **bold** · paste links as-is">
                <Textarea {...bind("body")} rows={12} className="min-h-56 font-[inherit]" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} placeholder={"Hi {{first_name}},\n\nRegistration for {{kids}} is now open..."} />
              </Field>
              {badTags.length > 0 && (
                <Notice tone="warning" icon={AlertTriangleIcon} title="Check your personalization">
                  {badTags.join(", ")} {badTags.length === 1 ? "isn't a tag" : "aren't tags"} we can fill in, so {badTags.length === 1 ? "it" : "they"} would be sent as typed. Use the buttons above, or delete {badTags.length === 1 ? "it" : "them"}.
                </Notice>
              )}
              <div className="flex flex-wrap items-end justify-end gap-2 border-t pt-4">
                <Field label="Send test to" className="mr-auto min-w-56 flex-1" hint={options?.testRecipients?.length ? `Test mode: only ${options.testRecipients.join(", ")} can receive email.` : "Leave empty to send it to your own sign-in email."}>
                  <Input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder={options?.me ?? "you@example.com"} />
                </Field>
                <Button variant="ghost" onClick={() => setDraft(emptyDraft)} disabled={!draft.body && !draft.subject}>Clear</Button>
                <Button variant="outline" onClick={sendTest} disabled={!ready || busy !== null || notConnected || Boolean(missingAddress)}><MailIcon /> {busy === "test" ? "Sending test…" : "3. Send me a test"}</Button>
                <Button onClick={() => setConfirm(true)} disabled={!ready || !audience?.sendable || busy !== null || notConnected || Boolean(missingAddress)}><SendIcon /> 4. Send to {audience?.sendable ?? 0}</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 overflow-hidden py-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
              <div>
                <p className="text-sm font-medium">Preview</p>
                <p className="text-muted-foreground text-xs">Shown with sample details (Jamie Rivera, kids Alex and Sam).</p>
              </div>
              <PillTabs id="device" value={device} onChange={setDevice} options={[{ value: "desktop", label: <span className="flex items-center gap-1.5"><MonitorIcon className="size-3.5" />Desktop</span> }, { value: "mobile", label: <span className="flex items-center gap-1.5"><SmartphoneIcon className="size-3.5" />Phone</span> }]} />
            </div>
            <div className="bg-muted/40 flex justify-center p-4">
              <iframe title="Email preview" sandbox="" srcDoc={preview} className={cn("h-[640px] rounded-lg border bg-white shadow-sm transition-all", device === "desktop" ? "w-full" : "w-[375px]")} />
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Send to ${audience?.sendable ?? 0} people?`}
        description="This sends right away and can't be undone."
        confirmLabel={busy === "send" ? "Sending…" : "Send now"}
        busy={busy === "send"}
        onConfirm={send}
      >
        <div className="bg-muted/50 space-y-1 rounded-lg p-3 text-sm">
          <p><span className="text-muted-foreground">To:</span> {describeAudience(segment, options ?? null)}</p>
          <p><span className="text-muted-foreground">Subject:</span> {fillMergeFields(draft.subject, SAMPLE_MERGE_VALUES)}</p>
          <p><span className="text-muted-foreground">From:</span> {options?.sender.name} &lt;{options?.sender.email}&gt;</p>
          {ex && <p><span className="text-muted-foreground">Left out:</span> {ex.unsubscribed} unsubscribed, {ex.unknown} unknown consent, {ex.bounced + ex.denied} other</p>}
        </div>
      </ConfirmDialog>
    </div>
  )
}
