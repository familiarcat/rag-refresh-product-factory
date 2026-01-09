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

// result.record.* optional fields not present in Row typing: key_prefix, scopes, expires_at
s = s.replace(/\bkey_prefix:\s*result\.record\.key_prefix\s*,/g, 'key_prefix: (result.record as any).key_prefix ?? "",');
s = s.replace(/\bscopes:\s*result\.record\.scopes\s*,/g, 'scopes: (result.record as any).scopes ?? [],');
s = s.replace(/\bexpires_at:\s*result\.record\.expires_at\s*,/g, 'expires_at: (result.record as any).expires_at ?? null,');

// Also guard last_used_at if present
s = s.replace(/\blast_used_at:\s*result\.record\.last_used_at\s*,/g, 'last_used_at: (result.record as any).last_used_at ?? null,');

if (s !== orig) {
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Patched api-keys route result.record optional fields with safe fallbacks:", p);
} else {
  console.log("ℹ️  No changes made (patterns not found):", p);
}
NODE
