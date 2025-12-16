#!/usr/bin/env bash
set -euo pipefail

TITLE="${1:-}"
DEPLOY_FLAG="${2:-}"

[[ -n "$TITLE" ]] || { echo "Usage: scripts/milestone/run_milestone.sh \"Milestone title\" [--deploy]"; exit 1; }

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

echo "✅ Milestone pushed to Git + Supabase"
echo ""

# Manual deploy option
if [[ "$DEPLOY_FLAG" == "--deploy" ]]; then
  echo "🚀 Running manual deploy to AWS..."
  bash scripts/deploy-app.sh
else
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📋 Development Mode: Auto-deploy is OFF"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "To deploy when ready:"
  echo "  Local:   ./scripts/deploy-app.sh"
  echo "  GitHub:  gh workflow run deploy.yml"
  echo "  With ms: ./scripts/milestone/run_milestone.sh \"title\" --deploy"
  echo ""
fi

echo "Run pruning anytime:"
echo "  node scripts/milestone/prune_local.mjs"
