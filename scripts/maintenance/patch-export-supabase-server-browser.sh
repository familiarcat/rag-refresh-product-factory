#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

TARGET="lib/supabase.ts"
[[ -f "$TARGET" ]] || err "Not found: $TARGET"

STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR=".patch-backups/export_supabase_server_browser_${STAMP}"
mkdir -p "$BACKUP_DIR"
cp "$TARGET" "$BACKUP_DIR/supabase.ts.bak"

node - <<'NODE'
const fs = require('fs');

const file = 'lib/supabase.ts';
let s = fs.readFileSync(file,'utf8');
const orig = s;

function hasExport(name){
  const re = new RegExp(String.raw`export\s+(?:const|function|type|interface)\s+${name}\b|export\s*\{[^}]*\b${name}\b[^}]*\}`, 'm');
  return re.test(s);
}

// Ensure imports exist (keep existing if already there)
if (!/from\s+["']@\/supabase\/server["']/.test(s) && !/from\s+["']@\/supabase\/server['"]/.test(s) && !/from\s+["']@\/supabase\/server["']/.test(s)) {
  // leave as-is; project may use different path
}

if (!hasExport('supabaseServer') || !hasExport('supabaseBrowser')) {
  // Try to locate existing import lines
  const serverImportRe = /import\s+\{\s*supabaseServer\s*\}\s+from\s+["'][^"']+["'];?/;
  const browserImportRe = /import\s+\{\s*supabaseBrowser\s*\}\s+from\s+["'][^"']+["'];?/;

  let hasServerImport = serverImportRe.test(s);
  let hasBrowserImport = browserImportRe.test(s);

  // If imports are missing, add canonical ones after Database import.
  if (!hasServerImport || !hasBrowserImport) {
    s = s.replace(
      /(import\s+type\s+\{\s*Database\s*\}\s+from\s+["'][^"']+["'];?\s*\r?\n)/,
      (m) => {
        let extra = '';
        if (!hasServerImport) extra += `\nimport { supabaseServer } from "@/supabase/server";\n`;
        if (!hasBrowserImport) extra += `import { supabaseBrowser } from "@/supabase/browser";\n`;
        return m + extra + '\n';
      }
    );
  }

  // If they were imported but not exported, add a named export block near "Canonical exports" comment if present.
  if (!hasExport('supabaseServer') || !hasExport('supabaseBrowser')) {
    if (s.includes('// ---- Canonical exports ----')) {
      s = s.replace(
        /\/\/ ---- Canonical exports ----\s*\r?\n/,
        `// ---- Canonical exports ----\n\nexport { supabaseServer, supabaseBrowser };\n\n`
      );
    } else {
      // Otherwise append exports near top after imports section.
      // Insert after last import statement.
      const lines = s.split(/\r?\n/);
      let lastImport = -1;
      for (let i=0;i<lines.length;i++){
        if (/^\s*import\b/.test(lines[i])) lastImport = i;
      }
      if (lastImport >= 0) {
        lines.splice(lastImport+1, 0, '', 'export { supabaseServer, supabaseBrowser };', '');
        s = lines.join('\n');
      } else {
        s = 'export { supabaseServer, supabaseBrowser };\n' + s;
      }
    }
  }

  // Ensure legacy alias supabase points to server client, not browser.
  s = s.replace(
    /export\s+const\s+supabase\s*:\s*SupabaseClient<Database>\s*=\s*supabaseServer\s*;/,
    'export const supabase: SupabaseClient<Database> = supabaseServer;'
  );
}

if (s !== orig) {
  fs.writeFileSync(file, s, 'utf8');
  console.log('patched:', file);
} else {
  console.log('no-op: already exports supabaseServer and supabaseBrowser');
}
NODE

ok "Ensured lib/supabase.ts exports { supabaseServer, supabaseBrowser } (and legacy supabase alias)."
ok "Backup: $BACKUP_DIR/supabase.ts.bak"
