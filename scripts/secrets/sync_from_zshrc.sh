#!/usr/bin/env bash
set -euo pipefail

# Minimal shell wrapper: run TS sync (reads from process.env)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

if command -v pnpm >/dev/null 2>&1; then
  pnpm -s script:secrets:sync >/dev/null
else
  npx -y tsx scripts/ts/secrets/sync-from-shell.ts >/dev/null
fi
