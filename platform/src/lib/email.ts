export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

/** "skipped" means nothing left the server (no Brevo key, or the test-recipient guard). */
export type SendOutcome = "sent" | "skipped";

export interface Mailer {
  readonly mode: "brevo" | "log" | "memory";
  send(message: OutgoingEmail): Promise<SendOutcome>;
}

export class BrevoMailer implements Mailer {
  readonly mode = "brevo" as const;

  constructor(
    private readonly apiKey: string,
    private readonly from: { email: string; name: string },
  ) {}

  async send(message: OutgoingEmail): Promise<SendOutcome> {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": this.apiKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: this.from,
        to: [{ email: message.to }],
        subject: message.subject,
        textContent: message.text,
        ...(message.html ? { htmlContent: message.html } : {}),
        ...(message.replyTo ? { replyTo: { email: message.replyTo } } : {}),
      }),
    });
    if (!res.ok) throw new Error(`Brevo send failed with status ${res.status}`);
    return "sent";
  }
}

/** Used until Brevo exists. Logs the subject only, never the body (it can hold personal data). */
export class LogMailer implements Mailer {
  readonly mode = "log" as const;

  async send(message: OutgoingEmail): Promise<SendOutcome> {
    console.info(JSON.stringify({ level: "info", scope: "email", note: "BREVO_API_KEY not set; email not sent", subject: message.subject }));
    return "skipped";
  }
}

export class MemoryMailer implements Mailer {
  readonly mode = "memory" as const;
  readonly sent: OutgoingEmail[] = [];

  async send(message: OutgoingEmail): Promise<SendOutcome> {
    this.sent.push(message);
    return "sent";
  }
}
