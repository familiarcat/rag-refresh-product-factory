#!/usr/bin/env bash
set -euo pipefail

: "${AWS_REGION:?missing AWS_REGION}"
: "${AWS_ACCOUNT_ID:?missing AWS_ACCOUNT_ID}"
: "${ECR_REPO:?missing ECR_REPO}"
: "${IMAGE_TAG:?missing IMAGE_TAG}"

REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_IMAGE="${REGISTRY}/${ECR_REPO}:${IMAGE_TAG}"

echo "Deploying: $ECR_IMAGE"

command -v aws >/dev/null || { echo "aws cli not installed on EC2"; exit 1; }
command -v docker >/dev/null || { echo "docker not installed on EC2"; exit 1; }

aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$REGISTRY"
docker pull "$ECR_IMAGE"

APP_DIR="/opt/app"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

export ECR_IMAGE
docker compose -f docker/compose.ec2.yml up -d
docker ps
