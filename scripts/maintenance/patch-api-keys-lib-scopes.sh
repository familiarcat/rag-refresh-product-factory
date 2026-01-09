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

// Patch hasScope to tolerate missing scopes on ApiKey row typing.
// Replace `apiKey.scopes.includes(scope)` with safe fallback.
s = s.replace(/return\s+apiKey\.scopes\.includes\(\s*scope\s*\)\s*;/g,
              'return (((apiKey as any).scopes ?? []) as string[]).includes(scope);');

// Also guard other direct `apiKey.scopes` reads if they exist
s = s.replace(/\bapiKey\.scopes\b/g, '((apiKey as any).scopes ?? [])');

if (s !== orig) {
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Patched ApiKey scopes access to be optional-safe in:", p);
} else {
  console.log("ℹ️  No changes made (apiKey.scopes not found):", p);
}
NODE
