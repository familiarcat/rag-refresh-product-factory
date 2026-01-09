#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

FILE="lib/auth/middleware 2.ts"
if [[ ! -f "$FILE" ]]; then
  echo "❌ Not found: $FILE"
  echo "Tip: list duplicates with: ls -la lib/auth | rg \"middleware\""
  exit 1
fi

node - <<'NODE'
const fs = require('fs');
const p = 'lib/auth/middleware 2.ts';
let s = fs.readFileSync(p,'utf8');
const orig = s;

// Guard revoked_at/expires_at reads that trigger SelectQueryError typing blowups
s = s.replace(/\bapiKeyData\.revoked_at\b/g, '(apiKeyData as any).revoked_at');
s = s.replace(/\bapiKeyData\.expires_at\b/g, '(apiKeyData as any).expires_at');

// Also guard alternative casing if present
s = s.replace(/\bapiKeyData\.revokedAt\b/g, '(apiKeyData as any).revokedAt ?? (apiKeyData as any).revoked_at');
s = s.replace(/\bapiKeyData\.expiresAt\b/g, '(apiKeyData as any).expiresAt ?? (apiKeyData as any).expires_at');

if (s !== orig) {
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Patched revoked_at/expires_at to any-cast in:", p);
} else {
  console.log("ℹ️  No changes made (patterns not found):", p);
}
NODE
