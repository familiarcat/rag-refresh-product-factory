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

// We need to ensure `user` satisfies AuthProfile (requires user_id).
// Patch the success return block to wrap user with a normalized shape.
const pattern = /return\s*\{\s*\n([\s\S]*?)success:\s*true,\s*\n([\s\S]*?)\buser,\s*\n/;
if (!pattern.test(s)) {
  console.log("ℹ️  Could not find success return block with `user,` shorthand. No changes made.");
  process.exit(0);
}

s = s.replace(pattern, (m, pre, mid) => {
  const inject = `// AlexAI patch: normalize user profile to satisfy AuthProfile typing\n    const _user = {\n      user_id: (apiKeyData as any)?.user_id ?? (user as any)?.user_id ?? '',\n      ...(user as any),\n    };\n\n    return {\n${pre}success: true,\n${mid}user: _user as any,\n`;
  return inject;
});

fs.writeFileSync(p, s, 'utf8');
console.log("✅ Patched middleware 2 to normalize `user` with user_id before returning:", p);
NODE
