#!/usr/bin/env bash
#
# Deploy RAG Refresh Product Factory to AWS EC2
# Usage: ./scripts/deploy-to-aws.sh [plan|apply|destroy]
#
set -euo pipefail

source scripts/secrets/load_env.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
INFRA_DIR="$PROJECT_ROOT/infra"

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

# Check prerequisites
check_prereqs() {
  say "Checking prerequisites..."
  
  command -v terraform >/dev/null || die "terraform not found. Install: brew install terraform"
  command -v aws >/dev/null || die "aws cli not found. Install: brew install awscli"
  command -v docker >/dev/null || die "docker not found. Install Docker Desktop"
  
  # Check AWS credentials
  aws sts get-caller-identity >/dev/null 2>&1 || die "AWS credentials not configured. Run: aws configure"
  
  ok "Prerequisites satisfied"
}

# Initialize Terraform
tf_init() {
  say "Initializing Terraform..."
  cd "$INFRA_DIR"
  terraform init -upgrade
  ok "Terraform initialized"
}

# Check for tfvars
check_tfvars() {
  if [[ ! -f "$INFRA_DIR/terraform.tfvars" ]]; then
    warn "terraform.tfvars not found!"
    echo ""
    echo "Create it from the example:"
    echo "  cp infra/terraform.tfvars.example infra/terraform.tfvars"
    echo ""
    echo "Required variables:"
    echo "  - aws_region"
    echo "  - key_name (existing EC2 keypair)"
    echo "  - domain_name (if using TLS)"
    echo "  - route53_zone_id (if using TLS)"
    echo ""
    die "Please configure terraform.tfvars first"
  fi
}

# Plan infrastructure
tf_plan() {
  say "Planning infrastructure..."
  cd "$INFRA_DIR"
  terraform plan -out=tfplan
  ok "Plan saved to infra/tfplan"
}

# Apply infrastructure
tf_apply() {
  say "Applying infrastructure..."
  cd "$INFRA_DIR"
  
  if [[ -f "tfplan" ]]; then
    terraform apply tfplan
    rm -f tfplan
  else
    terraform apply
  fi
  
  ok "Infrastructure deployed!"
  echo ""
  terraform output
}

# Destroy infrastructure
tf_destroy() {
  warn "This will DESTROY all AWS resources!"
  read -p "Are you sure? (type 'destroy' to confirm): " confirm
  
  if [[ "$confirm" == "destroy" ]]; then
    cd "$INFRA_DIR"
    terraform destroy
    ok "Infrastructure destroyed"
  else
    say "Aborted"
  fi
}

# Build and push Docker image
build_and_push() {
  say "Building Docker image..."
  
  # Get AWS account info
  AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  AWS_REGION=$(cd "$INFRA_DIR" && terraform output -raw aws_region 2>/dev/null || echo "us-east-1")
  
  ECR_REPO="rag-refresh-product-factory"
  REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
  IMAGE_TAG="${IMAGE_TAG:-latest}"
  FULL_IMAGE="${REGISTRY}/${ECR_REPO}:${IMAGE_TAG}"
  
  # Create ECR repo if needed
  aws ecr describe-repositories --repository-names "$ECR_REPO" --region "$AWS_REGION" >/dev/null 2>&1 || \
    aws ecr create-repository --repository-name "$ECR_REPO" --region "$AWS_REGION"
  
  # Login to ECR
  say "Logging into ECR..."
  aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$REGISTRY"
  
  # Build image
  say "Building image: $FULL_IMAGE"
  cd "$PROJECT_ROOT"
  docker build -t "$FULL_IMAGE" -t "${ECR_REPO}:${IMAGE_TAG}" .
  
  # Push to ECR
  say "Pushing to ECR..."
  docker push "$FULL_IMAGE"
  
  ok "Image pushed: $FULL_IMAGE"
  echo ""
  echo "To deploy to EC2, SSH into the instance and run:"
  echo "  export AWS_REGION=$AWS_REGION"
  echo "  export AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID"
  echo "  export ECR_REPO_APP=$ECR_REPO"
  echo "  export IMAGE_TAG=$IMAGE_TAG"
  echo "  /opt/app/scripts/ec2/deploy_all.sh"
}

# Full deployment
full_deploy() {
  check_prereqs
  check_tfvars
  tf_init
  tf_apply
  build_and_push
  
  echo ""
  ok "🚀 Deployment complete!"
  echo ""
  cd "$INFRA_DIR"
  echo "App URL:  $(terraform output -raw app_url 2>/dev/null || echo 'N/A - enable_alb_tls=false')"
  echo "n8n URL:  $(terraform output -raw n8n_url 2>/dev/null || echo 'N/A - enable_alb_tls=false')"
  echo "EC2 IP:   $(terraform output -raw public_ip)"
}

# Show usage
usage() {
  echo "Usage: $0 [command]"
  echo ""
  echo "Commands:"
  echo "  plan      - Plan infrastructure changes"
  echo "  apply     - Apply infrastructure (provision EC2)"
  echo "  destroy   - Destroy all AWS resources"
  echo "  build     - Build and push Docker image to ECR"
  echo "  deploy    - Full deployment (init + apply + build)"
  echo "  output    - Show Terraform outputs"
  echo ""
  echo "Quick start:"
  echo "  1. cp infra/terraform.tfvars.example infra/terraform.tfvars"
  echo "  2. Edit terraform.tfvars with your values"
  echo "  3. ./scripts/deploy-to-aws.sh deploy"
}

# Main
case "${1:-}" in
  plan)
    check_prereqs
    check_tfvars
    tf_init
    tf_plan
    ;;
  apply)
    check_prereqs
    check_tfvars
    tf_init
    tf_apply
    ;;
  destroy)
    check_prereqs
    tf_destroy
    ;;
  build)
    check_prereqs
    build_and_push
    ;;
  deploy)
    full_deploy
    ;;
  output)
    cd "$INFRA_DIR"
    terraform output
    ;;
  *)
    usage
    ;;
esac





