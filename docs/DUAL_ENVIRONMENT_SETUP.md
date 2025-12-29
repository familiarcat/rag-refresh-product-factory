# Dual Environment Setup Guide

**Update VSCode Extension to Work with Both Local and Deployed Dashboards**

This guide shows how to configure your local VSCode Alex AI extension to communicate with both your local development server and the deployed production dashboard simultaneously.

---

## Overview

You now have two environments running:

1. **Production (Vercel)**: https://rag-refresh-product-factory.vercel.app
2. **Local Development**: http://localhost:3000

Your VSCode extension can be configured to switch between or monitor both environments for testing interoperative capabilities.

---

## Step 1: Update VSCode Extension

### Quick Update (Recommended)

```bash
# Navigate to extension directory
cd vscode-extension

# Compile, package, and install in one command
npm run dev:reload
```

**After running this command:**
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type: `Developer: Reload Window`
3. Press Enter

✅ Extension updated and reloaded!

### Manual Update (Alternative)

```bash
cd vscode-extension

# Step 1: Compile TypeScript
npm run compile

# Step 2: Package extension
npm run package

# Step 3: Install extension
npm run install-extension
```

Then reload VSCode window (`Cmd+Shift+P` → `Developer: Reload Window`)

---

## Step 2: Configure Environment Switching

### Option A: Environment Variable Configuration

Update your VSCode extension settings to support environment switching:

**File**: `vscode-extension/src/config.ts`

```typescript
// Environment configuration
export const ENVIRONMENTS = {
  production: {
    name: 'Production (Vercel)',
    apiUrl: 'https://rag-refresh-product-factory.vercel.app/api',
    dashboardUrl: 'https://rag-refresh-product-factory.vercel.app',
    supabaseUrl: process.env.SUPABASE_URL,
    color: '#00C853' // Green indicator
  },
  local: {
    name: 'Local Development',
    apiUrl: 'http://localhost:3000/api',
    dashboardUrl: 'http://localhost:3000',
    supabaseUrl: process.env.SUPABASE_URL,
    color: '#2196F3' // Blue indicator
  }
};

// Get current environment (default: local)
export function getCurrentEnvironment(): 'production' | 'local' {
  return vscode.workspace.getConfiguration('alexAI').get('environment') || 'local';
}

// Get environment config
export function getEnvConfig() {
  const env = getCurrentEnvironment();
  return ENVIRONMENTS[env];
}
```

### Option B: Settings UI

Add to **VSCode User Settings** (`.vscode/settings.json` in your project):

```json
{
  "alexAI.environment": "local",
  "alexAI.production.apiUrl": "https://rag-refresh-product-factory.vercel.app/api",
  "alexAI.local.apiUrl": "http://localhost:3000/api",
  "alexAI.showEnvironmentIndicator": true
}
```

---

## Step 3: Test Both Environments

### Open Both Dashboards

**Production Dashboard:**
```bash
open https://rag-refresh-product-factory.vercel.app
```

**Local Dashboard:**
```bash
# Start local dev server if not running
npm run dev

# Open in browser
open http://localhost:3000
```

### Switch Environments in VSCode

**Via Command Palette:**
1. Press `Cmd+Shift+P`
2. Type: `Alex AI: Switch Environment`
3. Select: `Production` or `Local`

**Via Status Bar:**
- Look for environment indicator in bottom status bar
- Click to switch environments

---

## Step 4: Test Sprint API Integration

### Test Local Environment

```bash
# Create sprint on local
curl -X POST "http://localhost:3000/api/sprints" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "test-local",
    "name": "Local Test Sprint",
    "sprint_number": 1,
    "start_date": "2025-01-01",
    "end_date": "2025-01-14",
    "goals": ["Test local API"],
    "velocity_target": 20
  }'
```

### Test Production Environment

```bash
# Create sprint on production
curl -X POST "https://rag-refresh-product-factory.vercel.app/api/sprints" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "test-production",
    "name": "Production Test Sprint",
    "sprint_number": 1,
    "start_date": "2025-01-01",
    "end_date": "2025-01-14",
    "goals": ["Test production API"],
    "velocity_target": 20
  }'
```

### Compare Results

