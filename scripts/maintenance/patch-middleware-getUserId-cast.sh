#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
err(){ say "❌ $*"; exit 1; }

FILE="lib/auth/middleware.ts"
[[ -f "$FILE" ]] || err "Not found: $FILE"

BACKUP_DIR=".patch-backups/getUserId_cast_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp "$FILE" "$BACKUP_DIR/$(basename "$FILE").bak"

node - <<'NODE'
const fs = require('fs');

const file = 'lib/auth/middleware.ts';
let s = fs.readFileSync(file,'utf8');
const orig = s;

// We want to cast the returned id to string safely.
// Target:
//   return authResult.success ? authResult.user.id : null;
// Replace with:
//   return authResult.success ? String((authResult as any).user?.id ?? '') : null;

const re = /return\s+authResult\.success\s*\?\s*authResult\.user\.id\s*:\s*null\s*;/g;
s = s.replace(re, "return authResult.success ? String((authResult as any).user?.id ?? '') : null;");

// Also handle user_id if present
const re2 = /return\s+authResult\.success\s*\?\s*authResult\.user\.user_id\s*:\s*null\s*;/g;
s = s.replace(re2, "return authResult.success ? String((authResult as any).user?.user_id ?? '') : null;");

if (s !== orig) {
  fs.writeFileSync(file, s, 'utf8');
  console.log('patched:', file);
} else {
  console.log('no-op: getUserId return pattern not found in', file);
}
NODE

ok "Patched getUserId() return type to safe string cast in $FILE"
ok "Backup saved in $BACKUP_DIR"
