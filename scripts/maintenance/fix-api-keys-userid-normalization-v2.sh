#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
FILE="app/api/auth/api-keys/route.ts"
if [[ ! -f "$FILE" ]]; then echo "❌ Not found: $FILE"; exit 1; fi

node - <<'NODE'
const fs = require('fs');
const p = 'app/api/auth/api-keys/route.ts';
let s = fs.readFileSync(p,'utf8');

// Remove prior broken guard that references `userId` without defining it.
s = s.replace(/\/\/ AlexAI patch:[\s\S]*?Missing user id[\s\S]*?\);\s*\n}\s*\nconst userId = user\.id;\s*\n?/m, '');

s = s.replace(/\/\/ AlexAI patch: ensure user\.id is a string for downstream helpers[\s\S]*?return NextResponse\.json\([\s\S]*?\);\s*\n}\s*\nconst userId = user\.id;\s*\n?/m, '');

// Remove shadow vars introduced by earlier scripts
s = s.replace(/const _alexai_userId_shadow[\s\S]*?\n/mg, '');

// Now install a single canonical guard that is guaranteed in-scope:
// Insert immediately after the first time `user` is introduced or (fallback) before first use of user.id/userId.
function guard() {
  return `// AlexAI: canonical userId normalization (single source of truth for this route)
const userId = (typeof (user as any)?.id === "string") ? (user as any).id : "";
if (!userId) {
  return NextResponse.json({ success: false, error: "Missing user id" }, { status: 401 });
}

`;
}

if (!s.includes('canonical userId normalization')) {
  // Prefer insert after a `const user` or destructured user assignment
  const patterns = [
    /(const|let)\s+user\b[\s\S]*?;\n/,
    /const\s*{\s*user\s*}\s*=\s*[\s\S]*?;\n/,
    /const\s*{\s*user\s*:\s*user\s*}\s*=\s*[\s\S]*?;\n/,
  ];
  let inserted = false;
  for (const re of patterns) {
    const m = re.exec(s);
    if (m) {
      const idx = m.index + m[0].length;
      s = s.slice(0, idx) + "\n" + guard() + s.slice(idx);
      inserted = true;
      break;
    }
  }
  if (!inserted) {
    const idx = Math.max(s.indexOf('user.id'), s.indexOf('userId'));
    const insAt = idx === -1 ? 0 : (s.lastIndexOf('\n', idx) + 1);
    s = s.slice(0, insAt) + guard() + s.slice(insAt);
  }
}

// Rewrite callsites to use userId
s = s.replace(/createApiKeyForUser\s*\(\s*user\.id\s*,/g, 'createApiKeyForUser(userId,');
s = s.replace(/listApiKeys\s*\(\s*user\.id\s*,/g, 'listApiKeys(userId,');

// Also fix any createApiKeyForUser(userId,..) already OK (no change)
fs.writeFileSync(p, s, 'utf8');
console.log("✅ Repaired api-keys userId normalization:", p);
NODE
