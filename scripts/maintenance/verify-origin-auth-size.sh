#!/usr/bin/env bash
set -euo pipefail

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

MAX_MB="${ALEXAI_MAX_MB:-95}"
MAX_BYTES=$((MAX_MB * 1024 * 1024))

REMOTE_NAME="${ALEXAI_REMOTE_NAME:-origin}"
REMOTE_URL_DEFAULT="${ALEXAI_REMOTE_URL:-}"

# -----------------------------
# 1) Ensure origin remote exists
# -----------------------------
remote_url=""
if git remote get-url "$REMOTE_NAME" >/dev/null 2>&1; then
  remote_url="$(git remote get-url "$REMOTE_NAME")"
  ok "Remote '$REMOTE_NAME' found: $remote_url"
else
  warn "Remote '$REMOTE_NAME' is missing."
  if [[ -n "$REMOTE_URL_DEFAULT" ]]; then
    git remote add "$REMOTE_NAME" "$REMOTE_URL_DEFAULT"
    remote_url="$(git remote get-url "$REMOTE_NAME")"
    ok "Added '$REMOTE_NAME' from ALEXAI_REMOTE_URL: $remote_url"
  else
    say ""
    say "Next commands:"
    say "  git remote add $REMOTE_NAME ssh://github.com/familiarcat/rag-refresh-product-factory.git"
    say "  # OR (https): git remote add $REMOTE_NAME https://github.com/familiarcat/rag-refresh-product-factory.git"
    say "  git remote -v"
    err "No remote configured. Set ALEXAI_REMOTE_URL or add remote manually."
  fi
fi

# -----------------------------
# 2) Verify auth (ssh vs https)
# -----------------------------
if [[ "$remote_url" == git@github.com:* || "$remote_url" == ssh://github.com/* ]]; then
  warn "SSH remote detected. Verifying SSH auth to GitHub…"
  if ssh -T git@github.com >/dev/null 2>&1; then
    ok "SSH auth OK (git@github.com)."
  else
    say ""
    say "Next commands:"
    say "  ssh -T git@github.com"
    say "  # If fails, add a key to agent (choose one that exists):"
    say "  ssh-add --apple-use-keychain ~/.ssh/id_ed25519 2>/dev/null || ssh-add ~/.ssh/id_rsa"
    say "  ssh -T git@github.com"
    err "SSH auth failed."
  fi
else
  warn "HTTPS remote detected. Verifying GitHub CLI auth…"
  if command -v gh >/dev/null 2>&1; then
    if gh auth status >/dev/null 2>&1; then
      ok "gh auth OK."
    else
      say ""
      say "Next commands:"
      say "  gh auth login"
      say "  gh auth status"
      err "gh not authenticated."
    fi
  else
    say ""
    say "Next commands:"
    say "  brew install gh"
    say "  gh auth login"
    err "GitHub CLI (gh) not installed; HTTPS pushes may fail without a credential helper."
  fi
fi

# -----------------------------
# 3) Block huge files (staged)
# -----------------------------
warn "Checking staged files > ${MAX_MB}MB…"
big_staged="$(git diff --cached --name-only -z | while IFS= read -r -d '' f; do
  [[ -f "$f" ]] || continue
  sz="$(wc -c <"$f" 2>/dev/null || echo 0)"
  if (( sz > MAX_BYTES )); then
    printf "%s\t%s\n" "$sz" "$f"
  fi
done || true)"

if [[ -n "${big_staged}" ]]; then
  say ""
  say "❌ Found staged files larger than ${MAX_MB}MB:"
  echo "$big_staged" | awk '{mb=$1/1024/1024; $1=""; sub(/^ /,""); printf "  - %.2f MB  %s\n", mb, $0}'
  say ""
  say "Next commands (choose one):"
  say "  # Unstage (keep file):"
  say "  git restore --staged <path>"
  say "  # Remove from git tracking (keep file locally):"
  say "  git rm --cached <path>"
  say "  # Add ignore rule:"
  say "  echo '<path>' >> .gitignore"
  err "Blocked push: huge staged file(s)."
else
  ok "No huge staged files."
fi

# -----------------------------
# 4) Detect tracked huge blobs in history (common GitHub reject cause)
# -----------------------------
warn "Checking for tracked blobs > ${MAX_MB}MB in git object database (this catches already-committed zips)…"
# This is fast and reliable even if your filesystem scan hangs due to fileproviderd.
big_blobs="$(git rev-list --objects --all 2>/dev/null \
  | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' 2>/dev/null \
  | awk -v max="$MAX_BYTES" '$1=="blob" && $3>max {print}' \
  | sort -nrk3 | head -n 20 || true)"

if [[ -n "${big_blobs}" ]]; then
  say ""
  say "❌ Large tracked blobs detected (these will keep breaking GitHub pushes):"
  echo "$big_blobs" | awk '{mb=$3/1024/1024; $1=$2=$3=""; sub(/^   /,""); printf "  - %.2f MB  %s\n", mb, $0}'
  say ""
  say "Next commands (recommended: rewrite history):"
  say "  brew install git-filter-repo"
  say "  # Example: remove your press-logs zip(s) from history:"
  say "  git filter-repo --path .press-logs/rag-refresh-product-factory_20260105_223305.zip --invert-paths"
  say "  # Then force-push:"
  say "  git push -u $REMOTE_NAME \$(git branch --show-current) --force"
  say "  git push $REMOTE_NAME --force --tags"
  err "Blocked: repo history contains blobs > ${MAX_MB}MB."
else
  ok "No huge tracked blobs detected in history."
fi

ok "Git remote/auth/size checks passed."
