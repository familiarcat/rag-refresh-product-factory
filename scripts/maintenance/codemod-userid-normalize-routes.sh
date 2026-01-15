#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

node - <<'NODE'
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const exts = new Set(['.ts','.tsx']);
const ignore = new Set(['node_modules','.next','.git','.trash','.press-logs','.press-zips','.press-pids','.alexai-secrets']);

function walk(dir){
  for (const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if (ignore.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (exts.has(path.extname(ent.name))) fixFile(p);
  }
}

function ensureImport(s){
  if (s.includes('from "@/lib/auth/user-id"')) return s;
  // Only add if file uses `user.id` in a server route context
  if (!s.includes('user.id')) return s;
  // add after first import block
  const m = s.match(/^(import[\s\S]*?\n)\n/m);
  if (m) {
    const idx = m[0].length;
    return s.slice(0, idx) + 'import { normalizeUserId } from "@/lib/auth/user-id";\n' + s.slice(idx);
  }
  return 'import { normalizeUserId } from "@/lib/auth/user-id";\n' + s;
}

function fixFile(file){
  let s = fs.readFileSync(file,'utf8');
  const orig = s;

  // Only operate on Next app route handlers for now
  if (!file.includes(path.join('app','api')) || !file.endsWith('route.ts')) return;

  // Replace direct `user.id` arg in common helpers with normalizeUserId(user)
  s = s.replace(/(\(|,\s*)user\.id(\s*,|\s*\))/g, (_, a, b) => `${a}normalizeUserId(user)${b}`);

  // If we introduced normalizeUserId, ensure import
  if (s.includes('normalizeUserId(user)')) {
    s = ensureImport(s);
  }

  if (s !== orig) fs.writeFileSync(file, s, 'utf8');
}

walk(root);
console.log("✅ Cascading userId normalization applied to app/api/**/route.ts (user.id -> normalizeUserId(user) in args)");
NODE
