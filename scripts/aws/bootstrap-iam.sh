#!/usr/bin/env bash
#
# Bootstrap IAM User for RAG Refresh Product Factory
# 
# Run this script in AWS CloudShell or locally with admin credentials.
# It creates a dedicated deployment user with minimal required permissions.
#
# Usage:
#   # In AWS CloudShell (recommended for initial setup):
#   curl -sL https://raw.githubusercontent.com/familiarcat/rag-refresh-product-factory/main/scripts/aws/bootstrap-iam.sh | bash
#
#   # Or locally with admin credentials:
#   ./scripts/aws/bootstrap-iam.sh
#
set -euo pipefail

# Configuration
IAM_USER_NAME="${IAM_USER_NAME:-rag-refresh-deployer}"
POLICY_NAME="${POLICY_NAME:-RagRefreshDeployPolicy}"
REGION="${AWS_REGION:-us-east-2}"

# Colors (works in CloudShell too)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

say() { printf "${CYAN}▶${NC} %s\n" "$*"; }
ok() { printf "${GREEN}✅${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}⚠️${NC} %s\n" "$*"; }
die() { printf "${RED}❌${NC} %s\n" "$*"; exit 1; }
header() { printf "\n${BOLD}${CYAN}%s${NC}\n" "$*"; printf '%*s\n' "${#1}" '' | tr ' ' '='; }

# Verify AWS access
verify_access() {
  header "Verifying AWS Access"
  
  if ! command -v aws &>/dev/null; then
    die "AWS CLI not found. Install it first."
  fi
  
  CALLER=$(aws sts get-caller-identity 2>&1) || die "AWS credentials invalid. Are you in CloudShell or have valid credentials?"
  
  ACCOUNT_ID=$(echo "$CALLER" | jq -r '.Account')
  CALLER_ARN=$(echo "$CALLER" | jq -r '.Arn')
  
  ok "Authenticated as: $CALLER_ARN"
  ok "Account ID: $ACCOUNT_ID"
  
  export AWS_ACCOUNT_ID="$ACCOUNT_ID"
}

# Create the IAM policy
create_policy() {
  header "Creating IAM Policy: $POLICY_NAME"
  
  # Check if policy exists
  EXISTING_ARN=$(aws iam list-policies \
    --query "Policies[?PolicyName=='$POLICY_NAME'].Arn" \
    --output text 2>/dev/null || echo "")
  
  if [[ -n "$EXISTING_ARN" && "$EXISTING_ARN" != "None" ]]; then
    ok "Policy already exists: $EXISTING_ARN"
    export POLICY_ARN="$EXISTING_ARN"
    return
  fi
  
  say "Creating new policy..."
  
  # Policy document with minimal required permissions
  POLICY_DOC=$(cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EC2Management",
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "ec2:CreateSecurityGroup",
        "ec2:DeleteSecurityGroup",
        "ec2:AuthorizeSecurityGroup*",
        "ec2:RevokeSecurityGroup*",
        "ec2:RunInstances",
        "ec2:TerminateInstances",
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:CreateTags",
        "ec2:DeleteTags",
        "ec2:CreateKeyPair",
        "ec2:DeleteKeyPair",
        "ec2:ImportKeyPair"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ECRManagement",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:CreateRepository",
        "ecr:DescribeRepositories",
        "ecr:DeleteRepository",
        "ecr:ListImages",
        "ecr:DeleteRepositoryPolicy",
        "ecr:SetRepositoryPolicy",
        "ecr:GetRepositoryPolicy"
      ],
      "Resource": "*"
    },
    {
      "Sid": "LoadBalancerManagement",
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CertificateManagement",
      "Effect": "Allow",
      "Action": [
        "acm:RequestCertificate",
        "acm:DescribeCertificate",
        "acm:DeleteCertificate",
        "acm:ListCertificates",
        "acm:AddTagsToCertificate",
        "acm:ListTagsForCertificate",
        "acm:GetCertificate"
      ],
      "Resource": "*"
    },
    {
      "Sid": "DNSManagement",
      "Effect": "Allow",
      "Action": [
        "route53:GetHostedZone",
        "route53:ListHostedZones",
        "route53:ListHostedZonesByName",
        "route53:ChangeResourceRecordSets",
        "route53:GetChange",
        "route53:ListResourceRecordSets"
      ],
      "Resource": "*"
    },
    {
      "Sid": "MonitoringManagement",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricAlarm",
        "cloudwatch:DeleteAlarms",
        "cloudwatch:DescribeAlarms",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics",
        "sns:CreateTopic",
        "sns:DeleteTopic",
        "sns:Subscribe",
        "sns:Unsubscribe",
        "sns:ListTopics",
        "sns:GetTopicAttributes",
        "sns:SetTopicAttributes"
      ],
      "Resource": "*"
    },
    {
      "Sid": "SSMAccess",
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:PutParameter",
        "ssm:DeleteParameter",
        "ssm:DescribeParameters"
      ],
      "Resource": "*"
    },
    {
      "Sid": "IAMPassRole",
      "Effect": "Allow",
      "Action": [
        "iam:PassRole",
        "iam:GetRole",
        "iam:GetInstanceProfile",
        "iam:ListInstanceProfiles"
      ],
      "Resource": "*"
    }
  ]
}
EOF
)

  POLICY_ARN=$(aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --policy-document "$POLICY_DOC" \
    --description "Deployment permissions for RAG Refresh Product Factory" \
    --query 'Policy.Arn' \
    --output text)
  
  ok "Created policy: $POLICY_ARN"
  export POLICY_ARN
}

