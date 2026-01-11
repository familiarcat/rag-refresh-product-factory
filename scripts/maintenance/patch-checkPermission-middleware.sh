#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
err(){ say "❌ $*"; exit 1; }

FILE="lib/auth/middleware.ts"
[[ -f "$FILE" ]] || err "Not found: $FILE"

BACKUP_DIR=".patch-backups/checkPermission_obj_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp "$FILE" "$BACKUP_DIR/$(basename "$FILE").bak"

node - <<'NODE'
const fs = require('fs');

const file = 'lib/auth/middleware.ts';
let s = fs.readFileSync(file,'utf8');
const orig = s;

function ensureIdentityImport(src){
  if (/normalizeUserId/.test(src) && /from\s+['"]@\/lib\/auth\/identity['"]/.test(src)) return src;
  if (/from\s+['"]@\/lib\/auth\/identity['"]/.test(src) && !/normalizeUserId/.test(src)) {
    // extend existing import
    return src.replace(/import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]@\/lib\/auth\/identity['"]\s*;/,
      (m, inner)=>`import { ${inner.trim()}, normalizeUserId } from '@/lib/auth/identity';`);
  }
  // otherwise insert a new import after the first import block
  const m = src.match(/^(?:import[^\n]*\n)+/);
  const ins = `import { normalizeUserId } from '@/lib/auth/identity';\n`;
  if (m) return src.replace(m[0], m[0] + ins);
  return ins + src;
}

s = ensureIdentityImport(s);

// Replace 3-arg call into object-signature call.
// Example to match:
//   checkPermission(user.id, permission, projectId)
//   checkPermission(user.id, permission, projectId);
//   await checkPermission(user.id, permission, projectId)
const re = /checkPermission\(\s*([A-Za-z0-9_$.]+)\s*,\s*([A-Za-z0-9_$.]+)\s*,\s*([A-Za-z0-9_$.]+)\s*\)/g;

s = s.replace(re, (_m, userExpr, permExpr, projExpr) => {
  // normalizeUserId handles unknown shapes; fallback to userExpr when it's already a string
  const userIdExpr = `normalizeUserId(${userExpr} as any) ?? (${userExpr} as any)?.id ?? (${userExpr} as any) ?? ''`;
  return `checkPermission({ userId: ${userIdExpr}, permission: ${permExpr}, projectId: ${projExpr} })`;
});

if (s !== orig) {
  fs.writeFileSync(file, s, 'utf8');
  console.log('patched:', file);
} else {
  console.log('no-op: checkPermission(…, …, …) pattern not found in', file);
}
NODE

ok "Patched checkPermission() to object signature in $FILE"
ok "Backup saved in $BACKUP_DIR"
