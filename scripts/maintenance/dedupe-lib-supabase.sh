#!/usr/bin/env bash
set -euo pipefail

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

targets=(
  "lib/supabase.ts"
  "lib/supabase 2.ts"
  "lib/supabase2.ts"
)

for f in "${targets[@]}"; do
  if [[ -f "$f" ]]; then
    rm -f "$f"
    ok "Removed duplicate: $f"
  fi
done

# Clean obvious trash duplicates (non-destructive if absent)
if [[ -d ".trash" ]]; then
  find ".trash" -type f \( -name "supabase.ts" -o -name "supabase 2.ts" -o -name "supabase2.ts" -o -name "supabase-server.ts" -o -name "supabase-browser.ts" \) -print 2>/dev/null || true
  # Do NOT remove server/browser from trash automatically; only remove classic duplicates
  find ".trash" -type f \( -name "supabase.ts" -o -name "supabase 2.ts" -o -name "supabase2.ts" \) -exec rm -f {} \; 2>/dev/null || true
  ok "Cleaned duplicate supabase files under .trash (if any)"
else
  warn "No .trash directory (skipping)"
fi

# Safety check: ensure canonical files exist or will exist after patch overlay
if [[ -f "lib/supabase-server.ts" ]]; then ok "Found lib/supabase-server.ts"; else warn "lib/supabase-server.ts not present yet (ok if patch not applied)"; fi
if [[ -f "lib/supabase-browser.ts" ]]; then ok "Found lib/supabase-browser.ts"; else warn "lib/supabase-browser.ts not present yet (ok if patch not applied)"; fi
