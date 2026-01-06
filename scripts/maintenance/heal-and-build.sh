\
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

ts() { date +"%Y%m%d_%H%M%S"; }

MODE_BUILD="false"
for a in "$@"; do
  [[ "$a" == "--build" ]] && MODE_BUILD="true"
done

command -v rg >/dev/null || err "ripgrep (rg) is required"
command -v perl >/dev/null || err "perl is required"

say "🧹 Cleaning Next build artifacts..."
pkill -f "next" >/dev/null 2>&1 || true
pkill -f "node.*next" >/dev/null 2>&1 || true

if [[ -d ".next" ]]; then
  rm -rf .next >/dev/null 2>&1 || true
  if [[ -d ".next" ]]; then
    find .next -mindepth 1 -maxdepth 6 -exec rm -rf {} + >/dev/null 2>&1 || true
    rm -rf .next >/dev/null 2>&1 || true
  fi
fi
[[ ! -d ".next" ]] && ok "Removed .next" || warn "Could not fully remove .next (may still be in use)"

say "🧩 Reconciling duplicate ' 2' files under app/api..."
ARCHIVE_DIR=".patch-backups/duplicates/$(ts)"
mkdir -p "$ARCHIVE_DIR"

shopt -s nullglob
dupes=( app/api/**/**" 2.ts" app/api/**/**" 2.tsx" )
if [[ ${#dupes[@]} -eq 0 ]]; then
  ok "No ' 2' duplicates found in app/api"
else
  for f in "${dupes[@]}"; do
    base="${f/ 2./.}"
    if [[ -f "$base" ]]; then
      if cmp -s "$f" "$base"; then
        rm -f "$f"
        ok "Removed identical duplicate: $f"
      else
        mv "$f" "$ARCHIVE_DIR/"
        warn "Archived conflicting duplicate: $f -> $ARCHIVE_DIR/"
      fi
    else
      mv "$f" "$base"
      ok "Renamed: $f -> $base"
    fi
  done
fi
shopt -u nullglob

say "🧷 Ensuring StoryStatus includes \"review\"..."
candidates="$(rg -n --hidden --glob '!**/node_modules/**' --glob '!**/.next/**' '(^|\\s)(export\\s+)?(type|enum)\\s+StoryStatus\\b' . || true)"
if [[ -z "$candidates" ]]; then
  warn "No StoryStatus definition found (skipping)"
else
  files="$(echo "$candidates" | cut -d: -f1 | sort -u)"
  changed_any="false"
  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    if rg -q --fixed-strings '"review"' "$file"; then
      ok "StoryStatus already includes review: $file"
      continue
    fi

    if rg -q 'type\\s+StoryStatus\\s*=' "$file"; then
      cp "$file" "$ARCHIVE_DIR/$(echo "$file" | tr '/' '__').bak"
      perl -0777 -i -pe 's/(type\\s+StoryStatus\\s*=\\s*(?:.|\\n)*?)(;\\s*)/$1\\n  | "review"$2/sm' "$file" || true
      changed_any="true"
      ok "Patched StoryStatus union to include review: $file"
      continue
    fi

    if rg -q 'enum\\s+StoryStatus' "$file"; then
      cp "$file" "$ARCHIVE_DIR/$(echo "$file" | tr '/' '__').bak"
      perl -0777 -i -pe 's/(enum\\s+StoryStatus\\s*\\{)/$1\\n  review = "review",/sm' "$file" || true
      changed_any="true"
      ok "Patched StoryStatus enum to include review: $file"
      continue
    fi

    warn "Found StoryStatus definition but could not patch automatically: $file"
  done <<< "$files"

  [[ "$changed_any" == "true" ]] && ok "StoryStatus patching complete (backups in $ARCHIVE_DIR)" || ok "No StoryStatus patches needed"
fi

if [[ "$MODE_BUILD" == "true" ]]; then
  say "🏗️  Running clean build..."
  rm -rf .next >/dev/null 2>&1 || true
  npm run build
  ok "Build complete."
else
  say "ℹ️  Heal complete. To build: bash scripts/maintenance/heal-and-build.sh --build"
fi
