#!/usr/bin/env bash
set -euo pipefail

OUT_DIR=".secrets"
mkdir -p "$OUT_DIR"

# Only export keys you explicitly allow.
# Put long-lived exports in ~/.zshenv if your ~/.zshrc is interactive-heavy.
ALLOWLIST=(
  # GitHub CLI
  GH_TOKEN

  # Supabase (server-side only)
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

  # Embeddings provider (optional)
  OPENAI_API_KEY
  OPENAI_EMBED_MODEL

  # n8n crew hooks
  N8N_WEBHOOK_URL
  N8N_PROJECT_WEBHOOK_URL

  # AWS / ECR / EC2
  AWS_REGION
  AWS_ACCOUNT_ID
  ECR_REPO
  AWS_ROLE_TO_ASSUME
  EC2_HOST
  EC2_USER
)

say(){ printf "%b\n" "$*"; }

ENV_DUMP="$OUT_DIR/_env_dump.txt"

# Source ~/.zshrc in a non-interactive login shell and dump env.
zsh -lc 'set -a; source ~/.zshrc >/dev/null 2>&1; env' > "$ENV_DUMP" || true

LOCAL_ENV="$OUT_DIR/.env.local"
CICD_ENV="$OUT_DIR/.env.cicd"

: > "$LOCAL_ENV"
: > "$CICD_ENV"

for k in "${ALLOWLIST[@]}"; do
  v="$(grep -E "^${k}=" "$ENV_DUMP" | tail -n 1 | sed 's/^[^=]*=//')"
  if [[ -n "${v:-}" ]]; then
    v_escaped="$(printf "%s" "$v" | sed 's/\\/\\\\/g; s/"/\\"/g')"
    echo "${k}=\"${v_escaped}\"" >> "$LOCAL_ENV"
  fi
done

# CI/CD env is a safe subset (no runtime secrets that shouldn't go to GitHub)
CICD_KEYS=(
  AWS_REGION
  AWS_ACCOUNT_ID
  ECR_REPO
  AWS_ROLE_TO_ASSUME
  EC2_HOST
  EC2_USER
  SUPABASE_URL
)
for k in "${CICD_KEYS[@]}"; do
  line="$(grep -E "^${k}=" "$LOCAL_ENV" | tail -n 1 || true)"
  [[ -n "${line:-}" ]] && echo "$line" >> "$CICD_ENV"
done

say "✅ Wrote:"
say "  - $LOCAL_ENV   (local dev + server-side secrets)"
say "  - $CICD_ENV    (safe subset for CI/CD bootstrap)"
say ""
say "Security:"
say "  - $OUT_DIR is gitignored; do NOT commit generated env files."
