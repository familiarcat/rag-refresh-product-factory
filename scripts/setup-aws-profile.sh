#!/usr/bin/env bash
#
# Create a dedicated AWS IAM user and local profile for RAG Refresh deployment
# This follows the principle of least privilege
#
set -euo pipefail

PROFILE_NAME="rag-refresh-deploy"
IAM_USER_NAME="rag-refresh-deployer"
REGION="${AWS_REGION:-us-east-2}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

say() { printf "${CYAN}▶${NC} %s\n" "$*"; }
ok() { printf "${GREEN}✅${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}⚠️${NC} %s\n" "$*"; }
die() { printf "${RED}❌${NC} %s\n" "$*"; exit 1; }

# Check if we have working AWS credentials
check_aws() {
  say "Checking AWS credentials..."
  
  if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo ""
    warn "Current AWS credentials are invalid!"
    echo ""
    echo "Please do ONE of the following:"
    echo ""
    echo "1. Refresh via AWS Console:"
    echo "   - Go to: https://console.aws.amazon.com/iam/"
    echo "   - Navigate to Users → Your User → Security credentials"
    echo "   - Create new Access Key"
    echo "   - Run: aws configure"
    echo ""
    echo "2. Use temporary credentials from AWS Console:"
    echo "   - Click your username in AWS Console"
    echo "   - Select 'Security credentials'"
    echo "   - Copy the temporary credentials"
    echo ""
    echo "3. Export credentials directly:"
    echo "   export AWS_ACCESS_KEY_ID=your_key"
    echo "   export AWS_SECRET_ACCESS_KEY=your_secret"
    echo "   export AWS_REGION=us-east-2"
    echo ""
    die "Fix credentials and re-run this script"
  fi
  
  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  ok "Authenticated to AWS Account: $ACCOUNT_ID"
}

# Create IAM policy for deployment
create_policy() {
  POLICY_NAME="RagRefreshDeployPolicy"
  
  say "Creating IAM policy: $POLICY_NAME"
  
  # Check if policy exists
  EXISTING_POLICY=$(aws iam list-policies --query "Policies[?PolicyName=='$POLICY_NAME'].Arn" --output text 2>/dev/null || echo "")
  
  if [[ -n "$EXISTING_POLICY" ]]; then
    ok "Policy already exists: $EXISTING_POLICY"
    POLICY_ARN="$EXISTING_POLICY"
    return
  fi
  
  # Create policy document
  POLICY_DOC=$(cat <<'POLICY'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EC2Permissions",
      "Effect": "Allow",
      "Action": [
        "ec2:Describe*",
        "ec2:CreateSecurityGroup",
        "ec2:DeleteSecurityGroup",
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:AuthorizeSecurityGroupEgress",
        "ec2:RevokeSecurityGroupIngress",
        "ec2:RevokeSecurityGroupEgress",
        "ec2:RunInstances",
        "ec2:TerminateInstances",
        "ec2:CreateTags",
        "ec2:DeleteTags",
        "ec2:StartInstances",
        "ec2:StopInstances"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ECRPermissions",
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
        "ecr:ListImages"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ALBPermissions",
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ACMPermissions",
      "Effect": "Allow",
      "Action": [
        "acm:RequestCertificate",
        "acm:DescribeCertificate",
        "acm:DeleteCertificate",
        "acm:ListCertificates",
        "acm:AddTagsToCertificate"
      ],
      "Resource": "*"
    },
    {
      "Sid": "Route53Permissions",
      "Effect": "Allow",
      "Action": [
        "route53:GetHostedZone",
        "route53:ListHostedZones",
        "route53:ChangeResourceRecordSets",
        "route53:GetChange",
        "route53:ListResourceRecordSets"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchPermissions",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricAlarm",
        "cloudwatch:DeleteAlarms",
        "cloudwatch:DescribeAlarms",
        "sns:CreateTopic",
        "sns:DeleteTopic",
        "sns:Subscribe",
        "sns:Unsubscribe"
      ],
      "Resource": "*"
    },
    {
      "Sid": "IAMPassRole",
      "Effect": "Allow",
      "Action": [
        "iam:PassRole",
        "iam:GetRole"
      ],
      "Resource": "*"
    }
  ]
}
POLICY
)

  POLICY_ARN=$(aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --policy-document "$POLICY_DOC" \
    --query 'Policy.Arn' \
    --output text)
  
  ok "Created policy: $POLICY_ARN"
}

# Create IAM user
create_user() {
  say "Creating IAM user: $IAM_USER_NAME"
  
  # Check if user exists
  if aws iam get-user --user-name "$IAM_USER_NAME" >/dev/null 2>&1; then
    ok "User already exists: $IAM_USER_NAME"
  else
    aws iam create-user --user-name "$IAM_USER_NAME"
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
  say "Creating access keys..."
  
  # Delete existing keys if any (max 2 per user)
  EXISTING_KEYS=$(aws iam list-access-keys --user-name "$IAM_USER_NAME" --query 'AccessKeyMetadata[*].AccessKeyId' --output text 2>/dev/null || echo "")
  
  if [[ -n "$EXISTING_KEYS" ]]; then
    warn "User has existing access keys"
    read -p "Delete existing keys and create new ones? (y/n): " confirm
    if [[ "$confirm" == "y" ]]; then
      for key in $EXISTING_KEYS; do
        aws iam delete-access-key --user-name "$IAM_USER_NAME" --access-key-id "$key"
        say "Deleted key: $key"
      done
    else
      die "Cannot proceed with existing keys. Delete them manually or press 'y' next time."
    fi
  fi
  
  # Create new access key
  KEY_OUTPUT=$(aws iam create-access-key --user-name "$IAM_USER_NAME" --output json)
  
  ACCESS_KEY_ID=$(echo "$KEY_OUTPUT" | jq -r '.AccessKey.AccessKeyId')
  SECRET_ACCESS_KEY=$(echo "$KEY_OUTPUT" | jq -r '.AccessKey.SecretAccessKey')
  
  ok "Created new access key: $ACCESS_KEY_ID"
  
  # Store for profile creation
  export NEW_ACCESS_KEY_ID="$ACCESS_KEY_ID"
  export NEW_SECRET_ACCESS_KEY="$SECRET_ACCESS_KEY"
}

