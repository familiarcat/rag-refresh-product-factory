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

# Check if app code changed (triggers CI/CD deploy)
APP_CHANGES=$(git diff --cached --name-only 2>/dev/null | grep -E '^(app|components|lib|public|package|Dockerfile|next\.config|tsconfig)' || true)

node scripts/milestone/generate.mjs "$TITLE" > /tmp/milestone_meta.json
node scripts/milestone/upload_to_supabase.mjs /tmp/milestone_meta.json

# NOTE: milestone files are gitignored by default to avoid repo bloat.
git add -A
git commit -m "milestone: ${TITLE}" || true
git push

echo "✅ Milestone pushed and ingested to Supabase."

# Check for app changes and notify about CI/CD
if [[ -n "$APP_CHANGES" ]]; then
  echo ""
  echo "📦 App code changed - GitHub Actions will auto-deploy!"
  echo "   Changed: $(echo "$APP_CHANGES" | head -3 | tr '\n' ' ')..."
  echo "   Monitor: https://github.com/familiarcat/rag-refresh-product-factory/actions"
fi

# Manual deploy option
if [[ "$DEPLOY_FLAG" == "--deploy" ]]; then
  echo ""
  echo "🚀 Running manual deploy..."
  bash scripts/deploy-app.sh
elif [[ -n "$AWS_ACCESS_KEY_ID" ]] && [[ -z "$APP_CHANGES" ]]; then
  echo ""
  echo "💡 To manually deploy: ./scripts/deploy-app.sh"
fi

echo ""
echo "Run pruning anytime:"
echo "  node scripts/milestone/prune_local.mjs"
