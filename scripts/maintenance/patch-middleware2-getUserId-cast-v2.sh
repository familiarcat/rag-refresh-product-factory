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

// Replace the getUserId return to force string output.
// Handles variants:
//  - authResult.user?.id
//  - authResult.user!.id
//  - authResult.user.id
s = s.replace(/return\s+authResult\.success\s*\?\s*authResult\.user\?\.id\s*:\s*null\s*;?/g,
  'return authResult.success ? ((authResult.user as any)?.id?.toString?.() ?? null) : null;');

s = s.replace(/return\s+authResult\.success\s*\?\s*authResult\.user!\.id\s*:\s*null\s*;?/g,
  'return authResult.success ? ((authResult.user as any)?.id?.toString?.() ?? null) : null;');

s = s.replace(/return\s+authResult\.success\s*\?\s*authResult\.user\.id\s*:\s*null\s*;?/g,
  'return authResult.success ? ((authResult.user as any)?.id?.toString?.() ?? null) : null;');

if (s !== orig) {
  fs.writeFileSync(p, s, 'utf8');
  console.log('✅ Patched getUserId() return to cast id to string:', p);
} else {
  console.log('ℹ️  No changes made (no matching getUserId return found):', p);
}
NODE
