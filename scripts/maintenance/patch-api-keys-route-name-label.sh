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

// Fix: ApiKey Row has `label` not `name` (per Database typing). Use label with safe fallback.
s = s.replace(/name:\s*key\.name\s*,/g, 'name: (key as any).name ?? (key as any).label ?? "",');

// Also fix any other direct key.name usages in object literals (best-effort)
s = s.replace(/\bkey\.name\b/g, '(key as any).name ?? (key as any).label');

if (s !== orig) {
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Patched api-keys route to use label instead of name:", p);
} else {
  console.log("ℹ️  No changes made (no key.name found):", p);
}
NODE