# Create the IAM user
create_user() {
  header "Creating IAM User: $IAM_USER_NAME"
  
  # Check if user exists
  if aws iam get-user --user-name "$IAM_USER_NAME" &>/dev/null; then
    ok "User already exists: $IAM_USER_NAME"
  else
    say "Creating new user..."
    aws iam create-user \
      --user-name "$IAM_USER_NAME" \
      --tags Key=Project,Value=rag-refresh-product-factory Key=ManagedBy,Value=bootstrap-iam.sh
    ok "Created user: $IAM_USER_NAME"
  fi
  
  # Attach policy
  say "Attaching policy to user..."
  aws iam attach-user-policy \
    --user-name "$IAM_USER_NAME" \
    --policy-arn "$POLICY_ARN" 2>/dev/null || true
  ok "Policy attached"
}

# Create access keys
create_access_keys() {
  header "Creating Access Keys"
  
  # Check existing keys
  EXISTING_KEYS=$(aws iam list-access-keys \
    --user-name "$IAM_USER_NAME" \
    --query 'AccessKeyMetadata[*].AccessKeyId' \
    --output text 2>/dev/null || echo "")
  
  KEY_COUNT=$(echo "$EXISTING_KEYS" | wc -w | tr -d ' ')
  
  if [[ "$KEY_COUNT" -ge 2 ]]; then
    warn "User already has 2 access keys (AWS limit)"
    echo ""
    echo "Existing keys:"
    for key in $EXISTING_KEYS; do
      echo "  - $key"
    done
    echo ""
    read -p "Delete oldest key and create new one? (y/n): " confirm
    if [[ "$confirm" == "y" ]]; then
      OLDEST_KEY=$(echo "$EXISTING_KEYS" | awk '{print $1}')
      aws iam delete-access-key --user-name "$IAM_USER_NAME" --access-key-id "$OLDEST_KEY"
      say "Deleted key: $OLDEST_KEY"
    else
      warn "Skipping key creation. Use existing keys."
      return
    fi
  fi
  
  say "Generating new access key..."
  
  KEY_OUTPUT=$(aws iam create-access-key \
    --user-name "$IAM_USER_NAME" \
    --output json)
  
  ACCESS_KEY_ID=$(echo "$KEY_OUTPUT" | jq -r '.AccessKey.AccessKeyId')
  SECRET_ACCESS_KEY=$(echo "$KEY_OUTPUT" | jq -r '.AccessKey.SecretAccessKey')
  
  ok "Created access key: $ACCESS_KEY_ID"
  
  # Store for output
  export NEW_ACCESS_KEY_ID="$ACCESS_KEY_ID"
  export NEW_SECRET_ACCESS_KEY="$SECRET_ACCESS_KEY"
}

# Get infrastructure info
get_infra_info() {
  header "AWS Infrastructure Info"
  
  # EC2 Key Pairs
  say "EC2 Key Pairs:"
  KEYPAIRS=$(aws ec2 describe-key-pairs --query 'KeyPairs[*].KeyName' --output text 2>/dev/null || echo "none")
  if [[ -n "$KEYPAIRS" && "$KEYPAIRS" != "none" ]]; then
    for kp in $KEYPAIRS; do
      echo "    - $kp"
    done
  else
    warn "  No EC2 key pairs found"
    echo ""
    echo "  Create one with:"
    echo "    aws ec2 create-key-pair --key-name rag-refresh-key --query 'KeyMaterial' --output text > ~/.ssh/rag-refresh-key.pem"
  fi
  
  echo ""
  
  # Route53 Zones
  say "Route53 Hosted Zones:"
  ZONES=$(aws route53 list-hosted-zones --query 'HostedZones[*].[Name,Id]' --output text 2>/dev/null || echo "")
  if [[ -n "$ZONES" ]]; then
    echo "$ZONES" | while read -r name id; do
      zone_id=$(echo "$id" | sed 's|/hostedzone/||')
      echo "    Domain: ${name%.}"
      echo "    Zone ID: $zone_id"
      echo ""
    done
  else
    warn "  No Route53 hosted zones found"
  fi
}

