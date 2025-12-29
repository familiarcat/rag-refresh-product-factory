#!/bin/bash
# Deploy RAG Refresh with Intelligent Crew Orchestration
# This script deploys the complete system including:
# - TypeScript orchestration (Picard + Quark)
# - LLM batching system
# - Selective crew execution
#
# Usage:
#   npm run deploy:orchestration
#   ./scripts/deploy-with-orchestration.sh
#   Chat: "@alex deploy orchestration to AWS"

set -euo pipefail

source scripts/secrets/load_env.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  🚀 Intelligent Crew Orchestration Deployment                 ║${NC}"
echo -e "${CYAN}║  Deploying: Picard + Quark + Batching + Selective Execution   ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Start timing
START_TIME=$(date +%s)

# --- Env loading (secure, consistent with other /scripts) ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

say(){ echo -e "${CYAN}▶${NC} $*"; }
ok(){ echo -e "${GREEN}✅${NC} $*"; }
warn(){ echo -e "${YELLOW}⚠️${NC} $*"; }
die(){ echo -e "${RED}❌${NC} $*"; exit 1; }

ENV_LOCAL="$PROJECT_ROOT/.env.local"
SECRETS_ENV_LOCAL="$PROJECT_ROOT/.secrets/.env.local"
SECRETS_SYNC="$SCRIPT_DIR/secrets/sync_from_zshrc.sh"

load_env_file() {
  local f="$1"
  [[ -f "$f" ]] || return 1
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
elif [[ -x "$SECRETS_SYNC" ]]; then
  warn "No .env.local found; generating from ~/.zshenv + ~/.zshrc via allowlist..."
  bash "$SECRETS_SYNC"
  [[ -f "$SECRETS_ENV_LOCAL" ]] || die "Secrets sync did not produce $SECRETS_ENV_LOCAL"
  cp "$SECRETS_ENV_LOCAL" "$ENV_LOCAL"
  load_env_file "$ENV_LOCAL" || die "Failed to source $ENV_LOCAL"
  ok "Generated + copied + loaded $ENV_LOCAL"
else
  die ".env.local not found and secrets sync script missing. Run: npm run secrets:sync"
fi

# Validate required environment variables

echo ""
echo -e "${BLUE}🔍 Validating environment variables...${NC}"

REQUIRED_VARS=("OPENROUTER_API_KEY" "SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY")
MISSING_VARS=()

for VAR in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        MISSING_VARS+=("$VAR")
        echo -e "${RED}  ✗ $VAR is not set${NC}"
    else
        # Show first 10 chars for verification (security)
        VALUE="${!VAR}"
        PREVIEW="${VALUE:0:10}..."
        echo -e "${GREEN}  ✓ $VAR set (${PREVIEW})${NC}"
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Missing required environment variables. Please add to .env.local:${NC}"
    for VAR in "${MISSING_VARS[@]}"; do
        echo "  $VAR=..."
    done
    exit 1
fi

echo -e "${GREEN}✓ All required variables present${NC}"

# AWS Configuration
AWS_REGION="${AWS_REGION:-us-east-2}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-860268930466}"
ECR_REPO="rag-refresh-product-factory"
EC2_INSTANCE_ID="${EC2_INSTANCE_ID:-i-006cd2a8477f36489}"
IMAGE_TAG="${1:-latest}"
ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
FULL_IMAGE="${ECR_URL}/${ECR_REPO}:${IMAGE_TAG}"

echo ""
echo -e "${BLUE}⚙️  AWS Configuration:${NC}"
echo "   Region: ${AWS_REGION}"
echo "   Account: ${AWS_ACCOUNT_ID}"
echo "   ECR: ${ECR_URL}/${ECR_REPO}"
echo "   Tag: ${IMAGE_TAG}"
echo "   Instance: ${EC2_INSTANCE_ID}"
echo ""

# Check AWS credentials
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo -e "${RED}❌ AWS credentials not set${NC}"
    echo "Please export AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
    exit 1
fi

# Step 1: Login to ECR
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 1/5: Authenticating with AWS ECR...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URL}
echo -e "${GREEN}✓ Authenticated with ECR${NC}"
echo ""

# Step 2: Build and push Docker image
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 2/5: Building Docker image with orchestration system...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📦 Building for linux/amd64...${NC}"
echo ""
echo "   Included in this build:"
echo "   • lib/orchestration/ (Picard strategic analysis)"
echo "   • lib/orchestration/ (Quark cost optimization)"
echo "   • lib/crew/ (Selective crew execution)"
echo "   • lib/llm/ (Intelligent batching system)"
echo "   • app/api/crew/orchestrate/ (Orchestration endpoint)"
echo "   • app/api/crew/execute/ (Execution endpoint)"
echo ""

docker buildx build --platform linux/amd64 \
  --build-arg SUPABASE_URL="${SUPABASE_URL}" \
  --build-arg SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}" \
  --build-arg OPENROUTER_API_KEY="${OPENROUTER_API_KEY}" \
  -t ${FULL_IMAGE} --push .
echo ""
echo -e "${GREEN}✓ Built and pushed to ECR${NC}"
echo ""

# Step 3: Prepare deployment command with environment variables
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 3/5: Preparing deployment with environment variables...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Escape special characters for SSM command
OPENROUTER_KEY_ESCAPED=$(echo "$OPENROUTER_API_KEY" | sed "s/'/'\\\\''/g")
SUPABASE_URL_ESCAPED=$(echo "$SUPABASE_URL" | sed "s/'/'\\\\''/g")
SUPABASE_KEY_ESCAPED=$(echo "$SUPABASE_SERVICE_ROLE_KEY" | sed "s/'/'\\\\''/g")