# Configure local AWS profile
configure_profile() {
  say "Configuring local AWS profile: $PROFILE_NAME"
  
  # Add to credentials file
  aws configure set aws_access_key_id "$NEW_ACCESS_KEY_ID" --profile "$PROFILE_NAME"
  aws configure set aws_secret_access_key "$NEW_SECRET_ACCESS_KEY" --profile "$PROFILE_NAME"
  aws configure set region "$REGION" --profile "$PROFILE_NAME"
  aws configure set output json --profile "$PROFILE_NAME"
  
  ok "Profile configured: $PROFILE_NAME"
  
  # Test the new profile
  say "Testing new profile..."
  sleep 2  # Give AWS a moment to propagate
  
  if AWS_PROFILE="$PROFILE_NAME" aws sts get-caller-identity >/dev/null 2>&1; then
    ok "Profile is working!"
  else
    warn "Profile may need a few seconds to propagate. Try again in a moment."
  fi
}

# Get Route53 zone info
get_route53_info() {
  say "Fetching Route53 hosted zones..."
  
  ZONES=$(aws route53 list-hosted-zones --query 'HostedZones[*].[Name,Id]' --output text 2>/dev/null || echo "")
  
  if [[ -n "$ZONES" ]]; then
    echo ""
    echo "Available Route53 Hosted Zones:"
    echo "================================"
    echo "$ZONES" | while read -r name id; do
      zone_id=$(echo "$id" | sed 's|/hostedzone/||')
      echo "  Domain: $name"
      echo "  Zone ID: $zone_id"
      echo ""
    done
  else
    warn "No Route53 hosted zones found"
  fi
}

# Get EC2 key pairs
get_keypair_info() {
  say "Fetching EC2 key pairs..."
  
  KEYPAIRS=$(aws ec2 describe-key-pairs --query 'KeyPairs[*].KeyName' --output text 2>/dev/null || echo "")
  
  if [[ -n "$KEYPAIRS" ]]; then
    echo ""
    echo "Available EC2 Key Pairs:"
    echo "========================"
    for kp in $KEYPAIRS; do
      echo "  - $kp"
    done
    echo ""
  else
    warn "No EC2 key pairs found. You'll need to create one."
    echo ""
    echo "To create a key pair:"
    echo "  aws ec2 create-key-pair --key-name rag-refresh-key --query 'KeyMaterial' --output text > ~/.ssh/rag-refresh-key.pem"
    echo "  chmod 400 ~/.ssh/rag-refresh-key.pem"
  fi
}

# Create terraform.tfvars
create_tfvars() {
  INFRA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../infra" && pwd)"
  TFVARS_FILE="$INFRA_DIR/terraform.tfvars"
  
  if [[ -f "$TFVARS_FILE" ]]; then
    warn "terraform.tfvars already exists. Skipping creation."
    return
  fi
  
  say "Creating terraform.tfvars..."
  
  # Get first keypair
  KEYPAIR=$(aws ec2 describe-key-pairs --query 'KeyPairs[0].KeyName' --output text 2>/dev/null || echo "")
  
  # Get first Route53 zone
  ZONE_INFO=$(aws route53 list-hosted-zones --query 'HostedZones[0].[Name,Id]' --output text 2>/dev/null || echo "")
  DOMAIN=$(echo "$ZONE_INFO" | awk '{print $1}' | sed 's/\.$//')
  ZONE_ID=$(echo "$ZONE_INFO" | awk '{print $2}' | sed 's|/hostedzone/||')
  
  cat > "$TFVARS_FILE" <<EOF
# Generated by setup-aws-profile.sh on $(date)
aws_region = "$REGION"

# EC2 Configuration
key_name       = "${KEYPAIR:-your-key-name}"
instance_type  = "t3.small"
root_volume_gb = 40

# Security
allowed_ssh_cidrs = ["0.0.0.0/0"]  # TODO: Restrict to your IP

# Naming
name = "rag-refresh-product-factory"

# TLS/Domain Configuration
enable_alb_tls  = true
domain_name     = "${DOMAIN:-yourdomain.com}"
route53_zone_id = "${ZONE_ID:-your-zone-id}"

# Subdomains
app_subdomain = "rag"
n8n_subdomain = "n8n"
EOF

  ok "Created $TFVARS_FILE"
  echo ""
  echo "Please review and update the file before deploying."
}

# Main
main() {
  echo ""
  echo "🚀 RAG Refresh AWS Profile Setup"
  echo "================================="
  echo ""
  
  check_aws
  create_policy
  create_user
  create_access_keys
  configure_profile
  
  echo ""
  echo "📋 AWS Resource Information"
  echo "============================"
  get_route53_info
  get_keypair_info
  
  create_tfvars
  
  echo ""
  echo "🎉 Setup Complete!"
  echo "=================="
  echo ""
  echo "New AWS Profile: $PROFILE_NAME"
  echo ""
  echo "To use this profile for deployment:"
  echo "  export AWS_PROFILE=$PROFILE_NAME"
  echo "  ./scripts/deploy-to-aws.sh deploy"
  echo ""
  echo "Or add to your ~/.zshrc:"
  echo "  export AWS_PROFILE=$PROFILE_NAME"
  echo ""
}

main "$@"

