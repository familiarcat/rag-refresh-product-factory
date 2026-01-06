#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

TS="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR=".patch-backups/dedupe-supabase/$TS"
mkdir -p "$BACKUP_DIR"

say() { printf "%b\n" "$*"; }

CANON="lib/supabase.ts"
if [[ ! -f "$CANON" ]]; then
  say "❌ Expected canonical file missing: $CANON"
  exit 1
fi

say "🔎 Scanning for duplicate supabase files in ./lib …"

FOUND_ANY=0

# Find any lib/supabase*.ts that is NOT lib/supabase.ts
# This catches: "supabase 2.ts", "supabase copy.ts", "supabase (1).ts", etc.
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  FOUND_ANY=1
  bn="$(basename "$f")"

  mkdir -p "$BACKUP_DIR"
  cp "$f" "$BACKUP_DIR/$bn.bak"
  rm -f "$f"

  say "✅ Removed duplicate: $f (backup: $BACKUP_DIR/$bn.bak)"
done < <(find lib -maxdepth 1 -type f -name "supabase*.ts" ! -name "supabase.ts" -print)

if [[ "$FOUND_ANY" -eq 0 ]]; then
  say "✅ No duplicate lib/supabase* files found."
else
  say "✅ Supabase lib dedupe complete."
fi
