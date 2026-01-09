#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

FILE="lib/auth/middleware 2.ts"
if [[ ! -f "$FILE" ]]; then
  echo "❌ Not found: $FILE"
  exit 1
fi

node - <<'NODE'
const fs = require('fs');
const p = 'lib/auth/middleware 2.ts';
let s = fs.readFileSync(p,'utf8');
const orig = s;

// Break TS generic recursion for api_keys queries by casting builder to any.
// Replace supabase.from('api_keys') with (supabase as any).from('api_keys')
s = s.replace(/supabase\s*\.\s*from\(\s*['"]api_keys['"]\s*\)/g, '(supabase as any).from("api_keys")');

// Also handle if chain starts on next line: `await supabase` then `.from('api_keys')`
s = s.replace(/(=\s*await\s+)supabase(\s*\n\s*\.from\(\s*['"]api_keys['"]\s*\))/g, '$1(supabase as any)$2');

if (s !== orig) {
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Cast api_keys query builder to any in:", p);
} else {
  console.log("ℹ️  No changes made (no api_keys from() patterns found):", p);
}
NODE
