/**
 * Local stand-in for `vercel dev`: serves every function in api/ on one port,
 * plus a fake Stripe Checkout page when PAYMENTS_MODE=mock.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createDeps, setDeps } from "../src/lib/deps.js";
import { loadEnv } from "../src/lib/env.js";
import { MockGateway } from "../src/lib/payments.js";
import { MemoryMailer } from "../src/lib/email.js";
import { MockEmailProvider } from "../src/email/provider.js";

const port = Number(process.env.PORT ?? 4319);
const env = loadEnv();
const deps = createDeps(env);
setDeps(deps);

const apiRoot = resolve("api");

async function toRequest(req: IncomingMessage): Promise<Request> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
  if (!headers.has("x-forwarded-for")) headers.set("x-forwarded-for", req.socket.remoteAddress ?? "127.0.0.1");
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  return new Request(`http://localhost:${port}${req.url}`, { method: req.method, headers, body: hasBody ? Buffer.concat(chunks) : undefined });
}

async function send(res: ServerResponse, response: Response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await response.arrayBuffer()));
}

function html(body: string, status = 200) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Footy Up API (local)</title>
<style>
*{box-sizing:border-box}body{font:15px/1.6 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;margin:0;color:#18181b;background:#f8fafc;
background-image:radial-gradient(#d4d4d8 1px,transparent 1px);background-size:18px 18px}
main{max-width:560px;margin:56px auto;padding:32px;background:#fff;border:1px solid #e4e4e7;border-radius:16px;box-shadow:0 10px 30px -12px rgb(24 24 27/.15)}
h1{font-size:22px;letter-spacing:-.01em;margin:0 0 6px}p{color:#52525b;margin:8px 0}a{color:#047857;font-weight:500}
.mark{display:inline-grid;place-items:center;width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#10b981,#047857);color:#fff;font-weight:700;margin-bottom:16px}
code{background:#f4f4f5;padding:2px 6px;border-radius:6px;font-size:13px}ul{padding-left:18px}li{margin:4px 0}
.box{border:1px solid #e4e4e7;border-radius:12px;padding:18px;margin:20px 0;background:#fafafa}
button{font:inherit;font-weight:500;height:40px;padding:0 18px;border-radius:9px;border:1px solid transparent;margin:8px 8px 0 0;cursor:pointer}
.pay{background:#18181b;color:#fff}.pay:hover{background:#27272a}.cancel{background:#fff;border-color:#e4e4e7}.cancel:hover{background:#f4f4f5}
.tag{display:inline-block;font-size:12px;font-weight:500;color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:999px;padding:2px 10px}
</style></head><body><main><div class="mark">FU</div>${body}</main></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

async function resolveApi(pathname: string): Promise<Record<string, unknown> | null> {
  const rel = pathname.replace(/^\/api\/?/, "").replace(/\/+$/, "");
  if (rel.includes("..")) return null;
  for (const candidate of [`${rel}.ts`, join(rel, "index.ts")]) {
    const file = join(apiRoot, candidate);
    if (file.startsWith(apiRoot) && existsSync(file)) return import(pathToFileURL(file).href);
  }
  // Vercel-style dynamic segment, e.g. api/admin/[view].ts
  const dir = join(apiRoot, dirname(rel));
  if (dir.startsWith(apiRoot) && existsSync(dir)) {
    const dynamic = readdirSync(dir).find((f) => /^\[[^\]]+\]\.ts$/.test(f));
    if (dynamic) return import(pathToFileURL(join(dir, dynamic)).href);
  }
  return null;
}

const publicRoot = resolve("public");
const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".map": "application/json",
};

function serveStatic(pathname: string): Response | null {
  let file = join(publicRoot, decodeURIComponent(pathname));
  if (!file.startsWith(publicRoot)) return null;
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) return null;
  return new Response(readFileSync(file), {
    headers: { "content-type": MIME[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" },
  });
}

async function mockCheckout(req: Request, url: URL): Promise<Response> {
  const gateway = deps.payments;
  if (!(gateway instanceof MockGateway)) return html("<p>Mock checkout is only available with PAYMENTS_MODE=mock.</p>", 404);
  const [, , , id, action] = url.pathname.split("/");
  const session = id ? gateway.sessions.get(id) : undefined;
  if (!session) return html("<p>Unknown or restarted checkout session.</p>", 404);

  if (req.method === "POST" && (action === "pay" || action === "cancel")) {
    const delivery = action === "pay" ? gateway.complete(session.id) : gateway.expire(session.id);
    const webhook = await fetch(`http://localhost:${port}/api/stripe/webhook`, {
      method: "POST",
      headers: { "stripe-signature": delivery.signature, "content-type": "application/json" },
      body: delivery.body,
    });
    if (!webhook.ok) return html(`<p>Webhook failed with status ${webhook.status}.</p>`, 500);
    const target = action === "pay" ? session.input.successUrl.replace("{CHECKOUT_SESSION_ID}", session.id) : session.input.cancelUrl;
    return new Response(null, { status: 303, headers: { location: target } });
  }

  const total = (session.amountTotal / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  const items = session.input.lines
    .map((l) => `<li>${l.quantity} × ${l.name} — ${(l.unitAmountCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}</li>`)
    .join("");
  return html(`<span class="tag">Local test checkout · no money moves</span><h1 style="margin-top:12px">Mock Stripe Checkout</h1><p>Stands in for Stripe while testing locally.</p>
    <div class="box"><ul>${items}</ul><p><strong>Total: ${total}</strong></p>
    <form method="post" style="display:inline" action="/__mock/checkout/${session.id}/pay"><button class="pay">Pay (test)</button></form>
    <form method="post" style="display:inline" action="/__mock/checkout/${session.id}/cancel"><button class="cancel">Abandon checkout</button></form></div>`);
}

/** Local stand-in for an inbox: every email the app would have sent through Brevo. */
function outbox(url: URL): Response {
  const mails: { kind: string; to: string; subject: string; html: string; at: number }[] = []
  if (deps.mailer instanceof MemoryMailer) deps.mailer.sent.forEach((m, i) => mails.push({ kind: "Automatic", to: m.to, subject: m.subject, html: m.html ?? `<pre>${m.text}</pre>`, at: i }))
  if (deps.email instanceof MockEmailProvider) {
    for (const s of [...deps.email.sends].reverse()) for (const m of s.messages) mails.push({ kind: s.kind === "test" ? "Test" : "Campaign", to: m.to, subject: m.subject, html: m.html, at: 1e6 + mails.length })
  }
  mails.reverse()
  const i = Number(url.searchParams.get("i") ?? "-1")
  if (i >= 0 && mails[i]) return new Response(mails[i]!.html, { headers: { "content-type": "text/html; charset=utf-8" } })
  const rows = mails.map((m, n) => `<li><a href="/__mock/outbox?i=${n}" target="mail">${m.subject.replace(/</g, "&lt;")}</a><br><small>${m.kind} → ${m.to}</small></li>`).join("")
  return html(`<h1>Test outbox</h1><p>Emails captured locally (nothing is delivered). Newest first. Restarting the server clears it.</p>
    <div class="box"><ul style="list-style:none;padding:0">${rows || "<li>No emails yet.</li>"}</ul></div>
    <iframe name="mail" style="width:100%;height:640px;border:1px solid #e4e4e7;border-radius:12px;background:#fff"></iframe>`)
}

