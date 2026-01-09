#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

command -v zip >/dev/null 2>&1 || err "zip not found. Install with: brew install zip"

STAMP="$(date +%Y%m%d_%H%M%S)"
OUT_DIR=".press-zips"
mkdir -p "$OUT_DIR"

NAME="rag-refresh-product-factory_milestone_${STAMP}.zip"
OUT_PATH="${OUT_DIR}/${NAME}"

# Safety: do not accidentally include gigantic folders / secrets
EXCLUDES=(
  "node_modules/*"
  ".next/*"
  ".git/*"
  ".trash/*"
  ".press-logs/*"
  ".press-pids/*"
  ".alexai-secrets/*"
  ".DS_Store"
  "**/.DS_Store"
  "infra/.terraform/*"
  "infra/tfplan*"
  "*.log"
  "*.zip"                 # NOTE: prevents bundling old zips into the new zip
  "dist/*"
  "build/*"
  "coverage/*"
  ".turbo/*"
  ".cache/*"
  ".vscode/**/node_modules/*"
  "vscode-extension/**/node_modules/*"
)

# Build exclude args for zip
ZIP_EX_ARGS=()
for e in "${EXCLUDES[@]}"; do
  ZIP_EX_ARGS+=("-x" "$e")
done

ok "Creating milestone snapshot zip (excluding heavy folders)..."
ok "Output: $OUT_PATH"

# Use -r for recursion, -q quiet, -9 max compression
zip -r -9 "$OUT_PATH" . -q "${ZIP_EX_ARGS[@]}"

# Print size
SIZE_BYTES="$(stat -f %z "$OUT_PATH" 2>/dev/null || echo 0)"
SIZE_MB="$(python3 - <<PY
b=$SIZE_BYTES
print(f"{b/1024/1024:.2f}")
PY
)"
ok "Milestone zip created: $OUT_PATH (${SIZE_MB} MB)"

# Optional: warn if huge
# (Pick a threshold that feels safe for ChatGPT uploads; 80MB is usually comfortable.)
THRESH_MB=80
python3 - <<PY
size=float("$SIZE_MB"); thr=float("$THRESH_MB")
import sys
sys.exit(0 if size <= thr else 1)
PY || warn "Zip is > ${THRESH_MB}MB. If upload fails, we can split it (see next section)."

say ""
say "Next step:"
say "  Open Finder → ${OUT_DIR} → upload ${NAME} to ChatGPT"
