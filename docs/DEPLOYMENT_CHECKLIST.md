# Deployment Checklist

**Pre-flight checks for deploying Alex AI to production**

---

## Pre-Deployment

### Environment Setup

- [ ] **AWS credentials configured**
  ```bash
  aws sts get-caller-identity
  # Should show account 860268930466
  ```

- [ ] **Docker installed and running**
  ```bash
  docker --version
  docker ps
  ```

- [ ] **Environment variables set**
  ```bash
  # Check .env.local exists
  ls -la .env.local

  # Verify required vars
  grep -E "AWS_ACCESS_KEY_ID|OPENROUTER_API_KEY|EC2_INSTANCE_ID" .env.local
  ```

- [ ] **ECR repository accessible**
  ```bash
  aws ecr describe-repositories \
    --repository-names rag-refresh-product-factory \
    --region us-east-2
  ```

- [ ] **EC2 instance running**
  ```bash
  aws ec2 describe-instances \
    --instance-ids i-006cd2a8477f36489 \
    --query 'Reservations[0].Instances[0].State.Name'
  # Should return: "running"
  ```

### Code Quality

- [ ] **All tests passing**
  ```bash
  npm test
  ```

- [ ] **Linting clean**
  ```bash
  npm run lint
  ```

- [ ] **TypeScript compiles without errors**
  ```bash
  npm run build
  ```

- [ ] **No sensitive data in code**
  ```bash
  # Check for accidentally committed secrets
  grep -r "sk-or-v1" app/ lib/ || echo "Clean"
  grep -r "AKIA" app/ lib/ || echo "Clean"
  ```

### Documentation

- [ ] **README.md updated** with latest features
- [ ] **API documentation current** for new endpoints
- [ ] **Deployment guide reviewed** (docs/DEPLOYMENT_GUIDE.md)
- [ ] **CHANGELOG.md updated** with version notes

---

## Web Dashboard Deployment

### Build & Push

- [ ] **Build Docker image**
  ```bash
  docker buildx build --platform linux/amd64 -t test-build .
  # Should complete without errors
  ```

- [ ] **Image size reasonable**
  ```bash
  docker images test-build --format "{{.Size}}"
  # Should be ~150-200MB
  ```

- [ ] **Login to ECR**
  ```bash
  aws ecr get-login-password --region us-east-2 | \
    docker login --username AWS --password-stdin \
    860268930466.dkr.ecr.us-east-2.amazonaws.com
  ```

- [ ] **Push to ECR**
  ```bash
  ./scripts/deploy-app.sh
  # Or manually via GitHub Actions
  ```

### Deployment Verification

- [ ] **Container running on EC2**
  ```bash
  ssh ec2-user@<ec2-ip>
  docker ps | grep rag-app
  ```

- [ ] **Web app accessible**
  ```bash
  curl -I https://rag.pbradygeorgen.com/
  # Should return: HTTP/1.1 200 OK
  ```

- [ ] **API responding**
  ```bash
  curl https://rag.pbradygeorgen.com/api/projects | jq '.[0]'
  # Should return first project
  ```

- [ ] **Health check passing**
  ```bash
  curl https://rag.pbradygeorgen.com/api/sync/health
  # Should return: { "healthy": true }
  ```

### Data Integrity

- [ ] **Data files present in container**
  ```bash
  ssh ec2-user@<ec2-ip>
  docker exec rag-app ls -la /app/data/
  # Should show: projects.json, crew_memories.json, etc.
  ```

- [ ] **Data volume mounted** (if using volumes)
  ```bash
  docker inspect rag-app | grep -A 10 Mounts
  ```

- [ ] **Backup created**
  ```bash
  docker cp rag-app:/app/data ./backup-pre-deploy-$(date +%Y%m%d)
  ```

---

## VSCode Extension Deployment

### Build Extension

- [ ] **Install dependencies**
  ```bash
  cd vscode-extension
  npm install
  ```

- [ ] **Compile TypeScript**
  ```bash
  npm run compile
  # Should complete without errors
  ```

- [ ] **Package extension**
  ```bash
  npm run package
  # Should create: alex-ai-assistant-1.0.0.vsix
  ```

- [ ] **Extension size reasonable**
  ```bash
  ls -lh alex-ai-assistant-1.0.0.vsix
  # Should be ~500KB - 2MB
  ```

### Local Testing

- [ ] **Install locally**
  ```bash
  code --install-extension alex-ai-assistant-1.0.0.vsix
  ```

- [ ] **Extension appears in Extensions list**
  ```bash
  code --list-extensions | grep alex-ai
  ```

- [ ] **Configuration defaults correct**
  - Settings → "Alex AI: Base Url" → Should be `https://rag.pbradygeorgen.com`
  - Settings → "Alex AI: Default Crew Member" → Should be `riker`

