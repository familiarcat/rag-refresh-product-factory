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

STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR=".patch-backups/authprofile_return_data_${STAMP}"
mkdir -p "$BACKUP_DIR"
cp "$FILE" "$BACKUP_DIR/$(basename "$FILE").bak"

node - <<'NODE'
const fs = require('fs');

const file = 'lib/auth/middleware.ts';
let s = fs.readFileSync(file,'utf8');
const orig = s;

// We look for `return data;` that is associated with an AuthProfile-typed flow,
// and replace it with a safe normalization so AuthProfile always has user_id.
//
// Replacement:
//   return data;
// -> return ({ user_id: String((data as any)?.user_id ?? (data as any)?.id ?? ''), ...(data as any) } as any);

const lines = s.split(/\r?\n/);
let changed = 0;

function shouldPatchAt(i){
  // check +/- 80 lines for 'AuthProfile'
  const start = Math.max(0, i-80);
  const end = Math.min(lines.length-1, i+20);
  const window = lines.slice(start, end+1).join('\n');
  return /AuthProfile/.test(window);
}

for (let i=0; i<lines.length; i++){
  if (lines[i].match(/^\s*return\s+data\s*;\s*$/) && shouldPatchAt(i)){
    // preserve indentation
    const indent = (lines[i].match(/^(\s*)/)||['',''])[1];
    lines[i] = indent + "return ({ user_id: String((data as any)?.user_id ?? (data as any)?.id ?? ''), ...(data as any) } as any);";
    changed++;
    // if multiple, patch them all (safe)
  }
}

s = lines.join('\n');

if (changed && s !== orig){
  fs.writeFileSync(file, s, 'utf8');
  console.log(`patched: ${file} (${changed} return data; site(s))`);
} else {
  console.log('no-op: did not find an AuthProfile-adjacent `return data;` to patch');
}
NODE

ok "AuthProfile return normalization applied (if pattern matched)."
ok "Backup saved in $BACKUP_DIR"
