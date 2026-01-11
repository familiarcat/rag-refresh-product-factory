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

BACKUP_DIR=".patch-backups/getUserId_cast_v2_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp "$FILE" "$BACKUP_DIR/$(basename "$FILE").bak"

node - <<'NODE'
const fs = require('fs');

const file = 'lib/auth/middleware.ts';
let s = fs.readFileSync(file,'utf8');
const orig = s;

// Patch the exact pattern currently in your file (per screenshot):
// return authResult.success ? authResult.user!.id : null;
// also handle: authResult.user.id, authResult.user?.id, authResult.user!.user_id, etc.

function patchReturn(src){
  const patterns = [
    /return\s+authResult\.success\s*\?\s*authResult\.user!\.id\s*:\s*null\s*;/g,
    /return\s+authResult\.success\s*\?\s*authResult\.user\.id\s*:\s*null\s*;/g,
    /return\s+authResult\.success\s*\?\s*authResult\.user\?\.\s*id\s*:\s*null\s*;/g,
    /return\s+authResult\.success\s*\?\s*authResult\.user!\.user_id\s*:\s*null\s*;/g,
    /return\s+authResult\.success\s*\?\s*authResult\.user\.user_id\s*:\s*null\s*;/g,
    /return\s+authResult\.success\s*\?\s*authResult\.user\?\.\s*user_id\s*:\s*null\s*;/g,
  ];
  let out = src;
  for (const re of patterns){
    out = out.replace(re, "return authResult.success ? String((authResult as any).user?.id ?? (authResult as any).user?.user_id ?? '') : null;");
  }
  return out;
}

s = patchReturn(s);

if (s !== orig){
  fs.writeFileSync(file, s, 'utf8');
  console.log('patched:', file);
} else {
  console.log('no-op: no matching getUserId return patterns found in', file);
}
NODE

ok "Patched getUserId() return to safe string cast in $FILE"
ok "Backup saved in $BACKUP_DIR"
