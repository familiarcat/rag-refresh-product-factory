#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

FILE="lib/auth/api-keys.ts"
if [[ ! -f "$FILE" ]]; then
  echo "❌ Not found: $FILE"
  exit 1
fi

node - <<'NODE'
const fs = require('fs');
const p = 'lib/auth/api-keys.ts';
let s = fs.readFileSync(p,'utf8');
const orig = s;

// We break TS instantiation blowups by casting the query builder to `any`
// ONLY for api_keys table queries (surgical).
// Replace `.from('api_keys')` with `((supabase as any).from('api_keys'))` when used in a chain.
s = s.replace(/(\bawait\s+)?supabase\s*\.\s*from\(\s*['"]api_keys['"]\s*\)/g, (m) => m.replace('supabase.from', '(supabase as any).from'));

// Also handle cases like `const { data, error } = await supabase` newline `.from('api_keys')`
s = s.replace(/(\{\s*data\s*,\s*error\s*\}\s*=\s*await\s+)supabase(\s*\n\s*\.from\(\s*['"]api_keys['"]\s*\))/g,
              '$1(supabase as any)$2');

// If file already contains `(supabase as any)` we keep as-is.
if (s !== orig) {
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Cast supabase api_keys query builder to any to avoid deep instantiation:", p);
} else {
  console.log("ℹ️  No changes made (no api_keys from() patterns found):", p);
}
NODE
