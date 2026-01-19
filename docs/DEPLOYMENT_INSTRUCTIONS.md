# Alex AI - Deployment Instructions

**Quick start guide for updating VSCode extension and rag.pbradygeorgen.com**

---

## 🎯 Overview

This guide provides step-by-step instructions for deploying both components of Alex AI:

1. **Web Dashboard** → https://rag.pbradygeorgen.com (Next.js on EC2)
2. **VSCode Extension** → Local installation (.vsix package)

Both components share data via REST API for perfect synchronization.

---

## 📚 Documentation Index

Before deploying, review these comprehensive guides:

| Document | Purpose |
|----------|---------|
| **[DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** | Complete end-to-end deployment guide (architecture, prerequisites, methods) |
| **[DATA_SYNC_STRATEGY.md](docs/DATA_SYNC_STRATEGY.md)** | Data synchronization between extension and web dashboard |
| **[DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)** | Pre-flight checks, verification, and sign-off |

---

## 🚀 Quick Deployment (TL;DR)

### Deploy Web Dashboard

```bash
# From project root
./scripts/deploy-app.sh

# Expected output:
# ✓ Logged in to ECR
# ✓ Built and pushed
# ✓ Deployed via SSM
# ✓ Deployment successful!
# 🌐 Live at: https://rag.pbradygeorgen.com
```

### Deploy VSCode Extension

```bash
# Build and install extension
cd vscode-extension
npm install
npm run compile
npm run package
code --install-extension alex-ai-assistant-1.0.0.vsix

# Reload VSCode
# Cmd+Shift+P → "Developer: Reload Window"
```

### Verify Data Sync

```bash
# 1. Check web API is accessible
curl https://rag.pbradygeorgen.com/api/projects | jq '.[0]'

# 2. Open VSCode extension
# Cmd+Option+A → Should load projects from API

# 3. Create test project in extension
# Chat: "Create new project called 'Sync Test'"

# 4. Verify in web UI
open https://rag.pbradygeorgen.com/projects
# Should see "Sync Test" project
```

---

## 📋 Step-by-Step Deployment

### Part 1: Web Dashboard Deployment

#### Prerequisites

```bash
# 1. Verify AWS credentials
export AWS_ACCESS_KEY_ID=<your-key>
export AWS_SECRET_ACCESS_KEY=<your-secret>
aws sts get-caller-identity

# 2. Load environment variables
source scripts/secrets/load_env.sh

# 3. Verify Docker is running
docker ps
```

#### Deployment Steps

**Method 1: Automated Script (Recommended)**

```bash
# Navigate to project root
cd /path/to/rag-refresh-product-factory

# Deploy to production
./scripts/deploy-app.sh

# What it does:
# 1. Logs into AWS ECR
# 2. Builds Docker image (linux/amd64)
# 3. Pushes to ECR registry
# 4. Deploys to EC2 via SSM
# 5. Records deployment metrics
# 6. Verifies deployment success

# Deployment time: ~3-5 minutes
```

**Method 2: GitHub Actions**

```bash
# Trigger via CLI
gh workflow run deploy.yml

# Or via GitHub UI:
# 1. Go to Actions tab
# 2. Select "Deploy to EC2 (SSM)"
# 3. Click "Run workflow"
```

#### Verification

```bash
# 1. Check web app is live
curl -I https://rag.pbradygeorgen.com/
# Expected: HTTP/1.1 200 OK

# 2. Verify API is responding
curl https://rag.pbradygeorgen.com/api/projects | jq '.[0]'
# Expected: First project object

# 3. Check container health
ssh ec2-user@<ec2-ip>
docker ps | grep rag-app
docker logs rag-app --tail 50
```

---

### Part 2: VSCode Extension Deployment

#### Build Extension

```bash
# Navigate to extension directory
cd vscode-extension

# Install dependencies (if needed)
npm install

# Compile TypeScript
npm run compile

# Package as .vsix
npm run package

# Output: alex-ai-assistant-1.0.0.vsix
ls -lh *.vsix
```

#### Install Extension

**Option A: Command Line**

```bash
# Install directly
code --install-extension alex-ai-assistant-1.0.0.vsix

# Or from project root
npm run compile:extension
npm run install-extension
```

**Option B: VSCode UI**

1. Open VSCode
2. View → Extensions (Cmd+Shift+X)
3. Click `...` menu → "Install from VSIX..."
4. Select `vscode-extension/alex-ai-assistant-1.0.0.vsix`
5. Reload window (Cmd+Shift+P → "Developer: Reload Window")

#### Configure Extension

**1. Set API Base URL**

- Open Settings (Cmd+,)
- Search for "Alex AI: Base Url"
- Verify it's set to: `https://rag.pbradygeorgen.com`

**2. Set OpenRouter API Key**

- Settings → Search "Alex AI: Open Router Api Key"
- Enter your key from https://openrouter.ai/keys

**3. Verify Configuration**

```json
// settings.json
{
  "alexAi.baseUrl": "https://rag.pbradygeorgen.com",
  "alexAi.openRouterApiKey": "sk-or-v1-...",
  "alexAi.defaultCrewMember": "riker",
  "alexAi.autoLoadContext": true
}
```

#### Test Extension

```bash
# 1. Open chat panel
# Cmd+Option+A

# 2. Verify projects load
# Panel should display project list from API

# 3. Test crew interaction
# Type: @alex /picard hello
# Should get response from OpenRouter

# 4. Test architecture view
# Cmd+Shift+P → "Alex AI: Show Project Architecture"
# Should display project graph
```

---

### Part 3: Data Synchronization

#### How Sync Works

```
Extension (Local)              Web Dashboard (Production)
      │                              │
      │  GET /api/projects           │
      ├─────────────────────────────►│
      │  ◄─────────────────────────┤  data/projects.json
      │                              │
      │  POST /api/projects          │
      ├─────────────────────────────►│
      │  ◄─────────────────────────┤  Update + Save
```

**Key Points:**
- Extension reads from API (never local files)
- Extension writes via API (centralized validation)
- Web dashboard is source of truth
- Changes sync in real-time (no caching)

#### Sync Test Scenario

**1. Extension → Web Dashboard**

```bash
# In VSCode extension:
# - Open chat panel
# - Create project: "Test Sync A"

# Verify via API:
curl https://rag.pbradygeorgen.com/api/projects | \
  jq '.[] | select(.name=="Test Sync A")'

# Verify in web UI:
open https://rag.pbradygeorgen.com/projects
# Should see "Test Sync A"
```

**2. Web Dashboard → Extension**

```bash
# In web UI:
# - Open https://rag.pbradygeorgen.com/projects
# - Create "Test Sync B"

# In extension:
# - Refresh chat panel (close/reopen)
# - "Test Sync B" should appear
```

**3. Bi-directional Updates**

```bash
# In extension:
# - Rename "Test Sync A" → "Updated from Extension"

# In web UI:
# - Refresh page
# - Name should be "Updated from Extension"

# In web UI:
# - Add new domain to project

# In extension:
# - Refresh panel
# - New domain should appear
```

---

## 🔧 Configuration

### Production Environment Variables

**Web Dashboard (.env.local)**

```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_REGION=us-east-2
AWS_ACCOUNT_ID=860268930466
EC2_INSTANCE_ID=i-006cd2a8477f36489

# OpenRouter API
OPENROUTER_API_KEY=sk-or-v1-...

# Optional: n8n Integration
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/...
```

**Extension (settings.json)**

```json
{
  "alexAi.baseUrl": "https://rag.pbradygeorgen.com",
  "alexAi.openRouterApiKey": "sk-or-v1-...",
  "alexAi.defaultCrewMember": "riker",
  "alexAi.autoLoadContext": true,
  "alexAi.enableChatFileTools": true,
  "alexAi.fsWritableRoots": [
    "src", "app", "lib", "docs", "data"
  ]
}
```

### Development vs Production

**Development Setup:**

```bash
# Web dashboard
npm run dev  # Runs on http://localhost:3000

# Extension settings
"alexAi.baseUrl": "http://localhost:3000"
```

**Production Setup:**

```bash
# Web dashboard
# Deployed to EC2: https://rag.pbradygeorgen.com

# Extension settings (default)
"alexAi.baseUrl": "https://rag.pbradygeorgen.com"
```

---

## 🔍 Verification Checklist

### After Web Dashboard Deployment

- [ ] Homepage loads: `curl -I https://rag.pbradygeorgen.com/`
- [ ] Projects API works: `curl https://rag.pbradygeorgen.com/api/projects`
- [ ] Architecture viz works: `https://rag.pbradygeorgen.com/projects/proj_alex_ai_self_dev/architecture`
- [ ] Container healthy: `docker ps | grep rag-app`
- [ ] No errors in logs: `docker logs rag-app --tail 100`

### After Extension Deployment

- [ ] Extension installed: `code --list-extensions | grep alex-ai`
- [ ] Chat panel opens: Cmd+Option+A
- [ ] Projects load from API
- [ ] Crew commands work: `@alex /picard hello`
- [ ] File tools work: Select code → Right-click → "Ask Crew"
- [ ] Architecture view works: Cmd+Shift+P → "Alex AI: Show Project Architecture"

### After Sync Verification

- [ ] Create project in extension → Appears in web UI
- [ ] Create project in web UI → Appears in extension
- [ ] Update in extension → Updates in web UI
- [ ] Update in web UI → Updates in extension
- [ ] No sync errors in extension console
- [ ] No sync errors in container logs

---

## 🛠️ Troubleshooting

### Web Dashboard Issues

**Problem: Deployment fails**

```bash
# Check AWS credentials
aws sts get-caller-identity

# Re-authenticate to ECR
aws ecr get-login-password --region us-east-2 | \
  docker login --username AWS --password-stdin \
  860268930466.dkr.ecr.us-east-2.amazonaws.com

# Try deployment again
./scripts/deploy-app.sh
```

**Problem: Container crashes**

```bash
# Check logs
ssh ec2-user@<ec2-ip>
docker logs rag-app --tail 200

# Common fixes:
# - Missing env vars: Add to docker run command
# - Port conflict: Stop other process on 3000
# - Insufficient memory: Increase EC2 instance size
```

**Problem: 502 Bad Gateway**

```bash
# Check container is running
docker ps | grep rag-app

# Restart container
docker restart rag-app

# Check if app is listening
docker exec rag-app curl http://localhost:3000/
```

### Extension Issues

**Problem: Can't connect to API**

```
Error: Failed to fetch projects
```

**Fix:**

1. Verify `alexAi.baseUrl` setting: `https://rag.pbradygeorgen.com`
2. Test API manually: `curl https://rag.pbradygeorgen.com/api/projects`
3. Check CORS (should be allowed)
4. Reload VSCode window

**Problem: OpenRouter API key invalid**

**Fix:**

1. Settings → "Alex AI: Open Router Api Key"
2. Get new key from https://openrouter.ai/keys
3. Paste and save
4. Reload VSCode

**Problem: File tools not working**

**Fix:**

1. Check `alexAi.enableChatFileTools` is `true`
2. Verify target directory in `alexAi.fsWritableRoots`
3. Ensure workspace is open (not just file)

### Sync Issues

**Problem: Changes don't appear**

**Diagnosis:**

```bash
# 1. Verify extension is using production URL
# Settings → alexAi.baseUrl

# 2. Check API is accessible
curl https://rag.pbradygeorgen.com/api/projects

# 3. Check extension console (Cmd+Option+I)
# Look for network errors

# 4. Check container logs
ssh ec2-user@<ec2-ip>
docker logs rag-app | grep "POST /api/projects"
```

**Fix:**
- Extension pointing to localhost → Change to production URL
- CORS error → Check API CORS headers
- API error → Check container logs

---

## 📊 Monitoring

### Deployment Metrics

```bash
# View deployment history
curl https://rag.pbradygeorgen.com/api/deploy-metrics | jq '.'

# Latest deployment
curl https://rag.pbradygeorgen.com/api/deploy-metrics | \
  jq '.[-1] | {commitSha, duration, success, timestamp}'
```

### Crew Collaboration Metrics

```bash
# View collaboration analytics
curl https://rag.pbradygeorgen.com/api/crew/metrics | jq '.'

# Cost analysis
curl https://rag.pbradygeorgen.com/api/crew/metrics | \
  jq '.analytics | {totalCost, avgCost, costPer1KTokens}'
```

### Container Health

```bash
# SSH to EC2
ssh ec2-user@<ec2-ip>

# Check container status
docker ps | grep rag-app

# View logs
docker logs rag-app --tail 100 --follow

# Check resource usage
docker stats rag-app --no-stream
```

---

## 🔄 Rollback Procedure

If deployment has issues:

```bash
# 1. Get previous image tag
aws ecr describe-images \
  --repository-name rag-refresh-product-factory \
  --query 'sort_by(imageDetails, &imagePushedAt)[-5:]' \
  --output table

# 2. Deploy previous version
./scripts/deploy-app.sh <previous-tag>

# Example: Rollback to commit abc1234
./scripts/deploy-app.sh abc1234

# 3. Verify rollback
curl -I https://rag.pbradygeorgen.com/
docker logs rag-app --tail 50

# 4. Restore data backup (if needed)
scp -r ./backups/backup-20251227 ec2-user@<ec2-ip>:~/restore-data
ssh ec2-user@<ec2-ip>
docker cp ~/restore-data/data rag-app:/app/data
docker restart rag-app
```

---

## 📝 Maintenance

### Regular Tasks

**Daily:**
- Monitor deployment metrics
- Check container health
- Review error logs

**Weekly:**
- Backup data files: `docker cp rag-app:/app/data ./backups/`
- Review crew metrics
- Update dependencies if needed

**Monthly:**
- Rotate AWS credentials
- Clean old Docker images
- Update extension version (if published)

### Backup Strategy

**Manual Backup:**

```bash
# Backup to local
ssh ec2-user@<ec2-ip>
docker cp rag-app:/app/data ./backup-$(date +%Y%m%d)

# Download
scp -r ec2-user@<ec2-ip>:~/backup-* ./backups/
```

**Automated Backup (n8n):**

See `docs/n8n/N8N_DEPLOYMENT_GUIDE.md` for setting up automated daily backups.

---

## 🎓 Best Practices

### Before Deployment

1. ✅ Run tests: `npm test`
2. ✅ Lint code: `npm run lint`
3. ✅ Build locally: `docker build .`
4. ✅ Review changes: `git diff origin/main`
5. ✅ Backup data: `docker cp rag-app:/app/data ./backup`

### During Deployment

1. ✅ Monitor deployment logs
2. ✅ Watch container startup
3. ✅ Check API health immediately
4. ✅ Test critical endpoints

### After Deployment

1. ✅ Run smoke tests
2. ✅ Verify data sync
3. ✅ Check extension connection
4. ✅ Monitor for errors (first hour)
5. ✅ Update deployment log

---

## 📞 Support

### Documentation

- **End-to-end guide:** [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
- **Data sync:** [DATA_SYNC_STRATEGY.md](docs/DATA_SYNC_STRATEGY.md)
- **Checklist:** [DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)
- **Automation:** [CREW_AUTOMATION_GUIDE.md](CREW_AUTOMATION_GUIDE.md)
- **n8n setup:** [docs/n8n/N8N_DEPLOYMENT_GUIDE.md](docs/n8n/N8N_DEPLOYMENT_GUIDE.md)

### Debugging

```bash
# Web logs
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

## ✅ Success Criteria

Deployment is successful when:

- [ ] Web dashboard accessible at https://rag.pbradygeorgen.com
- [ ] API endpoints responding correctly
- [ ] Extension installed and configured
- [ ] Extension can fetch data from API
- [ ] Bi-directional sync working
- [ ] No errors in logs
- [ ] All smoke tests passing

---

**Deployment complete! Alex AI is now live across web and IDE.** 🚀

For detailed deployment workflows, see:
- [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) - Complete technical guide
- [DATA_SYNC_STRATEGY.md](docs/DATA_SYNC_STRATEGY.md) - Sync architecture
- [DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md) - Pre-flight checks
