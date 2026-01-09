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

// Apply query-cast at the table boundary to break TS deep instantiation:
// supabase.from('api_keys') -> (supabase as any).from('api_keys')
s = s.replace(/\bsupabase\s*\.\s*from\(\s*['"]api_keys['"]\s*\)/g, '(supabase as any).from("api_keys")');

// Also handle double quotes already
s = s.replace(/\bsupabase\s*\.\s*from\(\s*"api_keys"\s*\)/g, '(supabase as any).from("api_keys")');

if (s !== orig) {
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Applied query-cast for api_keys in:", p);
} else {
  console.log("ℹ️  No changes made (api_keys from() not found):", p);
}
NODE
