#!/usr/bin/env bash
set -euo pipefail

# -----------------------------------------------------------------------------
# Create a ChatGPT-friendly patch zip of the current repo state (small + legible).
# Excludes large/generated directories (node_modules, .next, dist, etc).
#
# Usage:
#   bash scripts/maintenance/make-chatgpt-zip.sh
#   PURPOSE="docs-and-scripts" bash scripts/maintenance/make-chatgpt-zip.sh
# -----------------------------------------------------------------------------

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

command -v zip >/dev/null 2>&1 || err "zip is required (brew install zip on macOS, apt install zip on Linux)"

PATCH_PREFIX="${PATCH_PREFIX:-alexai-rag-refresh-product-factory__patch__}"
DATE_STAMP="$(date +%Y-%m-%d)"
PURPOSE="${PURPOSE:-chatgpt-friendly}"
OUT_DIR="${OUT_DIR:-$HOME/Downloads}"
OUT_ZIP="${OUT_DIR}/${PATCH_PREFIX}${DATE_STAMP}__${PURPOSE}.zip"

mkdir -p "$OUT_DIR"

EXCLUDES=(
  "**/node_modules/**"
  "**/.next/**"
  "**/dist/**"
  "**/out/**"
  "**/coverage/**"
  "**/.turbo/**"
  "**/.DS_Store"
  "**/.git/**"
  "**/.press-logs/**"
  "**/.alexai-secrets/**"
  "**/.secrets/**"
)

say "📦 Creating patch zip:"
say "   Repo: $ROOT_DIR"
say "   Out : $OUT_ZIP"
say ""

ZIP_ARGS=( -r "$OUT_ZIP" . )
for pat in "${EXCLUDES[@]}"; do
  ZIP_ARGS+=( -x "$pat" )
done

zip "${ZIP_ARGS[@]}" >/dev/null
ok "Created: $OUT_ZIP"
say "Tip: This zip excludes dependencies/build artifacts for legibility."
