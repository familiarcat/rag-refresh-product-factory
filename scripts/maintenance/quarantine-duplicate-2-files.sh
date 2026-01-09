#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

ts=$(date +%Y%m%d_%H%M%S)
DEST=".trash/duplicates_${ts}"
mkdir -p "$DEST"

echo "🧹 Quarantining duplicate ' 2.*' files to $DEST (non-destructive)..."

while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  rel="${f#./}"
  mkdir -p "$DEST/$(dirname "$rel")"
  mv "$rel" "$DEST/$rel"
  echo "Moved: $rel -> $DEST/$rel"
done < <(find . -type f \( -name "* 2.ts" -o -name "* 2.tsx" -o -name "* 2.js" -o -name "* 2.jsx" -o -name "* 2.mjs" \) \
  -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./.git/*" -not -path "./.trash/*" -not -path "./.press-logs/*" -not -path "./.press-zips/*")

echo
echo "✅ Quarantine complete."
echo "Next: run build to confirm shadow files aren't being compiled:"
echo "  npm run build"
