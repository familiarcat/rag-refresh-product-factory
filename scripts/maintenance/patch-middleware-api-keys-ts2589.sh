#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

FILE="lib/auth/middleware.ts"
[[ -f "$FILE" ]] || err "Not found: $FILE (adjust script if your file name differs, e.g. 'middleware 2.ts')"

BACKUP_DIR=".patch-backups/middleware_api_keys_ts2589_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp "$FILE" "$BACKUP_DIR/$(basename "$FILE").bak"

node - <<'NODE'
const fs = require('fs');

const file = 'lib/auth/middleware.ts';
let s = fs.readFileSync(file,'utf8');
const orig = s;

// 1) Break Supabase generic inference at the api_keys boundary.
// Handles BOTH patterns:
//   await supabase
//     .from('api_keys')
// and
//   await supabase.from('api_keys')
//
// We only touch api_keys to keep the patch minimal.
s = s.replace(/await\s+supabase(\s*)\n(\s*)\.from\(\s*['"]api_keys['"]\s*\)/g,
              'await (supabase as any)$1\n$2.from("api_keys")');
s = s.replace(/\bsupabase\s*\.\s*from\(\s*['"]api_keys['"]\s*\)/g,
              '(supabase as any).from("api_keys")');

// 2) If destructuring is used, keep it the same; we don't change select/eq chain.
// This cast is runtime-neutral and fixes TS2589 in middleware/auth code.
if (s !== orig) {
  fs.writeFileSync(file, s, 'utf8');
  console.log('patched:', file);
} else {
  console.log('no-op:', file, '(api_keys from() pattern not found)');
}
NODE

ok "Applied TS2589 query-boundary cast in $FILE"
ok "Backup saved in $BACKUP_DIR"
