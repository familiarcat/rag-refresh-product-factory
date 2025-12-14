#!/usr/bin/env bash
set -euo pipefail

OUT_DIR=".secrets"
mkdir -p "$OUT_DIR"

ALLOWLIST=(
  AWS_REGION
  AWS_ACCOUNT_ID
  ECR_REPO
  EC2_HOST
  EC2_USER
  N8N_WEBHOOK_URL
  N8N_PROJECT_WEBHOOK_URL
)

say(){ printf "%b\n" "$*"; }

ENV_DUMP="$OUT_DIR/_env_dump.txt"

# Source ~/.zshrc in a non-interactive login shell and dump env.
# If your ~/.zshrc has interactive-only content, move exports to ~/.zshenv.
zsh -lc 'set -a; source ~/.zshrc >/dev/null 2>&1; env' > "$ENV_DUMP" || true

LOCAL_ENV="$OUT_DIR/.env.local"
EC2_ENV="$OUT_DIR/.env.ec2"

: > "$LOCAL_ENV"
: > "$EC2_ENV"

for k in "${ALLOWLIST[@]}"; do
  v="$(grep -E "^${k}=" "$ENV_DUMP" | tail -n 1 | sed 's/^[^=]*=//')"
  if [[ -n "${v:-}" ]]; then
    v_escaped="$(printf "%s" "$v" | sed 's/\\/\\\\/g; s/"/\\"/g')"
    echo "${k}=\"${v_escaped}\"" >> "$LOCAL_ENV"
  fi
done

# Keep EC2 env minimal (runtime-only)
RUNTIME_KEYS=(AWS_REGION AWS_ACCOUNT_ID ECR_REPO)
for k in "${RUNTIME_KEYS[@]}"; do
  line="$(grep -E "^${k}=" "$LOCAL_ENV" | tail -n 1 || true)"
  [[ -n "${line:-}" ]] && echo "$line" >> "$EC2_ENV"
done

say "✅ Wrote:"
say "  - $LOCAL_ENV"
say "  - $EC2_ENV"
say ""
say "Security: .secrets/ is gitignored; do NOT commit generated env files."
