#!/usr/bin/env bash
#
# Cleanup IAM resources for RAG Refresh Product Factory
# Use this when decommissioning the project
#
set -euo pipefail

IAM_USER_NAME="${IAM_USER_NAME:-rag-refresh-deployer}"
POLICY_NAME="${POLICY_NAME:-RagRefreshDeployPolicy}"

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
echo "🧹 Cleanup IAM Resources"
echo "========================"
echo ""
warn "This will DELETE the following resources:"
echo "  - IAM User: $IAM_USER_NAME"
echo "  - IAM Policy: $POLICY_NAME"
echo "  - All access keys for the user"
echo ""
read -p "Are you sure? Type 'delete' to confirm: " confirm

if [[ "$confirm" != "delete" ]]; then
  say "Aborted"
  exit 0
fi

# Verify AWS access
aws sts get-caller-identity >/dev/null 2>&1 || die "AWS credentials invalid"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Delete access keys
say "Deleting access keys..."
KEYS=$(aws iam list-access-keys --user-name "$IAM_USER_NAME" --query 'AccessKeyMetadata[*].AccessKeyId' --output text 2>/dev/null || echo "")
for key in $KEYS; do
  aws iam delete-access-key --user-name "$IAM_USER_NAME" --access-key-id "$key" 2>/dev/null || true
  say "  Deleted key: $key"
done

# Detach policies
say "Detaching policies..."
POLICIES=$(aws iam list-attached-user-policies --user-name "$IAM_USER_NAME" --query 'AttachedPolicies[*].PolicyArn' --output text 2>/dev/null || echo "")
for policy in $POLICIES; do
  aws iam detach-user-policy --user-name "$IAM_USER_NAME" --policy-arn "$policy" 2>/dev/null || true
  say "  Detached: $policy"
done

# Delete user
say "Deleting user: $IAM_USER_NAME"
aws iam delete-user --user-name "$IAM_USER_NAME" 2>/dev/null || warn "User may not exist"
ok "User deleted"

# Delete policy
POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"
say "Deleting policy: $POLICY_NAME"
aws iam delete-policy --policy-arn "$POLICY_ARN" 2>/dev/null || warn "Policy may not exist"
ok "Policy deleted"

# Delete SSM parameters
say "Cleaning up SSM parameters..."
aws ssm delete-parameter --name "/rag-refresh/deploy/access-key-id" 2>/dev/null || true
aws ssm delete-parameter --name "/rag-refresh/deploy/secret-access-key" 2>/dev/null || true
ok "SSM parameters deleted"

# Remove local profile
say "Removing local AWS profile..."
if [[ -f ~/.aws/credentials ]]; then
  # Create backup
  cp ~/.aws/credentials ~/.aws/credentials.backup
  # Remove profile section (this is a simple approach)
  warn "Please manually remove [rag-refresh-deploy] section from ~/.aws/credentials"
fi

echo ""
ok "Cleanup complete!"
echo ""
echo "Don't forget to:"
echo "  1. Remove AWS exports from ~/.zshrc"
echo "  2. Remove [rag-refresh-deploy] from ~/.aws/credentials"
echo "  3. Run: source ~/.zshrc"
echo ""