const server = createServer(async (nodeReq, nodeRes) => {
  try {
    const req = await toRequest(nodeReq);
    const url = new URL(req.url);

    if (url.pathname.startsWith("/api/")) {
      const mod = await resolveApi(url.pathname);
      const handler = mod?.[req.method] as ((r: Request) => Promise<Response>) | undefined;
      if (!mod) return send(nodeRes, Response.json({ error: "not_found", message: "No such endpoint" }, { status: 404 }));
      if (!handler) return send(nodeRes, Response.json({ error: "method_not_allowed", message: "Method not allowed" }, { status: 405 }));
      return send(nodeRes, await handler(req));
    }
    if (url.pathname.startsWith("/__mock/checkout/")) return send(nodeRes, await mockCheckout(req, url));
    if (url.pathname.startsWith("/__mock/outbox")) return send(nodeRes, outbox(url));
    if (url.pathname === "/admin") return send(nodeRes, new Response(null, { status: 308, headers: { location: "/admin/" } }));
    const asset = url.pathname.startsWith("/admin/") ? serveStatic(url.pathname) : null;
    if (asset) return send(nodeRes, asset);
    if (url.pathname === "/success" || url.pathname === "/cancel") {
      const ok = url.pathname === "/success";
      return send(nodeRes, html(`<h1>${ok ? "Payment received" : "Checkout cancelled"}</h1><p>The live site's <code>${url.pathname}</code> page shows here. ${ok ? "The registration is now in the dashboard." : "The held spot is released."}</p><p><a href="/admin/">Open the dashboard</a></p>`));
    }
    if (url.pathname === "/registration/success") {
      return send(nodeRes, html(`<h1>Registration received</h1><p>Stripe session <code>${url.searchParams.get("session_id") ?? ""}</code>. This placeholder stands in for the success page Ivy Devs builds.</p><p><a href="/">Back</a></p>`));
    }
    if (url.pathname === "/registration/cancelled") {
      return send(nodeRes, html(`<h1>Checkout cancelled</h1><p>The held spot is released. This placeholder stands in for Ivy Devs' page.</p><p><a href="/">Back</a></p>`));
    }
    if (url.pathname === "/") {
      return send(
        nodeRes,
        html(`<h1>Footy Up registration API</h1><p>Local server. Payments: <code>${env.paymentsMode}</code>. Email: <code>${deps.mailer.mode}</code>.</p>
        <p><a href="/admin/">Open the admin dashboard</a> (run <code>pnpm admin:build</code> first).</p>
        <ul><li><a href="/api/camps">GET /api/camps</a></li><li><a href="/api/miami">GET /api/miami</a></li>
        <li>POST /api/checkout/camp</li><li>POST /api/miami/verify-code</li><li>POST /api/miami/checkout</li>
        <li>POST /api/private-training</li><li>POST /api/waitlist</li><li>POST /api/stripe/webhook</li><li><a href="/api/cron/cleanup">GET /api/cron/cleanup</a></li></ul>
        <p>Shapes are in <code>docs/api-contract.md</code>.</p>`),
      );
    }
    return send(nodeRes, html("<p>Not found.</p>", 404));
  } catch (err) {
    console.error(err);
    nodeRes.statusCode = 500;
    nodeRes.end("Internal error");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Footy Up API listening on http://localhost:${port} (payments: ${env.paymentsMode}, email: ${deps.mailer.mode})`);
});
