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
  return `// AlexAI patch: ensure user.id is a string for downstream helpers
const userId = (user as any)?.id;
if (!userId || typeof userId !== "string") {
  return NextResponse.json({ success: false, error: "Missing user id" }, { status: 401 });
}
`;
}

const already = s.includes('const userId = (user as any)?.id') || s.includes('const userId = user.id');
if (!already) {
  // Try several patterns to find where `user` is defined:
  const patterns = [
    /(const|let)\s+user\b[\s\S]*?;/,                 // const user = ...;
    /const\s*{\s*user\s*}\s*=\s*[\s\S]*?;/,          // const { user } = ...;
    /const\s*{\s*user\s*:\s*user\s*}\s*=\s*[\s\S]*?;/ // const { user: user } = ...;
  ];

  let inserted = false;
  for (const re of patterns) {
    const m = re.exec(s);
    if (m) {
      const idx = m.index + m[0].length;
      s = s.slice(0, idx) + "\n\n" + guardBlock() + s.slice(idx);
      inserted = true;
      break;
    }
  }

  // Fallback: insert before first usage of `user.id`
  if (!inserted) {
    const idx = s.indexOf('user.id');
    if (idx === -1) {
      console.error("Could not find any 'user.id' usage to anchor guard insertion.");
      process.exit(2);
    }
    // Insert at the beginning of the line containing first 'user.id'
    const lineStart = s.lastIndexOf('\n', idx) + 1;
    s = s.slice(0, lineStart) + guardBlock() + s.slice(lineStart);
    inserted = true;
  }
}

// Replace call sites to use userId
s = s.replaceAll('createApiKeyForUser(user.id,', 'createApiKeyForUser(userId,');
s = s.replaceAll('createApiKeyForUser(user.id', 'createApiKeyForUser(userId');
s = s.replaceAll('listApiKeys(user.id,', 'listApiKeys(userId,');
s = s.replaceAll('listApiKeys(user.id', 'listApiKeys(userId');

// Also replace any remaining `user.id,` as first argument patterns (best-effort)
s = s.replace(/createApiKeyForUser\s*\(\s*user\.id\s*,/g, 'createApiKeyForUser(userId,');
s = s.replace(/listApiKeys\s*\(\s*user\.id\s*,/g, 'listApiKeys(userId,');

fs.writeFileSync(p, s, 'utf8');
console.log("✅ Patched api-keys route with robust userId guard and callsite rewrites:", p);
NODE
