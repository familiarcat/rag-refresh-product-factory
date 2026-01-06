#!/usr/bin/env bash
set -euo pipefail

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
err(){ say "❌ $*"; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# 1) No duplicates
if [[ -f "lib/supabase.ts" || -f "lib/supabase 2.ts" || -f "lib/supabase2.ts" ]]; then
  err "Duplicate supabase file exists in lib/. Run scripts/maintenance/dedupe-lib-supabase.sh"
fi
ok "No duplicate lib/supabase*.ts files."

# 2) Canonical files exist
[[ -f "lib/supabase-server.ts" ]] || err "Missing lib/supabase-server.ts"
[[ -f "lib/supabase-browser.ts" ]] || err "Missing lib/supabase-browser.ts"
ok "Canonical lib clients exist."

# 3) No legacy import remains
if rg -n "from ['\"]@/lib/supabase['\"]" app lib components 2>/dev/null; then
  err "Legacy import '@/lib/supabase' still present. Run fix-imports-supabase.sh or update manually."
fi
ok "No legacy '@/lib/supabase' imports found."
