#!/usr/bin/env bash
set -euo pipefail

echo "🧩 Applying Supabase normalization patch..."

chmod +x scripts/maintenance/normalize-supabase-imports.sh
chmod +x scripts/maintenance/patch-package-json-alexai-ts-heal.mjs

node scripts/maintenance/patch-package-json-alexai-ts-heal.mjs

echo "✅ Patch applied."
echo ""
echo "Next:"
echo "  npm run alexai:ts:heal"
