#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }

TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then
  echo "Usage: bash scripts/maintenance/safe-trash.sh <path>" >&2
  exit 2
fi

TS=$(date +"%Y%m%d_%H%M%S")
TRASH_DIR=".trash/alexai-trash-${TS}"
mkdir -p "$TRASH_DIR"

if [[ ! -e "$TARGET" ]]; then
  ok "Nothing to move: $TARGET"
  exit 0
fi

# Try fast mv first; if it hangs due to fileprovider, we background and time it out.
warn "Moving $TARGET -> $TRASH_DIR (avoids rm hang)"
(
  mv "$TARGET" "$TRASH_DIR/" 
) &
PID=$!

TIMEOUT=30
for i in $(seq 1 $TIMEOUT); do
  if ! kill -0 "$PID" 2>/dev/null; then
    wait "$PID" || true
    ok "Moved $TARGET"
    exit 0
  fi
  sleep 1
done

warn "Move is taking >${TIMEOUT}s; leaving it in place to avoid terminal hang."
warn "If this keeps happening, check macOS File Provider / cloud sync mounts affecting the repo."
exit 0
