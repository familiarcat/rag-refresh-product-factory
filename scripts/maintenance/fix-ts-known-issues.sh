#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

# --- timeout helper (macOS: coreutils provides gtimeout) ---
TIMEOUT_BIN=""
if command -v gtimeout >/dev/null 2>&1; then
  TIMEOUT_BIN="gtimeout"
elif command -v timeout >/dev/null 2>&1; then
  TIMEOUT_BIN="timeout"
fi

with_timeout() {
  local seconds="$1"; shift
  if [[ -n "$TIMEOUT_BIN" ]]; then
    "$TIMEOUT_BIN" "${seconds}" "$@"
  else
    "$@"
  fi
}

# --- Safe ripgrep wrapper ---
rg_safe() {
  rg --no-mmap --hidden --follow \
    --glob '!.git/**' \
    --glob '!node_modules/**' \
    --glob '!**/node_modules/**' \
    --glob '!.next/**' \
    --glob '!.trash/**' \
    --glob '!.press-logs/**' \
    --glob '!.press-pids/**' \
    --glob '!.alexai-secrets/**' \
    --glob '!.secrets/**' \
    --glob '!vscode-extension/node_modules/**' \
    --glob '!**/*.map' \
    "$@"
}

# --- Find Supabase types file ---
TYPES_CANDIDATES=(
  "types/supabase.ts"
  "types/supabase.generated.ts"
  "src/types/supabase.ts"
  "app/types/supabase.ts"
)

TYPES_FILE=""
for c in "${TYPES_CANDIDATES[@]}"; do
  if [[ -f "$c" ]]; then
    TYPES_FILE="$c"
    break
  fi
done

if [[ -z "$TYPES_FILE" ]]; then
  warn "No Supabase types file found. Skipping api_keys typing injection."
  exit 0
fi

ok "Using types file: $TYPES_FILE"

# --- backup ---
BACKUP_DIR=".press-logs/ts-fix-backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -f "$TYPES_FILE" "$BACKUP_DIR/$(basename "$TYPES_FILE").bak"
ok "Backup saved: $BACKUP_DIR/$(basename "$TYPES_FILE").bak"

# --- If already present, stop ---
if rg_safe -q "api_keys:\s*\{" "$TYPES_FILE"; then
  ok "api_keys typing already present (skipping)."
  exit 0
fi

# --- Write block to temp file (NO env var passing) ---
TMP_BLOCK="$(mktemp)"
trap 'rm -f "$TMP_BLOCK"' EXIT

cat > "$TMP_BLOCK" <<'BLOCK'
/**
 * --- AlexAI patch: api_keys table typing ---
 * Add/adjust fields to match your Supabase schema.
 */
api_keys: {
  Row: {
    id: string
    user_id: string
    api_key_hash: string
    label: string | null
    created_at: string
    revoked_at: string | null
  }
  Insert: {
    id?: string
    user_id: string
    api_key_hash: string
    label?: string | null
    created_at?: string
    revoked_at?: string | null
  }
  Update: {
    id?: string
    user_id?: string
    api_key_hash?: string
    label?: string | null
    created_at?: string
    revoked_at?: string | null
  }
  Relationships: []
}
BLOCK

say "🔧 Injecting api_keys typing into Database.public.Tables..."

# Insert right after `Tables: {` inside the Database type definition
BLOCK_FILE="$TMP_BLOCK" with_timeout 20 perl -0777 -i -pe '
  my $block_file = $ENV{BLOCK_FILE};
  open(my $fh, "<", $block_file) or die "Cannot open block file\n";
  local $/ = undef;
  my $ins = <$fh>;
  close($fh);

  # Insert inside the first occurrence of Tables: {
  s/(Tables:\s*\{\s*\n)/$1$ins\n/;
' "$TYPES_FILE" || err "Injection timed out or failed."

# Verify injection
if rg_safe -q "api_keys:\s*\{" "$TYPES_FILE"; then
  ok "Injected api_keys typing into $TYPES_FILE"
else
  warn "Injection did not verify. Open $TYPES_FILE and add api_keys under Database.public.Tables manually."
fi

ok "Automation complete."
say "Next step:"
say "  rm -rf .next || true"
say "  npm run build"
