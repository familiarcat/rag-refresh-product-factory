\
#!/usr/bin/env bash
set -euo pipefail

ZIP_PATH="${1:-}"
MODE="${2:---apply}" # --dry-run | --apply
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say() { printf "%b\n" "$*"; }
err() { say "❌ $*"; exit 1; }
ok()  { say "✅ $*"; }
warn(){ say "⚠️  $*"; }

if [[ -z "${ZIP_PATH}" ]]; then
  err "Usage: bash scripts/patch/apply-docs-patch.sh <path-to-patch-zip> [--dry-run|--apply]
Example: bash scripts/patch/apply-docs-patch.sh ../rag-refresh-product-factory_patch_docs_v2.zip"
fi

command -v unzip >/dev/null 2>&1 || err "unzip is required"
command -v rsync >/dev/null 2>&1 || err "rsync is required"

if [[ ! -f "$ZIP_PATH" ]]; then
  err "Patch zip not found: $ZIP_PATH"
fi

TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

# Extract to temp
unzip -q "$ZIP_PATH" -d "$TMP_DIR"

# Find the extracted repo root inside the zip (expected: rag-refresh-product-factory/)
EXTRACTED_ROOT="$TMP_DIR/rag-refresh-product-factory"
if [[ ! -d "$EXTRACTED_ROOT" ]]; then
  # fallback: try to locate a single top-level directory
  top="$(find "$TMP_DIR" -maxdepth 1 -mindepth 1 -type d | head -n 1 || true)"
  [[ -n "$top" ]] || err "Could not locate extracted patch root in zip"
  EXTRACTED_ROOT="$top"
fi

# Safety: refuse to apply if patch contains obviously unsafe paths
if find "$EXTRACTED_ROOT" -type f | grep -E '/(\.git|node_modules|\.next|dist|build|coverage|__pycache__)/' >/dev/null 2>&1; then
  err "Patch appears to include build/cache artifacts (.next/node_modules/.git/etc). Refusing to apply."
fi

# Build file list
mapfile -t PATCH_FILES < <(cd "$EXTRACTED_ROOT" && find . -type f -print | sed 's|^\./||' | sort)

say "🧩 Patch contains ${#PATCH_FILES[@]} file(s):"
for f in "${PATCH_FILES[@]}"; do
  say "  - $f"
done

# Diff-like summary: new vs overwrite
new_count=0
overwrite_count=0
say ""
say "🔎 Impact summary:"
for f in "${PATCH_FILES[@]}"; do
  if [[ -f "$ROOT_DIR/$f" ]]; then
    overwrite_count=$((overwrite_count+1))
    say "  ✏️  overwrite: $f"
  else
    new_count=$((new_count+1))
    say "  ➕ new:       $f"
  fi
done
say ""
ok "Summary: ${new_count} new, ${overwrite_count} overwrite"

if [[ "$MODE" == "--dry-run" ]]; then
  ok "Dry run complete. Re-run with --apply to apply."
  exit 0
fi

# Default to apply
BACKUP_DIR="$ROOT_DIR/.patch-backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup overwritten files
for f in "${PATCH_FILES[@]}"; do
  if [[ -f "$ROOT_DIR/$f" ]]; then
    mkdir -p "$BACKUP_DIR/$(dirname "$f")"
    cp -p "$ROOT_DIR/$f" "$BACKUP_DIR/$f"
  fi
done
ok "Backups written to: $BACKUP_DIR"

# Apply overlay (preserve perms/timestamps where possible)
rsync -a --checksum "$EXTRACTED_ROOT"/ "$ROOT_DIR"/

ok "Patch applied."
say "Next steps:"
say "  1) npm install"
say "  2) npm run check:env"
say "  3) npm run lint && npm run build"
say "  4) npm run dev (or npm run dev:check)"
