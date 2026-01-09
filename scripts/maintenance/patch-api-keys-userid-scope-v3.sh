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

const hasUserIdDecl = /const\s+userId\s*=/.test(s);
const usesUserId = /\buserId\b/.test(s);

if (usesUserId && !hasUserIdDecl) {
  // Insert declaration right before the first usage of userId.
  const idx = s.indexOf('userId');
  if (idx === -1) throw new Error("Expected userId usage but none found");
  const lineStart = s.lastIndexOf('\n', idx) + 1;

  const decl = `// AlexAI patch: define userId in the same scope as its first usage
const userId = (typeof (user as any)?.id === "string")
  ? (user as any).id
  : String((user as any)?.id ?? "");
if (!userId) {
  return NextResponse.json({ success: false, error: "Missing user id" }, { status: 401 });
}

`;

  s = s.slice(0, lineStart) + decl + s.slice(lineStart);
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Inserted userId declaration in-scope before first usage:", p);
} else {
  console.log("ℹ️  userId declaration already present or userId not used; no changes:", p);
}
NODE
