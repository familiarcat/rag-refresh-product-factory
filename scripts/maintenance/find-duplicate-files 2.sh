#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "🔎 Finding duplicate ' 2.ts/tsx/js/jsx/mjs' files (likely shadow copies)..."
echo

# Find dupes
dupes=$(find . -type f \( -name "* 2.ts" -o -name "* 2.tsx" -o -name "* 2.js" -o -name "* 2.jsx" -o -name "* 2.mjs" \) \
  -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./.git/*" -not -path "./.trash/*" -not -path "./.press-logs/*" -not -path "./.press-zips/*" || true)

if [[ -z "$dupes" ]]; then
  echo "✅ No duplicates found."
  exit 0
fi

echo "$dupes" | sed 's/^\.\///' | sort
echo
echo "🔎 Import references (best-effort grep):"
echo "$dupes" | while read -r f; do
  rel="${f#./}"
  base="${rel/ 2./.}"
  echo
  echo "— $rel (canonical would be: $base)"
  rg -n --hidden --no-ignore-vcs "$rel" . || true
done
