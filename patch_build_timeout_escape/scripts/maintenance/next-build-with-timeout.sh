#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

DEFAULT_TIMEOUT=900
TIMEOUT_SECS="$DEFAULT_TIMEOUT"
MODE="turbopack"  # or "webpack"

usage(){
  cat <<EOF
next-build-with-timeout.sh

Runs a Next.js production build with a HARD timeout and clean Ctrl+C behavior.

Usage:
  bash scripts/maintenance/next-build-with-timeout.sh [timeoutSeconds] [--webpack]

Examples:
  bash scripts/maintenance/next-build-with-timeout.sh
  bash scripts/maintenance/next-build-with-timeout.sh 900
  bash scripts/maintenance/next-build-with-timeout.sh 1200 --webpack
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ "${1:-}" =~ ^[0-9]+$ ]]; then
  TIMEOUT_SECS="$1"
  shift
fi

if [[ "${1:-}" == "--webpack" ]]; then
  MODE="webpack"
  shift
fi

if [[ $# -gt 0 ]]; then
  usage
  err "Unknown args: $*"
fi

# Prefer a consistent root (you have a pnpm-lock one directory up that confuses Next)
# If you have next.config, set turbopack.root there; this env helps avoid surprises.
export NEXT_TELEMETRY_DISABLED=1

# --- Decide build command ---
# Next doesn't have a stable cross-version CLI flag to disable Turbopack. The most reliable
# approach is to set NEXT_DISABLE_TURBOPACK=1 (supported in recent Next) and fall back
# to plain next build.
BUILD_CMD=(npm run -s build)

if [[ "$MODE" == "webpack" ]]; then
  export NEXT_DISABLE_TURBOPACK=1
  ok "Forcing Webpack build via NEXT_DISABLE_TURBOPACK=1"
else
  unset NEXT_DISABLE_TURBOPACK || true
fi

# --- Helper: kill an entire process group ---
kill_group(){
  local pgid="$1"
  [[ -z "$pgid" ]] && return 0
  # TERM then KILL after a short grace
  kill -TERM "-$pgid" 2>/dev/null || true
  sleep 2
  kill -KILL "-$pgid" 2>/dev/null || true
}

# --- Run build in its own process group so we can kill the whole tree ---
PGID=""
cleanup(){
  if [[ -n "${PGID:-}" ]]; then
    warn "Stopping build process group (pgid=$PGID)..."
    kill_group "$PGID"
  fi
}
trap cleanup INT TERM

# Clearing .next is optional; your fileprovider mounts can cause rm/mv hangs.
# If .next exists and you want a clean build, prefer moving with a timeout:
#   bash scripts/maintenance/safe-trash.sh .next

say "⏱  Running Next build (timeout=${TIMEOUT_SECS}s, mode=${MODE})..."

# Start a new process group using setsid if available; fallback to bash job control.
if command -v setsid >/dev/null 2>&1; then
  # setsid makes the child its own process group; the PGID == child's PID
  setsid "${BUILD_CMD[@]}" &
  CHILD_PID=$!
  PGID="$CHILD_PID"
else
  # Fallback: start in background; we'll treat PID as PGID (usually ok, but not perfect)
  ( "${BUILD_CMD[@]}" ) &
  CHILD_PID=$!
  PGID="$CHILD_PID"
fi

# --- Timeout loop with progress heartbeat ---
START=$(date +%s)
LAST_HEARTBEAT=$START

while kill -0 "$CHILD_PID" 2>/dev/null; do
  NOW=$(date +%s)
  ELAPSED=$((NOW-START))
  if (( ELAPSED >= TIMEOUT_SECS )); then
    warn "Build exceeded ${TIMEOUT_SECS}s. Killing process tree..."
    cleanup
    err "Build timed out"
  fi

  # Heartbeat every 30s so it never looks "stuck" even if Next is quiet.
  if (( NOW - LAST_HEARTBEAT >= 30 )); then
    say "… still running (${ELAPSED}s elapsed)"
    LAST_HEARTBEAT=$NOW
  fi

  sleep 1
done

wait "$CHILD_PID" || {
  CODE=$?
  err "Build failed (exit code $CODE)"
}

ok "Build completed successfully."
