#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

EXT_DIR="vscode-extension"
BRANCH="vscode-extension"
cmd="${1:-help}"

case "$cmd" in
  split)
    [[ -d "$EXT_DIR" ]] || err "Missing $EXT_DIR at repo root."
    warn "Updating branch '$BRANCH' from '$EXT_DIR' via git subtree split..."
    git subtree split --prefix "$EXT_DIR" -b "$BRANCH"
    ok "Branch '$BRANCH' updated."
    ;;
  push)
    warn "Pushing '$BRANCH' to origin..."
    git push -u origin "$BRANCH"
    ok "Pushed."
    ;;
  pull)
    warn "Merging '$BRANCH' back into current branch under '$EXT_DIR'..."
    git fetch origin "$BRANCH":"$BRANCH" || true
    git subtree merge --prefix "$EXT_DIR" "$BRANCH" -m "chore(vscode): subtree merge from $BRANCH"
    ok "Merged."
    ;;
  *)
    say "Usage: $0 split|push|pull"
    ;;
esac
