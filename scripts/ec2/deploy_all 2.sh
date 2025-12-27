#!/usr/bin/env bash
set -euo pipefail

say(){ printf "%b\n" "$*"; }
die(){ say "❌ $*"; exit 1; }

: "${AWS_REGION:?missing AWS_REGION}"
: "${AWS_ACCOUNT_ID:?missing AWS_ACCOUNT_ID}"
: "${ECR_REPO_APP:?missing ECR_REPO_APP}"
: "${IMAGE_TAG:?missing IMAGE_TAG}"

REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
APP_IMAGE="${REGISTRY}/${ECR_REPO_APP}:${IMAGE_TAG}"

N8N_IMAGE="${N8N_IMAGE:-n8nio/n8n:latest}"
N8N_PORT="${N8N_PORT:-5678}"
APP_PORT="${APP_PORT:-3000}"

say "🔐 Login to ECR"
command -v aws >/dev/null || die "aws cli missing on EC2"
command -v docker >/dev/null || die "docker missing on EC2"
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$REGISTRY" >/dev/null

say "📦 Pull app image: $APP_IMAGE"
docker pull "$APP_IMAGE" >/dev/null

mkdir -p /opt/stacks/n8n /opt/stacks/app

# Copy stack files from /opt/app (which CI should upload)
[[ -f "/opt/app/docker/stacks/n8n/docker-compose.yml" ]] && cp /opt/app/docker/stacks/n8n/docker-compose.yml /opt/stacks/n8n/docker-compose.yml
[[ -f "/opt/app/docker/stacks/app/docker-compose.yml" ]] && cp /opt/app/docker/stacks/app/docker-compose.yml /opt/stacks/app/docker-compose.yml

touch /opt/stacks/n8n/.env /opt/stacks/app/.env
echo "N8N_IMAGE=$N8N_IMAGE" > /opt/stacks/n8n/.env
echo "N8N_PORT=$N8N_PORT" >> /opt/stacks/n8n/.env
echo "APP_IMAGE=$APP_IMAGE" > /opt/stacks/app/.env
echo "APP_PORT=$APP_PORT" >> /opt/stacks/app/.env
[[ -n "${N8N_WEBHOOK_URL:-}" ]] && echo "N8N_WEBHOOK_URL=$N8N_WEBHOOK_URL" >> /opt/stacks/app/.env || true
[[ -n "${N8N_PROJECT_WEBHOOK_URL:-}" ]] && echo "N8N_PROJECT_WEBHOOK_URL=$N8N_PROJECT_WEBHOOK_URL" >> /opt/stacks/app/.env || true

say "🧠 Deploy n8n first"
cd /opt/stacks/n8n
docker compose --env-file .env up -d

say "⏳ Wait for n8n readiness"
for i in {1..60}; do
  if curl -fsS "http://localhost:5678/healthz/readiness" >/dev/null 2>&1; then
    say "✅ n8n ready"
    break
  fi
  sleep 5
  [[ "$i" -eq 60 ]] && die "n8n did not become ready in time"
done

say "🚀 Deploy app"
cd /opt/stacks/app
docker compose --env-file .env up -d

say "⏳ Wait for app health"
for i in {1..40}; do
  if curl -fsS "http://localhost:3000/" >/dev/null 2>&1; then
    say "✅ app healthy"
    break
  fi
  sleep 5
  [[ "$i" -eq 40 ]] && die "app did not become healthy in time"
done

say "🎉 Done"
