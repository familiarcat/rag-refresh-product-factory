#!/usr/bin/env bash
set -euo pipefail

# Minimal shell wrapper:
# - Ensure .env.local exists (TS-driven)
# - Source it for shell-based deploy scripts

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

ENV_LOCAL="$PROJECT_ROOT/.env.local"

# Ensure .env.local exists using TypeScript script runner
if [[ ! -f "$ENV_LOCAL" ]]; then
  if command -v pnpm >/dev/null 2>&1; then
    pnpm -s script:secrets:ensure >/dev/null 2>&1 || true
  else
    npx -y tsx scripts/ts/secrets/ensure-env.ts >/dev/null 2>&1 || true
  fi
fi

if [[ -f "$ENV_LOCAL" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_LOCAL"
  set +a
fi
