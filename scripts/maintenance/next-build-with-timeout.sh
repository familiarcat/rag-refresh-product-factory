#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

DURATION_SECONDS="${1:-900}"   # default 15 minutes

# Prefer gtimeout on macOS (coreutils), else timeout (Linux).
TIMEOUT_BIN=""
if command -v gtimeout >/dev/null 2>&1; then
  TIMEOUT_BIN="gtimeout"
elif command -v timeout >/dev/null 2>&1; then
  TIMEOUT_BIN="timeout"
fi

# Always try to avoid deleting .next if rm hangs on your machine.
# Move it out of the way instead (fast), then clean later.
TS=$(date +"%Y%m%d_%H%M%S")
TRASH_DIR=".trash/alexai-trash-$TS"
mkdir -p "$TRASH_DIR" .trash || true

if [ -d .next ]; then
  warn "Moving .next -> $TRASH_DIR/.next (avoids rm hang)"
  mv .next "$TRASH_DIR/.next" || true
fi

warn "Running Next build (timeout=${DURATION_SECONDS}s)..."
if [ -n "$TIMEOUT_BIN" ]; then
  "$TIMEOUT_BIN" "$DURATION_SECONDS" npm run -s build
else
  warn "No timeout binary found. Install coreutils on macOS for gtimeout: brew install coreutils"
  npm run -s build
fi

ok "Build finished."
