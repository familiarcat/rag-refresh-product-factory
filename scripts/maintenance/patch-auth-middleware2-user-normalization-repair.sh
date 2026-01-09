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

// Remove the previously injected self-referential block `const _user = { ... (_user as any) ... }`
// and replace it with a safe normalization that does NOT reference itself.
// We only operate if we see the "AlexAI patch: normalize user profile" marker.
const marker = /\/\/ AlexAI patch: normalize user profile[\s\S]*?\n/;
if (!marker.test(s)) {
  console.log("ℹ️  Normalization marker not found; no changes made.");
  process.exit(0);
}

// Delete the injected block up to the `return {` that follows it.
s = s.replace(/\/\/ AlexAI patch: normalize user profile[\s\S]*?\n\s*return\s*\{/m, 'return {');

// Now, inside the success return object, replace `user: _user as any` (or similar) with a safe inline user object.
// Prefer existing `_user` in scope, but do not reference it before declaration: we only wrap at the point of return.
// This avoids top-of-function injections.
s = s.replace(/\buser\s*:\s*_user\s+as\s+any\s*,/g,
  'user: ({ user_id: ((_user as any)?.user_id ?? ""), ...(_user as any) } as any),');

if (s !== orig) {
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Repaired middleware 2 user normalization (no self-reference, applied at return):", p);
} else {
  console.log("ℹ️  No changes made.");
}
NODE
