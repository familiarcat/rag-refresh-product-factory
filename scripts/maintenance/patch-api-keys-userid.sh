#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

FILE="app/api/auth/api-keys/route.ts"
if [[ ! -f "$FILE" ]]; then
  echo "❌ Not found: $FILE"
  exit 1
fi

# Replace the call `listApiKeys(user.id, includeRevoked)` with a guarded version.
node - <<'NODE'
const fs = require('fs');
const p = 'app/api/auth/api-keys/route.ts';
let s = fs.readFileSync(p,'utf8');

const needle = 'const keys = await listApiKeys(user.id, includeRevoked);';
if (!s.includes(needle)) {
  console.error('Needle not found; file may have changed. Please patch manually:\n', needle);
  process.exit(2);
}

const replacement = `
  if (!user?.id || typeof user.id !== "string") {
    return NextResponse.json({ success: false, error: "Missing user id" }, { status: 401 });
  }
  const keys = await listApiKeys(user.id, includeRevoked);
`.trimEnd();

s = s.replace(needle, replacement);
fs.writeFileSync(p, s, 'utf8');
console.log('✅ Patched user.id typing in', p);
NODE
