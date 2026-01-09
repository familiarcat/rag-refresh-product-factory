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

// Guard result.record.key_prefix (not in ApiKey Row typing)
s = s.replace(/\bresult\.record\.key_prefix\b/g, '(result.record as any).key_prefix');

// Guard result.record.scopes too (often missing)
s = s.replace(/\bresult\.record\.scopes\b/g, '(result.record as any).scopes');

if (s !== orig) {
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Patched api-keys lib result.record key_prefix/scopes to any-cast:", p);
} else {
  console.log("ℹ️  No changes made (patterns not found):", p);
}
NODE
