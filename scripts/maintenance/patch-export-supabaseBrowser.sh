#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

# We support either a barrel folder (lib/supabase/index.ts) OR a flat module (lib/supabase.ts).
TARGET=""
if [[ -f "lib/supabase/index.ts" ]]; then
  TARGET="lib/supabase/index.ts"
elif [[ -f "lib/supabase.ts" ]]; then
  TARGET="lib/supabase.ts"
else
  err "Could not find lib/supabase/index.ts or lib/supabase.ts"
fi

STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR=".patch-backups/export_supabaseBrowser_${STAMP}"
mkdir -p "$BACKUP_DIR"
cp "$TARGET" "$BACKUP_DIR/$(basename "$TARGET").bak"

node - <<'NODE'
const fs = require('fs');

const target = fs.existsSync('lib/supabase/index.ts') ? 'lib/supabase/index.ts' : 'lib/supabase.ts';
let s = fs.readFileSync(target,'utf8');
const orig = s;

function ensureExport(name){
  // if already exported, do nothing
  const re = new RegExp(String.raw`export\s+(?:const|function|class|type|interface|\{[^}]*\b${name}\b[^}]*\})`, 'm');
  return re.test(s);
}

function appendLine(line){
  if (!s.includes(line)) s = s.trimEnd() + '\n' + line + '\n';
}

if (target.endsWith('index.ts')) {
  // Preferred: re-export from dedicated modules if present, else export local bindings.
  const hasBrowserMod = fs.existsSync('lib/supabase/browser.ts') || fs.existsSync('lib/supabase-browser.ts');
  const hasServerMod  = fs.existsSync('lib/supabase/server.ts')  || fs.existsSync('lib/supabase-server.ts');

  // Try canonical internal module paths first.
  if (!ensureExport('supabaseBrowser')) {
    if (fs.existsSync('lib/supabase/browser.ts')) {
      appendLine(`export { supabaseBrowser } from './browser';`);
    } else if (fs.existsSync('lib/supabase-browser.ts')) {
      appendLine(`export { supabaseBrowser } from '../supabase-browser';`);
    } else {
      // Fall back: export whatever is declared locally
      appendLine(`export { supabaseBrowser };`);
    }
  }

  if (!ensureExport('supabaseServer')) {
    if (fs.existsSync('lib/supabase/server.ts')) {
      appendLine(`export { supabaseServer } from './server';`);
    } else if (fs.existsSync('lib/supabase-server.ts')) {
      appendLine(`export { supabaseServer } from '../supabase-server';`);
    } else {
      appendLine(`export { supabaseServer };`);
    }
  }

  // Legacy: some files import { supabase } from '@/lib/supabase'
  // Ensure `supabase` is exported (alias to supabaseServer) if not already.
  if (!ensureExport('supabase')) {
    // only add if supabaseServer exists in module scope or re-exported above
    appendLine(`export const supabase = supabaseServer as any;`);
  }

} else {
  // target is lib/supabase.ts (flat)
  // Ensure both are exported names, and keep legacy alias `supabase`.
  // If file defines `const supabaseBrowser` without export, convert to export.
  s = s.replace(/\bconst\s+supabaseBrowser\b/g, 'export const supabaseBrowser');
  s = s.replace(/\bconst\s+supabaseServer\b/g, 'export const supabaseServer');
  // If they are declared with `function` etc, ignore.

  // Ensure legacy `supabase` export exists.
  if (!/export\s+const\s+supabase\b/.test(s)) {
    s = s.replace(/(\n|^)export\s+const\s+supabaseServer\b[\s\S]*?;\s*\n/m, m => m); // no-op
    s = s.trimEnd() + `\n\n// Legacy alias: most server-side code expects { supabase } from '@/lib/supabase'\nexport const supabase = (typeof supabaseServer !== 'undefined' ? supabaseServer : (supabaseBrowser as any)) as any;\n`;
  }
}

if (s !== orig) {
  fs.writeFileSync(target, s, 'utf8');
  console.log('patched:', target);
} else {
  console.log('no-op: already exports supabaseBrowser/supabaseServer in', target);
}
NODE

ok "Exported supabaseBrowser (and ensured supabaseServer + legacy supabase alias)."
ok "Backup saved in $BACKUP_DIR"
