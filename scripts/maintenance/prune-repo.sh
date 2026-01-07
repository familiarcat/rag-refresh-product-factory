#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }

TS="$(date +%Y%m%d_%H%M%S)"
TRASH_RUN=".trash/prune-$TS"
mkdir -p "$TRASH_RUN"

for d in .next .turbo out dist .press-pids .pytest_cache; do
  if [[ -e "$d" ]]; then
    warn "Moving $d -> $TRASH_RUN/$d (avoids rm hang)"
    mv "$d" "$TRASH_RUN/$d" 2>/dev/null || true
  fi
done

say "Reconciling duplicate ' 2' files..."
while IFS= read -r f; do
  base="${f/ 2./.}"
  if [[ -f "$base" ]] && cmp -s "$f" "$base"; then
    mv "$f" "$TRASH_RUN/" 2>/dev/null || rm -f "$f"
    ok "Removed identical duplicate: $f"
  fi
done < <(find . -type f -name "* 2.*"   -not -path "./node_modules/*"   -not -path "./.git/*"   -not -path "./.trash/*"   -not -path "./.next/*" 2>/dev/null)

if [[ -d ".press-logs" ]]; then
  say "Pruning old .press-logs zips (keeping 5 newest)..."
  mapfile -t zips < <(ls -1t .press-logs/*.zip 2>/dev/null || true)
  if (( ${#zips[@]} > 5 )); then
    for z in "${zips[@]:5}"; do
      warn "Moving $z -> $TRASH_RUN/"
      mv "$z" "$TRASH_RUN/" 2>/dev/null || rm -f "$z"
    done
  fi
fi

ok "Prune complete. Trash: $TRASH_RUN"
