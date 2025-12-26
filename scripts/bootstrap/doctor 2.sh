#!/usr/bin/env bash
set -euo pipefail

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
die(){ say "❌ $*"; exit 1; }

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ok "RAG Refresh Product Factory: Doctor"

for cmd in git node npm; do
  command -v "$cmd" >/dev/null && ok "found $cmd" || die "missing $cmd"
done

command -v gh >/dev/null && ok "found gh (GitHub CLI)" || warn "missing gh (needed for secrets sync)"
command -v aws >/dev/null && ok "found aws cli" || warn "missing aws cli (needed for infra/app deploy)"
command -v terraform >/dev/null && ok "found terraform" || warn "missing terraform (needed for infra apply)"

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  ok "git repo detected"
  remote="$(git config --get remote.origin.url || true)"
  [[ -n "$remote" ]] && ok "origin: $remote" || warn "origin not set (run npm run bootstrap:init)"
else
  warn "not a git repo (run npm run bootstrap:init)"
fi

if [[ -f ".env.local" ]]; then
  ok ".env.local present"
else
  warn ".env.local missing (run npm run secrets:sync or copy .env.local.example)"
fi

REQ=(SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY AWS_REGION AWS_ACCOUNT_ID)
missing=0
for k in "${REQ[@]}"; do
  if [[ -n "${!k:-}" ]]; then ok "$k set in shell"; else warn "$k not set in shell (expected via ~/.zshenv/.zshrc)"; missing=1; fi
done

say ""
if [[ "$missing" -eq 1 ]]; then
  warn "Some env vars missing in shell. Add exports to ~/.zshenv (preferred) or ~/.zshrc."
else
  ok "Shell environment looks good."
fi
