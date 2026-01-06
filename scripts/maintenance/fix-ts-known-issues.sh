#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }
ts(){ date +"%Y%m%d_%H%M%S"; }

command -v rg >/dev/null || err "ripgrep (rg) is required"
command -v perl >/dev/null || err "perl is required"

BACKUP_DIR=".patch-backups/ts-fixes/$(ts)"
mkdir -p "$BACKUP_DIR"

# ------------------------------------------------------------
# Fix A) Normalize duplicate middleware filename (space + 2)
# ------------------------------------------------------------
SRC_MW="lib/auth/middleware 2.ts"
DST_MW="lib/auth/middleware.ts"

say "🔧 Fixing auth middleware typing + file duplicates..."

if [[ -f "$SRC_MW" ]]; then
  mkdir -p "$BACKUP_DIR/lib_auth"
  cp "$SRC_MW" "$BACKUP_DIR/lib_auth/middleware_2.ts.bak"
  ok "Backed up: $SRC_MW -> $BACKUP_DIR/lib_auth/middleware_2.ts.bak"

  if [[ -f "$DST_MW" ]]; then
    # If both exist, keep middleware.ts and archive middleware 2.ts to backups.
    warn "Both $SRC_MW and $DST_MW exist. Archiving $SRC_MW and keeping $DST_MW."
    mv "$SRC_MW" "$BACKUP_DIR/lib_auth/middleware_2.ts.archived"
    ok "Archived: $SRC_MW -> $BACKUP_DIR/lib_auth/middleware_2.ts.archived"
  else
    mv "$SRC_MW" "$DST_MW"
    ok "Renamed: $SRC_MW -> $DST_MW"
  fi
fi

# Determine which middleware file we will patch
MW_FILE=""
if [[ -f "$DST_MW" ]]; then
  MW_FILE="$DST_MW"
elif [[ -f "$SRC_MW" ]]; then
  MW_FILE="$SRC_MW"
fi

# ------------------------------------------------------------
# Fix B) Make revoked_at check null-safe (apiKeyData?.revoked_at)
# ------------------------------------------------------------
if [[ -n "$MW_FILE" ]]; then
  cp "$MW_FILE" "$BACKUP_DIR/lib_auth/$(basename "$MW_FILE").bak"
  ok "Backed up: $MW_FILE -> $BACKUP_DIR/lib_auth/$(basename "$MW_FILE").bak"

  # Replace: if (apiKeyData.revoked_at) {
  # With:    if (apiKeyData?.revoked_at) {
  perl -i -pe 's/\bif\s*\(\s*apiKeyData\.revoked_at\s*\)\s*\{/if (apiKeyData?.revoked_at) {/g' "$MW_FILE"

  if rg -q "apiKeyData\\?\\.revoked_at" "$MW_FILE"; then
    ok "Patched revoked_at check to be null-safe in: $MW_FILE"
  else
    warn "Did not find exact pattern 'if (apiKeyData.revoked_at) {' in $MW_FILE (skipping this patch)."
  fi
else
  warn "No middleware file found at lib/auth/middleware(.ts| 2.ts). Skipping middleware fixes."
fi

# ------------------------------------------------------------
# Fix C) Ensure Database types include api_keys table to avoid `never`
# ------------------------------------------------------------
TYPES_FILE="types/supabase.ts"
if [[ ! -f "$TYPES_FILE" ]]; then
  warn "Missing $TYPES_FILE; cannot add api_keys typing automatically."
  warn "Create/restore types/supabase.ts first, then rerun."
  exit 0
fi

cp "$TYPES_FILE" "$BACKUP_DIR/$(echo "$TYPES_FILE" | tr '/' '__').bak"
ok "Backed up: $TYPES_FILE -> $BACKUP_DIR/$(echo "$TYPES_FILE" | tr '/' '__').bak"

# If api_keys already exists, we’re done.
if rg -q '^\s*api_keys\s*:\s*\{' "$TYPES_FILE"; then
  ok "types/supabase.ts already contains api_keys table."
else
  say "➕ Injecting minimal api_keys table into types/supabase.ts..."

  # Minimal supabase-compatible table block
  API_KEYS_BLOCK=$'api_keys: {\n'\
$'        Row: {\n'\
$'          id: string\n'\
$'          created_at: string | null\n'\
$'          revoked_at: string | null\n'\
$'          key_hash: string\n'\
$'          name: string | null\n'\
$'          user_id: string | null\n'\
$'          scopes: string[] | null\n'\
$'          is_active: boolean | null\n'\
$'        }\n'\
$'        Insert: {\n'\
$'          id?: string\n'\
$'          created_at?: string | null\n'\
$'          revoked_at?: string | null\n'\
$'          key_hash: string\n'\
$'          name?: string | null\n'\
$'          user_id?: string | null\n'\
$'          scopes?: string[] | null\n'\
$'          is_active?: boolean | null\n'\
$'        }\n'\
$'        Update: {\n'\
$'          id?: string\n'\
$'          created_at?: string | null\n'\
$'          revoked_at?: string | null\n'\
$'          key_hash?: string\n'\
$'          name?: string | null\n'\
$'          user_id?: string | null\n'\
$'          scopes?: string[] | null\n'\
$'          is_active?: boolean | null\n'\
$'        }\n'\
$'        Relationships: []\n'\
$'      },\n'

  # Insert right after `Tables: {` opening.
  # This is a safe heuristic for your stub style file.
  perl -0777 -i -pe '
    my $ins = $ENV{API_KEYS_BLOCK};
    s/(Tables:\s*\{\s*\n)/$1      $ins/s
  ' "$TYPES_FILE" 2>/dev/null || true

  # Export env for perl injection
  export API_KEYS_BLOCK="$API_KEYS_BLOCK"
  perl -0777 -i -pe '
    my $ins = $ENV{API_KEYS_BLOCK};
    s/(Tables:\s*\{\s*\n)/$1      $ins/s
  ' "$TYPES_FILE"

  if rg -q '^\s*api_keys\s*:\s*\{' "$TYPES_FILE"; then
    ok "Injected api_keys table typing into $TYPES_FILE"
  else
    warn "Failed to inject api_keys block (structure may differ)."
    warn "Open $TYPES_FILE and add api_keys under Database.public.Tables manually."
  fi
fi

say ""
ok "Automation complete."
say "Backups saved in: $BACKUP_DIR"
say ""
say "Next step:"
say "  rm -rf .next || true"
say "  npm run build"
