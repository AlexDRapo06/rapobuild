/**
 * The three branded email templates (Brief D15): registration confirmation,
 * reminder, and general campaign (waitlist notices reuse the campaign layout).
 * Email-safe HTML (tables, inline styles, 600px) plus a plain-text version.
 * No imports, so the dashboard bundles this file for live previews.
 */

export const BRAND = {
  name: "Footy Up",
  green: "#047857",
  greenSoft: "#ecfdf5",
  ink: "#18181b",
  muted: "#52525b",
  border: "#e4e4e7",
  bg: "#f4f4f5",
}

/** Placeholder replaced per recipient: by Brevo in production, by our own signed link locally. */
export const UNSUBSCRIBE_TOKEN = "{{ unsubscribe }}"
/** Personalisation a writer can type into a campaign body or subject. */
export const FIRST_NAME_TOKEN = "{{first_name}}"

export interface MergeField {
  token: string
  label: string
  /** What it becomes for one person. */
  description: string
  /** Used when we don't know the value for that person. */
  fallback: string
  /** Shown in the dashboard preview. */
  sample: string
}

/** Every personalisation tag a campaign may use. Values come from the contact and their registrations. */
export const MERGE_FIELDS: MergeField[] = [
  { token: FIRST_NAME_TOKEN, label: "First name", description: "Parent's first name", fallback: "there", sample: "Jamie" },
  { token: "{{last_name}}", label: "Last name", description: "Parent's last name", fallback: "", sample: "Rivera" },
  { token: "{{full_name}}", label: "Full name", description: "Parent's full name", fallback: "there", sample: "Jamie Rivera" },
  { token: "{{kids}}", label: "Kids' names", description: "First names of their registered players, e.g. \"Alex and Sam\"", fallback: "your player", sample: "Alex and Sam" },
  { token: "{{registered_for}}", label: "Registered for", description: "The camps and sessions they're registered for", fallback: "Footy Up", sample: "Arlington Catholic – Summer Camp" },
  { token: "{{town}}", label: "Town", description: "Their town", fallback: "your area", sample: "Brookline" },
]

export type MergeValues = Partial<Record<string, string | null | undefined>>

/** Replaces each tag with the person's value, or its fallback when the value is unknown. */
export function fillMergeFields(text: string, values: MergeValues): string {
  return MERGE_FIELDS.reduce((out, f) => out.replaceAll(f.token, values[f.token]?.trim() || f.fallback), text)
}

export const SAMPLE_MERGE_VALUES: MergeValues = Object.fromEntries(MERGE_FIELDS.map((f) => [f.token, f.sample]))

/** Tags in the text that aren't in MERGE_FIELDS (likely typos), e.g. "{{kid}}". */
export function unknownMergeTags(text: string): string[] {
  const known = new Set([...MERGE_FIELDS.map((f) => f.token), UNSUBSCRIBE_TOKEN])
  return [...new Set(text.match(/\{\{[^{}]*\}\}/g) ?? [])].filter((t) => !known.has(t))
}

/** "Alex", "Alex and Sam", "Alex, Sam and Jo" */
export function joinNames(names: string[]): string {
  const list = [...new Set(names.map((n) => n.trim()).filter(Boolean))]
  if (list.length <= 1) return list[0] ?? ""
  return `${list.slice(0, -1).join(", ")} and ${list.at(-1)}`
}

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

export interface BrandOptions {
  logoUrl?: string | null
  mailingAddress?: string | null
  replyTo?: string | null
}

export function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;")
}

