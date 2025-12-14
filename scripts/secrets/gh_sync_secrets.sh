#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.secrets/.env.local}"
[[ -f "$ENV_FILE" ]] || { echo "Missing $ENV_FILE"; exit 1; }
command -v gh >/dev/null || { echo "GitHub CLI (gh) not found"; exit 1; }

SECRET_KEYS=(
  AWS_ACCOUNT_ID
  AWS_REGION
  ECR_REPO
  EC2_HOST
  EC2_USER
  N8N_WEBHOOK_URL
  N8N_PROJECT_WEBHOOK_URL
)

echo "Pushing secrets from $ENV_FILE ..."
for k in "${SECRET_KEYS[@]}"; do
  v="$(grep -E "^${k}=" "$ENV_FILE" | sed 's/^[^=]*=//' | sed 's/^"//; s/"$//' | tail -n 1 || true)"
  if [[ -n "${v:-}" ]]; then
    echo " - setting $k"
    printf "%s" "$v" | gh secret set "$k" -b-
  else
    echo " - skipping $k (missing)"
  fi
done
echo "✅ GitHub secrets updated."
