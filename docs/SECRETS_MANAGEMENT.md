# Alex AI - Secrets Management Guide

**Version**: 1.0.0
**Date**: 2025-12-26
**Status**: Production

---

## Overview

Alex AI uses a centralized secrets management system that syncs credentials from your shell environment (`~/.zshrc`) to the project. This ensures:

- ✅ **Single source of truth** - All credentials in `~/.zshrc`
- ✅ **Automatic syncing** - One command to update all projects
- ✅ **Security** - `.env.local` is git-ignored and has restricted permissions (0600)
- ✅ **Flexibility** - Supports local dev, CI/CD, and production environments
- ✅ **No hardcoding** - Never commit secrets to git

---

## Architecture

```
~/.zshrc (single source of truth)
    ↓
npm run script:secrets:sync
    ↓
scripts/ts/secrets/sync-from-shell.ts
    ↓
scripts/secrets/allowlist.env (whitelist)
    ↓
.secrets/.env.local (generated, 0600 permissions)
    ↓
.env.local (copied from .secrets/)
    ↓
Scripts & Next.js app load credentials
```

---

## Quick Start

### 1. Add Credentials to ~/.zshrc

Open your shell configuration:

```bash
nano ~/.zshrc
# or
code ~/.zshrc
```

Add your credentials (if not already present):

```bash
# Supabase (RBAC Database)
export SUPABASE_URL="https://rpkkkbufdwxmjaerbhbn.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export SUPABASE_ANON_KEY="your-anon-key"

# N8N Workflows
export N8N_WEBHOOK_URL="https://n8n.pbradygeorgen.com/webhook/sync"
export N8N_PROJECT_WEBHOOK_URL="https://n8n.pbradygeorgen.com/webhook/create-project"

# AWS (if using)
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"
```

### 2. Reload Shell

```bash
source ~/.zshrc
```

### 3. Sync to Project

```bash
cd /Users/bradygeorgen/Documents/workspace/rag-refresh-product-factory
npm run script:secrets:sync
```

**Expected output**:
```
/Users/bradygeorgen/Documents/workspace/rag-refresh-product-factory/.secrets/.env.local
```

### 4. Verify Sync

```bash
cat .env.local
```

**Should contain**:
```bash
SUPABASE_URL='https://rpkkkbufdwxmjaerbhbn.supabase.co'
SUPABASE_SERVICE_ROLE_KEY='eyJhbGci...'
SUPABASE_ANON_KEY='your-anon-key'
N8N_WEBHOOK_URL='https://n8n.pbradygeorgen.com/webhook/sync'
...
```

---

## Credential Whitelist

Only credentials listed in `scripts/secrets/allowlist.env` are synced. This prevents accidental exposure of unrelated environment variables.

**Current whitelist**:
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_SESSION_TOKEN
AWS_DEFAULT_REGION
AMPLIFY_APP_ID
AMPLIFY_BRANCH
DOCKER_USERNAME
DOCKER_PASSWORD
N8N_BASIC_AUTH_USER
N8N_BASIC_AUTH_PASSWORD
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
N8N_WEBHOOK_URL
N8N_PROJECT_WEBHOOK_URL
```

### Adding New Credentials

1. Add to `~/.zshrc`:
   ```bash
   export MY_NEW_SECRET="my-secret-value"
   ```

2. Add to `scripts/secrets/allowlist.env`:
   ```
   MY_NEW_SECRET
   ```

3. Reload and sync:
   ```bash
   source ~/.zshrc
   npm run script:secrets:sync
   ```

---

## npm Scripts

### Secrets Management

| Command | Description |
|---------|-------------|
| `npm run script:secrets:sync` | Sync credentials from `~/.zshrc` to `.secrets/.env.local` |
| `npm run script:secrets:ensure` | Ensure `.env.local` exists (creates from `.secrets/` if needed) |

### Database (Requires Supabase Credentials)

| Command | Description |
|---------|-------------|
| `npm run db:migrate` | Apply Supabase migrations |
| `npm run db:test` | Test RBAC permissions |
| `npm run db:verify` | Verify database schema |

---

## Files

### Source Files

| File | Purpose | Tracked in Git |
|------|---------|----------------|
| `~/.zshrc` | Single source of truth | ❌ No (user's shell) |
| `scripts/secrets/allowlist.env` | Whitelist of allowed credentials | ✅ Yes |
| `scripts/ts/secrets/sync-from-shell.ts` | Sync script | ✅ Yes |
| `scripts/ts/secrets/ensure-env.ts` | Ensure script | ✅ Yes |
| `.env.local.example` | Template for manual setup | ✅ Yes |

### Generated Files (Git-Ignored)

| File | Purpose | Permissions |
|------|---------|-------------|
| `.secrets/.env.local` | Synced credentials | 0600 (user-only) |
| `.env.local` | Copy for Next.js/scripts | 0644 (default) |

**⚠️ NEVER commit `.env.local` or `.secrets/.env.local` to git!**

---

## Workflows

### Local Development

```bash
# One-time setup
npm run script:secrets:sync

