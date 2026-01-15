#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }

THRESH_MB="${1:-95}"
say "Scanning tracked files for > ${THRESH_MB}MB ..."
big="$(git ls-files -z | xargs -0 -I{} bash -lc 'f="{}"; [[ -f "$f" ]] || exit 0; s=$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f" 2>/dev/null || echo 0); echo "$s $f"'   | awk -v thr="$THRESH_MB" '$1 > thr*1024*1024 {print}' | sort -nr || true)"

if [[ -n "$big" ]]; then
  warn "Tracked files exceeding ${THRESH_MB}MB:"
  echo "$big" | awk '{printf " - %.2f MB  %s\n", $1/1024/1024, substr($0, index($0,$2))}'
  warn "Stopgap: git rm --cached <file> && echo '<file>' >> .gitignore"
  warn "If committed already, use git-filter-repo/BFG to purge history."
  exit 2
fi
ok "No tracked files over ${THRESH_MB}MB."
