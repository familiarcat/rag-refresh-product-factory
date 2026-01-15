#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
warn(){ say "⚠️  $*"; }
ok(){ say "✅ $*"; }
err(){ say "❌ $*"; exit 1; }

TARGET="${1:-}"
TIMEOUT_SECS="${2:-30}"

[[ -z "$TARGET" ]] && err "Usage: safe-trash.sh <path> [timeout_seconds]"
[[ ! -e "$TARGET" ]] && { warn "Not found: $TARGET"; exit 0; }

mkdir -p .trash
TS="$(date +%Y%m%d_%H%M%S)"
BASE="$(basename "$TARGET")"
DEST=".trash/${BASE}_${TS}"

# Move in a separate process group so we can kill it if it hangs.
( setsid mv "$TARGET" "$DEST" ) &
PID=$!

time_left="$TIMEOUT_SECS"
while kill -0 "$PID" 2>/dev/null; do
  if (( time_left <= 0 )); then
    warn "Move timed out after ${TIMEOUT_SECS}s. Killing mv process tree..."
    kill -TERM "-$PID" 2>/dev/null || true
    sleep 1
    kill -KILL "-$PID" 2>/dev/null || true
    err "Move hung. Investigate fileproviderd/iCloud mounts for: $TARGET"
  fi
  sleep 1
  time_left=$((time_left-1))
done

wait "$PID" || true
ok "Moved ${TARGET} -> ${DEST}"
