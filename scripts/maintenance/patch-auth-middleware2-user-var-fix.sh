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

// The injected block used `user` but in this file the variable is `_user`.
// Rewrite `(user as any)` to `(_user as any)` inside the normalization block only.
s = s.replace(/const\s+_user\s*=\s*\{[\s\S]*?\};/m, (block) => {
  return block.replace(/\(user as any\)/g, '(_user as any)');
});

if (s !== orig) {
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Fixed user variable reference in normalization block (user -> _user):", p);
} else {
  console.log("ℹ️  No changes made (normalization block not found):", p);
}
NODE
