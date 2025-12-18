#!/usr/bin/env bash
set -euo pipefail

# Parse arguments - supports both positional and flag-based
TITLE=""
DEPLOY_FLAG=""

for arg in "$@"; do
  case "$arg" in
    --deploy) DEPLOY_FLAG="--deploy" ;;
    *) [[ -z "$TITLE" ]] && TITLE="$arg" ;;
  esac
done

[[ -n "$TITLE" ]] || { echo "Usage: scripts/milestone/run_milestone.sh \"Milestone title\" [--deploy]"; exit 1; }

# Load local env if present (for Supabase upload)
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

# Deploy via GitHub Actions (never local - ensures all deploys are from committed code)
if [[ "$DEPLOY_FLAG" == "--deploy" ]]; then
  echo "🚀 Triggering deployment via GitHub Actions..."
  echo "   (All deployments go through CI/CD for auditability)"
  echo ""
  
  if command -v gh >/dev/null 2>&1; then
    gh workflow run deploy.yml
    echo "✅ Deploy workflow triggered!"
    echo ""
    echo "Monitor at: https://github.com/familiarcat/rag-refresh-product-factory/actions"
    echo "Or run: gh run list --workflow=deploy.yml --limit 1"
  else
    echo "⚠️  GitHub CLI not installed. Trigger manually:"
    echo "   gh workflow run deploy.yml"
    echo "   Or visit: https://github.com/familiarcat/rag-refresh-product-factory/actions"
  fi
else
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📋 Milestone Complete - Deploy when ready"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "To deploy (via GitHub Actions):"
  echo "  gh workflow run deploy.yml"
  echo "  Or: npm run milestone:deploy -- \"title\""
  echo ""
fi

echo "Run pruning anytime:"
echo "  node scripts/milestone/prune_local.mjs"
