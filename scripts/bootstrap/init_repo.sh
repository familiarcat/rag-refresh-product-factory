#!/usr/bin/env bash
set -euo pipefail

REPO_SSH_URL="${1:-git@github.com:familiarcat/rag-refresh-product-factory.git}"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

git init >/dev/null 2>&1 || true

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REPO_SSH_URL"
  ok "Updated origin → $REPO_SSH_URL"
else
  git remote add origin "$REPO_SSH_URL"
  ok "Added origin → $REPO_SSH_URL"
fi

git checkout -B main >/dev/null 2>&1 || true
ok "Branch set to main"

say "Next:"
say "  git add -A && git commit -m "chore: bootstrap" && git push -u origin main"
