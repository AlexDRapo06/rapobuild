#!/usr/bin/env bash
# Cloud Agent environment build: dependencies and the built dashboard. Safe to rerun.
set -euo pipefail
cd "$(dirname "$0")/../.."

# nvm only loads in interactive shells; put the pinned Node toolchain on the default PATH.
NODE_BIN="$HOME/.nvm/versions/node/v22.23.4/bin"
if [ -d "$NODE_BIN" ]; then
  for tool in node npm npx corepack pnpm; do
    [ -e "$NODE_BIN/$tool" ] && sudo ln -sf "$NODE_BIN/$tool" "/usr/local/bin/$tool"
  done
fi

pnpm install --frozen-lockfile
pnpm admin:build