Open both dashboards side-by-side:
- **Left**: Production (https://rag-refresh-product-factory.vercel.app)
- **Right**: Local (http://localhost:3000)

Verify:
- ✅ Sprint appears in correct environment
- ✅ AI crew assignment works in both
- ✅ CRUD operations function identically
- ✅ Personas loaded in both

---

## Step 5: VSCode Extension Commands

### Available Commands

Press `Cmd+Shift+P` and type `Alex AI`:

```
Alex AI: Switch Environment
  → Toggle between Production and Local

Alex AI: Open Dashboard
  → Opens current environment dashboard

Alex AI: Create Sprint
  → Create sprint in current environment

Alex AI: View Sprints
  → List sprints from current environment

Alex AI: Test API Connection
  → Verify API connectivity

Alex AI: Compare Environments
  → Side-by-side comparison view
```

---

## Interoperative Capabilities

### What You Can Test

**1. API Consistency**
- Same endpoint behavior in both environments
- Identical response formats
- Matching error handling

**2. Database Sync**
- Both environments use same Supabase instance
- Data changes appear in both dashboards
- Real-time updates propagate

**3. Extension Integration**
- VSCode extension can control both environments
- Switch contexts seamlessly
- Monitor both simultaneously

**4. Sprint System Features**
- Create sprints in one environment
- View in other environment
- AI crew assignment works identically
- Workload balancing synchronized

---

## Monitoring Both Environments

### Terminal Setup

**Terminal 1: Local Dev Server**
```bash
cd ~/Documents/workspace/rag-refresh-product-factory
npm run dev
```

**Terminal 2: Local API Testing**
```bash
cd ~/Documents/workspace/rag-refresh-product-factory

# Watch API logs
tail -f .next/server.log

# Or run test suite
./scripts/test-api-examples.sh
```

**Terminal 3: Production Monitoring**
```bash
# Monitor Vercel deployment
vercel logs --follow

# Or check deployment status
vercel ls
```

### Browser Setup

**Split View (Recommended):**
1. Open two browser windows
2. Left: Production dashboard
3. Right: Local dashboard
4. Tile windows side-by-side

**Browser DevTools:**
- Open DevTools in both windows
- Monitor Network tab for API calls
- Compare response times and data

---

## Troubleshooting

### Extension Not Updating

```bash
# Force reinstall
cd vscode-extension
rm -rf dist node_modules
npm install
npm run dev:reload

# Then reload VSCode window
```

### API Connection Issues

**Local:**
```bash
# Verify dev server is running
curl http://localhost:3000/api/sprints

# Check port availability
lsof -i :3000
```

**Production:**
```bash
# Verify deployment
curl https://rag-refresh-product-factory.vercel.app/api/sprints

# Check Vercel status
vercel ls
```

### Database Connection Issues

```bash
# Verify Supabase credentials
node scripts/alex-ai/auto-migrate.mjs --verify-only

# Test database connection
curl -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  "$SUPABASE_URL/rest/v1/sprints"
```

---

## Best Practices

### Development Workflow

1. **Make changes locally** - Edit code in local environment
2. **Test locally** - Run `npm run dev` and test in browser
3. **Commit & push** - Push to GitHub
4. **Auto-deploy** - Vercel automatically deploys
5. **Test production** - Verify in production dashboard
6. **Compare** - Use VSCode extension to compare both

### Environment Switching

- **Use Local for**: Active development, debugging, testing
- **Use Production for**: Final testing, demo, stakeholder review
- **Switch between**: Testing consistency, deployment verification

### Data Management

- **Test data**: Use project_id prefix like `test-local-` or `test-prod-`
- **Real data**: Use actual project IDs consistently
- **Cleanup**: Delete test sprints after verification

---

## Quick Reference

### URLs

| Environment | Dashboard | API Base |
|------------|-----------|----------|
| Production | https://rag-refresh-product-factory.vercel.app | /api |
| Local | http://localhost:3000 | /api |

### Commands

```bash
# Update extension
cd vscode-extension && npm run dev:reload

# Start local dev
npm run dev

# Test local API
./scripts/test-api-examples.sh

# Deploy to production
git push origin main  # Auto-deploys via Vercel

# Monitor production
vercel logs --follow
```

### VSCode Commands

- `Cmd+Shift+P` → `Alex AI: Switch Environment`
- `Cmd+Shift+P` → `Alex AI: Open Dashboard`
- `Cmd+Shift+P` → `Developer: Reload Window`

---

## Next Steps

1. **Update Extension**: Run `npm run dev:reload` in `vscode-extension/`
2. **Reload VSCode**: `Cmd+Shift+P` → `Developer: Reload Window`
3. **Open Both Dashboards**: Production + Local side-by-side
4. **Test Sprint API**: Create sprints in both environments
5. **Compare Results**: Verify identical behavior

---

## Support

**Extension Issues:**
- Check: `vscode-extension/README.md`
- Logs: VSCode → Help → Toggle Developer Tools → Console

**API Issues:**
- Check: `docs/SPRINT_API.md`
- Test: `./scripts/test-api-examples.sh`

**Database Issues:**
- Check: `node scripts/alex-ai/auto-migrate.mjs --verify-only`
- Verify: Supabase Dashboard

---

**Generated**: December 28, 2025
**Purpose**: Enable dual-environment development and testing
**Status**: Ready for use