- [ ] **Extension activates without errors**
  - Open VSCode
  - Check Developer Tools console (Cmd+Option+I)
  - Look for "Alex AI extension activated"

### Functional Testing

- [ ] **Chat panel opens**
  - Cmd+Option+A or click sidebar icon

- [ ] **API connection works**
  - Chat panel should load projects
  - No "Failed to fetch" errors

- [ ] **Crew commands work**
  - Type `@alex /picard hello`
  - Should get response from OpenRouter

- [ ] **File tools work**
  - Select code → Right-click → "Ask Crew About Selection"
  - Should analyze selected code

- [ ] **Architecture visualization works**
  - Cmd+Shift+P → "Alex AI: Show Project Architecture"
  - Should display graph

---

## Data Synchronization Verification

### Extension → Web Dashboard

- [ ] **Create project in extension**
  - Chat: "Create new project called 'Sync Test'"
  - Note project ID from response

- [ ] **Verify in web UI**
  ```bash
  open https://rag.pbradygeorgen.com/projects
  # Should see "Sync Test" project
  ```

- [ ] **Verify via API**
  ```bash
  curl https://rag.pbradygeorgen.com/api/projects | \
    jq '.[] | select(.name=="Sync Test")'
  ```

### Web Dashboard → Extension

- [ ] **Create project in web UI**
  - Open https://rag.pbradygeorgen.com/projects
  - Click "New Project"
  - Create "Web Test Project"

- [ ] **Verify in extension**
  - VSCode → Alex AI chat panel
  - Click refresh or reopen panel
  - "Web Test Project" should appear

### Bi-directional Updates

- [ ] **Update project name in extension**
  - Extension: Rename "Sync Test" → "Sync Test Updated"

- [ ] **Check web UI reflects change**
  - Refresh web dashboard
  - Name should be "Sync Test Updated"

- [ ] **Update project in web UI**
  - Add new domain to project

- [ ] **Check extension reflects change**
  - Refresh extension
  - New domain should appear

---

## Performance Testing

### Web Dashboard

- [ ] **Page load time**
  ```bash
  curl -w "@curl-format.txt" -o /dev/null -s https://rag.pbradygeorgen.com/
  # time_total should be < 2s
  ```

- [ ] **API response time**
  ```bash
  time curl -s https://rag.pbradygeorgen.com/api/projects > /dev/null
  # Should be < 500ms
  ```

- [ ] **Large dataset handling**
  - Create 50+ projects
  - /projects page should load without freezing
  - API should respond in < 1s

### Extension

- [ ] **Extension activation time**
  - Restart VSCode
  - Note time until "Alex AI extension activated" in console
  - Should be < 5s

- [ ] **Chat panel load time**
  - Open chat panel (Cmd+Option+A)
  - Note time until projects loaded
  - Should be < 1s

- [ ] **Large file handling**
  - Open file with 1000+ lines
  - Select all → "Ask Crew About Selection"
  - Should not freeze UI

---

## Security Verification

### Web Dashboard

- [ ] **HTTPS enabled**
  ```bash
  curl -I https://rag.pbradygeorgen.com/ | grep -i "strict-transport"
  # Should have HSTS header
  ```

- [ ] **No sensitive data exposed**
  ```bash
  curl https://rag.pbradygeorgen.com/data/projects.json
  # Should 404 (data not publicly accessible)
  ```

- [ ] **Environment variables not leaked**
  ```bash
  curl https://rag.pbradygeorgen.com/.env.local
  # Should 404
  ```

### Extension

- [ ] **API key stored securely**
  - Check VS Code settings.json
  - `alexAi.openRouterApiKey` should be present but not in version control

- [ ] **No credentials in logs**
  - Open Developer Tools console
  - Search for "sk-or-v1"
  - Should not appear

- [ ] **File tool permissions respected**
  - Try to write to `/etc/`
  - Should be blocked (not in `fsWritableRoots`)

---

## Monitoring Setup

### CloudWatch Alarms (Optional)

- [ ] **EC2 CPU alarm configured**
  ```bash
  aws cloudwatch describe-alarms \
    --alarm-names rag-app-high-cpu
  ```

- [ ] **Container health checks**
  ```bash
  docker inspect rag-app | grep -A 5 Healthcheck
  ```

### Deployment Metrics

- [ ] **Metrics API working**
  ```bash
  curl https://rag.pbradygeorgen.com/api/deploy-metrics | jq '.'
  ```

- [ ] **Deployment recorded**
  ```bash
  # Latest deployment should show current commit
  curl https://rag.pbradygeorgen.com/api/deploy-metrics | \
    jq '.[-1].commitSha'
  ```

### Error Tracking

