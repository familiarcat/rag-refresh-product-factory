# Lt. Worf Security Agent - Integration Guide

**"Today is a good day to secure secrets"**

## Overview

Lt. Worf is now integrated as an **AI-powered security agent** within the Alex AI crew system. Worf provides centralized secrets management with intelligent automation, audit logging, and crew coordination.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    ~/.zshrc                               │
│              (Source of Truth)                            │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
       ┌─────────────────────────────┐
       │    Lt. Worf AI Agent        │
       │  (Security & Secrets)       │
       └──────────┬──────────────────┘
                  │
     ┌────────────┼────────────┐
     │            │            │
     ▼            ▼            ▼
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Bash    │  │  API    │  │  n8n    │
│ Scripts │  │ Endpoint│  │Workflow │
└─────────┘  └─────────┘  └─────────┘
     │            │            │
     └────────────┼────────────┘
                  │
                  ▼
         ┌────────────────┐
         │  Crew System   │
         │  Coordination  │
         └────────────────┘
```

## Three Ways to Use Worf

### 1. CLI/npm Scripts (Fastest)

```bash
# Complete workflows
npm run worf:dev         # Setup local development
npm run worf:ci          # Setup CI/CD
npm run worf:supabase    # Run Supabase migrations

# Individual operations
npm run worf sync        # Sync from ~/.zshrc
npm run worf validate    # Validate secrets
npm run worf:status      # Show security status
npm run worf:audit       # View audit log
```

### 2. API Endpoint (Programmable)

```bash
# Get security status
curl http://localhost:3001/api/crew/worf?action=status | jq '.'

# Execute security operation
curl -X POST http://localhost:3001/api/crew/worf \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "analyze_security"
  }' | jq '.'

# Request crew assistance
curl -X POST http://localhost:3001/api/crew/worf \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "request_crew_assistance",
    "params": {
      "task": "supabase_migration",
      "urgency": "high"
    }
  }' | jq '.'
```

### 3. n8n Automation (AI-Powered)

Import the workflow from `docs/n8n/worf-security-workflow.json` into n8n.

**Trigger**: Webhook or schedule
**Actions**:
- Security status check
- Automatic crew coordination
- Smart alerts on critical issues
- Automated remediation workflows

## Quick Start: Supabase Migration with Worf

### Step 1: Invoke Worf for Supabase Workflow

```bash
# Let Worf handle the complete workflow
npm run worf:supabase
```

This will:
1. ✅ Sync secrets from ~/.zshrc
2. ✅ Validate all required secrets
3. ✅ Copy to .env.local
4. ✅ Link to Supabase project
5. ✅ Run database migrations
6. ✅ Verify connection
7. ✅ Log everything to audit trail

### Step 2: Verify with API

```bash
# Check security status
curl http://localhost:3001/api/crew/worf?action=status | jq '.analysis'
```

### Step 3: Test RBAC Integration

```bash
# Generate API key
curl http://localhost:3001/api/dev/test-auth?action=create-api-key&email=dev1@example.com | jq '.'

# Test with API key
export API_KEY="alex_..."
curl -H "Authorization: Bearer $API_KEY" \
  http://localhost:3001/api/projects | jq '.'
```

## AI Agent Capabilities

Worf as an AI agent provides:

### 1. Intelligent Security Analysis

```typescript
import { worf } from '@/lib/crew/worf-security-agent';

const analysis = await worf.analyzeSecurityPosture();
console.log(analysis);
// {
//   overall: 'good',
//   issues: ['GitHub CLI not authenticated'],
//   recommendations: ['Run: gh auth login']
// }
```

### 2. Crew Coordination

```typescript
const assistance = await worf.requestCrewAssistance(
  'supabase_migration',
  'high'
);

console.log(assistance.suggested_crew);
// ['worf', 'data', 'laforge']

console.log(assistance.coordination_notes);
// "Security posture is good. Proceeding with supabase_migration is acceptable."
```

### 3. Automated Operations

```typescript
// Setup complete development environment
const result = await worf.setupLocalDev();

if (result.success) {
  console.log('Local development ready!');
} else {
  console.error('Setup failed:', result.details);
}
```

### 4. Real-time Status Monitoring

```typescript
const status = await worf.getStatus();

if (!status.supabase_linked) {
  await worf.linkSupabase();
}

if (status.secrets_vault.count < 10) {
  console.warn('Insufficient secrets - check ~/.zshrc');
}
```

## Integration with Alex AI Crew

Worf works alongside other crew members:

```typescript
// scripts/alex-ai/coordinate.mjs

