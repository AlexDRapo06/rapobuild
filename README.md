# Footy Up (footyup.net)

The Footy Up website plus its registration platform, deployed as one Vercel project.

| Path | What it is |
| --- | --- |
| `index.html`, `src/*.jsx`, `public/`, `assets/` | The website: camp pages, Boston College Combine (code name "miami"), private training, coaches |
| `api/` | Serverless functions: the site's forms (`/api/site/*`), Stripe webhook, email, cron jobs, dashboard API |
| `platform/` | Back end and admin dashboard code, database migrations, tests, docs |
| `vercel.json` | Build (`pnpm build` → `dist/`), cron jobs, `/admin` headers |

- Run locally: see [`platform/README.md`](platform/README.md). The short version: `pnpm install`, then `pnpm dev`, which serves the site, `/admin` and the API on one port.
- Go-live steps: [`platform/docs/go-live-checklist.md`](platform/docs/go-live-checklist.md).
- How-tos (camps, combine access code, email, rosters, backups): [`platform/docs/handoff.md`](platform/docs/handoff.md).

Secrets live in Vercel environment variables only, never in this repo.
