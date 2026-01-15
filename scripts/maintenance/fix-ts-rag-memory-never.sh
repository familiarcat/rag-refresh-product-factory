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

say "🛠️  Fixing RAG memory `never` typing issue..."

if [[ ! -f "$TARGET" ]]; then
  warn "Missing file: $TARGET (skipping)"
  exit 0
fi

cp "$TARGET" "$BACKUP_DIR/$(echo "$TARGET" | tr '/' '__').bak"
ok "Backed up: $TARGET"

# 1) Ensure Action interface exists (idempotent)
if ! rg -q "interface RAGMemoryAction" "$TARGET"; then
  perl -0777 -i -pe '
    s/(^|\n)(\s*\/\/\s*Calculate average success score)/\ninterface RAGMemoryAction {\n  success_score?: number | null;\n}\n\n$2/sm
  ' "$TARGET"
  ok "Inserted RAGMemoryAction interface"
else
  ok "RAGMemoryAction interface already present"
fi

# 2) Cast data before reduce to avoid `never`
perl -i -pe '
  s/const\s+avgScore\s*=\s*data\.reduce\s*\(/const typedData = data as RAGMemoryAction[];\n  const avgScore = typedData.reduce(/g
' "$TARGET"

# 3) Ensure reduce body remains correct
if rg -q "typedData.reduce" "$TARGET"; then
  ok "Patched reduce() to use typedData"
else
  warn "Did not find expected reduce() pattern — verify manually"
fi

say "✅ RAG memory typing fix complete."
say "Backups saved in: $BACKUP_DIR"
say ""
say "Next:"
say "  rm -rf .next || true"
say "  npm run build"
