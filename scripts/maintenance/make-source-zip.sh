#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

command -v zip >/dev/null || err "zip is required (macOS has it by default)."

TS="$(date +%Y%m%d_%H%M%S)"
OUT_DIR=".press-zips"
mkdir -p "$OUT_DIR"

# Default output name: <repo-folder>_source_<timestamp>.zip
REPO_NAME="$(basename "$ROOT_DIR")"
OUT_ZIP="${1:-$OUT_DIR/${REPO_NAME}_source_${TS}.zip}"

# Exclusions: heavy, generated, secrets, caches, logs
EXCLUDES=(
  "**/node_modules/**"
  "**/.next/**"
  "**/.turbo/**"
  "**/.vercel/**"
  "**/.cache/**"
  "**/.pytest_cache/**"
  "**/dist/**"
  "**/build/**"
  "**/out/**"
  "**/.DS_Store"
  "**/coverage/**"
  "**/.press-logs/**"
  "**/.press-pids/**"
  "**/.alexai-secrets/**"
  "**/.secrets/**"
  "**/*.log"
  "**/.env"
  "**/.env.*"
  # Keep .env.example / templates, but exclude local envs
  "!**/.env.example"
  "!**/.env.local.example"
  # Git + editor cruft
  "**/.git/**"
  "**/.idea/**"
)

say "📦 Creating source zip (excluding node_modules/.next/secrets)..."
say "   Output: $OUT_ZIP"

# zip needs -x patterns individually
ZIP_ARGS=()
for pat in "${EXCLUDES[@]}"; do
  ZIP_ARGS+=("-x" "$pat")
done

# -q quiet, -r recursive
zip -qr "$OUT_ZIP" . "${ZIP_ARGS[@]}"

ok "Created: $OUT_ZIP"
say ""
say "Tip: unzip into a clean folder and run:"
say "  npm install"
say "  npm run check:env"
say "  npm run build"
