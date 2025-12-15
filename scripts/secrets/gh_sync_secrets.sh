#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.secrets/.env.local}"
[[ -f "$ENV_FILE" ]] || { echo "Missing $ENV_FILE"; exit 1; }

command -v gh >/dev/null || { echo "GitHub CLI (gh) not found"; exit 1; }

# Keys to push into GitHub Actions Secrets.
# NOTE: keep SUPABASE_SERVICE_ROLE_KEY and OPENAI_API_KEY as GitHub Secrets ONLY if you accept this risk.
# Many teams prefer to keep embedding keys out of CI and only run ingestion locally.
SECRET_KEYS=(
  AWS_ACCOUNT_ID
  AWS_REGION
  ECR_REPO
  AWS_ROLE_TO_ASSUME
  EC2_HOST
  EC2_USER

  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

  N8N_WEBHOOK_URL
  N8N_PROJECT_WEBHOOK_URL

  OPENAI_API_KEY
  OPENAI_EMBED_MODEL
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

echo ""
echo "✅ GitHub secrets updated."
echo "Reminder: add EC2_SSH_PRIVATE_KEY manually in GitHub Secrets (Settings → Secrets and variables → Actions)."
