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

// Make expires_at optional-safe (schema typing currently lacks expires_at)
s = s.replace(/\bexpires_at:\s*key\.expires_at\s*,/g, 'expires_at: (key as any).expires_at ?? null,');

// Also guard common alternate casing
s = s.replace(/\bexpiresAt:\s*key\.expiresAt\s*,/g, 'expiresAt: (key as any).expiresAt ?? (key as any).expires_at ?? null,');

if (s !== orig) {
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Patched expires_at to optional-safe access in:", p);
} else {
  console.log("ℹ️  No changes made (pattern not found):", p);
}
NODE
