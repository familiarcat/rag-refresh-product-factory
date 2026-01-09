#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

FILE="app/api/auth/api-keys/route.ts"
if [[ ! -f "$FILE" ]]; then
  echo "❌ Not found: $FILE"
  exit 1
fi

node - <<'NODE'
const fs = require('fs');
const p = 'app/api/auth/api-keys/route.ts';
let s = fs.readFileSync(p,'utf8');
const orig = s;

// Fix `result.record.name` to match schema `label`
s = s.replace(/\bname:\s*result\.record\.name\s*,/g, 'name: (result.record as any).name ?? (result.record as any).label ?? "",');
// Also rewrite any other access patterns if present
s = s.replace(/\bresult\.record\.name\b/g, '(result.record as any).name ?? (result.record as any).label');

if (s !== orig) {
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Patched api-keys route result.record.name -> label fallback:", p);
} else {
  console.log("ℹ️  No changes made (pattern not found):", p);
}
NODE
