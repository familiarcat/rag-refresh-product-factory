#!/usr/bin/env bash
# inspect-repo-structure.sh
#
# Read-only diagnostic script.
# Prints an ASCII tree of the repo and highlights important anchors.

set -euo pipefail

TARGET="/Users/bradygeorgen/Documents/workspace/rag-refresh-product-factory"

say() { printf "%b\n" "$*"; }

if [[ ! -d "$TARGET" ]]; then
  say "❌ Target directory not found:"
  say "   $TARGET"
  exit 1
fi

say ""
say "🔍 Inspecting Alex AI repo structure"
say "📁 Target: $TARGET"
say "📍 Current working dir: $(pwd)"
say ""

cd "$TARGET"

say "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
say "📦 TOP-LEVEL STRUCTURE"
say "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Print top-level dirs/files
find . -maxdepth 1 -mindepth 1 | sort | sed 's|^\./|├── |'

say ""
say "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
say "📂 scripts/ (if present)"
say "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ -d scripts ]]; then
  find scripts -maxdepth 3 | sed 's|^\./||' | awk '
    BEGIN { FS="/" }
    {
      indent = ""
      for (i = 2; i <= NF; i++) indent = indent "│   "
      print indent "├── " $NF
    }
  '
else
  say "⚠️  scripts/ directory not found"
fi

say ""
say "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
say "📦 package.json locations"
say "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

find . -name package.json -not -path "./node_modules/*" | sed 's|^\./|├── |'

say ""
say "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
say "🧩 VS Code extension markers"
say "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

find . -maxdepth 3 \( -name extension.ts -o -name package.json \) \
  | grep -i vscode || say "⚠️  No vscode-extension markers found at shallow depth"

say ""
say "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
say "📄 README files"
say "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

find . -maxdepth 2 -iname "readme*.md" | sed 's|^\./|├── |'

say ""
say "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
say "✅ Inspection complete"
say "👉 Paste this output back into ChatGPT"
say "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
