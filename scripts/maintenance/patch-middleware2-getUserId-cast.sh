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

// Fix: authResult.user.id inferred as unknown. Cast to string safely.
s = s.replace(/authResult\.success\s*\?\s*authResult\.user\?\.id\s*:\s*null/g,
              'authResult.success ? (authResult.user as any)?.id?.toString?.() ?? null : null');

// Also handle without optional chaining
s = s.replace(/authResult\.success\s*\?\s*authResult\.user\.id\s*:\s*null/g,
              'authResult.success ? (authResult.user as any)?.id?.toString?.() ?? null : null');

if (s !== orig) {
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Patched getUserId() to cast user.id to string:", p);
} else {
  console.log("ℹ️  No changes made (pattern not found):", p);
}
NODE
