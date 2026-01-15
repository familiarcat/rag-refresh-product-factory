#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

TIMEOUT_SECS="${1:-900}"
TS="$(date +%Y%m%d_%H%M%S)"
mkdir -p .trash

if [[ -e ".next" ]]; then
  warn "Moving .next -> .trash/next-$TS (avoids rm hang)"
  mv .next ".trash/next-$TS" 2>/dev/null || true
fi

warn "Running build (timeout=${TIMEOUT_SECS}s)..."
if command -v gtimeout >/dev/null 2>&1; then
  gtimeout "$TIMEOUT_SECS" npm run -s build || err "Build timed out or failed"
elif command -v timeout >/dev/null 2>&1; then
  timeout "$TIMEOUT_SECS" npm run -s build || err "Build timed out or failed"
else
  warn "No timeout command found. Install coreutils: brew install coreutils"
  npm run -s build
fi
ok "Build complete."
