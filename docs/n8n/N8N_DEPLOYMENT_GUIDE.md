# n8n Workflow Deployment Guide

## 🎯 Deploy Alex AI Crew Collaboration Optimizer

**Automate crew collaboration every 6 hours with cost-optimized OpenRouter integration**

---

## Prerequisites

1. **n8n installed** (self-hosted or cloud)
   ```bash
   # Docker (recommended)
   docker run -it --rm \
     --name n8n \
     -p 5678:5678 \
     -v ~/.n8n:/home/node/.n8n \
     n8nio/n8n

   # Or npm
   npm install -g n8n
   n8n start
   ```

2. **OpenRouter API Key**
   - Sign up at https://openrouter.ai
   - Get API key from dashboard
   - Add credits ($5+ recommended)

3. **Next.js API running**
   ```bash
   cd /path/to/rag-refresh-product-factory
   npm run dev # or deploy to production
   ```

---

## Step 1: Import Workflow

### Option A: Via n8n UI (Recommended)

1. Open n8n: http://localhost:5678
2. Click "**Import from File**"
3. Select: `docs/n8n/workflows/crew-collaboration-optimizer.json`
4. Click "**Import**"

### Option B: Via API

```bash
curl -X POST http://localhost:5678/rest/workflows \
  -H "Content-Type: application/json" \
  -d @docs/n8n/workflows/crew-collaboration-optimizer.json
```

---

## Step 2: Configure Environment Variables

### In n8n Settings → Environment

```bash
# OpenRouter API Key (required)
OPENROUTER_API_KEY=sk-or-v1-...

# Next.js API URL (required)
NEXTJS_API_URL=http://localhost:3000

# Slack webhook for alerts (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### Or Docker Environment

```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -e OPENROUTER_API_KEY=sk-or-v1-... \
  -e NEXTJS_API_URL=http://host.docker.internal:3000 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

---

## Step 3: Activate Workflow

1. Open imported workflow in n8n
2. Click "**Activate**" toggle (top right)
3. Workflow now runs every 6 hours automatically

**Schedule:**
- Default: Every 6 hours (`0 */6 * * *`)
- Customize: Edit "Schedule Trigger" node

---

## Step 4: Test Workflow

### Manual Test Run

1. Open workflow in n8n
2. Click "**Execute Workflow**" button
3. Watch execution in real-time
4. Check results in execution log

### Expected Output

```
✅ Schedule Trigger: Fired
✅ Get Active Projects: 8 projects loaded
✅ Identify Opportunities: 8 opportunities found
✅ Assign Crew: Optimal crews assigned
✅ Optimize LLM: Models selected (60% cost savings)
✅ Execute Collaboration: 3 collaborations completed
✅ Log Results: Saved to database
✅ Save Metrics: Metrics stored
```

---

## Step 5: Monitor Execution

### View Execution History

1. n8n → Executions tab
2. Filter by workflow: "Alex AI Crew Collaboration Optimizer"
3. Click execution to see details
4. Check for errors or warnings

### Check Metrics API

```bash
# Get collaboration metrics
curl http://localhost:3000/api/crew/metrics

# Expected response
{
  "total": 3,
  "analytics": {
    "totalCost": 0.0598,
    "totalTokens": 18000,
    "avgCost": 0.0199,
    "costPer1KTokens": 0.00332
  },
  "crewUsage": {
    "commander_riker": 3,
    "chief_obrien": 3,
    "counselor_troi": 3
  },
  "modelUsage": {
    "anthropic/claude-3.5-sonnet": 3,
    "anthropic/claude-3-haiku": 3,
    "openai/gpt-3.5-turbo": 3
  }
}
```

---

## Workflow Configuration

### Adjust Schedule

Edit "Schedule: Every 6 Hours" node:

```
# Every 6 hours
0 */6 * * *

# Every hour (high-frequency)
0 * * * *

# Daily at 9 AM
0 9 * * *

# Weekdays only at 10 AM
0 10 * * 1-5
```

### Modify Priority Thresholds

Edit "Identify Opportunities" node JavaScript:

```javascript
// Current thresholds
const priority = domain.progress < 25 ? 'high' :
                (domain.status === 'in-progress' && domain.progress < 50) ? 'medium' : 'low';

// Custom thresholds
const priority = domain.progress < 15 ? 'critical' :
                domain.progress < 30 ? 'high' :
                domain.progress < 60 ? 'medium' : 'low';
```

### Add Slack Alerts

Edit "Alert Team" node URL:

```javascript
// Replace with your Slack webhook
url: process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'

// Customize message format
message: `🚨 High Priority Alert
Project: ${projectName}
Domain: ${domainName}
Progress: ${progress}%
Crew: ${assignedCrew.join(', ')}
Action: Click here to view`
```

---