function inline(text: string): string {
  let html = escapeHtml(text)
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  html = html.replace(
    /(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g,
    `<a href="$1" style="color:${BRAND.green};text-decoration:underline;">$1</a>`,
  )
  return html
}

/**
 * Plain text with light formatting -> email HTML:
 * blank line = new paragraph, "- " = bullet, **bold**, URLs become links.
 */
export function formatBody(body: string): string {
  const blocks = body.replace(/\r\n/g, "\n").trim().split(/\n{2,}/)
  return blocks
    .map((block) => {
      const lines = block.split("\n")
      if (lines.every((l) => /^\s*[-•]\s+/.test(l))) {
        const items = lines.map((l) => `<li style="margin:0 0 6px;">${inline(l.replace(/^\s*[-•]\s+/, ""))}</li>`).join("")
        return `<ul style="margin:0 0 16px;padding-left:20px;color:${BRAND.ink};font-size:15px;line-height:24px;">${items}</ul>`
      }
      return `<p style="margin:0 0 16px;color:${BRAND.ink};font-size:15px;line-height:24px;">${lines.map(inline).join("<br>")}</p>`
    })
    .join("")
}

function header(logoUrl?: string | null): string {
  const mark = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${BRAND.name}" height="36" style="display:block;height:36px;border:0;">`
    : `<span style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:800;letter-spacing:2px;color:${BRAND.green};">FOOTY&nbsp;UP</span>`
  return `<tr><td style="padding:28px 32px 20px;border-bottom:1px solid ${BRAND.border};">${mark}</td></tr>`
}

function layout(opts: { preheader: string; content: string; footer: string; logoUrl?: string | null }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${BRAND.name}</title>
<style>
  @media (max-width: 620px) {
    .container { width: 100% !important; border-radius: 0 !important; }
    .px { padding-left: 20px !important; padding-right: 20px !important; }
  }
  a { color: ${BRAND.green}; }
</style>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};-webkit-text-size-adjust:100%;">
<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${escapeHtml(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.bg};">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid ${BRAND.border};border-radius:12px;font-family:Arial,Helvetica,sans-serif;">
      ${header(opts.logoUrl)}
      <tr><td class="px" style="padding:28px 32px 12px;">${opts.content}</td></tr>
      <tr><td class="px" style="padding:20px 32px 28px;border-top:1px solid ${BRAND.border};color:${BRAND.muted};font-size:12px;line-height:18px;">${opts.footer}</td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;line-height:30px;color:${BRAND.ink};font-weight:700;">${escapeHtml(text)}</h1>`
}

function address(mailingAddress?: string | null): string {
  return mailingAddress ? escapeHtml(mailingAddress).replace(/\n/g, "<br>") : ""
}

// ---------------------------------------------------------------------------
// General campaign (also used for waitlist notices)
// ---------------------------------------------------------------------------

export interface CampaignInput extends BrandOptions {
  subject: string
  body: string
  preheader?: string
  heading?: string
  /** Defaults to UNSUBSCRIBE_TOKEN. */
  unsubscribeUrl?: string
}

export function renderCampaign(input: CampaignInput): RenderedEmail {
  const unsubscribe = input.unsubscribeUrl ?? UNSUBSCRIBE_TOKEN
  const content = `${input.heading ? heading(input.heading) : ""}${formatBody(input.body)}`
  const footer = `You're receiving this because you're on the ${BRAND.name} mailing list.<br>
<a href="${unsubscribe}" style="color:${BRAND.muted};text-decoration:underline;">Unsubscribe</a> at any time.
${input.mailingAddress ? `<br><br>${BRAND.name}<br>${address(input.mailingAddress)}` : ""}`
  const text = [
    input.heading,
    input.body.trim(),
    "",
    "—",
    `You're receiving this because you're on the ${BRAND.name} mailing list.`,
    `Unsubscribe: ${unsubscribe}`,
    input.mailingAddress ? `${BRAND.name}\n${input.mailingAddress}` : null,
  ]
    .filter((l) => l !== undefined && l !== null)
    .join("\n")
  return {
    subject: input.subject,
    html: layout({ preheader: input.preheader ?? input.body.slice(0, 120), content, footer, logoUrl: input.logoUrl }),
    text,
  }
}

// ---------------------------------------------------------------------------
// Transactional: confirmation and reminder
// ---------------------------------------------------------------------------

export interface ProgramItem {
  player: string
  program: string
  dates: string
  time?: string | null
  location?: string | null
  info?: string | null
}

function itemsHtml(items: ProgramItem[]): string {
  return items
    .map(
      (i) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 12px;background:${BRAND.greenSoft};border-radius:10px;">
<tr><td style="padding:16px 18px;">
<p style="margin:0 0 4px;font-size:16px;font-weight:700;color:${BRAND.ink};">${escapeHtml(i.player)}</p>
<p style="margin:0 0 8px;font-size:14px;color:${BRAND.green};font-weight:600;">${escapeHtml(i.program)}</p>
<p style="margin:0;font-size:14px;line-height:22px;color:${BRAND.ink};">
<strong>When:</strong> ${escapeHtml(i.dates)}${i.time ? `, ${escapeHtml(i.time)}` : ""}<br>
${i.location ? `<strong>Where:</strong> ${escapeHtml(i.location)}<br>` : ""}
</p>
${i.info ? `<p style="margin:8px 0 0;font-size:13px;line-height:20px;color:${BRAND.muted};">${escapeHtml(i.info).replace(/\n/g, "<br>")}</p>` : ""}
</td></tr></table>`,
    )
    .join("")
}

function itemsText(items: ProgramItem[]): string {
  return items
    .map((i) =>
      [`${i.player}: ${i.program}`, `  When: ${i.dates}${i.time ? `, ${i.time}` : ""}`, i.location ? `  Where: ${i.location}` : null, i.info ? `  ${i.info}` : null]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n")
}

function transactionalFooter(opts: BrandOptions): { html: string; text: string } {
  const reply = opts.replyTo ? `Questions? Just reply to this email or write to <a href="mailto:${escapeHtml(opts.replyTo)}" style="color:${BRAND.muted};">${escapeHtml(opts.replyTo)}</a>.` : "Questions? Just reply to this email."
  return {
    html: `${reply}${opts.mailingAddress ? `<br><br>${BRAND.name}<br>${address(opts.mailingAddress)}` : ""}`,
    text: `Questions? Reply to this email${opts.replyTo ? ` or write to ${opts.replyTo}` : ""}.${opts.mailingAddress ? `\n\n${BRAND.name}\n${opts.mailingAddress}` : ""}`,
  }
}

export interface ConfirmationInput extends BrandOptions {
  parentFirstName: string
  items: ProgramItem[]
  totalPaid?: string | null
  extraNote?: string | null
}

export function renderConfirmation(input: ConfirmationInput): RenderedEmail {
  const programs = [...new Set(input.items.map((i) => i.program))]
  const subject = programs.length === 1 ? `You're registered: ${programs[0]}` : "You're registered for Footy Up"
  const footer = transactionalFooter(input)
  const content = `${heading("You're registered!")}
<p style="margin:0 0 16px;color:${BRAND.ink};font-size:15px;line-height:24px;">Hi ${escapeHtml(input.parentFirstName)}, thanks for registering. Here are the details:</p>
${itemsHtml(input.items)}
${input.totalPaid ? `<p style="margin:16px 0;color:${BRAND.ink};font-size:15px;"><strong>Total paid:</strong> ${escapeHtml(input.totalPaid)}</p>` : ""}
${input.extraNote ? formatBody(input.extraNote) : ""}
<p style="margin:16px 0 0;color:${BRAND.ink};font-size:15px;line-height:24px;">We'll send a reminder before the first day. See you on the field!</p>`
  const text = [
    "You're registered!",
    "",
    `Hi ${input.parentFirstName}, thanks for registering. Here are the details:`,
    "",
    itemsText(input.items),
    input.totalPaid ? `\nTotal paid: ${input.totalPaid}` : null,
    input.extraNote ? `\n${input.extraNote}` : null,
    "",
    "We'll send a reminder before the first day. See you on the field!",
    "",
    "—",
    footer.text,
  ]
    .filter((l) => l !== null)
    .join("\n")
  return { subject, html: layout({ preheader: `Registration confirmed for ${input.items.map((i) => i.player).join(", ")}`, content, footer: footer.html, logoUrl: input.logoUrl }), text }
}

export interface ReminderInput extends BrandOptions {
  parentFirstName: string
  daysBefore: number
  items: ProgramItem[]
  /** Optional extra paragraph, e.g. what to bring (setting `reminder_note`). */
  note?: string | null
}

export function renderReminder(input: ReminderInput): RenderedEmail {
  const when = input.daysBefore === 0 ? "today" : input.daysBefore === 1 ? "tomorrow" : `in ${input.daysBefore} days`
  const program = input.items[0]?.program ?? "Footy Up"
  const subject = `Reminder: ${program} starts ${when}`
  const footer = transactionalFooter(input)
  const content = `${heading(`See you ${when}!`)}
<p style="margin:0 0 16px;color:${BRAND.ink};font-size:15px;line-height:24px;">Hi ${escapeHtml(input.parentFirstName)}, a quick reminder that ${input.items.length > 1 ? "these start" : "this starts"} ${when}:</p>
${itemsHtml(input.items)}
${input.note ? formatBody(input.note) : ""}`
  const text = [`See you ${when}!`, "", `Hi ${input.parentFirstName}, a quick reminder that ${input.items.length > 1 ? "these start" : "this starts"} ${when}:`, "", itemsText(input.items), input.note ? `\n${input.note}` : null, "", "—", footer.text]
    .filter((l) => l !== null)
    .join("\n")
  return { subject, html: layout({ preheader: `${program} starts ${when}`, content, footer: footer.html, logoUrl: input.logoUrl }), text }
}
