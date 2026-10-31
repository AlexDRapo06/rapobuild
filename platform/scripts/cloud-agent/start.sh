#!/usr/bin/env bash
# Cloud Agent boot: local Postgres, the dev database, and the dev server on :4319
# (tmux session "footyup-api"). Safe to rerun; skips anything already up.
set -euo pipefail
cd "$(dirname "$0")/../.."

sudo service postgresql start
until pg_isready -q; do sleep 1; done

sql() { sudo -u postgres psql -tAc "$1"; }
[ "$(sql "select 1 from pg_roles where rolname = 'footy'")" = "1" ] || sql "create role footy login superuser password 'footy'"
[ -f .env ] || cp .env.example .env

if [ "$(sql "select 1 from pg_database where datname = 'footyup_dev'")" != "1" ]; then
  sudo -u postgres createdb -O footy footyup_dev
  pnpm -s db:reset
fi
pnpm -s db:migrate
pnpm -s admins add reed@example.test >/dev/null

if ! tmux has-session -t footyup-api 2>/dev/null; then
  tmux new-session -d -s footyup-api "pnpm dev 2>&1 | tee /tmp/footyup-dev.log"
fi
for _ in $(seq 1 60); do
  curl -sf -o /dev/null http://localhost:4319/admin/ && { echo "Footy Up dashboard: http://localhost:4319/admin/"; exit 0; }
  sleep 1
done
echo "Dev server didn't answer on :4319; see /tmp/footyup-dev.log" >&2
exit 1
