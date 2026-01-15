#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

NAME="${1:-rag-refresh-product-factory_snapshot}"
OUT_DIR="${2:-.press-logs}"
TS="$(date +%Y%m%d_%H%M%S)"
ZIP_PATH="$OUT_DIR/${NAME}_${TS}.zip"

mkdir -p "$OUT_DIR"

warn "Creating project snapshot zip (excluding node_modules, .next, caches, secrets)..."
# Use zip if available (macOS has it)
zip -rq "$ZIP_PATH" . \
  -x "**/node_modules/*" \
  -x "**/.next/*" \
  -x "**/.turbo/*" \
  -x "**/.trash/*" \
  -x "**/.press-logs/*" \
  -x "**/.press-pids/*" \
  -x "**/.alexai-secrets/*" \
  -x "**/.secrets/*" \
  -x "**/.git/*" \
  -x "**/.DS_Store" \
  -x "**/dist/*" \
  -x "**/build/*" \
  -x "**/coverage/*" \
  -x "**/*.log"

ok "Snapshot created: $ZIP_PATH"
say "📦 Project snapshot zip created at: $ZIP_PATH"