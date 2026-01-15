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

TARGET="lib/orchestration/rag-memory-integration.ts"
TABLE="sprint_planning_memories"

say "🛠️  Fixing insert typing for $TARGET ($TABLE)..."

[[ -f "$TARGET" ]] || err "Missing file: $TARGET"

cp "$TARGET" "$BACKUP_DIR/$(echo "$TARGET" | tr '/' '__').bak"
ok "Backed up: $TARGET"

# 1) Ensure local Insert type exists (idempotent)
if ! rg -q "type SprintPlanningMemoryInsert" "$TARGET"; then
  perl -0777 -i -pe '
    # Insert after imports block (best-effort)
    s/(^(\s*import[^\n]*\n)+)/$1\ntype SprintPlanningMemoryInsert = {\n  sprint_id: string;\n  project_id: string;\n  project_name: string;\n  goals: string[];\n  crew_assignments: Record<string, string[]>;\n  velocity_target: number;\n  prior_analysis?: string | null;\n  risk_organization?: string | null;\n  quark_optimization?: string | null;\n};\n\n/sm
  ' "$TARGET"
  ok "Inserted SprintPlanningMemoryInsert type"
else
  ok "SprintPlanningMemoryInsert already present"
fi

# 2) Patch the `.from("sprint_planning_memories")` call to avoid `never`
# We do NOT rely on Supabase Database typing at all; we cast the table name to any.
perl -i -pe '
  s/\.from\(\s*["'\'']sprint_planning_memories["'\'']\s*\)/.from(("sprint_planning_memories" as any))/g
' "$TARGET"

# 3) Ensure the insert payload is typed (cast object literal)
# Convert `.insert({` to `.insert(({` and close with `}) as SprintPlanningMemoryInsert)`
# only for the first matching insert into this table region.
perl -0777 -i -pe '
  # Find a `.from(("sprint_planning_memories" as any)) ... .insert({ ... })`
  # and wrap object literal with type cast
  s/(\.from\(\("sprint_planning_memories"\s+as\s+any\)\)\s*\n(?:.|\n){0,400}?\.\s*insert\()\s*\{\s*/$1({ /s
  and
  s/(\.from\(\("sprint_planning_memories"\s+as\s+any\)\)\s*\n(?:.|\n){0,400}?\.\s*insert\(\(\{\s*(?:.|\n)*?\n\s*\}\)\s*)\)\s*/$1 as SprintPlanningMemoryInsert))/s
' "$TARGET"

# Validate that our key transformation exists
if rg -q '\.from\(\("sprint_planning_memories" as any\)\)' "$TARGET"; then
  ok "Patched .from() for sprint_planning_memories"
else
  warn "Did not patch .from(); pattern may differ. Open $TARGET and search for sprint_planning_memories."
fi

if rg -q "as SprintPlanningMemoryInsert" "$TARGET"; then
  ok "Typed insert payload as SprintPlanningMemoryInsert"
else
  warn "Did not find typed insert payload cast. You may need a manual tweak in $TARGET."
fi

say ""
ok "rag-memory-integration insert typing patch complete."
say "Backups saved in: $BACKUP_DIR"
say ""
say "Next:"
say "  rm -rf .next || true"
say "  npm run build"
