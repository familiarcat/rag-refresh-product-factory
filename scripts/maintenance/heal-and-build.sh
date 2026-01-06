#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

usage(){
  cat <<'EOF'
Usage:
  bash scripts/maintenance/heal-and-build.sh --build
  bash scripts/maintenance/heal-and-build.sh --clean-only

What it does:
- Cleans .next safely even if rm -rf hangs (moves it aside first)
- Kills stuck Next/Turbopack processes for this repo
- Runs next build with a heartbeat so "hangs" are visible
- Retries build once if it appears stuck (no output)
EOF
}

MODE="${1:-}"
[[ "$MODE" == "--build" || "$MODE" == "--clean-only" ]] || { usage; exit 2; }

# --- helpers ---
kill_next_procs() {
  # Only best-effort; don't fail if none found.
  warn "Killing potentially stuck Next/Turbopack processes (best-effort)..."
  # kill processes that often lock .next; keep it broad but safe
  pkill -f "next dev" >/dev/null 2>&1 || true
  pkill -f "next build" >/dev/null 2>&1 || true
  pkill -f "turbopack" >/dev/null 2>&1 || true
  pkill -f "node .*next" >/dev/null 2>&1 || true
  pkill -f "node .*turbopack" >/dev/null 2>&1 || true
  ok "Process cleanup done."
}

safe_clear_next() {
  local ts trash=".trash"
  ts="$(date +%Y%m%d_%H%M%S)"
  mkdir -p "$trash"

  if [[ -d ".next" ]]; then
    warn "Safely clearing .next (move-then-delete)..."
    local moved="$trash/.next_$ts"
    # Move is usually instant even if rm -rf would hang.
    mv ".next" "$moved" 2>/dev/null || true

    # Now delete moved dir in background; don't block.
    ( rm -rf "$moved" >/dev/null 2>&1 || true ) & disown || true
    ok ".next moved to $moved and scheduled for deletion."
  else
    ok "No .next directory found."
  fi
}

heartbeat_build() {
  # Run build but ensure we see progress; if no output for N seconds, treat as stuck.
  local timeout_no_output=120   # seconds without output => stuck
  local max_total=1800          # hard ceiling 30min (won't block forever)
  local log=".press-logs/next_build_$(date +%Y%m%d_%H%M%S).log"
  mkdir -p ".press-logs"

  warn "Running Next build with heartbeat..."
  say "📝 Logging to: $log"

  # Start build in background, capture output to log + console
  # Use stdbuf to reduce buffering where available; macOS may not have GNU stdbuf.
  ( npm run -s build 2>&1 | tee "$log" ) &
  local pid=$!

  local start now last_out last_size size
  start="$(date +%s)"
  last_out="$start"
  last_size=0

  while kill -0 "$pid" >/dev/null 2>&1; do
    sleep 2
    now="$(date +%s)"

    # file size as proxy for output progress
    if [[ -f "$log" ]]; then
      size="$(wc -c < "$log" | tr -d ' ')"
    else
      size=0
    fi

    if [[ "$size" -gt "$last_size" ]]; then
      last_size="$size"
      last_out="$now"
    fi

    # heartbeat line every ~10s
    if (( (now - start) % 10 == 0 )); then
      say "⏳ build running... elapsed=$((now-start))s  last_output=$((now-last_out))s_ago"
    fi

    # stuck detector
    if (( now - last_out > timeout_no_output )); then
      warn "No build output for >${timeout_no_output}s — treating as stuck. Killing build PID=$pid"
      kill -TERM "$pid" >/dev/null 2>&1 || true
      sleep 3
      kill -KILL "$pid" >/dev/null 2>&1 || true
      return 124
    fi

    # hard ceiling
    if (( now - start > max_total )); then
      warn "Build exceeded hard ceiling (${max_total}s). Killing build PID=$pid"
      kill -TERM "$pid" >/dev/null 2>&1 || true
      sleep 3
      kill -KILL "$pid" >/dev/null 2>&1 || true
      return 124
    fi
  done

  wait "$pid"
}

# --- main ---
kill_next_procs
safe_clear_next

if [[ "$MODE" == "--clean-only" ]]; then
  ok "Clean-only complete."
  exit 0
fi

# First attempt
if heartbeat_build; then
  ok "Build succeeded."
  exit 0
fi

rc=$?
warn "Build attempt 1 ended with code $rc. Retrying once after another cleanup..."
kill_next_procs
safe_clear_next

if heartbeat_build; then
  ok "Build succeeded on retry."
  exit 0
fi

err "Build failed after retry. Check the latest log in .press-logs/next_build_*.log"
