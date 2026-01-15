#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

have(){ command -v "$1" >/dev/null 2>&1; }

# Use GNU coreutils timeout if present; otherwise no timeout.
TIMEOUT_BIN=""
if have gtimeout; then TIMEOUT_BIN="gtimeout"; elif have timeout; then TIMEOUT_BIN="timeout"; fi

# --- config ---
TRASH_DIR=".trash/alexai-trash-$(date +%Y%m%d_%H%M%S)"
# Limit duplicate scan to these dirs (edit as you like)
DUP_SCAN_DIRS=( "app" "lib" "scripts" "types" "components" )

# Exclusions for find (heavy/sync/irrelevant)
FIND_PRUNE=(
  -name node_modules -o
  -name .next -o
  -name .git -o
  -name .trash -o
  -name .press-logs -o
  -name .press-pids -o
  -name .alexai-secrets -o
  -name .pytest_cache -o
  -name dist -o
  -name build -o
  -name out -o
  -name coverage -o
  -name .turbo -o
  -name .vercel -o
  -name ".DS_Store"
)

ensure_trash() { mkdir -p "$TRASH_DIR"; }

move_to_trash_if_exists() {
  local p="$1"
  [[ -e "$p" ]] || return 0
  ensure_trash
  local base; base="$(basename "$p")"
  local dest="$TRASH_DIR/$base"
  warn "Moving $p -> $dest (avoids rm hang)"
  mv -f "$p" "$dest" 2>/dev/null || {
    warn "mv failed, trying cp+rm fallback (may still hang if FS is stuck)"
    cp -a "$p" "$dest" && rm -rf "$p" || true
  }
}

reconcile_duplicate_2_files() {
  say "🧹 Reconciling duplicate ' 2' files (scoped + progress + safe)…"

  local tmp
  tmp="$(mktemp)"
  trap 'rm -f "$tmp" || true' RETURN

  # Build list with find -print0 to handle spaces safely
  for d in "${DUP_SCAN_DIRS[@]}"; do
    [[ -d "$d" ]] || continue
    say "   • scanning: $d"
    # shellcheck disable=SC2016
    find "$d" \
      \( "${FIND_PRUNE[@]}" \) -prune -o \
      -type f -name "* 2.*" -print0 >> "$tmp" || true
  done

  local count=0
  # Process files
  while IFS= read -r -d '' f; do
    count=$((count+1))
    if (( count % 25 == 0 )); then
      say "   …processed $count duplicates so far"
    fi

    # Compute base path: replace " 2." with "."
    local base="${f/ 2./.}"

    # If base exists and files are identical => remove duplicate " 2"
    if [[ -f "$base" ]]; then
      if cmp -s "$f" "$base"; then
        rm -f "$f" || true
      else
        # If not identical, keep both; optionally log
        :
      fi
    else
      # If only the " 2" exists, rename it back
      mv -f "$f" "$base" 2>/dev/null || true
    fi
  done < "$tmp"

  ok "Duplicate reconcile done. Processed $count candidates."
}

run_build_with_timeout() {
  local seconds="${1:-900}"
  if [[ -n "$TIMEOUT_BIN" ]]; then
    warn "Running build (timeout=${seconds}s)…"
    "$TIMEOUT_BIN" "${seconds}"s npm run -s build
  else
    warn "Running build (no timeout available)…"
    npm run -s build
  fi
}

# --- main ---
say "🧼 Repo hygiene: prune → verify → build"

# 1) Avoid rm -rf hangs by moving build artifacts out of the way
move_to_trash_if_exists ".next"

# 2) Reconcile duplicates (scoped)
reconcile_duplicate_2_files

# 3) (Optional) run your TS heal step if it exists
if [[ -x "scripts/maintenance/fix-ts-known-issues.sh" ]]; then
  warn "Running TS known-issues fixer…"
  bash scripts/maintenance/fix-ts-known-issues.sh || true
fi

# 4) Build with timeout so “hangs” become actionable
run_build_with_timeout 900

ok "prune-verify-build complete."