const suggestTeam = (task) => {
  if (task.includes('security') || task.includes('secrets')) {
    return ['worf', 'data'];  // Worf + Data for security tasks
  }

  if (task.includes('database') || task.includes('migration')) {
    return ['worf', 'data', 'laforge'];  // Add Geordi for infrastructure
  }

  // ... other team assignments
};
```

## n8n Workflow Integration

### Automated Security Checks

1. **Import workflow**: `docs/n8n/worf-security-workflow.json`
2. **Configure webhook**: Set `ALEX_AI_URL` environment variable
3. **Trigger**:
   - Schedule (daily security audit)
   - Pre-deployment hook
   - Manual trigger for migrations

### Example: Pre-Deployment Security Check

```json
{
  "trigger": "webhook",
  "url": "https://your-n8n.com/webhook/worf/security-check",
  "workflow": [
    "Get Security Status",
    "Is Critical?",
    "Request Crew Assistance",
    "Block Deployment if Critical"
  ]
}
```

## Worf Agent Profile

```json
{
  "crew_id": "worf",
  "name": "Lieutenant Worf",
  "rank": "Lieutenant",
  "role": "Security & Access Control",
  "department": "Security",
  "motto": "Today is a good day to secure secrets",

  "primary_expertise": [
    "secrets_management",
    "security_auditing",
    "access_control",
    "ci_cd_security",
    "compliance_monitoring"
  ],

  "capabilities": [
    "sync_secrets_from_shell",
    "validate_secrets_completeness",
    "push_to_github_actions",
    "link_supabase_project",
    "run_secure_migrations",
    "audit_security_operations",
    "analyze_security_status",
    "detect_vulnerabilities"
  ],

  "temperature": 0.4,
  "preferred_models": ["claude-3.7-sonnet"]
}
```

## API Reference

### GET /api/crew/worf

**Query Parameters**:
- `action=profile` - Get agent profile
- `action=status` - Get security status
- `action=audit&limit=20` - Get audit log

**Response**:
```json
{
  "agent": {...},
  "security_status": {...},
  "security_analysis": {
    "overall": "good",
    "issues": [],
    "recommendations": []
  }
}
```

### POST /api/crew/worf

**Body**:
```json
{
  "operation": "supabase_workflow",
  "params": {}
}
```

**Available Operations**:
- `sync_secrets`
- `validate_secrets`
- `setup_local_dev`
- `setup_ci_cd`
- `link_supabase`
- `run_migrations`
- `supabase_workflow`
- `analyze_security`
- `request_crew_assistance`

## Security Features

### 1. Audit Logging

Every operation logged to `.secrets/audit.log`:

```
2025-12-26T15:00:00Z | user | sync_secrets | success | {...}
2025-12-26T15:00:05Z | user | validate_secrets | success | {...}
2025-12-26T15:00:10Z | user | supabase_workflow | success | {...}
```

View audit log:
```bash
npm run worf:audit
```

### 2. Security Analysis

AI-powered analysis of security posture:

```bash
curl http://localhost:3001/api/crew/worf?action=status | jq '.analysis'
```

### 3. Crew Coordination

Automatic crew assignment for security tasks:

- **Secrets Management**: Worf + Data
- **Database Migration**: Worf + Data + Geordi
- **Security Audit**: Worf + Data + Picard
- **Vulnerability Scan**: Worf + Data

### 4. Zero Trust Validation

Every operation:
- ✅ Validates prerequisites
- ✅ Checks permissions
- ✅ Confirms sensitive actions
- ✅ Logs to audit trail

## Troubleshooting

### "Worf agent not responding"

**Check**:
```bash
curl http://localhost:3001/api/crew/worf
```

**Fix**: Ensure dev server is running on port 3001

### "Security posture critical"

**Check**:
```bash
npm run worf:status
```

**Fix**: Follow recommendations in analysis output

### "Supabase workflow failed"

**Check**:
```bash
npm run worf:audit
```

**Fix**: Review audit log for specific error

## Next Steps

1. **Complete Supabase Migration**:
   ```bash
   npm run worf:supabase
   ```

2. **Setup CI/CD**:
   ```bash
   npm run worf:ci
   ```

3. **Import n8n Workflow**:
   - Import `docs/n8n/worf-security-workflow.json`
   - Configure Alex AI API credentials
   - Set up webhook triggers

4. **Integrate with Crew System**:
   - Use Worf API in coordination scripts
   - Add security checks to deployment pipelines
   - Enable automated security audits

## Resources

- **Documentation**: `docs/WORF_SECURITY_SYSTEM.md`
- **API Endpoint**: `/api/crew/worf`
- **Agent Code**: `lib/crew/worf-security-agent.ts`
- **Bash Scripts**: `scripts/worf/worf.sh`
- **n8n Workflow**: `docs/n8n/worf-security-workflow.json`

---

**"Today is a good day to secure secrets"** - Lt. Worf

*Part of the Alex AI Crew System*
