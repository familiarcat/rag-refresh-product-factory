#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
OUT_DIR=".press-logs"
mkdir -p "$OUT_DIR"
ZIP_PATH="$OUT_DIR/rag-refresh-product-factory_proxy_${TS}.zip"

warn "Creating clean proxy zip: $ZIP_PATH"
if command -v bsdtar >/dev/null 2>&1; then
  bsdtar -a -c -f "$ZIP_PATH"     --exclude "node_modules"     --exclude ".next"     --exclude ".git"     --exclude ".trash"     --exclude ".press-logs"     --exclude ".press-pids"     --exclude ".alexai-secrets"     --exclude ".secrets"     --exclude ".env"     --exclude ".env.*"     --exclude "*.zip"     .
else
  command -v zip >/dev/null 2>&1 || err "zip not installed"
  zip -r "$ZIP_PATH" . -x "node_modules/*" ".next/*" ".git/*" ".trash/*" ".press-logs/*" ".press-pids/*" ".alexai-secrets/*" ".secrets/*" ".env" ".env.*" "*.zip" >/dev/null
fi
ok "Created: $ZIP_PATH"
