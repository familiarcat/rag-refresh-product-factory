#!/usr/bin/env bash
set -euo pipefail

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
die(){ say "❌ $*"; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ok "Unified setup starting..."

npm run secrets:sync || die "secrets:sync failed"
ok "Local env synced from ~/.zshrc/.zshenv"

npm run check:env || warn "check:env reports missing vars (expected if n8n not configured yet)"

if command -v gh >/dev/null; then
  if gh auth status >/dev/null 2>&1; then
    npm run secrets:gh || warn "Failed to sync secrets to GitHub (check gh permissions)"
  else
    warn "gh not authenticated. Run: gh auth login"
  fi
else
  warn "gh not installed; skipping GitHub secrets sync"
fi

say ""
ok "Next steps:"
say "1) Ensure GitHub Secrets/Vars are set (docs/INFRA_DEPLOY_PLAYBOOK.md)"
say "2) Run GitHub Action: Infra + Deploy (Terraform → ECR → EC2)"
say ""
