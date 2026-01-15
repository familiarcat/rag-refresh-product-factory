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

// Replace legacy 3-arg checkPermission(user.id, permission, projectId) with object form.
s = s.replace(/checkPermission\(\s*user\.(id|user_id)\s*,\s*permission\s*,\s*projectId\s*\)/g,
              "checkPermission({ userId: (user as any).id ?? (user as any).user_id ?? '', permission, projectId })");

// Also handle variant with userId variable already extracted
s = s.replace(/checkPermission\(\s*userId\s*,\s*permission\s*,\s*projectId\s*\)/g,
              "checkPermission({ userId: userId as any, permission, projectId })");

if (s !== orig) {
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Patched checkPermission call signature in:", p);
} else {
  console.log("ℹ️  No changes made (pattern not found):", p);
}
NODE
