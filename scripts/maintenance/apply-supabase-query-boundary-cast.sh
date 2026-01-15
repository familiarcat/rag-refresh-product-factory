#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }

BACKUP_DIR=".patch-backups/query_boundary_cast_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

TARGETS=(
  "lib/auth/middleware.ts"
  "lib/auth/middleware2.ts"
  "lib/auth/middleware 2.ts"
  "lib/auth/api-keys.ts"
)

node - <<'NODE'
const fs = require('fs');
const path = require('path');

const backupDir = process.env.BACKUP_DIR;
const targets = JSON.parse(process.env.TARGETS_JSON);

function backup(p){
  const rel = p.replace(/^\.\//,'');
  const dst = path.join(backupDir, rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(p, dst);
}

function patch(p){
  if (!fs.existsSync(p)) return { file: p, status: 'missing' };
  let s = fs.readFileSync(p,'utf8');
  const orig = s;
  backup(p);

  // 1) Cast supabase to any when chaining into api_keys across newlines:
  //    supabase
  //      .from('api_keys')
  //  -> (supabase as any)
  //      .from('api_keys')
  const re1 = /(^|\n)(\s*)supabase(\s*)\n(\s*)\.from\(\s*['"]api_keys['"]\s*\)/g;
  s = s.replace(re1, (_m, a, indent1, _ws, indent2) => {
    return `${a}${indent1}(supabase as any)\n${indent2}.from("api_keys")`;
  });

  // 2) Also handle cases where "await supabase" is used:
  //    await supabase
  //      .from('api_keys')
  //  -> await (supabase as any)
  //      .from('api_keys')
  const re2 = /await(\s+)supabase(\s*)\n(\s*)\.from\(\s*['"]api_keys['"]\s*\)/g;
  s = s.replace(re2, (_m, sp, _ws, indent) => {
    return `await${sp}(supabase as any)\n${indent}.from("api_keys")`;
  });

  // 3) Handle inline: supabase.from('api_keys') -> (supabase as any).from("api_keys")
  const re3 = /\bsupabase\s*\.\s*from\(\s*['"]api_keys['"]\s*\)/g;
  s = s.replace(re3, '(supabase as any).from("api_keys")');

  // Optional: if file imports q helper but doesn't use it, we don't add imports here to avoid unused warnings.

  const changed = s !== orig;
  if (changed) fs.writeFileSync(p, s, 'utf8');
  return { file: p, status: changed ? 'patched' : 'no-op' };
}

const results = targets.map(patch);
console.log(JSON.stringify({ backupDir, results }, null, 2));
NODE