## Troubleshooting

### Error: "Cannot connect to Next.js API"

**Solution:**
```bash
# Check Next.js is running
curl http://localhost:3000/api/projects

# If using Docker, use host.docker.internal
NEXTJS_API_URL=http://host.docker.internal:3000

# Or use production URL
NEXTJS_API_URL=https://your-app.vercel.app
```

### Error: "OpenRouter API key invalid"

**Solution:**
```bash
# Verify API key
curl https://openrouter.ai/api/v1/auth/key \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"

# Check credits
# Visit: https://openrouter.ai/settings/credits
```

### Workflow doesn't trigger automatically

**Solution:**
1. Check workflow is **activated** (toggle on)
2. Verify schedule trigger node is configured
3. Check n8n logs for errors:
   ```bash
   docker logs n8n
   ```

### Collaborations not executing

**Solution:**
1. Check crew availability > 50%
2. Verify projects have status="active"
3. Check API route `/api/crew/collaborate` is accessible
4. Review execution logs in n8n

---

## Advanced Configuration

### Multi-Environment Setup

```bash
# Development
NEXTJS_API_URL=http://localhost:3000

# Staging
NEXTJS_API_URL=https://staging.your-app.com

# Production
NEXTJS_API_URL=https://your-app.com
```

### Custom Crew Assignments

Edit "Assign Crew" node JavaScript:

```javascript
const domainCrewMap = {
  'collaboration-engine': ['commander_riker', 'commander_data', 'counselor_troi'],
  'rag-memory': ['commander_data', 'geordi_la_forge', 'quark'],

  // Add your custom mappings
  'your-domain': ['crew_member_1', 'crew_member_2'],
};
```

### Cost Optimization

Edit "Optimize LLM Selection" node JavaScript:

```javascript
// Budget mode (cheapest models)
const budgetMode = {
  all: 'anthropic/claude-3-haiku'
};

// Quality mode (best models)
const qualityMode = {
  all: 'anthropic/claude-3.5-sonnet'
};

// Balanced mode (current)
const balancedMode = CREW_MODEL_PREFERENCES;

// Select mode
const activeMode = balancedMode; // Change as needed
```

---

## Maintenance

### Weekly Tasks

1. **Check metrics:**
   ```bash
   curl http://localhost:3000/api/crew/metrics
   ```

2. **Review cost:**
   - OpenRouter dashboard → Usage
   - Expected: $0.02-0.05 per collaboration

3. **Verify crew availability:**
   - All crew > 40% availability
   - Reset weekly if needed

### Monthly Tasks

1. **Optimize crew assignments**
   - Review which crews are most effective
   - Adjust `domainCrewMap` based on success rate

2. **Refine model selection**
   - Test different model combinations
   - Measure quality vs cost trade-offs

3. **Update workflows**
   - Export latest from n8n
   - Commit to `docs/n8n/workflows/`

---

## Scaling

### High-Frequency Mode

For very active projects:

```
Schedule: Every hour
Priority: Progress < 40% (more aggressive)
Team Size: 2-4 crew (faster execution)
Models: Haiku + GPT-3.5 (cheapest)
```

### Enterprise Mode

For production use:

```
Schedule: Every 6 hours
Priority: Progress < 25% (conservative)
Team Size: 3-5 crew (thorough)
Models: Balanced (quality + cost)
Monitoring: Slack alerts + metrics dashboard
```

---

## Security

### API Key Management

```bash
# Never commit API keys
# Use environment variables
# Rotate keys monthly

# Store in .env.local
OPENROUTER_API_KEY=sk-or-v1-...

# Or use secrets manager
# AWS SSM, Vault, etc.
```

### Network Security

```bash
# Use HTTPS for production
NEXTJS_API_URL=https://your-app.com

# Restrict API access
# Add authentication to /api/crew/* routes
# Use API keys or JWT tokens
```

---

## Support

### Documentation
- n8n docs: https://docs.n8n.io
- OpenRouter docs: https://openrouter.ai/docs
- Alex AI guide: `CREW_AUTOMATION_GUIDE.md`

### Debugging
```bash
# n8n logs
docker logs n8n -f

# Next.js logs
npm run dev

# Check network
curl -v http://localhost:3000/api/crew/collaborate
```

---

## Success Checklist

- [ ] n8n running (http://localhost:5678)
- [ ] Workflow imported
- [ ] Environment variables set
- [ ] Workflow activated
- [ ] Test execution successful
- [ ] Metrics API responding
- [ ] Slack alerts working (optional)
- [ ] Schedule confirmed (every 6 hours)
- [ ] Cost tracking enabled
- [ ] Documentation reviewed

---

**Deployment complete! The crew is now working 24/7 to optimize your projects.** 🚀

For questions or issues, check the execution logs in n8n or the metrics API.
