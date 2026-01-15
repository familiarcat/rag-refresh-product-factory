#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

FILE="lib/supabase.ts"
if [[ ! -f "$FILE" ]]; then
  echo "❌ Not found: $FILE"
  exit 1
fi

node - <<'NODE'
const fs = require('fs');

const p = 'lib/supabase.ts';
let s = fs.readFileSync(p,'utf8');
const orig = s;

// 1) Ensure supabaseServer is exported if declared as const/let
s = s.replace(/^(\s*)(const|let)\s+supabaseServer\s*=/m, '$1export $2 supabaseServer =');

// 2) Ensure supabaseBrowser is exported if declared as const/let
s = s.replace(/^(\s*)(const|let)\s+supabaseBrowser\s*=/m, '$1export $2 supabaseBrowser =');

// 3) If file declares `const supabaseServer` in a different style, also handle `function supabaseServer` (unlikely)
 // no-op otherwise

// 4) As a safety net: if it declares `const supabaseServer` *and* later tries to `export { ... }`, avoid double-export.
// (TypeScript allows `export const` plus named export list; but we keep it simple.)

if (s !== orig) {
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Exported supabaseServer/supabaseBrowser from", p);
} else {
  console.log("ℹ️  No changes needed (supabaseServer/supabaseBrowser already exported?)", p);
}
NODE
