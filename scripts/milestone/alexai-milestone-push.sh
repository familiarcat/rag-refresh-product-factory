#!/usr/bin/env bash
set -euo pipefail

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

REMOTE_NAME="${ALEXAI_REMOTE_NAME:-origin}"
BRANCH="$(git branch --show-current 2>/dev/null || echo main)"

ok "AlexAI milestone push: verify → milestone → push"

bash scripts/maintenance/verify-origin-auth-size.sh

# Your existing milestone runner:
if [[ -x scripts/milestone/run_milestone.sh ]]; then
  warn "Running milestone workflow…"
  bash scripts/milestone/run_milestone.sh
  ok "Milestone workflow complete."
else
  say ""
  say "Next commands:"
  say "  ls -la scripts/milestone"
  err "Missing scripts/milestone/run_milestone.sh"
fi

warn "Pushing to $REMOTE_NAME $BRANCH…"
git push -u "$REMOTE_NAME" "$BRANCH"
git push "$REMOTE_NAME" --tags

ok "Milestone push complete."
