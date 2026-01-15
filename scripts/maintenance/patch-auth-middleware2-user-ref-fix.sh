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

// Fix: inline return wrapper should reference `user` variable, not `_user` (which doesn't exist in this scope).
// Replace occurrences of `(_user as any)` with `(user as any)` within the `user:` return object line.
s = s.replace(/user:\s*\(\{\s*user_id:\s*\(\(_user as any\)\?\.\s*user_id\s*\?\?\s*""\)\s*,\s*\.\.\.\(_user as any\)\s*\}\s*as any\)\s*,/g,
              'user: ({ user_id: ((user as any)?.user_id ?? ""), ...(user as any) } as any),');

// Also handle the variant produced in your screenshot: `user: ({ user_id: ((_user as any)?.user_id ?? ""), ...(_user as any) } as any),`
s = s.replace(/\(\(_user as any\)\?\.\s*user_id/g, '((user as any)?.user_id');
s = s.replace(/\.\.\.\(_user as any\)/g, '...(user as any)');

if (s !== orig) {
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Fixed user normalization return to reference `user` (not `_user`):", p);
} else {
  console.log("ℹ️  No changes made (pattern not found):", p);
}
NODE