- [ ] **Container logs accessible**
  ```bash
  ssh ec2-user@<ec2-ip>
  docker logs rag-app --tail 100
  ```

- [ ] **No errors in logs**
  ```bash
  docker logs rag-app 2>&1 | grep -i error | tail -20
  # Should be empty or expected errors
  ```

---

## Rollback Preparation

### Backup Current Version

- [ ] **Tag current production image**
  ```bash
  # Get current image
  docker pull 860268930466.dkr.ecr.us-east-2.amazonaws.com/rag-refresh-product-factory:latest

  # Tag as last-stable
  docker tag <current-image> <ecr-url>/rag-refresh-product-factory:last-stable
  docker push <ecr-url>/rag-refresh-product-factory:last-stable
  ```

- [ ] **Backup data files**
  ```bash
  ssh ec2-user@<ec2-ip>
  docker cp rag-app:/app/data ./backup-$(date +%Y%m%d-%H%M%S)
  ```

- [ ] **Document rollback procedure**
  ```bash
  # If deployment fails:
  ./scripts/deploy-app.sh last-stable
  ```

---

## Post-Deployment

### Smoke Tests

- [ ] **Access homepage**
  - https://rag.pbradygeorgen.com/

- [ ] **View projects**
  - https://rag.pbradygeorgen.com/projects

- [ ] **View architecture**
  - https://rag.pbradygeorgen.com/projects/proj_alex_ai_self_dev/architecture

- [ ] **Test crew collaboration**
  ```bash
  curl -X POST https://rag.pbradygeorgen.com/api/crew/collaborate \
    -H "Content-Type: application/json" \
    -d '{
      "opportunity": {
        "projectId": "proj_test",
        "domainSlug": "test-domain",
        "priority": "medium"
      },
      "activatedCrew": ["commander_riker"]
    }'
  ```

### User Acceptance

- [ ] **Announce deployment** to team
  ```markdown
  🚀 Alex AI deployed!

  Web Dashboard: https://rag.pbradygeorgen.com
  Extension: Update your alexAi.baseUrl to production URL

  New features:
  - Architecture visualization
  - Cost-optimized crew collaboration
  - Real-time sync between extension and web

  Report issues: [GitHub Issues]
  ```

- [ ] **Update user documentation**
  - Link to DEPLOYMENT_GUIDE.md
  - Configuration instructions
  - Troubleshooting tips

### Cleanup

- [ ] **Remove old Docker images**
  ```bash
  docker image prune -a --filter "until=168h"  # 7 days
  ```

- [ ] **Clean build artifacts**
  ```bash
  rm -rf vscode-extension/dist
  rm vscode-extension/*.vsix
  ```

- [ ] **Update deployment log**
  ```bash
  echo "$(date +%Y-%m-%d): Deployed version $(git rev-parse --short HEAD)" >> DEPLOYMENT_LOG.md
  ```

---

## Troubleshooting

### Common Issues

**Issue: Extension can't connect to API**

- [ ] Check `alexAi.baseUrl` setting
- [ ] Verify API is accessible: `curl https://rag.pbradygeorgen.com/api/projects`
- [ ] Check CORS headers in browser console

**Issue: Deployment fails with ECR login error**

- [ ] Refresh AWS credentials
- [ ] Check ECR permissions: `aws ecr describe-repositories`
- [ ] Re-authenticate: `aws ecr get-login-password | docker login ...`

**Issue: Container won't start**

- [ ] Check logs: `docker logs rag-app`
- [ ] Verify environment variables
- [ ] Check port 3000 not in use: `lsof -i :3000`

**Issue: Data not syncing**

- [ ] Verify API endpoints responding
- [ ] Check network connectivity
- [ ] Review sync health: `curl https://rag.pbradygeorgen.com/api/sync/health`

---

## Sign-Off

### Pre-Production Approval

- [ ] **Technical Lead Approval**: ___________
- [ ] **Security Review**: ___________
- [ ] **QA Sign-off**: ___________

### Production Deployment

- [ ] **Deployed by**: ___________
- [ ] **Deployment date**: ___________
- [ ] **Deployment time**: ___________
- [ ] **Git commit**: ___________

### Post-Deployment Verification

- [ ] **Verified by**: ___________
- [ ] **Verification date**: ___________
- [ ] **Issues found**: ___________
- [ ] **Resolution**: ___________

---

## Rollback Decision

If more than 3 critical issues found in first 24 hours:

- [ ] **Execute rollback**: `./scripts/deploy-app.sh last-stable`
- [ ] **Restore data backup**: `docker cp backup-* rag-app:/app/data`
- [ ] **Notify team**: "Rolled back to previous version due to [reason]"

---

**Deployment complete!** ✅

Next deployment: `./scripts/deploy-app.sh`
