#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

export BACKUP_DIR=".patch-backups/final_consolidation_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

export CANDIDATES="$(printf "%s
"   "lib/auth/middleware.ts"   "lib/auth/middleware2.ts"   "lib/auth/middleware 2.ts")"

bash scripts/maintenance/final-consolidation-identity-and-supabase.sh

echo
echo "✅ Final consolidation applied."
echo "Backups saved in: $BACKUP_DIR"
echo
echo "Next commands:"
echo "  npm run -s clean:build:webpack || npm run build"
echo "  # If TypeScript still reports 'excessively deep', run:"
echo "  bash scripts/maintenance/find-supabase-query-cast-candidates.sh"
