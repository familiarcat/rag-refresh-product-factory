#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }

# Ensure .gitignore has required entries
ensure_ignore () {
  local pattern="$1"
  if ! rg -n --fixed-strings "$pattern" .gitignore >/dev/null 2>&1; then
    echo "$pattern" >> .gitignore
  fi
}

touch .gitignore

ensure_ignore ""
ensure_ignore "# --- AlexAI build trash / caches ---"
ensure_ignore ".next/"
ensure_ignore ".trash/"
ensure_ignore ".tmp/"
ensure_ignore "node_modules/"
ensure_ignore "*.log"
ensure_ignore "*.pid"
ensure_ignore ".DS_Store"

# Keep VSCode config but ignore the rest
if ! rg -n "^\.vscode/\*$" .gitignore >/dev/null 2>&1; then
  cat >> .gitignore <<'EOF'

# VSCode: ignore workspace noise but keep sharable config
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
!.vscode/launch.json

EOF
fi

say "✅ .gitignore updated."

# Remove common trash dirs from index if they were ever added
git rm -r --cached .next .trash .tmp node_modules 2>/dev/null || true

# Also remove any cached files inside .trash (if a weird one slipped in)
if git ls-files --cached | rg -n "^\.(trash|next|tmp)/" >/dev/null 2>&1; then
  git ls-files --cached | rg -n "^\.(trash|next|tmp)/" | awk '{print $1}' | while read -r f; do
    git rm --cached -f "$f" >/dev/null 2>&1 || true
  done
fi

say "✅ Git index cleaned."

git add .gitignore

say "Now run:"
say "  git add ."
say "  git status"
