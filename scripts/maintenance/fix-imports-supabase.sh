    #!/usr/bin/env bash
    set -euo pipefail

    say(){ printf "%b\n" "$*"; }
    ok(){ say "✅ $*"; }
    warn(){ say "⚠️  $*"; }

    ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
    cd "$ROOT"

    # Replace legacy "@/lib/supabase" imports in server areas with supabase-server
    # and in client components with supabase-browser.
    #
    # Heuristic:
    # - app/api/** and lib/** => server
    # - components/** and app/** (non-api) => browser (only if the file contains 'use client')
    #
    # Note: conservative; won't touch unknown patterns.

    # 1) Server routes / libs
    files=$(git ls-files 2>/dev/null || true)
    if [[ -z "$files" ]]; then
      # fall back if not a git repo in this environment
      files=$(find app lib -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | sed 's|^./||')
    fi

    # helper for portable in-place edits
    inplace() {
      local file="$1"
      python3 - <<'PY' "$file"
import io,sys,re,os
path=sys.argv[1]
with open(path,'r',encoding='utf-8') as f: s=f.read()
orig=s

# Replace @/lib/supabase -> @/lib/supabase-server in app/api or lib
if path.startswith('app/api/') or path.startswith('lib/'):
  s=re.sub(r"from\s+['\"]@/lib/supabase['\"]", "from '@/lib/supabase-server'", s)

# Replace @/lib/supabase -> @/lib/supabase-browser in client components (contains 'use client')
if ("'use client'" in s or '"use client"' in s):
  s=re.sub(r"from\s+['\"]@/lib/supabase['\"]", "from '@/lib/supabase-browser'", s)

if s!=orig:
  with open(path,'w',encoding='utf-8') as f: f.write(s)
  print(path)
PY
    }

    changed=0
    while IFS= read -r f; do
      [[ "$f" == *.ts || "$f" == *.tsx ]] || continue
      if out=$(inplace "$f"); then
        if [[ -n "$out" ]]; then
          changed=$((changed+1))
        fi
      fi
    done <<< "$files"

    ok "Updated imports in $changed file(s) (if any)"
    warn "If you intentionally import '@/lib/supabase' elsewhere, validate manually."
