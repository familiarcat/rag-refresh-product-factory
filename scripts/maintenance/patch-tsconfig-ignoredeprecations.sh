#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

FILE="tsconfig.json"
[[ -f "$FILE" ]] || err "Not found: $FILE"

STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR=".patch-backups/tsconfig_ignoreDeprecations_${STAMP}"
mkdir -p "$BACKUP_DIR"
cp "$FILE" "$BACKUP_DIR/tsconfig.json.bak"

node - <<'NODE'
const fs = require('fs');

const file = 'tsconfig.json';
let s = fs.readFileSync(file,'utf8');
const orig = s;

function setIgnoreDeprecations(val){
  const re = /"ignoreDeprecations"\s*:\s*"[^"]*"\s*,?/;
  if (re.test(s)) {
    s = s.replace(re, `"ignoreDeprecations": "${val}",`);
    return true;
  }
  // insert inside compilerOptions
  const m = s.match(/"compilerOptions"\s*:\s*\{/);
  if (!m) return false;
  s = s.replace(/("compilerOptions"\s*:\s*\{)/, `$1\n    "ignoreDeprecations": "${val}",`);
  return true;
}

// TypeScript 5.9 rejects future versions like "6.0" and also rejects "5.9".
// Use a supported floor value. "5.0" is accepted broadly.
const changed = setIgnoreDeprecations("5.0");

if (!changed) {
  console.log('no-op: could not locate compilerOptions to set ignoreDeprecations');
} else if (s !== orig) {
  fs.writeFileSync(file, s, 'utf8');
  console.log('patched:', file, 'ignoreDeprecations => 5.0');
} else {
  console.log('no-op: already set');
}
NODE

ok "tsconfig.json updated: ignoreDeprecations => 5.0"
ok "Backup saved: $BACKUP_DIR/tsconfig.json.bak"
