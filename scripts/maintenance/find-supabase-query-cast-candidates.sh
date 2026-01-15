#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "🔎 Supabase query-cast candidates (heuristic): files containing .from(...)+.select(...)"
echo "    Only apply casts where TS reports 'excessively deep' on that file/line."
echo

node - <<'NODE'
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const roots = ['lib','app'];
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
const files=[];
for (const r of roots){
  const p = path.join(root,r);
  if (fs.existsSync(p)) walk(p, files);
}

const hits=[];
for (const f of files){
  const s = fs.readFileSync(f,'utf8');
  if (!s.includes('.from(') || !s.includes('.select(')) continue;
  const apiKeys = (s.match(/from\(\s*['"]api_keys['"]\s*\)/g)||[]).length;
  const stars = (s.match(/select\(\s*['"]\*['"]\s*\)/g)||[]).length;
  const tables = (s.match(/from\(\s*['"][^'"]+['"]\s*\)/g)||[]).length;
  const score = apiKeys*10 + stars*3 + tables;
  hits.push({f, score});
}
hits.sort((a,b)=>b.score-a.score);
for (const h of hits.slice(0,60)){
  console.log(`${String(h.score).padStart(2,' ')}  ${path.relative(root,h.f)}`);
}
NODE
