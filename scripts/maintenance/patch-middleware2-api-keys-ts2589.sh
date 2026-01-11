#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

# We’ve seen this repo sometimes has "middleware.ts" and "middleware 2.ts".
CANDIDATES=(
  "lib/auth/middleware.ts"
  "lib/auth/middleware 2.ts"
  "lib/auth/middleware2.ts"
)

TARGET=""
for f in "${CANDIDATES[@]}"; do
  if [[ -f "$f" ]]; then TARGET="$f"; break; fi
done
[[ -n "$TARGET" ]] || err "Could not find middleware file. Looked for: ${CANDIDATES[*]}"

BACKUP_DIR=".patch-backups/middleware2_api_keys_ts2589_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp "$TARGET" "$BACKUP_DIR/$(basename "$TARGET").bak"

node - <<'NODE'
const fs = require('fs');

const candidates = ['lib/auth/middleware.ts','lib/auth/middleware 2.ts','lib/auth/middleware2.ts'];
const file = candidates.find(f => fs.existsSync(f));
if (!file) { console.error('no middleware file found'); process.exit(1); }

let s = fs.readFileSync(file,'utf8');
const orig = s;

// Break Supabase generic inference at the api_keys boundary (TS2589).
// Convert:
//   await supabase.from('api_keys')...
//   await supabase\n  .from('api_keys')...
// to:
//   await (supabase as any).from("api_keys")...
s = s.replace(/await\s+supabase(\s*)\n(\s*)\.from\(\s*['"]api_keys['"]\s*\)/g,
              'await (supabase as any)$1\n$2.from("api_keys")');
s = s.replace(/\bawait\s+supabase\s*\.\s*from\(\s*['"]api_keys['"]\s*\)/g,
              'await (supabase as any).from("api_keys")');

// Also handle non-awaited occurrences (rare, but safe)
s = s.replace(/\bsupabase\s*\.\s*from\(\s*['"]api_keys['"]\s*\)/g,
              '(supabase as any).from("api_keys")');

if (s !== orig) {
  fs.writeFileSync(file, s, 'utf8');
  console.log('patched:', file);
} else {
  console.log('no-op:', file, '(api_keys from() pattern not found)');
}
NODE

ok "Applied TS2589 query-boundary cast in $TARGET"
ok "Backup saved in $BACKUP_DIR"
