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

// 1) Neutralize any prior block-scoped userId declarations that may be out-of-scope for later use.
s = s.replace(/\bconst\s+userId\b/g, 'const _alexai_userId_shadow');
s = s.replace(/\blet\s+userId\b/g, 'let _alexai_userId_shadow');

// 2) Insert a single canonical userId guard immediately before the first usage of `createApiKeyForUser(`
//    (this ensures the userId is in the same scope as the call).
const anchor = s.search(/createApiKeyForUser\s*\(/);
if (anchor === -1) {
  console.error("Could not find createApiKeyForUser(...) call to anchor insertion.");
  process.exit(2);
}

const lineStart = s.lastIndexOf('\n', anchor) + 1;

const guard = `// AlexAI canonical userId normalization (server route)
const userId = (typeof (user as any)?.id === "string") ? (user as any).id : "";
if (!userId) {
  return NextResponse.json({ success: false, error: "Missing user id" }, { status: 401 });
}

`;

s = s.slice(0, lineStart) + guard + s.slice(lineStart);

// 3) Rewrite call sites to use canonical userId variable (do AFTER insert).
s = s.replace(/createApiKeyForUser\s*\(\s*(user\.id|_alexai_userId_shadow)\s*,/g, 'createApiKeyForUser(userId,');
s = s.replace(/listApiKeys\s*\(\s*(user\.id|_alexai_userId_shadow)\s*,/g, 'listApiKeys(userId,');

fs.writeFileSync(p, s, 'utf8');
console.log("✅ Installed canonical userId normalization in:", p);
NODE