# Output configuration
output_config() {
  header "Configuration Output"
  
  cat <<EOF

${BOLD}═══════════════════════════════════════════════════════════════${NC}
${GREEN}✅ IAM User Created Successfully!${NC}
${BOLD}═══════════════════════════════════════════════════════════════${NC}

${CYAN}AWS Credentials (SAVE THESE - Secret won't be shown again!):${NC}
───────────────────────────────────────────────────────────────
AWS_ACCESS_KEY_ID=${NEW_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${NEW_SECRET_ACCESS_KEY}
AWS_REGION=${REGION}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}

${CYAN}Configure locally with:${NC}
───────────────────────────────────────────────────────────────
aws configure --profile rag-refresh-deploy

  Access Key ID: ${NEW_ACCESS_KEY_ID}
  Secret Access Key: ${NEW_SECRET_ACCESS_KEY}
  Region: ${REGION}
  Output format: json

${CYAN}Or export directly:${NC}
───────────────────────────────────────────────────────────────
export AWS_PROFILE=rag-refresh-deploy
export AWS_ACCESS_KEY_ID=${NEW_ACCESS_KEY_ID}
export AWS_SECRET_ACCESS_KEY=${NEW_SECRET_ACCESS_KEY}
export AWS_REGION=${REGION}

${CYAN}Add to ~/.zshrc:${NC}
───────────────────────────────────────────────────────────────
# RAG Refresh Product Factory AWS
export RAG_REFRESH_AWS_ACCESS_KEY_ID="${NEW_ACCESS_KEY_ID}"
export RAG_REFRESH_AWS_SECRET_ACCESS_KEY="${NEW_SECRET_ACCESS_KEY}"
export RAG_REFRESH_AWS_REGION="${REGION}"
export RAG_REFRESH_AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID}"

${CYAN}Verify with:${NC}
───────────────────────────────────────────────────────────────
aws sts get-caller-identity --profile rag-refresh-deploy

${CYAN}Then deploy:${NC}
───────────────────────────────────────────────────────────────
cd /path/to/rag-refresh-product-factory
export AWS_PROFILE=rag-refresh-deploy
./scripts/deploy-to-aws.sh deploy

EOF
}

# Store credentials in SSM (optional, for CI/CD)
store_in_ssm() {
  header "Store in SSM Parameter Store (Optional)"
  
  read -p "Store credentials in SSM for CI/CD? (y/n): " confirm
  if [[ "$confirm" != "y" ]]; then
    say "Skipping SSM storage"
    return
  fi
  
  say "Storing in SSM..."
  
  aws ssm put-parameter \
    --name "/rag-refresh/deploy/access-key-id" \
    --value "$NEW_ACCESS_KEY_ID" \
    --type SecureString \
    --overwrite >/dev/null
  
  aws ssm put-parameter \
    --name "/rag-refresh/deploy/secret-access-key" \
    --value "$NEW_SECRET_ACCESS_KEY" \
    --type SecureString \
    --overwrite >/dev/null
  
  ok "Credentials stored in SSM Parameter Store"
  echo "  /rag-refresh/deploy/access-key-id"
  echo "  /rag-refresh/deploy/secret-access-key"
}

# Create EC2 key pair if none exists
create_keypair_if_needed() {
  KEYPAIRS=$(aws ec2 describe-key-pairs --query 'KeyPairs[*].KeyName' --output text 2>/dev/null || echo "")
  
  if [[ -z "$KEYPAIRS" ]]; then
    header "Creating EC2 Key Pair"
    
    KEYPAIR_NAME="rag-refresh-key"
    say "Creating key pair: $KEYPAIR_NAME"
    
    # Create key and save to current directory
    aws ec2 create-key-pair \
      --key-name "$KEYPAIR_NAME" \
      --query 'KeyMaterial' \
      --output text > "${KEYPAIR_NAME}.pem"
    
    chmod 400 "${KEYPAIR_NAME}.pem"
    
    ok "Created key pair: $KEYPAIR_NAME"
    echo "  Private key saved to: $(pwd)/${KEYPAIR_NAME}.pem"
    echo ""
    warn "Download this file and save to ~/.ssh/ on your local machine!"
  fi
}

# Main
main() {
  echo ""
  echo "${BOLD}🚀 RAG Refresh Product Factory - IAM Bootstrap${NC}"
  echo "================================================"
  echo ""
  
  verify_access
  create_policy
  create_user
  create_access_keys
  create_keypair_if_needed
  get_infra_info
  output_config
  store_in_ssm
  
  echo ""
  ok "Bootstrap complete!"
  echo ""
}

main "$@"

