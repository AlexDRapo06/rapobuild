import { createHmac, timingSafeEqual } from "node:crypto"
import { resolveCname, resolveTxt } from "node:dns/promises"
import type { Env } from "../lib/env.js"

function key(env: Env) {
  return createHmac("sha256", env.rateLimitSalt).update("email-links").digest()
}

function sign(env: Env, email: string) {
  return createHmac("sha256", key(env)).update(email.toLowerCase()).digest("base64url").slice(0, 32)
}

/** A per-address link that unsubscribes without logging in. */
export function unsubscribeUrl(env: Env, email: string): string {
  const e = Buffer.from(email.toLowerCase()).toString("base64url")
  return `${env.apiUrl}/api/email/unsubscribe?e=${e}&t=${sign(env, email)}`
}

export function verifyUnsubscribe(env: Env, e: string | null, t: string | null): string | null {
  if (!e || !t) return null
  let email: string
  try {
    email = Buffer.from(e, "base64url").toString("utf8")
  } catch {
    return null
  }
  const expected = Buffer.from(sign(env, email))
  const given = Buffer.from(t)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  return email
}

export interface DnsCheck {
  name: string
  host: string
  found: string | null
  ok: boolean
  hint: string
}

async function txt(host: string): Promise<string[]> {
  try {
    return (await resolveTxt(host)).map((parts) => parts.join(""))
  } catch {
    return []
  }
}

/** What's actually published in DNS right now, so the client can see whether Ivy Devs' records took effect. */
export async function checkDns(domain: string): Promise<DnsCheck[]> {
  const [root, dmarc, mail, b1, b2] = await Promise.all([
    txt(domain),
    txt(`_dmarc.${domain}`),
    txt(`mail._domainkey.${domain}`),
    resolveCname(`brevo1._domainkey.${domain}`).catch(() => [] as string[]),
    resolveCname(`brevo2._domainkey.${domain}`).catch(() => [] as string[]),
  ])
  const spf = root.find((r) => r.toLowerCase().startsWith("v=spf1")) ?? null
  const code = root.find((r) => r.startsWith("brevo-code:")) ?? null
  const dkim = mail[0] ?? b1[0] ?? b2[0] ?? null
  return [
    { name: "Brevo verification", host: domain, found: code, ok: Boolean(code), hint: "TXT record starting with brevo-code:" },
    {
      name: "SPF",
      host: domain,
      found: spf,
      ok: Boolean(spf && /include:(spf\.brevo\.com|spf\.sendinblue\.com)/i.test(spf)),
      hint: "One v=spf1 TXT record that includes spf.brevo.com (merge with any existing SPF record; never publish two)",
    },
    { name: "DKIM", host: `mail._domainkey.${domain} or brevo1/brevo2._domainkey`, found: dkim, ok: Boolean(dkim), hint: "DKIM record exactly as shown in Brevo" },
    { name: "DMARC", host: `_dmarc.${domain}`, found: dmarc[0] ?? null, ok: Boolean(dmarc[0]?.toLowerCase().startsWith("v=dmarc1")), hint: "TXT record starting with v=DMARC1" },
  ]
}
