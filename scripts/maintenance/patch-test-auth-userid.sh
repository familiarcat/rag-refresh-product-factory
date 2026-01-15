#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

FILE="app/api/dev/test-auth/route.ts"
if [[ ! -f "$FILE" ]]; then
  echo "❌ Not found: $FILE"
  exit 1
fi

node - <<'NODE'
const fs = require('fs');

const p = 'app/api/dev/test-auth/route.ts';
let s = fs.readFileSync(p,'utf8');
const orig = s;

// We insert userId right before permissions block (minimal and safe).
if (!/\bconst\s+userId\b/.test(s)) {
  const idx = s.indexOf("const permissions =");
  if (idx === -1) {
    console.error("Could not find `const permissions =` block.");
    process.exit(2);
  }
  const lineStart = s.lastIndexOf("\n", idx) + 1;

  const insertion =
`// AlexAI patch: define userId once (normalized) for permission checks
const userId = normalizeUserId((authResult as any).user ?? (user as any));
if (!userId) {
  return NextResponse.json(
    { authenticated: false, error: "Missing user id" },
    { status: 401 }
  );
}

`;

  s = s.slice(0, lineStart) + insertion + s.slice(lineStart);
}

if (s !== orig) {
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Patched userId definition + guard into:", p);
} else {
  console.log("ℹ️  No changes needed:", p);
}
NODE