# Start development server
npm run dev
```

**Next.js automatically loads `.env.local`**

### Running Database Migrations

```bash
# Sync credentials (if not done recently)
npm run script:secrets:sync

# Apply migrations
npm run db:migrate

# Test permissions
npm run db:test
```

### Running Scripts

Most scripts automatically load `.env.local`:

```bash
# Migration script (uses dotenv)
npm run db:migrate

# Alex AI scripts (use process.env)
npm run alex-ai:activate
npm run crew:chat
```

### CI/CD (GitHub Actions)

GitHub Actions uses **GitHub Secrets** instead of syncing from `~/.zshrc`.

**Setup**:
1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Add secrets:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - etc.

3. Reference in `.github/workflows/*.yml`:
   ```yaml
   env:
     SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
     SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
   ```

---

## Security Best Practices

### ✅ DO

- ✅ Store all credentials in `~/.zshrc`
- ✅ Add credentials to allowlist before syncing
- ✅ Use `npm run script:secrets:sync` to update credentials
- ✅ Keep `.env.local` in `.gitignore`
- ✅ Use restrictive file permissions (0600 for `.secrets/.env.local`)
- ✅ Rotate credentials regularly
- ✅ Use separate credentials for dev/staging/production

### ❌ DON'T

- ❌ Commit `.env.local` to git
- ❌ Hardcode secrets in source code
- ❌ Share `.env.local` files via Slack/email
- ❌ Use production credentials in development
- ❌ Store secrets in unencrypted files outside `~/.zshrc`
- ❌ Add sensitive env vars without adding to allowlist first

---

## Troubleshooting

### Issue: `.env.local` not found

**Symptom**: Scripts fail with "environment variable not set"

**Solution**:
```bash
npm run script:secrets:sync
```

### Issue: Credentials not syncing

**Symptom**: `.env.local` missing expected values

**Solution**:
1. Check credentials exist in `~/.zshrc`:
   ```bash
   echo $SUPABASE_URL
   ```

2. Check allowlist includes the variable:
   ```bash
   grep SUPABASE_URL scripts/secrets/allowlist.env
   ```

3. Reload shell and re-sync:
   ```bash
   source ~/.zshrc
   npm run script:secrets:sync
   ```

### Issue: Permission denied

**Symptom**: `EACCES` error when accessing `.secrets/.env.local`

**Solution**:
```bash
chmod 600 .secrets/.env.local
```

### Issue: Wrong credentials being used

**Symptom**: Script connects to wrong Supabase project

**Solution**:
1. Verify `~/.zshrc` has correct values
2. Delete `.env.local` and re-sync:
   ```bash
   rm .env.local
   npm run script:secrets:sync
   ```

3. Verify synced values:
   ```bash
   cat .env.local | grep SUPABASE
   ```

---

## Manual Setup (Alternative)

If you prefer not to use the sync script:

1. Copy example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local`:
   ```bash
   nano .env.local
   ```

3. Replace placeholder values:
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

**⚠️ This method is NOT recommended** because:
- Not synced with `~/.zshrc` (manual updates required)
- Risk of committing secrets if `.gitignore` is misconfigured
- No automatic validation

---

## Environment Variable Reference

### Supabase (RBAC Database)

| Variable | Purpose | Where to Get |
|----------|---------|--------------|
| `SUPABASE_URL` | Supabase project URL | [Dashboard → Settings → API](https://supabase.com/dashboard/project/_/settings/api) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin access) | [Dashboard → Settings → API](https://supabase.com/dashboard/project/_/settings/api) |
| `SUPABASE_ANON_KEY` | Anonymous key (public access) | [Dashboard → Settings → API](https://supabase.com/dashboard/project/_/settings/api) |

**Example**:
```bash
export SUPABASE_URL="https://rpkkkbufdwxmjaerbhbn.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### N8N (Workflow Automation)

| Variable | Purpose |
|----------|---------|
| `N8N_WEBHOOK_URL` | Generic webhook endpoint |
| `N8N_PROJECT_WEBHOOK_URL` | Project creation webhook |
| `N8N_BASIC_AUTH_USER` | N8N basic auth username |
| `N8N_BASIC_AUTH_PASSWORD` | N8N basic auth password |

### AWS (Cloud Infrastructure)

| Variable | Purpose |
|----------|---------|
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_SESSION_TOKEN` | AWS session token (temporary credentials) |
| `AWS_DEFAULT_REGION` | Default AWS region (e.g., `us-east-1`) |
| `AMPLIFY_APP_ID` | AWS Amplify app ID |
| `AMPLIFY_BRANCH` | Amplify deployment branch |

### Docker (Container Registry)

| Variable | Purpose |
|----------|---------|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub password or token |

---

## Integration Examples

### Next.js App

Next.js automatically loads `.env.local`:

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Node.js Scripts

Scripts using `dotenv`:

```javascript
// scripts/my-script.mjs
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
console.log('Connected to:', supabaseUrl);
```

### VSCode Extension

VSCode extension uses API keys (future Phase 4):

```typescript
// vscode-extension/src/auth.ts
const apiKey = await context.secrets.get('alex-ai-api-key');
const response = await fetch(process.env.SUPABASE_URL, {
  headers: { Authorization: `Bearer ${apiKey}` }
});
```

---

## Migration from Old System

If you previously used a different secrets management approach:

### From Hardcoded Values

1. Extract all hardcoded secrets
2. Add to `~/.zshrc`
3. Add to allowlist
4. Sync and test
5. Remove hardcoded values

### From .env Files

1. Copy values from old `.env` to `~/.zshrc`
2. Delete old `.env` file
3. Run `npm run script:secrets:sync`
4. Verify all scripts still work

### From Environment Variables

1. Export all env vars to `~/.zshrc`
2. Add to allowlist
3. Sync and test
4. Remove manual `export` commands from scripts

---

## Next Steps

1. **Verify credentials synced**:
   ```bash
   npm run script:secrets:sync
   cat .env.local
   ```

2. **Test database connection**:
   ```bash
   npm run db:verify
   ```

3. **Apply migrations**:
   ```bash
   npm run db:migrate
   ```

4. **Test RBAC permissions**:
   ```bash
   npm run db:test
   ```

5. **Start development**:
   ```bash
   npm run dev
   ```

---

## References

### Internal Documentation
- [RBAC Architecture](./RBAC_ARCHITECTURE.md) - Complete RBAC design
- [RBAC Phase 1 Complete](./RBAC_PHASE1_COMPLETE.md) - Database schema
- [Supabase README](../supabase/README.md) - Migration guide

### Scripts
- `scripts/ts/secrets/sync-from-shell.ts` - Sync implementation
- `scripts/ts/secrets/ensure-env.ts` - Ensure implementation
- `scripts/secrets/allowlist.env` - Credential whitelist
- `.env.local.example` - Credential template

### External Resources
- [Supabase Dashboard](https://supabase.com/dashboard)
- [N8N Webhooks](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [AWS IAM](https://aws.amazon.com/iam/)

---

**Version**: 1.0.0
**Last Updated**: 2025-12-26
**Maintained by**: Alex AI Crew
