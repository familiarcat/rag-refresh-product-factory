#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

node - <<'NODE'
const fs = require('fs');
const path = require('path');

const root = process.cwd();

function isRouteFile(p){
  return p.includes(path.join('app','api')) && p.endsWith('route.ts');
}

function walk(dir, out=[]){
  for (const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const p = path.join(dir, ent.name);
    if (['node_modules','.next','.git','.trash','.press-logs','.press-zips','.press-pids','.alexai-secrets'].includes(ent.name)) continue;
    if (ent.isDirectory()) walk(p,out);
    else if (isRouteFile(p)) out.push(p);
  }
  return out;
}

const files = walk(root, []);
let touched = 0;

for (const file of files){
  let s = fs.readFileSync(file,'utf8');
  const orig = s;

  // Remove inline/mangled occurrences like "...createApiKeyimport { normalizeUserId } from '...';"
  s = s.replace(/([A-Za-z0-9_$]+)import\s*\{\s*normalizeUserId\s*\}\s*from\s*['"]@\/lib\/auth\/user-id['"]\s*;?/g,
                (_m, pre) => `${pre}\n`);

  // Remove any occurrences of the import that are not at start-of-line
  s = s.replace(/(?<!^)\s*import\s*\{\s*normalizeUserId\s*\}\s*from\s*['"]@\/lib\/auth\/user-id['"]\s*;?/gm, '');

  // Ensure clean import exists if normalizeUserId(...) is used
  const uses = s.includes('normalizeUserId(');
  const hasImport = /^\s*import\s*\{\s*normalizeUserId\s*\}\s*from\s*["']@\/lib\/auth\/user-id["']\s*;?\s*$/m.test(s);

  if (uses && !hasImport){
    const lines = s.split('\n');
    let insertAt = 0;
    for (let i=0;i<lines.length;i++){
      if (lines[i].startsWith('import ')) insertAt = i+1;
      else if (i>0 && !lines[i].trim()) continue;
      else if (i>0 && !lines[i].startsWith('import ')) break;
    }
    lines.splice(insertAt, 0, `import { normalizeUserId } from "@/lib/auth/user-id";`);
    s = lines.join('\n');
  }

  // Cleanup excessive blank lines
  s = s.replace(/\n{3,}/g, '\n\n');

  if (s !== orig){
    fs.writeFileSync(file, s, 'utf8');
    touched++;
  }
}

console.log(`✅ Fixed mangled normalizeUserId imports in ${touched} route file(s).`);
NODE
