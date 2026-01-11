#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

command -v gh >/dev/null 2>&1 || err "GitHub CLI (gh) is required."
gh auth status >/dev/null 2>&1 || err "gh is not authenticated. Run: gh auth login"

REPO="${GH_REPO:-}"
if [[ -z "$REPO" ]]; then
  origin="$(git remote get-url origin 2>/dev/null || true)"
  [[ -z "$origin" ]] && err "No git remote 'origin' found. Set GH_REPO=owner/name or add origin."
  if [[ "$origin" =~ github\.com[:/]+([^/]+)/([^/.]+)(\.git)?$ ]]; then
    REPO="${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
  else
    err "Could not parse owner/name from origin: $origin (set GH_REPO=owner/name)"
  fi
fi

VARS=(
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  SUPABASE_ANON_KEY
  SUPABASE_PROJECT_ID
)

missing=0
for var in "${VARS[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    warn "$var not set in current shell. Tip: bash scripts/secrets/sync_supabase_from_zshrc.sh && set -a; source .env.local; set +a"
    missing=1
  fi
done
[[ "$missing" == "1" ]] && warn "Continuing, but missing vars will be skipped."

for var in "${VARS[@]}"; do
  val="${!var:-}"
  [[ -z "$val" ]] && continue
  printf "%s" "$val" | gh secret set "$var" -R "$REPO" -b -
  ok "Set GitHub secret: $var (repo: $REPO)"
done

say ""
say "In GitHub Actions workflow, add:"
say "env:"
for var in "${VARS[@]}"; do
  say "  $var: \${{ secrets.$var }}"
done
