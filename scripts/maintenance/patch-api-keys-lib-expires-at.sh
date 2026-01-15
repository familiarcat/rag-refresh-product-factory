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

// Replace `apiKeyData.expires_at` reads with optional-safe any-cast form.
// We do minimal replacements around common patterns.
s = s.replace(/\bapiKeyData\.expires_at\b/g, '(apiKeyData as any).expires_at');

// Also handle `apiKeyData.expiresAt` if present
s = s.replace(/\bapiKeyData\.expiresAt\b/g, '(apiKeyData as any).expiresAt ?? (apiKeyData as any).expires_at');

if (s !== orig) {
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Patched apiKeyData.expires_at to optional-safe access in:", p);
} else {
  console.log("ℹ️  No changes made (apiKeyData.expires_at not found):", p);
}
NODE
