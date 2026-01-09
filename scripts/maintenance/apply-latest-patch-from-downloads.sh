#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

DOWNLOADS_DIR="${DOWNLOADS_DIR:-$HOME/Downloads}"

# Match your patch naming convention(s)
# Add/remove patterns as you standardize names.
PATTERNS=(
  "rag-refresh-product-factory_patch_*.zip"
  "rag-refresh-product-factory_*patch*.zip"
)

# Find the most recently modified matching zip in Downloads
latest_zip=""
latest_mtime=0

for pat in "${PATTERNS[@]}"; do
  while IFS= read -r f; do
    [[ -f "$f" ]] || continue
    # macOS stat
    mt=$(stat -f "%m" "$f" 2>/dev/null || echo 0)
    if [[ "$mt" -gt "$latest_mtime" ]]; then
      latest_mtime="$mt"
      latest_zip="$f"
    fi
  done < <(ls -1t "$DOWNLOADS_DIR"/$pat 2>/dev/null || true)
done

[[ -n "$latest_zip" ]] || err "No patch zip found in $DOWNLOADS_DIR matching: ${PATTERNS[*]}"

ok "Latest patch found: $latest_zip"

# Canonical name in repo root so your system always knows what to apply next
TARGET="./rag-refresh-product-factory_patch_latest.zip"
cp -f "$latest_zip" "$TARGET"
ok "Copied to repo root as: $TARGET"

# Apply via your patch/overlay system
# (Your package.json shows alexai:upgrade -> upgrade-and-verify.sh)
npm run -s alexai:upgrade -- "$TARGET"
ok "Patch applied via alexai:upgrade"
