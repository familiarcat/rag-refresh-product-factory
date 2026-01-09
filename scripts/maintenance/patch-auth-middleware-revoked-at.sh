#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

FILE="lib/auth/middleware.ts"
if [[ ! -f "$FILE" ]]; then
  echo "❌ Not found: $FILE"
  exit 1
fi

node - <<'NODE'
const fs = require('fs');
const p = 'lib/auth/middleware.ts';
let s = fs.readFileSync(p,'utf8');
const orig = s;

// Guard revoked_at reads (schema typing may not include it)
s = s.replace(/\bapiKeyData\.revoked_at\b/g, '(apiKeyData as any).revoked_at');

// Also guard expires_at if referenced similarly (optional safety)
s = s.replace(/\bapiKeyData\.expires_at\b/g, '(apiKeyData as any).expires_at');

if (s !== orig) {
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Patched auth middleware apiKeyData revoked_at/expires_at to any-cast:", p);
} else {
  console.log("ℹ️  No changes made (apiKeyData.revoked_at not found):", p);
}
NODE
