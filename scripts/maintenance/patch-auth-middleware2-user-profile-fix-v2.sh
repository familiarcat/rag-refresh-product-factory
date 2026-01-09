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

// If previous patch injected apiKeyData reference but apiKeyData is not in scope, remove it.
// Replace `(apiKeyData as any)?.user_id ?? (user as any)?.user_id ?? ''` with `(user as any)?.user_id ?? ''`
s = s.replace(/\(apiKeyData as any\)\?\.[A-Za-z0-9_]+\s*\?\?\s*\(user as any\)\?\.[A-Za-z0-9_]+\s*\?\?\s*''/g,
              '(user as any)?.user_id ?? ""');

// Also handle exact string we injected
s = s.replace(/\(apiKeyData as any\)\?\.[A-Za-z0-9_]+\s*\?\?\s*\(user as any\)\?\.[A-Za-z0-9_]+\s*\?\?\s*""/g,
              '(user as any)?.user_id ?? ""');

// In case we used user_id property name directly
s = s.replace(/\(apiKeyData as any\)\?\.\s*user_id\s*\?\?\s*\(user as any\)\?\.\s*user_id\s*\?\?\s*''/g,
              '(user as any)?.user_id ?? ""');

if (s !== orig) {
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Removed out-of-scope apiKeyData reference in user profile normalization:", p);
} else {
  console.log("ℹ️  No changes made (apiKeyData reference not found):", p);
}
NODE
