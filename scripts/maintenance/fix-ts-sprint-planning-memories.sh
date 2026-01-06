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

TYPES_FILE="types/supabase.ts"
TABLE_NAME="sprint_planning_memories"

say "🛠️  Fixing Supabase typing for $TABLE_NAME..."

if [[ ! -f "$TYPES_FILE" ]]; then
  err "Missing $TYPES_FILE — cannot inject table typing."
fi

cp "$TYPES_FILE" "$BACKUP_DIR/types__supabase.ts.bak"
ok "Backed up: $TYPES_FILE"

# If already defined, do nothing
if rg -q "^\s*$TABLE_NAME\s*:\s*\{" "$TYPES_FILE"; then
  ok "$TABLE_NAME already exists in Database types."
  exit 0
fi

say "➕ Injecting minimal $TABLE_NAME table typing..."

TABLE_BLOCK=$'sprint_planning_memories: {\n'\
$'        Row: {\n'\
$'          id: string\n'\
$'          created_at: string | null\n'\
$'          sprint_id: string\n'\
$'          project_id: string\n'\
$'          project_name: string\n'\
$'          goals: string[]\n'\
$'          crew_assignments: Record<string, string[]>\n'\
$'          velocity_target: number\n'\
$'          prior_analysis: string | null\n'\
$'          risk_organization: string | null\n'\
$'          quark_optimization: string | null\n'\
$'        }\n'\
$'        Insert: {\n'\
$'          id?: string\n'\
$'          created_at?: string | null\n'\
$'          sprint_id: string\n'\
$'          project_id: string\n'\
$'          project_name: string\n'\
$'          goals: string[]\n'\
$'          crew_assignments: Record<string, string[]>\n'\
$'          velocity_target: number\n'\
$'          prior_analysis?: string | null\n'\
$'          risk_organization?: string | null\n'\
$'          quark_optimization?: string | null\n'\
$'        }\n'\
$'        Update: {\n'\
$'          id?: string\n'\
$'          created_at?: string | null\n'\
$'          sprint_id?: string\n'\
$'          project_id?: string\n'\
$'          project_name?: string\n'\
$'          goals?: string[]\n'\
$'          crew_assignments?: Record<string, string[]>\n'\
$'          velocity_target?: number\n'\
$'          prior_analysis?: string | null\n'\
$'          risk_organization?: string | null\n'\
$'          quark_optimization?: string | null\n'\
$'        }\n'\
$'        Relationships: []\n'\
$'      },\n'

export TABLE_BLOCK

perl -0777 -i -pe '
  my $ins = $ENV{TABLE_BLOCK};
  s/(Tables:\s*\{\s*\n)/$1      $ins/s
' "$TYPES_FILE"

if rg -q "^\s*$TABLE_NAME\s*:\s*\{" "$TYPES_FILE"; then
  ok "Injected $TABLE_NAME into types/supabase.ts"
else
  warn "Injection failed — file structure may differ."
  warn "Manually add $TABLE_NAME under Database.public.Tables."
fi

say ""
ok "Sprint planning memory typing fix complete."
say "Backups saved in: $BACKUP_DIR"
say ""
say "Next:"
say "  rm -rf .next || true"
say "  npm run build"
