#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

FILE="lib/auth/middleware.ts"
[[ -f "$FILE" ]] || err "Not found: $FILE"

BACKUP_DIR=".patch-backups/authprofile_userid_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp "$FILE" "$BACKUP_DIR/$(basename "$FILE").bak"

node - <<'NODE'
const fs = require('fs');

const file = 'lib/auth/middleware.ts';
let s = fs.readFileSync(file, 'utf8');
const orig = s;

function ensureIdentityImport(src){
  if (/from\s+['"]@\/lib\/auth\/identity['"]/.test(src)) return src;
  // Insert after the first import block
  const m = src.match(/^(?:import[^\n]*\n)+/);
  const ins = `import { normalizeUserId } from '@/lib/auth/identity';\n`;
  if (m) return src.replace(m[0], m[0] + ins);
  return ins + src;
}

s = ensureIdentityImport(s);

// Replace return block that returns `user` without required user_id.
// We target the exact shape shown in the error screenshots:
//
// return {
//   success: true,
//   user,
// };
//
// And also handle inline `return { success: true, user, };`
const replacementObj =
`return {\n    success: true,\n    // Ensure user_id exists to satisfy AuthProfile typing\n    user: ({ user_id: normalizeUserId(user as any) ?? '', ...(user as any) } as any),\n  };`;

// multiline form
s = s.replace(/return\s*\{\s*\n\s*success\s*:\s*true\s*,\s*\n\s*user\s*,\s*\n\s*\}\s*;/g, replacementObj);

// inline form
s = s.replace(/return\s*\{\s*success\s*:\s*true\s*,\s*user\s*,\s*\}\s*;/g, replacementObj);

if (s !== orig) {
  fs.writeFileSync(file, s, 'utf8');
  console.log('patched:', file);
} else {
  console.log('no-op: pattern not found in', file);
}
NODE

ok "AuthProfile user_id normalization applied in $FILE"
ok "Backup saved in $BACKUP_DIR"
