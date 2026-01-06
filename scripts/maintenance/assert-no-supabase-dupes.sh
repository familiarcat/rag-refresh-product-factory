#!/usr/bin/env bash
set -euo pipefail
BAD="$(find lib -maxdepth 1 -type f -name "supabase*.ts" ! -name "supabase.ts" -print || true)"
if [[ -n "$BAD" ]]; then
  echo "❌ Forbidden duplicate supabase files detected:"
  echo "$BAD"
  exit 1
fi
echo "✅ No supabase duplicates detected."
