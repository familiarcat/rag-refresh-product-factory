#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

BACKUP_DIR=".patch-backups/final_consolidation_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Candidate auth middleware files (we've seen multiple naming variants)
CANDIDATES=(
  "lib/auth/middleware.ts"
  "lib/auth/middleware2.ts"
  "lib/auth/middleware 2.ts"
)

node - <<'NODE'
const fs = require('fs');
const path = require('path');

const backupDir = process.env.BACKUP_DIR;
const candidates = (process.env.CANDIDATES || '').split('\n').filter(Boolean);

function backupFile(p){
  const rel = p.replace(/^\.\//,'');
  const dst = path.join(backupDir, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(p, dst);
}

function patchFile(p){
  if (!fs.existsSync(p)) return {p, changed:false, note:'missing'};
  let s = fs.readFileSync(p,'utf8');
  const orig = s;
  backupFile(p);

  // Ensure identity helper import exists where needed
  const hasImport = /from\s+['"]@\/lib\/auth\/identity['"]/.test(s);
  const usesNormalize = /normalizeUserId|requireUserId/.test(s);
  if (!hasImport && (s.includes('getUserId') || s.includes('checkPermission') || s.includes('user_id'))) {
    // Insert after first import block
    const m = s.match(/^(?:import[^\n]*\n)+/);
    const insert = `import { normalizeUserId, requireUserId } from '@/lib/auth/identity';\n`;
    if (m) s = s.replace(m[0], m[0] + insert);
    else s = insert + s;
  }

  // --- 1) Fix getUserId() returning unknown id -> string | null
  // Replace common patterns in getUserId function body.
  s = s.replace(/return\s+authResult\.success\s*\?\s*authResult\.user\?\.(id|user_id)\s*:\s*null\s*;?/g,
    'return authResult.success ? (normalizeUserId(authResult.user as any) ?? null) : null;');
  s = s.replace(/return\s+authResult\.success\s*\?\s*authResult\.user\.(id|user_id)\s*:\s*null\s*;?/g,
    'return authResult.success ? (normalizeUserId(authResult.user as any) ?? null) : null;');
  s = s.replace(/return\s+authResult\.success\s*\?\s*authResult\.user!\.(id|user_id)\s*:\s*null\s*;?/g,
    'return authResult.success ? (normalizeUserId(authResult.user as any) ?? null) : null;');

  // --- 2) Fix checkPermission legacy 3-arg calls -> object signature
  // checkPermission(user.id, permission, projectId)
  s = s.replace(/checkPermission\(\s*user\.(id|user_id)\s*,\s*permission\s*,\s*projectId\s*\)/g,
    "checkPermission({ userId: normalizeUserId(user as any) ?? '', permission, projectId })");
  // checkPermission(userId, permission, projectId)
  s = s.replace(/checkPermission\(\s*userId\s*,\s*permission\s*,\s*projectId\s*\)/g,
    "checkPermission({ userId: userId as any, permission, projectId })");

  // --- 3) Eliminate `_user` shadow usage in return payloads (common broken patches)
  // Replace _user references with user where present.
  s = s.replace(/\(\(_user as any\)\?\.\s*user_id/g, '((user as any)?.user_id');
  s = s.replace(/\.\.\.\(_user as any\)/g, '...(user as any)');

  // --- 4) Query-cast at api_keys boundary to stop TS deep instantiation
  // supabase.from('api_keys') -> (supabase as any).from('api_keys')
  s = s.replace(/\bsupabase\s*\.\s*from\(\s*['"]api_keys['"]\s*\)/g, '(supabase as any).from("api_keys")');

  // Also cast `supabaseServer` / `supabaseBrowser` if they are used as `supabase`
  // (we only change query boundary, so no further changes required)

  const changed = s !== orig;
  if (changed) fs.writeFileSync(p, s, 'utf8');
  return {p, changed, note: changed ? 'patched' : 'no-op'};
}

const results = candidates.map(patchFile);

// Also patch lib/api-keys.ts for deep instantiation issues on api_keys queries
const apiKeysFile = 'lib/auth/api-keys.ts';
if (fs.existsSync(apiKeysFile)){
  let s = fs.readFileSync(apiKeysFile,'utf8');
  const orig = s;
  // ensure identity import not required here
  // Break deep instantiation by casting supabase query boundary for api_keys
  s = s.replace(/\bsupabase\s*\.\s*from\(\s*['"]api_keys['"]\s*\)/g, '(supabase as any).from("api_keys")');
  if (s !== orig){
    backupFile(apiKeysFile);
    fs.writeFileSync(apiKeysFile, s, 'utf8');
    results.push({p: apiKeysFile, changed:true, note:'patched'});
  } else {
    results.push({p: apiKeysFile, changed:false, note:'no-op'});
  }
} else {
  results.push({p: apiKeysFile, changed:false, note:'missing'});
}

console.log(JSON.stringify(results, null, 2));
NODE
