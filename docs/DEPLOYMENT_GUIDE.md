# Alex AI - End-to-End Deployment Guide

**Complete deployment workflow for Alex AI Crew Assistant**

This guide covers deploying both the web dashboard and VSCode extension with data synchronization.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Web Dashboard Deployment](#web-dashboard-deployment)
4. [VSCode Extension Deployment](#vscode-extension-deployment)
5. [Data Synchronization](#data-synchronization)
6. [Verification & Testing](#verification--testing)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Production Stack                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  VSCode Extension│◄────────┤  Web Dashboard   │         │
│  │  (Local Install) │  HTTP   │  Next.js + Docker│         │
│  │                  │         │                   │         │
│  │  - Chat UI       │         │  - Project UI    │         │
│  │  - Code Context  │         │  - Crew Mgmt     │         │
│  │  - File Tools    │         │  - API Routes    │         │
│  └────────┬─────────┘         └────────┬─────────┘         │
│           │                            │                    │
│           │    ┌──────────────────────┴─────────┐          │
│           │    │     Shared Data Layer          │          │
│           │    │                                 │          │
│           └───►│  - projects.json                │          │
│                │  - crew_memories.json           │          │
│                │  - collaboration_log.json       │          │
│                │  - deploy-metrics.json          │          │
│                └─────────────────────────────────┘          │
│                                                              │
│  Production URL: https://rag.pbradygeorgen.com               │
│  Extension Config: alexAi.baseUrl = production URL          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Components

1. **Web Dashboard** (Next.js)
   - Deployed to EC2 via Docker/ECR
   - URL: `https://rag.pbradygeorgen.com`
   - Port: 3000
   - Data: `/app/data/*.json` (in container)

2. **VSCode Extension** (TypeScript)
   - Installed locally via `.vsix` package
   - Connects to web dashboard API
   - Config: `alexAi.baseUrl` setting
   - Data: Synced via HTTP API

3. **Data Layer** (JSON files)
   - `data/projects.json` - Project definitions
   - `data/crew_memories.json` - Crew learning history
   - `data/collaboration_log.json` - Collaboration events
   - `data/deploy-metrics.json` - Deployment analytics

---

## Prerequisites

### Required Tools

```bash
# Development tools
node --version          # v20+
npm --version          # v10+
docker --version       # v24+

# AWS CLI
aws --version          # v2.x

# VSCode
code --version         # v1.85+

# Optional: GitHub CLI
gh --version           # v2.x
```

### AWS Setup

```bash
# 1. Configure AWS credentials
export AWS_ACCESS_KEY_ID=<your-key>
export AWS_SECRET_ACCESS_KEY=<your-secret>
export AWS_REGION=us-east-2

# 2. Verify ECR access
aws ecr describe-repositories --repository-names rag-refresh-product-factory

# 3. Verify EC2 SSM access
aws ssm describe-instance-information --instance-ids i-006cd2a8477f36489
```

### Environment Variables

Create `.env.local` in project root:

```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_REGION=us-east-2
AWS_ACCOUNT_ID=860268930466
EC2_INSTANCE_ID=i-006cd2a8477f36489

# OpenRouter (for AI features)
OPENROUTER_API_KEY=sk-or-v1-...

# Optional: n8n integration
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/...
```

---

## Web Dashboard Deployment

### Method 1: Automated Deployment (Recommended)

**Local Deployment Script:**

```bash
# Navigate to project root
cd /path/to/rag-refresh-product-factory

# Ensure secrets are loaded
source scripts/secrets/load_env.sh

# Deploy to production
./scripts/deploy-app.sh

# Expected output:
# ✓ Logged in to ECR
# ✓ Built and pushed image
# ✓ Deployed via SSM
# ✓ Deployment successful!
# 🌐 Live at: https://rag.pbradygeorgen.com
```

**What it does:**
1. Loads environment variables from `.env.local`
2. Logs into AWS ECR
3. Builds Docker image for `linux/amd64`
4. Pushes to ECR registry
5. Deploys to EC2 via AWS Systems Manager (SSM)
6. Records deployment metrics
7. Verifies deployment success

**Deployment time:** ~3-5 minutes

### Method 2: GitHub Actions (Manual Trigger)

```bash
# Using GitHub CLI
gh workflow run deploy.yml

# Or via GitHub UI
# 1. Go to Actions tab
# 2. Select "Deploy to EC2 (SSM)"
# 3. Click "Run workflow"
# 4. Enter deployment reason (optional)
# 5. Click "Run workflow"
```

**Note:** Auto-deploy on push is **disabled** for cost efficiency during development. To enable:

```yaml
# .github/workflows/deploy.yml
on:
  push:  # Uncomment this section
    branches: [ "main" ]
    paths:
      - 'app/**'
      - 'lib/**'
      # ...
```

### Method 3: Manual Docker Deployment

```bash
# 1. Build image
docker buildx build --platform linux/amd64 -t rag-app:latest .

# 2. Save and transfer to EC2
docker save rag-app:latest | gzip > rag-app.tar.gz
scp rag-app.tar.gz ec2-user@<ec2-ip>:/tmp/

# 3. SSH into EC2 and load
ssh ec2-user@<ec2-ip>
docker load < /tmp/rag-app.tar.gz
docker stop rag-app || true
docker rm rag-app || true
docker run -d --name rag-app -p 3000:3000 --restart always rag-app:latest

# 4. Verify
docker ps
curl http://localhost:3000/
```

### Deployment Verification

```bash
# Check deployment status
curl https://rag.pbradygeorgen.com/

# Check API health
curl https://rag.pbradygeorgen.com/api/projects

# View deployment metrics
curl https://rag.pbradygeorgen.com/api/deploy-metrics

# SSH to EC2 and check logs
ssh ec2-user@<ec2-ip>
docker logs rag-app --tail 100
```

### Rollback Procedure

```bash
# List previous images
aws ecr describe-images --repository-name rag-refresh-product-factory \
  --query 'sort_by(imageDetails, &imagePushedAt)[-5:]' --output table

# Deploy specific version
./scripts/deploy-app.sh <image-tag>

# Example: rollback to commit abc1234
./scripts/deploy-app.sh abc1234
```

---

## VSCode Extension Deployment

### Build & Package Extension

```bash
# Navigate to extension directory
cd vscode-extension

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package as .vsix
npm run package

# Output: alex-ai-assistant-1.0.0.vsix
```

### Local Installation

**Method 1: Command Line**

```bash
# From vscode-extension directory
code --install-extension alex-ai-assistant-1.0.0.vsix

# Or from project root
npm run compile:extension
npm run install-extension
```

**Method 2: VSCode UI**

1. Open VSCode
2. View → Extensions (Cmd+Shift+X)
3. Click `...` menu → "Install from VSIX..."
4. Select `vscode-extension/alex-ai-assistant-1.0.0.vsix`
5. Reload window (Cmd+Shift+P → "Developer: Reload Window")

### Extension Configuration

**Configure API Endpoint:**

1. Open Settings (Cmd+,)
2. Search for "Alex AI"
3. Set **Alex AI: Base Url** to:
   - Local development: `http://localhost:3000`
   - Production: `https://rag.pbradygeorgen.com`

**Configure OpenRouter API Key:**

1. Settings → Search "Alex AI"
2. Set **Alex AI: Open Router Api Key**
3. Get key from https://openrouter.ai/keys

**settings.json:**

```json
{
  "alexAi.baseUrl": "https://rag.pbradygeorgen.com",
  "alexAi.openRouterApiKey": "sk-or-v1-...",
  "alexAi.defaultCrewMember": "riker",
  "alexAi.autoLoadContext": true,
  "alexAi.enableChatFileTools": true
}
```

### Publishing to Marketplace (Future)

```bash
# 1. Create publisher account at https://marketplace.visualstudio.com/manage

# 2. Generate Personal Access Token (PAT)
# - Azure DevOps → User Settings → Personal Access Tokens
# - Scopes: Marketplace (Acquire, Publish, Manage)

# 3. Login to vsce
npx vsce login <publisher-name>

# 4. Publish
npx vsce publish

# Version bump
npx vsce publish minor  # 1.0.0 → 1.1.0
npx vsce publish patch  # 1.0.0 → 1.0.1
npx vsce publish major  # 1.0.0 → 2.0.0
```

**Marketplace URL (once published):**
```
https://marketplace.visualstudio.com/items?itemName=alex-ai.alex-ai-assistant
```

### Development Workflow

**Quick reload during development:**

```bash
# Terminal 1: Watch mode (auto-compile on save)
cd vscode-extension
npm run compile:watch

# Terminal 2: Package and reload
npm run dev:reload

# Then in VSCode:
# Cmd+Shift+P → "Developer: Reload Window"
```

---

## Data Synchronization

### Architecture

```
VSCode Extension              Web Dashboard
     │                             │
     │  GET /api/projects          │
     ├────────────────────────────►│
     │  ◄────────────────────────┤  data/projects.json
     │                             │
     │  POST /api/projects         │
     ├────────────────────────────►│
     │  ◄────────────────────────┤  Update + Save
     │                             │
     │  GET /api/crew/memories     │
     ├────────────────────────────►│
     │  ◄────────────────────────┤  data/crew_memories.json
```

### Data Flow

1. **Extension → Dashboard (Write)**
   - User creates project in extension
   - Extension: `POST /api/projects`
   - Dashboard: Updates `data/projects.json`
   - Docker container persists file

2. **Dashboard → Extension (Read)**
   - Extension opens chat panel
   - Extension: `GET /api/projects`
   - Dashboard: Reads `data/projects.json`
   - Extension: Displays in UI

3. **Bi-directional Sync**
   - Changes in web UI → Immediately available to extension
   - Changes in extension → Immediately available to web UI
   - No caching delays (live data)

### API Endpoints Used by Extension

```typescript
// vscode-extension/src/chatView.ts

// 1. Fetch all projects
GET ${baseUrl}/api/projects
→ Returns: Array<Project>

// 2. Create new project
POST ${baseUrl}/api/projects
Body: { name, description, domains, crew }
→ Returns: { success: true, project: Project }

// 3. Fetch sprints (deprecated, but still used)
GET ${baseUrl}/api/sprints?projectId=${id}
→ Returns: Array<Sprint>

// 4. Crew collaboration
POST ${baseUrl}/api/crew/collaborate
Body: { opportunity, activatedCrew, llmAssignments }
→ Returns: { result, cost, tokens }

// 5. Fetch crew memories
GET ${baseUrl}/api/crew/memories
→ Returns: Array<Memory>
```

### Data Persistence

**In Docker Container:**

```dockerfile
# Dockerfile (lines 33-34)
COPY --from=builder /app/data ./data
COPY --from=builder /app/crew-members ./crew-members
```

**Data is persisted in container filesystem:**
- Changes survive container restarts
- Lost on container removal (use volumes for production)

**Production Best Practice: Use Docker Volumes**

```bash
# Create volume for persistent data
docker volume create alex-ai-data

# Run with volume mount
docker run -d \
  --name rag-app \
  -p 3000:3000 \
  -v alex-ai-data:/app/data \
  --restart always \
  <ecr-image>

# Data persists across deployments
```

### Backup & Restore

**Backup data from production:**

```bash
# SSH into EC2
ssh ec2-user@<ec2-ip>

# Copy data from container
docker cp rag-app:/app/data ./backup-data-$(date +%Y%m%d)

# Download to local
scp -r ec2-user@<ec2-ip>:~/backup-data-* ./backups/
```

**Restore data to production:**

```bash
# Upload to EC2
scp -r ./data ec2-user@<ec2-ip>:~/restore-data

# SSH and restore
ssh ec2-user@<ec2-ip>
docker cp ~/restore-data rag-app:/app/data
docker restart rag-app
```

**Automated backup via n8n:**

```json
{
  "name": "Daily Data Backup",
  "nodes": [
    {
      "name": "Schedule: Daily 2 AM",
      "type": "scheduleTrigger",
      "parameters": { "rule": { "interval": [{ "field": "cronExpression", "expression": "0 2 * * *" }] } }
    },
    {
      "name": "Backup Projects",
      "type": "httpRequest",
      "parameters": { "url": "https://rag.pbradygeorgen.com/api/projects", "method": "GET" }
    },
    {
      "name": "Save to S3",
      "type": "awsS3",
      "parameters": { "operation": "upload", "bucket": "alex-ai-backups", "fileName": "backup-{{$now.format('YYYYMMDD')}}/projects.json" }
    }
  ]
}
```

---

## Verification & Testing

### Web Dashboard Tests

```bash
# 1. Homepage loads
curl -I https://rag.pbradygeorgen.com/
# Expected: HTTP/1.1 200 OK

# 2. Projects API
curl https://rag.pbradygeorgen.com/api/projects | jq '.[0]'
# Expected: JSON array of projects

# 3. Architecture visualization
curl https://rag.pbradygeorgen.com/api/projects/proj_alex_ai_self_dev/graph?dimension=domains | jq '.elements | length'
# Expected: Number > 0

# 4. Crew collaboration
curl -X POST https://rag.pbradygeorgen.com/api/crew/collaborate \
  -H "Content-Type: application/json" \
  -d '{"opportunity": {...}, "activatedCrew": ["commander_riker"]}'
# Expected: { "result": {...}, "cost": 0.02 }
```

### Extension Tests

**1. Installation Test:**

```bash
# List installed extensions
code --list-extensions | grep alex-ai

# Expected: alex-ai.alex-ai-assistant or similar
```

**2. Configuration Test:**

```javascript
// In VSCode Developer Console (Cmd+Option+I)
vscode.workspace.getConfiguration('alexAi').get('baseUrl')
// Expected: "https://rag.pbradygeorgen.com"
```

**3. Functional Tests:**

- [ ] Open chat panel (Cmd+Option+A)
- [ ] Select text → Right-click → "Ask Crew About Selection"
- [ ] Type `@alex /picard help` in chat
- [ ] View project architecture (Cmd+Shift+P → "Alex AI: Show Project Architecture")
- [ ] Create new project via chat

### End-to-End Sync Test

**Test scenario: Create project in extension, view in web UI**

```bash
# 1. In VSCode extension:
# - Open Alex AI chat
# - Create new project: "Test Sync Project"
# - Note the project ID

# 2. Verify via API:
curl https://rag.pbradygeorgen.com/api/projects | jq '.[] | select(.name=="Test Sync Project")'

# 3. Open web dashboard:
# https://rag.pbradygeorgen.com/projects

# 4. Verify project appears in list
```

---

## Troubleshooting

### Web Dashboard Issues

**Problem: Deployment fails with ECR login error**

```bash
# Solution: Refresh ECR credentials
aws ecr get-login-password --region us-east-2 | \
  docker login --username AWS --password-stdin \
  860268930466.dkr.ecr.us-east-2.amazonaws.com
```

**Problem: Container crashes on startup**

```bash
# Check logs
ssh ec2-user@<ec2-ip>
docker logs rag-app --tail 100

# Common issues:
# - Missing environment variables
# - Port 3000 already in use
# - Insufficient memory

# Fix: Set environment variables
docker run -d --name rag-app -p 3000:3000 \
  -e NODE_ENV=production \
  -e OPENROUTER_API_KEY=sk-or-v1-... \
  --restart always <image>
```

**Problem: 502 Bad Gateway**

```bash
# Check if container is running
docker ps | grep rag-app

# Restart container
docker restart rag-app

# Check nginx/reverse proxy (if applicable)
sudo systemctl status nginx
```

### Extension Issues

**Problem: Extension not connecting to API**

```
Error: Failed to fetch projects from https://rag.pbradygeorgen.com/api/projects
```

**Solution:**

1. Verify `alexAi.baseUrl` setting
2. Check CORS headers on API routes
3. Verify production API is accessible:
   ```bash
   curl https://rag.pbradygeorgen.com/api/projects
   ```

**Problem: OpenRouter API key invalid**

```
Error: OpenRouter API key is invalid or missing
```

**Solution:**

1. Settings → "Alex AI: Open Router Api Key"
2. Verify key at https://openrouter.ai/keys
3. Reload VSCode window

**Problem: File tools not working**

```
Error: Workspace not found or not writable
```

**Solution:**

1. Check `alexAi.enableChatFileTools` is `true`
2. Verify `alexAi.fsWritableRoots` includes target directory
3. Ensure workspace is open (not just a file)

### Data Sync Issues

**Problem: Changes in extension not appearing in web UI**

**Diagnosis:**

```bash
# 1. Check extension is using correct base URL
# VSCode Settings → alexAi.baseUrl

# 2. Verify POST request succeeded
# Check extension Developer Tools (Cmd+Option+I) → Network tab

# 3. Check web API received update
ssh ec2-user@<ec2-ip>
docker logs rag-app | grep "POST /api/projects"
```

**Solution:**

- Extension pointing to localhost instead of production
- CORS issue (check browser console)
- API route error (check container logs)

---

## Maintenance

### Regular Tasks

**Daily:**
- [ ] Monitor deployment metrics: `curl https://rag.pbradygeorgen.com/api/deploy-metrics`
- [ ] Check container health: `docker ps | grep rag-app`

**Weekly:**
- [ ] Backup data files: `docker cp rag-app:/app/data ./backups/`
- [ ] Review crew collaboration metrics: `/api/crew/metrics`
- [ ] Update dependencies: `npm outdated`

**Monthly:**
- [ ] Rotate AWS credentials: `./scripts/aws/rotate-keys.sh`
- [ ] Review and clean old Docker images: `docker image prune`
- [ ] Update VSCode extension version if published

### Monitoring

**Set up CloudWatch alarms (optional):**

```bash
# EC2 CPU utilization
aws cloudwatch put-metric-alarm \
  --alarm-name rag-app-high-cpu \
  --alarm-description "Alert when CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=InstanceId,Value=i-006cd2a8477f36489

# Container health check
# Add to docker-compose or deployment script:
healthcheck:
  test: ["CMD-SHELL", "curl -fsS http://localhost:3000/ || exit 1"]
  interval: 15s
  timeout: 5s
  retries: 10
```

### Performance Optimization

**Enable Docker BuildKit cache:**

```bash
# GitHub Actions already uses cache-from/cache-to
# For local builds:
export DOCKER_BUILDKIT=1
docker buildx build --cache-from=type=local,src=/tmp/buildx-cache \
  --cache-to=type=local,dest=/tmp/buildx-cache \
  -t rag-app:latest .
```

**Optimize image size:**

```dockerfile
# Current image: ~150MB (Alpine-based)
# To reduce further:
# - Remove unused dependencies
# - Use multi-stage builds (already implemented)
# - Minimize layer count
```

---

## Quick Reference

### Deployment Commands

```bash
# Deploy web dashboard
./scripts/deploy-app.sh

# Build extension
cd vscode-extension && npm run package

# Install extension
npm run install-extension

# Full development reload
npm run dev:reload
```

### Important URLs

- **Production:** https://rag.pbradygeorgen.com
- **Projects API:** https://rag.pbradygeorgen.com/api/projects
- **Architecture:** https://rag.pbradygeorgen.com/projects/[id]/architecture
- **Deploy Metrics:** https://rag.pbradygeorgen.com/api/deploy-metrics
- **OpenRouter Dashboard:** https://openrouter.ai/dashboard

### Configuration Files

```
.env.local                          # Environment variables
.github/workflows/deploy.yml        # GitHub Actions
scripts/deploy-app.sh               # Deployment script
vscode-extension/package.json       # Extension manifest
docker-compose.yml                  # Docker composition
Dockerfile                          # Container build
```

---

## Support

### Documentation

- **Crew Automation:** `CREW_AUTOMATION_GUIDE.md`
- **n8n Deployment:** `docs/n8n/N8N_DEPLOYMENT_GUIDE.md`
- **Dogfooding Workflow:** `ALEX_AI_DOGFOODING_WORKFLOW.md`
- **Cost Analysis:** `docs/COST_ANALYSIS.md`

### Debugging

```bash
# Web dashboard logs
ssh ec2-user@<ec2-ip>
docker logs rag-app --follow

# Extension logs
# VSCode → Help → Toggle Developer Tools → Console

# Deployment logs
aws ssm get-command-invocation \
  --command-id <command-id> \
  --instance-id i-006cd2a8477f36489
```

---

**Deployment complete! Your Alex AI Crew is now available across web and IDE.** 🚀
