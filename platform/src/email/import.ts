/**
 * Contact import (Brief D6). Accepts the client's Word document (.docx), a
 * spreadsheet export (.csv) or plain text. Emails are trimmed, lowercased,
 * validated and de-duplicated. Re-running an import never creates duplicates.
 */
import { inflateRawSync } from "node:zlib"

export interface ParsedContact {
  email: string
  name: string | null
  town: string | null
  phone: string | null
}

export interface ParseResult {
  contacts: ParsedContact[]
  duplicates: number
  rejected: { value: string; reason: string }[]
}

const EMAIL = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/
const EMAILISH = /[^\s,;:<>()"'[\]]+@[^\s,;:<>()"'[\]]*/g

/** Minimal ZIP reader: enough to pull word/document.xml out of a .docx. */
function unzipEntry(zip: Buffer, wanted: string): Buffer | null {
  let eocd = -1
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 65_557); i--) {
    if (zip.readUInt32LE(i) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) return null
  const count = zip.readUInt16LE(eocd + 10)
  let p = zip.readUInt32LE(eocd + 16)
  for (let n = 0; n < count && p + 46 <= zip.length; n++) {
    if (zip.readUInt32LE(p) !== 0x02014b50) return null
    const method = zip.readUInt16LE(p + 10)
    const size = zip.readUInt32LE(p + 20)
    const nameLen = zip.readUInt16LE(p + 28)
    const extraLen = zip.readUInt16LE(p + 30)
    const commentLen = zip.readUInt16LE(p + 32)
    const local = zip.readUInt32LE(p + 42)
    const name = zip.subarray(p + 46, p + 46 + nameLen).toString("utf8")
    if (name === wanted) {
      const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28)
      const data = zip.subarray(start, start + size)
      return method === 0 ? Buffer.from(data) : method === 8 ? inflateRawSync(data) : null
    }
    p += 46 + nameLen + extraLen + commentLen
  }
  return null
}

function decodeXml(s: string) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&")
}

export function fileToText(filename: string, data: Buffer): string {
  const lower = filename.toLowerCase()
  if (lower.endsWith(".docx")) {
    const xml = unzipEntry(data, "word/document.xml")
    if (!xml) throw new Error("That .docx file couldn't be read. Try saving it again from Word, or paste the text instead.")
    return decodeXml(
      xml
        .toString("utf8")
        .replace(/<w:tab\/>/g, "\t")
        .replace(/<w:br[^>]*\/>/g, "\n")
        .replace(/<\/w:p>/g, "\n")
        .replace(/<\/w:tc>/g, "\t")
        .replace(/<[^>]+>/g, ""),
    )
  }
  if (lower.endsWith(".doc")) {
    throw new Error("Old .doc files aren't supported. Open it in Word and save as .docx, or paste the text instead.")
  }
  return data.toString("utf8").replace(/^\uFEFF/, "")
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ""
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') quoted = false
      else cur += ch
    } else if (ch === '"') quoted = true
    else if (ch === "," || ch === "\t" || ch === ";") {
      out.push(cur)
      cur = ""
    } else cur += ch
  }
  out.push(cur)
  return out.map((c) => c.trim())
}

function cleanName(raw: string): string | null {
  const name = raw.replace(/[<>()[\]"|]/g, " ").replace(/^[\s,;:\-–—]+|[\s,;:\-–—]+$/g, "").replace(/\s+/g, " ").trim()
  return name && /[a-z]/i.test(name) && name.length <= 80 && !/@/.test(name) ? name : null
}

export function parseContacts(text: string): ParseResult {
  const lines = text.replace(/\r\n?/g, "\n").split("\n").filter((l) => l.trim())
  const seen = new Map<string, ParsedContact>()
  const rejected: ParseResult["rejected"] = []
  let duplicates = 0

  const add = (rawEmail: string, contact: Omit<ParsedContact, "email">) => {
    const email = rawEmail.trim().toLowerCase().replace(/^mailto:/, "").replace(/[.,;:]+$/, "")
    if (!EMAIL.test(email) || email.length > 254) {
      rejected.push({ value: rawEmail.trim().slice(0, 120), reason: "Not a valid email address" })
      return
    }
    const existing = seen.get(email)
    if (existing) {
      duplicates++
      existing.name ??= contact.name
      existing.town ??= contact.town
      existing.phone ??= contact.phone
      return
    }
    seen.set(email, { email, ...contact })
  }

  const header = lines[0] ? splitCsvLine(lines[0]).map((h) => h.toLowerCase()) : []
  const col = (...names: string[]) => header.findIndex((h) => names.some((n) => h.replace(/[^a-z]/g, "").includes(n)))
  const emailCol = col("email", "emailaddress")

  if (emailCol >= 0 && header.length > 1) {
    const first = col("firstname", "first")
    const last = col("lastname", "last", "surname")
    const full = col("name", "fullname", "parent")
    const town = col("town", "city")
    const phone = col("phone", "mobile", "cell")
    for (const line of lines.slice(1)) {
      const cells = splitCsvLine(line)
      const raw = cells[emailCol] ?? ""
      if (!raw) continue
      const name = [first >= 0 ? cells[first] : "", last >= 0 ? cells[last] : ""].join(" ").trim() || (full >= 0 && full !== first ? cells[full] : "") || ""
      add(raw, { name: cleanName(name), town: town >= 0 ? cells[town] || null : null, phone: phone >= 0 ? cells[phone] || null : null })
    }
  } else {
    for (const line of lines) {
      const found = line.match(EMAILISH) ?? []
      if (!found.length) continue
      const rest = found.length === 1 ? cleanName(line.replace(found[0]!, " ")) : null
      for (const raw of found) add(raw, { name: rest, town: null, phone: null })
    }
  }

  return { contacts: [...seen.values()], duplicates, rejected }
}
