#!/bin/bash
# Quick deploy script - builds, pushes, and deploys via SSM
# Usage: ./scripts/deploy-app.sh
# Records deployment metrics for cost tracking

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Start timing
START_TIME=$(date +%s)

echo -e "${YELLOW}🚀 RAG Refresh Quick Deploy${NC}"
echo ""

# Check for AWS credentials
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo -e "${RED}❌ AWS credentials not set. Export AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY${NC}"
    exit 1
fi

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