echo -e "${CYAN}🔧 Environment variables will be injected into Docker container:${NC}"
echo "   • OPENROUTER_API_KEY (for LLM calls)"
echo "   • SUPABASE_URL (for crew memories & drill system)"
echo "   • SUPABASE_SERVICE_ROLE_KEY (for database access)"
echo "   • NODE_ENV=production"
echo "   • NEXT_TELEMETRY_DISABLED=1"
echo ""
echo -e "${GREEN}✓ Deployment configuration ready${NC}"
echo ""

# Step 4: Deploy via SSM
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 4/5: Deploying to EC2 via AWS Systems Manager...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

COMMAND_ID=$(aws ssm send-command \
    --instance-ids "${EC2_INSTANCE_ID}" \
    --document-name "AWS-RunShellScript" \
    --parameters "commands=[
        \"echo '🔐 Logging into ECR...'\",
        \"aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URL}\",
        \"echo '📥 Pulling latest image...'\",
        \"docker pull ${FULL_IMAGE}\",
        \"echo '🛑 Stopping existing container...'\",
        \"docker stop rag-app 2>/dev/null || echo '   (No container running)'\",
        \"docker rm rag-app 2>/dev/null || echo '   (No container to remove)'\",
        \"echo '🚀 Starting new container with orchestration system...'\",
        \"docker run -d --name rag-app -p 3000:3000 --restart always \
            -e NODE_ENV=production \
            -e NEXT_TELEMETRY_DISABLED=1 \
            -e OPENROUTER_API_KEY='${OPENROUTER_KEY_ESCAPED}' \
            -e SUPABASE_URL='${SUPABASE_URL_ESCAPED}' \
            -e SUPABASE_SERVICE_ROLE_KEY='${SUPABASE_KEY_ESCAPED}' \
            ${FULL_IMAGE}\",
        \"echo ''\",
        \"echo '✅ Deployment complete!'\",
        \"echo ''\",
        \"echo 'Container status:'\",
        \"docker ps --filter name=rag-app --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'\",
        \"echo ''\",
        \"echo 'Recent logs:'\",
        \"docker logs rag-app --tail 10 2>&1 || true\"
    ]" \
    --query 'Command.CommandId' --output text)

echo ""
echo -e "${CYAN}📡 SSM Command ID: ${COMMAND_ID}${NC}"
echo ""

# Step 5: Wait and verify
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Step 5/5: Waiting for deployment to complete...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

for i in {1..6}; do
    echo -e "${CYAN}⏳ Waiting... (${i}0s)${NC}"
    sleep 10
done

echo ""

# Check deployment status
STATUS=$(aws ssm get-command-invocation \
    --command-id "${COMMAND_ID}" \
    --instance-id "${EC2_INSTANCE_ID}" \
    --query 'Status' --output text 2>/dev/null || echo "InProgress")

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Deployment Results${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ "$STATUS" = "Success" ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ DEPLOYMENT SUCCESSFUL                                      ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}🌐 Live URL:${NC}"
    echo -e "   ${GREEN}https://rag.pbradygeorgen.com${NC}"
    echo ""
    echo -e "${CYAN}📊 Deployment Stats:${NC}"
    echo "   Duration: ${DURATION}s"
    echo "   Image: ${ECR_REPO}:${IMAGE_TAG}"
    echo "   Commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
    echo ""
    echo -e "${CYAN}🔧 New Features Deployed:${NC}"
    echo "   ✓ Picard strategic task analysis"
    echo "   ✓ Quark cost optimization"
    echo "   ✓ Selective crew activation (prevents over-calling)"
    echo "   ✓ LLM call batching (30-80% cost reduction)"
    echo "   ✓ POST /api/crew/orchestrate endpoint"
    echo "   ✓ POST /api/crew/execute endpoint"
    echo ""
    echo -e "${CYAN}📝 EC2 Instance Logs:${NC}"
    aws ssm get-command-invocation \
        --command-id "${COMMAND_ID}" \
        --instance-id "${EC2_INSTANCE_ID}" \
        --query 'StandardOutputContent' --output text | tail -20
    echo ""

    echo -e "${CYAN}🧪 Test Orchestration:${NC}"
    echo '   curl -X POST https://rag.pbradygeorgen.com/api/crew/orchestrate \'
    echo '     -H "Content-Type: application/json" \'
    echo '     -d '"'"'{"task": "Review security implementation"}'"'"
    echo ""

    echo -e "${CYAN}📱 Next Steps for VS Code Extension:${NC}"
    echo "   1. Update VS Code settings:"
    echo '      "alexAi.baseUrl": "https://rag.pbradygeorgen.com"'
    echo ""
    echo "   2. Rebuild extension:"
    echo "      npm run vscode:build && npm run vscode:install"
    echo ""
    echo "   3. Test in VS Code Copilot Chat:"
    echo "      @alex /picard Analyze this code"
    echo ""

elif [ "$STATUS" = "InProgress" ]; then
    echo -e "${YELLOW}⏳ Deployment still in progress...${NC}"
    echo ""
    echo "Check status with:"
    echo "  aws ssm get-command-invocation --command-id ${COMMAND_ID} --instance-id ${EC2_INSTANCE_ID}"
    echo ""
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ DEPLOYMENT FAILED                                          ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${RED}Status: ${STATUS}${NC}"
    echo ""
    echo -e "${CYAN}Error Output:${NC}"
    aws ssm get-command-invocation \
        --command-id "${COMMAND_ID}" \
        --instance-id "${EC2_INSTANCE_ID}" \
        --query 'StandardErrorContent' --output text
    echo ""
    exit 1
fi

echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""
