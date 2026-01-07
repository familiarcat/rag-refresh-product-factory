#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

TIMEOUT_SECONDS="${1:-900}"   # default 15m
HEARTBEAT_SECONDS="${2:-15}"  # default 15s

# Use gtimeout if available (brew coreutils), else node fallback.
TIMEOUT_BIN=""
if command -v gtimeout >/dev/null 2>&1; then
  TIMEOUT_BIN="gtimeout"
elif command -v timeout >/dev/null 2>&1; then
  TIMEOUT_BIN="timeout"
fi

# Start heartbeat in background so hangs are visible.
heartbeat() {
  local i=0
  while true; do
    i=$((i+HEARTBEAT_SECONDS))
    warn "TS Heal: build still running... (${i}s elapsed)"
    sleep "$HEARTBEAT_SECONDS"
  done
}

# Ensure we always cleanup heartbeat + child process
HB_PID=""
BUILD_PID=""

cleanup() {
  set +e
  if [[ -n "${HB_PID:-}" ]] && kill -0 "$HB_PID" >/dev/null 2>&1; then kill "$HB_PID" >/dev/null 2>&1; fi
  if [[ -n "${BUILD_PID:-}" ]] && kill -0 "$BUILD_PID" >/dev/null 2>&1; then
    warn "Killing stuck build process PID=$BUILD_PID"
    kill -TERM "$BUILD_PID" >/dev/null 2>&1
    sleep 2
    kill -KILL "$BUILD_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

# Prefer "rm -rf .next" but don’t block on it
if [[ -d ".next" ]]; then
  warn "Moving .next to trash (avoid rm hang)…"
  ts="$(date +%Y%m%d_%H%M%S)"
  mkdir -p ".trash"
  mv ".next" ".trash/.next_${ts}" 2>/dev/null || true
fi

warn "Running Next build (timeout=${TIMEOUT_SECONDS}s)…"
heartbeat & HB_PID=$!

# Run build with timeout + capture output.
# Important: run in its own process group so timeout can kill it reliably.
if [[ -n "$TIMEOUT_BIN" ]]; then
  set +e
  "$TIMEOUT_BIN" --preserve-status --kill-after=10s "${TIMEOUT_SECONDS}s" bash -lc "npm run -s build" &
  BUILD_PID=$!
  wait "$BUILD_PID"
  code=$?
  set -e
else
  # Node fallback timeout (works without coreutils)
  set +e
  node - <<NODE
const { spawn } = require("child_process");

const timeoutMs = ${TIMEOUT_SECONDS} * 1000;
const child = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run","-s","build"], {
  stdio: "inherit",
  detached: true
});

const t = setTimeout(() => {
  console.error("❌ Build timed out after ${TIMEOUT_SECONDS}s");
  try { process.kill(-child.pid, "SIGTERM"); } catch {}
  setTimeout(() => {
    try { process.kill(-child.pid, "SIGKILL"); } catch {}
    process.exit(124);
  }, 5000);
}, timeoutMs);

child.on("exit", (code, sig) => {
  clearTimeout(t);
  if (sig) process.exit(124);
  process.exit(code ?? 1);
});
NODE
  code=$?
  set -e
fi

if [[ "${code:-0}" -ne 0 ]]; then
  err "Build failed or timed out (exit=${code}). See output above."
fi

ok "Build completed."
