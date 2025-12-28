#!/usr/bin/env bash
#
# Rotate access keys for the RAG Refresh deployment user
# Run this periodically for security best practices
#
set -euo pipefail

IAM_USER_NAME="${IAM_USER_NAME:-rag-refresh-deployer}"
PROFILE_NAME="${AWS_PROFILE:-rag-refresh-deploy}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

say() { printf "${CYAN}▶${NC} %s\n" "$*"; }
ok() { printf "${GREEN}✅${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}⚠️${NC} %s\n" "$*"; }
die() { printf "${RED}❌${NC} %s\n" "$*"; exit 1; }

echo ""
echo "🔄 Rotating Access Keys for: $IAM_USER_NAME"
echo "============================================"
echo ""

# Verify we can access AWS
aws sts get-caller-identity >/dev/null 2>&1 || die "AWS credentials invalid"

# Get current access key
CURRENT_KEY=$(aws configure get aws_access_key_id --profile "$PROFILE_NAME" 2>/dev/null || echo "")

if [[ -z "$CURRENT_KEY" ]]; then
  die "No access key found for profile: $PROFILE_NAME"
fi

say "Current access key: $CURRENT_KEY"

# List all keys for user
EXISTING_KEYS=$(aws iam list-access-keys \
  --user-name "$IAM_USER_NAME" \
  --query 'AccessKeyMetadata[*].AccessKeyId' \
  --output text)

KEY_COUNT=$(echo "$EXISTING_KEYS" | wc -w | tr -d ' ')

# If 2 keys exist, delete the one that's not current
if [[ "$KEY_COUNT" -ge 2 ]]; then
  say "User has $KEY_COUNT keys, cleaning up old key..."
  for key in $EXISTING_KEYS; do
    if [[ "$key" != "$CURRENT_KEY" ]]; then
      aws iam delete-access-key --user-name "$IAM_USER_NAME" --access-key-id "$key"
      say "Deleted old key: $key"
    fi
  done
fi

# Create new key
say "Creating new access key..."

KEY_OUTPUT=$(aws iam create-access-key \
  --user-name "$IAM_USER_NAME" \
  --output json)

NEW_ACCESS_KEY_ID=$(echo "$KEY_OUTPUT" | jq -r '.AccessKey.AccessKeyId')
NEW_SECRET_ACCESS_KEY=$(echo "$KEY_OUTPUT" | jq -r '.AccessKey.SecretAccessKey')

ok "Created new key: $NEW_ACCESS_KEY_ID"

# Update local profile
say "Updating local profile: $PROFILE_NAME"

aws configure set aws_access_key_id "$NEW_ACCESS_KEY_ID" --profile "$PROFILE_NAME"
aws configure set aws_secret_access_key "$NEW_SECRET_ACCESS_KEY" --profile "$PROFILE_NAME"

# Test new credentials
say "Testing new credentials..."
sleep 2

if aws sts get-caller-identity --profile "$PROFILE_NAME" >/dev/null 2>&1; then
  ok "New credentials working!"
  
  # Delete old key
  say "Deleting old key: $CURRENT_KEY"
  aws iam delete-access-key --user-name "$IAM_USER_NAME" --access-key-id "$CURRENT_KEY" --profile "$PROFILE_NAME"
  ok "Old key deleted"
else
  die "New credentials failed! Old key preserved."
fi

echo ""
ok "Key rotation complete!"
echo ""
echo "New Access Key ID: $NEW_ACCESS_KEY_ID"
echo ""
echo "Update your ~/.zshrc if needed:"
echo "  export RAG_REFRESH_AWS_ACCESS_KEY_ID=\"$NEW_ACCESS_KEY_ID\""
echo "  export RAG_REFRESH_AWS_SECRET_ACCESS_KEY=\"$NEW_SECRET_ACCESS_KEY\""
echo ""





