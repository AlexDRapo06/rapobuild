/**
 * Outside production, a real Brevo key must never email the fake families in a
 * test database: bounces from made-up addresses hurt the client's sender
 * reputation and can get the Brevo account suspended. With the guard on, real
 * email only goes to addresses listed in EMAIL_TEST_RECIPIENTS.
 */
import type { CampaignContent, CampaignRecipient, EmailProvider } from "../email/provider.js";
import type { Mailer, OutgoingEmail, SendOutcome } from "./email.js";

/** "you@gmail.com, @footyup.net" -> matcher. Entries starting with @ allow a whole domain. */
export function recipientAllowList(raw: string | undefined): (email: string) => boolean {
  const entries = (raw ?? "").split(/[,\s]+/).map((e) => e.trim().toLowerCase()).filter(Boolean);
  return (email) => {
    const address = email.trim().toLowerCase();
    return entries.some((e) => (e.startsWith("@") ? address.endsWith(e) : address === e));
  };
}

export const NOT_ON_TEST_LIST =
  "This isn't production, so real emails only go to addresses in EMAIL_TEST_RECIPIENTS (comma-separated; @domain allows a whole domain).";

export class GuardedMailer implements Mailer {
  readonly mode: Mailer["mode"];
  constructor(private readonly inner: Mailer, private readonly allowed: (email: string) => boolean) {
    this.mode = inner.mode;
  }
  async send(message: OutgoingEmail): Promise<SendOutcome> {
    if (!this.allowed(message.to)) {
      console.info(JSON.stringify({ level: "info", scope: "email.guard", note: "skipped: not on EMAIL_TEST_RECIPIENTS", subject: message.subject }));
      return "skipped";
    }
    return this.inner.send(message);
  }
}

export class GuardedEmailProvider implements EmailProvider {
  readonly mode: EmailProvider["mode"];
  constructor(private readonly inner: EmailProvider, private readonly allowed: (email: string) => boolean) {
    this.mode = inner.mode;
  }
  async sendCampaign(content: CampaignContent, recipients: CampaignRecipient[]) {
    const blocked = recipients.filter((r) => !this.allowed(r.email)).length;
    if (blocked) throw new Error(`${blocked} of ${recipients.length} recipients aren't on the test list. ${NOT_ON_TEST_LIST} Narrow the audience to your own test contacts.`);
    return this.inner.sendCampaign(content, recipients);
  }
  async sendTest(content: CampaignContent, to: string) {
    if (!this.allowed(to)) throw new Error(`Tests go to your admin email (${to}), which isn't on the test list. ${NOT_ON_TEST_LIST}`);
    return this.inner.sendTest(content, to);
  }
  async setBlocked(email: string, blocked: boolean) {
    if (this.allowed(email)) await this.inner.setBlocked(email, blocked);
  }
  status(domain: string, sender: string) {
    return this.inner.status(domain, sender);
  }
  addDomain(domain: string) {
    return this.inner.addDomain(domain);
  }
  authenticateDomain(domain: string) {
    return this.inner.authenticateDomain(domain);
  }
  webhookStatus(url: string) {
    return this.inner.webhookStatus(url);
  }
  connectWebhooks(url: string) {
    return this.inner.connectWebhooks(url);
  }
}
