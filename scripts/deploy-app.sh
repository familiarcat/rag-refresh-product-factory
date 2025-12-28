#!/bin/bash
# Quick deploy script - builds, pushes, and deploys via SSM
# Usage: ./scripts/deploy-app.sh
# Records deployment metrics for cost tracking

set -euo pipefail

# Load secrets via Worf security system (prefers ~/.alexai-secrets)
if [ -f "$HOME/.alexai-secrets/api-keys.env" ]; then
    set -a
    source "$HOME/.alexai-secrets/api-keys.env"
    set +a
    echo "✓ Loaded secrets from Worf secure vault (~/.alexai-secrets)"
else
    # Fallback to legacy load_env.sh
    source scripts/secrets/load_env.sh
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# --- Resolve paths so the script can be run from anywhere ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# --- Secure env loading (matches deploy-with-orchestration.sh) ---
ENV_LOCAL="$PROJECT_ROOT/.env.local"
SECRETS_ENV_LOCAL="$PROJECT_ROOT/.secrets/.env.local"
SECRETS_SYNC_SCRIPT="$PROJECT_ROOT/scripts/secrets/sync_from_zshrc.sh"

say()  { printf "%b\n" "$*"; }
ok()   { say "${GREEN}✓${NC} $*"; }
warn() { say "${YELLOW}⚠️${NC}  $*"; }
die()  { say "${RED}❌${NC} $*"; exit 1; }

load_env_file() {
  local f="$1"
  # shellcheck disable=SC1090
  set -a
  source "$f"
  set +a
  return 0
}

say "📋 Loading environment variables..."
if [[ -f "$ENV_LOCAL" ]]; then
  load_env_file "$ENV_LOCAL" || die "Failed to source $ENV_LOCAL"
  ok "Loaded $ENV_LOCAL"
elif [[ -f "$SECRETS_ENV_LOCAL" ]]; then
  warn ".env.local not found; using generated secrets env at .secrets/.env.local"
  cp "$SECRETS_ENV_LOCAL" "$ENV_LOCAL"
  load_env_file "$ENV_LOCAL" || die "Failed to source $ENV_LOCAL"
  ok "Copied + loaded $ENV_LOCAL"
elif [[ -x "$SECRETS_SYNC_SCRIPT" ]]; then
  warn "No .env.local found; generating from ~/.zshrc allowlist via secrets sync..."
  "$SECRETS_SYNC_SCRIPT" || die "Secrets sync failed"
  if [[ -f "$SECRETS_ENV_LOCAL" ]]; then
    cp "$SECRETS_ENV_LOCAL" "$ENV_LOCAL"
    load_env_file "$ENV_LOCAL" || die "Failed to source $ENV_LOCAL"
    ok "Generated + loaded $ENV_LOCAL"
  else
    die "Secrets sync ran but $SECRETS_ENV_LOCAL was not created"
  fi
else
  warn "No env file found and secrets sync script missing; continuing with existing environment variables."
fi


# Start timing
START_TIME=$(date +%s)

echo -e "${YELLOW}🚀 RAG Refresh Quick Deploy${NC}"
echo ""

# Check for AWS credentials
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo -e "${RED}❌ AWS credentials not set. Export AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY${NC}"
    exit 1
fi

# Validate AWS credentials and region
echo -e "${YELLOW}Validating AWS credentials...${NC}"
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo -e "${RED}❌ AWS credentials are invalid or expired${NC}"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check your credentials in .env.local"
    echo "2. Verify AWS_REGION is set correctly (should be us-east-2)"
    echo "3. Run: aws configure list"
    echo "4. Run: aws sts get-caller-identity"
    echo ""
    exit 1
fi
echo -e "${GREEN}✓ AWS credentials valid${NC}"

# Configuration
AWS_REGION="${AWS_REGION:-us-east-2}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-860268930466}"
ECR_REPO="rag-refresh-product-factory"
EC2_INSTANCE_ID="${EC2_INSTANCE_ID:-i-006cd2a8477f36489}"
IMAGE_TAG="${1:-latest}"

ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
FULL_IMAGE="${ECR_URL}/${ECR_REPO}:${IMAGE_TAG}"

echo "📦 Configuration:"
echo "   Region: ${AWS_REGION}"
echo "   ECR: ${ECR_URL}/${ECR_REPO}"
echo "   Tag: ${IMAGE_TAG}"
echo "   Instance: ${EC2_INSTANCE_ID}"
echo ""

