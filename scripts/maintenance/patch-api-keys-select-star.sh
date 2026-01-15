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

// Supabase type-instantiation blowups often happen with select('*') on large Database types.
// Replace select('*') used on api_keys queries with explicit columns.
const cols = "id,user_id,api_key_hash,label,created_at,revoked_at";

s = s.replace(/(\.from\(\s*['"]api_keys['"]\s*\)[\s\S]{0,120}?\.\s*select\()\s*['"]\*['"]\s*(\))/g,
              `$1'${cols}'$2`);

// Also catch plain `.select('*')` (best-effort) and replace if file contains from('api_keys')
if (s.includes(".from('api_keys'") || s.includes('.from("api_keys"')) {
  s = s.replace(/\.select\(\s*['"]\*['"]\s*\)/g, `.select('${cols}')`);
}

if (s !== orig) {
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Replaced select('*') with explicit columns in:", p);
} else {
  console.log("ℹ️  No changes made (select('*') not found):", p);
}
NODE
