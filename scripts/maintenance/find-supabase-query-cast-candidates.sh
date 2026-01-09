#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "🔎 Scanning for Supabase query chains likely to trigger TS deep instantiation..."
echo "    (heuristic: `.from('...')` + `.select(` + TypeScript files in app/lib)"
echo

node - <<'NODE'
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const targets = ['app','lib'];
const exts = new Set(['.ts','.tsx']);
const ignore = new Set(['node_modules','.next','.git','.trash','.press-logs','.press-zips','.patch-backups']);

function walk(dir, out){
  for (const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if (ignore.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (exts.has(path.extname(ent.name))) out.push(p);
  }
}

const files = [];
for (const t of targets){
  const p = path.join(root, t);
  if (fs.existsSync(p)) walk(p, files);
}

const hits = [];
for (const f of files){
  const s = fs.readFileSync(f,'utf8');
  // candidate patterns: supabase.from('table') chains, or `.from("...")` + `.select(`
  if (!s.includes('.from(') || !s.includes('.select(')) continue;
  // Prefer files touching api_keys or with select('*')
  const score =
    (s.match(/from\(\s*['"]api_keys['"]\s*\)/g)||[]).length*5 +
    (s.match(/select\(\s*['"]\*['"]\s*\)/g)||[]).length*3 +
    (s.match(/from\(\s*['"][^'"]+['"]\s*\)/g)||[]).length;

  if (score > 0){
    hits.push({f, score});
  }
}
hits.sort((a,b)=>b.score-a.score);

console.log("Likely candidates for query-cast (highest score first):");
for (const h of hits.slice(0,40)){
  console.log(`${h.score.toString().padStart(2,' ')}  ${path.relative(root, h.f)}`);
}
NODE
