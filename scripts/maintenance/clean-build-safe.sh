#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }

MODE="${1:-webpack}"   # "webpack" or "turbopack"
ts="$(date +%Y%m%d_%H%M%S)"
TRASH_DIR=".trash/alexai-trash-${ts}"

mkdir -p "$TRASH_DIR"

warn "Stopping any Next/Turbo processes that may hold .next open..."
# Be a bit aggressive; failing to kill just means nothing matched.
pkill -f "next dev"        2>/dev/null || true
pkill -f "next start"      2>/dev/null || true
pkill -f "next build"      2>/dev/null || true
pkill -f "turbopack"       2>/dev/null || true
pkill -f "node.*next"      2>/dev/null || true

# Extra: if something still has .next open, show it (doesn't fail build)
if command -v lsof >/dev/null 2>&1; then
  warn "Checking for open file handles under .next (if any)..."
  lsof +D ".next" 2>/dev/null | head -n 20 || true
fi

warn "Moving build artifacts aside (avoids rm/rmdir hangs + ENOTEMPTY)..."
if [[ -d ".next" ]]; then
  mv ".next" "$TRASH_DIR/.next" || true
  ok "Moved .next -> $TRASH_DIR/.next"
fi
if [[ -d ".turbo" ]]; then
  mv ".turbo" "$TRASH_DIR/.turbo" || true
  ok "Moved .turbo -> $TRASH_DIR/.turbo"
fi

warn "Running production build (mode=$MODE)..."
if [[ "$MODE" == "webpack" ]]; then
  export NEXT_DISABLE_TURBOPACK=1
  next build --webpack
else
  # turbopack mode
  unset NEXT_DISABLE_TURBOPACK || true
  next build
fi

ok "Build complete."