# Step 1: Login to ECR
echo -e "${YELLOW}Step 1/4: Logging into ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URL}
echo -e "${GREEN}✓ Logged in${NC}"

# Step 2: Build for linux/amd64
echo -e "${YELLOW}Step 2/4: Building image for linux/amd64...${NC}"
docker buildx build --platform linux/amd64 -t ${FULL_IMAGE} --push .
echo -e "${GREEN}✓ Built and pushed${NC}"

# Step 3: Deploy via SSM
echo -e "${YELLOW}Step 3/4: Deploying via SSM...${NC}"
COMMAND_ID=$(aws ssm send-command \
    --instance-ids "${EC2_INSTANCE_ID}" \
    --document-name "AWS-RunShellScript" \
    --parameters "commands=[
        \"aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URL}\",
        \"docker pull ${FULL_IMAGE}\",
        \"docker stop rag-app 2>/dev/null || true\",
        \"docker rm rag-app 2>/dev/null || true\",
        \"docker run -d --name rag-app -p 3000:3000 --restart always ${FULL_IMAGE}\",
        \"docker ps\"
    ]" \
    --query 'Command.CommandId' --output text)

echo "   Command ID: ${COMMAND_ID}"

# Step 4: Wait and verify
echo -e "${YELLOW}Step 4/4: Waiting for deployment...${NC}"
sleep 30

STATUS=$(aws ssm get-command-invocation \
    --command-id "${COMMAND_ID}" \
    --instance-id "${EC2_INSTANCE_ID}" \
    --query 'Status' --output text 2>/dev/null || echo "InProgress")

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Get image size (approximate from last build)
IMAGE_SIZE=$(docker images --format "{{.Size}}" "${FULL_IMAGE}" 2>/dev/null | head -1 || echo "150MB")
IMAGE_SIZE_BYTES=$(echo "$IMAGE_SIZE" | awk '/MB/{gsub(/MB/,""); print int($1 * 1024 * 1024)} /GB/{gsub(/GB/,""); print int($1 * 1024 * 1024 * 1024)}')
IMAGE_SIZE_BYTES=${IMAGE_SIZE_BYTES:-150000000}

# Get commit SHA
COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

if [ "$STATUS" = "Success" ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "🌐 Live at: https://rag.pbradygeorgen.com"
    echo ""
    aws ssm get-command-invocation \
        --command-id "${COMMAND_ID}" \
        --instance-id "${EC2_INSTANCE_ID}" \
        --query 'StandardOutputContent' --output text | tail -10
    
    # Record metrics (success)
    echo ""
    echo -e "${YELLOW}📊 Recording deployment metrics...${NC}"
    curl -s -X POST "https://rag.pbradygeorgen.com/api/deploy-metrics" \
        -H "Content-Type: application/json" \
        -d "{\"duration\": ${DURATION}, \"imageSize\": ${IMAGE_SIZE_BYTES}, \"trigger\": \"manual\", \"success\": true, \"commitSha\": \"${COMMIT_SHA}\"}" \
        > /dev/null 2>&1 || echo "   (Metrics recording skipped - app may be restarting)"
    
    echo -e "${GREEN}✓ Duration: ${DURATION}s | Image: ${IMAGE_SIZE}${NC}"
    
elif [ "$STATUS" = "InProgress" ]; then
    echo -e "${YELLOW}⏳ Deployment still in progress. Check status with:${NC}"
    echo "   aws ssm get-command-invocation --command-id ${COMMAND_ID} --instance-id ${EC2_INSTANCE_ID}"
else
    echo -e "${RED}❌ Deployment failed: ${STATUS}${NC}"
    aws ssm get-command-invocation \
        --command-id "${COMMAND_ID}" \
        --instance-id "${EC2_INSTANCE_ID}" \
        --query 'StandardErrorContent' --output text
    
    # Record metrics (failure)
    curl -s -X POST "https://rag.pbradygeorgen.com/api/deploy-metrics" \
        -H "Content-Type: application/json" \
        -d "{\"duration\": ${DURATION}, \"imageSize\": ${IMAGE_SIZE_BYTES}, \"trigger\": \"manual\", \"success\": false, \"commitSha\": \"${COMMIT_SHA}\"}" \
        > /dev/null 2>&1 || true
    
    exit 1
fi





