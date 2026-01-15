#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

CANDIDATES=(
  "lib/auth/middleware.ts"
  "lib/auth/middleware 2.ts"
  "lib/auth/middleware2.ts"
)

FOUND=0
STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR=".patch-backups/ts2589_api_keys_boundary_${STAMP}"
mkdir -p "$BACKUP_DIR"

node - <<'NODE'
const fs = require('fs');

const files = [
  'lib/auth/middleware.ts',
  'lib/auth/middleware 2.ts',
  'lib/auth/middleware2.ts',
].filter(f => fs.existsSync(f));

if (!files.length) {
  console.error('No middleware files found.');
  process.exit(2);
}

function patchFile(file){
  let s = fs.readFileSync(file,'utf8');
  const orig = s;

  // Primary target: destructured await supabase on next line chain.
  // Example:
  // const { data: apiKeyData, error: keyError } = await supabase
  //   .from('api_keys')
  //   .select('user_id, expires_at, revoked_at')
  //   .eq('key_hash', keyHash);
  //
  // Patch: cast at await boundary so the whole chain becomes "any" and TS2589 disappears.
  s = s.replace(
    /(\=\s*await)\s+supabase(\s*(?:\r?\n\s*)\.\s*from\(\s*['"]api_keys['"]\s*\))/g,
    '$1 (supabase as any)$2'
  );

  // Also cover "await supabase.from('api_keys')" (same-line)
  s = s.replace(
    /\bawait\s+supabase\s*\.\s*from\(\s*['"]api_keys['"]\s*\)/g,
    'await (supabase as any).from("api_keys")'
  );

  // If there's a chain without maybeSingle/single/limit, add maybeSingle() right after eq('key_hash', keyHash)
  // to encourage a bounded return shape (runtime safe; returns first row or null).
  s = s.replace(
    /(\.eq\(\s*['"]key_hash['"]\s*,\s*keyHash\s*\))(\s*;)/g,
    '$1\n    .maybeSingle()$2'
  );

  if (s !== orig) {
    fs.writeFileSync(file, s, 'utf8');
    return true;
  }
  return false;
}

let changed = 0;
for (const f of files){
  if (patchFile(f)) {
    console.log('patched:', f);
    changed++;
  } else {
    console.log('no-op:', f, '(no matching api_keys await-from pattern)');
  }
}

process.exit(changed ? 0 : 3);
NODE

STATUS=$?
if [[ "$STATUS" -eq 2 ]]; then
  err "No middleware files found to patch."
elif [[ "$STATUS" -eq 3 ]]; then
  warn "No changes applied (pattern not found). If the failing file differs, open it and search for from('api_keys')."
else
  ok "Applied TS2589 boundary cast for api_keys query."
fi
