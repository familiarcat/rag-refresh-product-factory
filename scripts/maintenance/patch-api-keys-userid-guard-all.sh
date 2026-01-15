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

function guardBlock() {
  return `if (!user?.id || typeof user.id !== "string") {
  return NextResponse.json({ success: false, error: "Missing user id" }, { status: 401 });
}
const userId = user.id;
`;
}

// Insert guard after first `const user = ...;` if not already present
if (!s.includes('const userId = user.id') && !s.includes('const userId = user.id;')) {
  const re = /(const\s+user\s*=\s*[\s\S]*?;)/;
  const m = re.exec(s);
  if (!m) {
    console.error("Could not find `const user = ...;` to insert userId guard after.");
    process.exit(2);
  }
  const idx = m.index + m[0].length;
  s = s.slice(0, idx) + "\n\n" + guardBlock() + s.slice(idx);
}

// Replace common call sites
s = s.replaceAll('createApiKeyForUser(user.id,', 'createApiKeyForUser(userId,');
s = s.replaceAll('listApiKeys(user.id,', 'listApiKeys(userId,');

fs.writeFileSync(p, s, 'utf8');
console.log("✅ Patched api-keys route to use validated userId for all calls:", p);
NODE
