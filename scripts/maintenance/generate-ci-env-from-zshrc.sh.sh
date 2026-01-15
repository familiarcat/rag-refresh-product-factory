#!/usr/bin/env bash
set -euo pipefail

ZSHRC="${HOME}/.zshrc"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

ALLOWLIST=(
  N8N_EMAIL
  N8N_PROJECT_WEBHOOK_URL
  N8N_WEBHOOK_URL
  SUPABASE_URL
  ECR_REPOSITORY
  AUTHORIZED_USERS
)

OUT_ENV=".env.example"
OUT_DOC="docs/ci-secrets.md"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

[[ -f "$ZSHRC" ]] || err "Missing $ZSHRC"

extract_var() {
  local key="$1"
  # Match: export KEY="value" or export KEY='value' or export KEY=value
  local line
  line="$(grep -E "^\s*export\s+${key}=" "$ZSHRC" | tail -n 1 || true)"
  [[ -n "$line" ]] || return 1
  # Strip leading `export KEY=`
  local val="${line#*export ${key}=}"
  # Strip surrounding quotes if present
  val="${val%\"}"; val="${val#\"}"
  val="${val%\'}"; val="${val#\'}"
  printf "%s" "$val"
}

mkdir -p docs

say "# Non-secret runtime config" > "$OUT_ENV"
say "# Generated from ~/.zshrc (allowlisted keys only)" >> "$OUT_ENV"
say "" >> "$OUT_ENV"

for k in "${ALLOWLIST[@]}"; do
  v="$(extract_var "$k" || true)"
  if [[ -z "${v:-}" ]]; then
    # keep placeholder
    say "${k}=" >> "$OUT_ENV"
  else
    # write value only if it is clearly non-secret; AUTHORIZED_USERS is borderline -> keep but you can comment out
    say "${k}=${v}" >> "$OUT_ENV"
  fi
done

say "" >> "$OUT_ENV"
say "# Secrets (set locally via ~/.alexai-secrets/api-keys.env or in GitHub Actions Secrets)" >> "$OUT_ENV"
say "OPENROUTER_API_KEY=" >> "$OUT_ENV"
say "N8N_API_KEY=" >> "$OUT_ENV"
say "N8N_OWNER_API_KEY=" >> "$OUT_ENV"

ok "Wrote $OUT_ENV"

cat > "$OUT_DOC" <<'MD'
# CI/CD Secrets & Config

This repo uses a split between:

## Non-secret config (committable)
- `.env.example` contains non-secret defaults like URLs.

## Secrets (NEVER commit)
Set these in **GitHub Actions → Settings → Secrets and variables → Actions**:

- `OPENROUTER_API_KEY` (required)
- `N8N_API_KEY` (required for webhook calls)
- `N8N_OWNER_API_KEY` (optional; only for admin endpoints)

### Local development
Store secrets in:
- `~/.alexai-secrets/api-keys.env`

And ensure your shell loads them (your `.zshrc` already calls `load_alex_ai_secrets`).

## Goal contract
All model billing should route via **OpenRouter**, with n8n crew orchestration performing usage attribution.
MD

ok "Wrote $OUT_DOC"

say ""
say "Next:"
say "  1) Commit .env.example and docs/ci-secrets.md"
say "  2) Add required GitHub Secrets"
