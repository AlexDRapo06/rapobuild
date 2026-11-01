import { getSql, type Sql } from "./db.js";
import { GuardedEmailProvider, GuardedMailer, recipientAllowList } from "./email-guard.js";
import { BrevoMailer, LogMailer, MemoryMailer, type Mailer } from "./email.js";
import { BrevoProvider, MockEmailProvider, NoEmailProvider, type EmailProvider } from "../email/provider.js";
import { unsubscribeUrl } from "../email/links.js";
import { loadEnv, type Env } from "./env.js";
import { MockGateway, StagingGateway, StripeGateway, type PaymentsGateway } from "./payments.js";

export interface Deps {
  db: Sql;
  env: Env;
  payments: PaymentsGateway;
  mailer: Mailer;
  /** Campaign email provider (Brevo). */
  email: EmailProvider;
}

export function createDeps(env: Env, source: NodeJS.ProcessEnv = process.env): Deps {
  const payments =
    env.paymentsMode === "stripe"
      ? new StripeGateway(env.stripeSecretKey!, env.stripeWebhookSecret)
      : env.onVercel
        ? new StagingGateway(env.apiUrl, env.rateLimitSalt)
        : new MockGateway(env.siteUrl, env.stripeWebhookSecret);
  // Without Brevo: locally, emails are kept in memory (see /__mock/outbox); on Vercel, they're logged and campaigns are refused.
  let mailer: Mailer = env.brevoApiKey
    ? new BrevoMailer(env.brevoApiKey, { email: env.emailFrom, name: env.emailFromName })
    : env.onVercel
      ? new LogMailer()
      : new MemoryMailer();
  let email: EmailProvider = env.brevoApiKey
    ? new BrevoProvider(env.brevoApiKey)
    : env.onVercel
      ? new NoEmailProvider()
      : new MockEmailProvider((address) => unsubscribeUrl(env, address));
  // A real Brevo key outside production only emails EMAIL_TEST_RECIPIENTS (see email-guard.ts).
  if (env.brevoApiKey && !env.isProduction) {
    const allowed = recipientAllowList(source.EMAIL_TEST_RECIPIENTS);
    mailer = new GuardedMailer(mailer, allowed);
    email = new GuardedEmailProvider(email, allowed);
  }
  return { db: getSql(env.databaseUrl), env, payments, mailer, email };
}

let shared: Deps | undefined;

export function getDeps(): Deps {
  shared ??= createDeps(loadEnv());
  return shared;
}

/** Lets the local dev server and tests swap in their own dependencies. */
export function setDeps(deps: Deps): void {
  shared = deps;
}
