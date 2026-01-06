#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }

warn "Normalizing Supabase import paths (portable Node walker)..."

node - <<'NODE'
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const ignore = new Set([
  'node_modules', '.next', '.git', '.trash',
  '.press-logs', '.alexai-secrets', '.secrets'
]);

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignore.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (exts.has(path.extname(ent.name))) fixFile(p);
  }
}

// Canonical targets in this repo:
//   - server-only:  '@/lib/supabase-server'
//   - browser-only: '@/lib/supabase-browser'
//   - shared barrel: '@/lib/supabase'
//
// NOTE: We only normalize PATHS. We do not change imported identifiers.
const replacements = [
  // Absolute aliases
  { from: /from\s+['"]@\/lib\/supabase-server['"]/g, to: "from '@/lib/supabase-server'" },
  { from: /from\s+['"]@\/lib\/supabase-browser['"]/g, to: "from '@/lib/supabase-browser'" },
  { from: /from\s+['"]@\/lib\/supabase['"]/g,        to: "from '@/lib/supabase'" },

  // Common relative legacy imports -> barrel
  { from: /from\s+['"]\.\.\/supabase['"]/g,          to: "from '@/lib/supabase'" },
  { from: /from\s+['"]\.\/supabase['"]/g,            to: "from '@/lib/supabase'" },

  // Rare deep relatives -> canonical
  { from: /from\s+['"]\.\.\/\.\.\/lib\/supabase-server['"]/g, to: "from '@/lib/supabase-server'" },
  { from: /from\s+['"]\.\.\/\.\.\/lib\/supabase-browser['"]/g, to: "from '@/lib/supabase-browser'" },
];

let changedFiles = 0;
function fixFile(file) {
  let s = fs.readFileSync(file, 'utf8');
  const orig = s;
  for (const r of replacements) s = s.replace(r.from, r.to);
  if (s !== orig) {
    fs.writeFileSync(file, s, 'utf8');
    changedFiles++;
  }
}

walk(root);
console.log(`normalize-supabase-imports: updated ${changedFiles} file(s)`);
NODE

ok "Normalized Supabase import paths."
