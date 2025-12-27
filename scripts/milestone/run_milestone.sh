#!/usr/bin/env bash
set -euo pipefail

TITLE="${1:-}"
[[ -n "$TITLE" ]] || { echo "Usage: scripts/milestone/run_milestone.sh \"Milestone title\""; exit 1; }

# Load local env if present (server-side only)
if [[ -f ".env.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

node scripts/milestone/generate.mjs "$TITLE" > /tmp/milestone_meta.json
node scripts/milestone/upload_to_supabase.mjs /tmp/milestone_meta.json

# NOTE: milestone files are gitignored by default to avoid repo bloat.
git add -A
git commit -m "milestone: ${TITLE}" || true
git push

echo "✅ Milestone pushed and ingested to Supabase."
echo "Run pruning anytime:"
echo "  node scripts/milestone/prune_local.mjs"
