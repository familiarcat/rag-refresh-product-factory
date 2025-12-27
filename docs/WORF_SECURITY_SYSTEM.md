# Lt. Worf Security System

**"Today is a good day to secure secrets"**

## Overview

The Lt. Worf Security System is Alex AI's centralized secrets management and security governance framework. It provides a unified interface for managing credentials across local development, CI/CD pipelines, and production deployments.

## Philosophy

Named after Star Trek's Lt. Worf (Chief of Security), this system embodies:
- **Centralized Control**: Single source of truth for all secrets
- **Audit Everything**: Complete logging of all security operations
- **Defense in Depth**: Multiple validation layers
- **Zero Trust**: Explicit confirmation for sensitive operations
- **Honor and Integrity**: Security as a core value, not an afterthought

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ~/.zshrc                              │
│              (Source of Truth)                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │   Lt. Worf CLI       │
          │  (worf.sh)           │
          └──────────┬───────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
  ┌─────────┐  ┌─────────┐  ┌─────────┐
  │ .secrets│  │  GitHub │  │Supabase │
  │ /vault  │  │ Actions │  │   CLI   │
  └─────────┘  └─────────┘  └─────────┘
        │            │            │
        └────────────┼────────────┘
                     │
                     ▼
              ┌──────────────┐
              │  Audit Log   │
              └──────────────┘
```

## Secret Categories

### Infrastructure
- **AWS Credentials**: Account ID, region, access keys
- **EC2/ECR**: Container registry, deployment targets
- **Environment**: Cloud infrastructure secrets

### Database
- **Supabase**: URL, service role key, anon key
- **Database URLs**: Direct database connection strings

### AI Services
- **OpenAI**: API keys, embedding models
- **Anthropic**: Claude API keys

### Integrations
- **N8N**: Webhook URLs for automation
- **GitHub**: Tokens for API access

## Quick Start

### Setup Local Development

```bash
# Complete local dev setup (recommended for first time)
npm run worf:dev
```

This workflow:
1. Syncs secrets from `~/.zshrc`
2. Validates all required secrets exist
3. Copies to `.env.local` for local development

### Setup CI/CD

```bash
# Push secrets to GitHub Actions
npm run worf:ci
```

This workflow:
1. Syncs secrets from `~/.zshrc`
2. Validates completeness
3. Pushes to GitHub Actions secrets via `gh` CLI

### Run Supabase Migrations

```bash
# Complete Supabase workflow
npm run worf:supabase
```

This workflow:
1. Syncs and validates secrets
2. Links to Supabase project
3. Runs database migrations
4. Verifies connection

## Individual Commands

### Secrets Management

```bash
# Sync secrets from ~/.zshrc to .secrets/.env.local
npm run worf sync

# Validate that all required secrets are present
npm run worf validate

# Copy secrets to .env.local (for local dev)
npm run worf local

# Push secrets to GitHub Actions (requires gh CLI)
npm run worf github
```

### Supabase Commands

```bash
# Link to Supabase project
npm run worf supabase:link

# Run database migrations
npm run worf supabase:migrate

# Verify database connection
npm run worf supabase:verify
```

### Status and Audit

```bash
# Show security system status
npm run worf:status

# View audit log
npm run worf:audit
```

## Security Features

### 1. Audit Logging

All operations are logged to `.secrets/audit.log`:

```
2025-12-26T10:30:00Z | bradygeorgen | sync_from_shell | Success: 15 secrets
2025-12-26T10:30:05Z | bradygeorgen | validate_secrets | Success
2025-12-26T10:30:10Z | bradygeorgen | push_to_github | Success
```

View audit log:
```bash
npm run worf:audit
```

### 2. Validation

Before any operation, Worf validates:
- ✅ Secret format correctness
- ✅ Required secrets presence
- ✅ File permissions (0600)
- ✅ Command availability (gh, supabase)

### 3. Confirmation Prompts

Sensitive operations require explicit confirmation:
- Overwriting `.env.local`
- Pushing to GitHub Actions
- Running production migrations

### 4. Secure Storage

- Secrets stored with `0600` permissions (owner read/write only)
- Encrypted vault in `.secrets/` directory
- Never committed to git (in `.gitignore`)

## Source of Truth: ~/.zshrc

All secrets originate from your `~/.zshrc` file. This provides:

1. **Single Source**: One place to manage all credentials
2. **Portability**: Easy to backup and restore
3. **Shell Integration**: Available in terminal sessions
4. **Security**: Protected by your user account

### Example ~/.zshrc Setup

```bash
# Add to ~/.zshrc
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."
export SUPABASE_ANON_KEY="eyJhbGci..."
export OPENAI_API_KEY="sk-..."
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
```

After editing:
```bash
source ~/.zshrc
npm run worf:dev
```

## Allowlist System

Only secrets in `scripts/secrets/allowlist.env` are synced:

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
OPENAI_API_KEY
...
```

This prevents accidental exposure of sensitive environment variables.

## CI/CD Integration

### GitHub Actions

Worf pushes secrets to GitHub Actions using the `gh` CLI:

```bash
# Authenticate first
gh auth login

# Push secrets
npm run worf:ci
```

Secrets are available in workflows as:
```yaml
- name: Deploy
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

### Automated Workflow

You can automate the sync in your deployment pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Setup Secrets
  run: npm run worf:dev
```

## Supabase CLI Integration

Worf integrates with Supabase CLI for database operations:

```bash
# Link project (uses SUPABASE_URL from secrets)
npm run worf supabase:link

# Run migrations
npm run worf supabase:migrate

# Verify connection
npm run worf supabase:verify
```

The CLI automatically uses credentials from `.env.local`.

## Security Best Practices

### 1. Never Commit Secrets

Ensure `.env.local` and `.secrets/` are in `.gitignore`:

```gitignore
.env.local
.secrets/
```

### 2. Rotate Keys Regularly

```bash
# Update in ~/.zshrc
export SUPABASE_SERVICE_ROLE_KEY="new-key"

# Re-sync everywhere
source ~/.zshrc
npm run worf:dev
npm run worf:ci
```

### 3. Audit Regularly

```bash
# Review recent operations
npm run worf:audit

# Check security status
npm run worf:status
```

### 4. Use Least Privilege

- Development: Use anon key when possible
- CI/CD: Only include necessary secrets
- Production: Separate service accounts

### 5. Monitor Access

The audit log tracks:
- Who accessed secrets
- What operations were performed
- When operations occurred
- Success/failure status

## Troubleshooting

### "Missing required secrets"

**Problem**: Validation fails with missing secrets

**Solution**:
```bash
# Check what's missing
npm run worf validate

# Add to ~/.zshrc
export MISSING_SECRET="value"
source ~/.zshrc

# Re-sync
npm run worf:dev
```

### "GitHub CLI not authenticated"

**Problem**: Cannot push to GitHub Actions

**Solution**:
```bash
gh auth login
npm run worf:ci
```

### "Supabase not linked"

**Problem**: Cannot run migrations

**Solution**:
```bash
npm run worf supabase:link
npm run worf supabase:migrate
```

### "Permission denied"

**Problem**: Cannot read secrets file

**Solution**:
```bash
chmod 600 .secrets/.env.local
chmod 600 .env.local
```

## Advanced Usage

### Custom Workflows

Create your own workflows by combining commands:

```bash
#!/usr/bin/env bash
# scripts/my-workflow.sh

npm run worf sync
npm run worf validate
# ... custom logic ...
npm run worf local
```

### Programmatic Access

Use Worf in your scripts:

```typescript
import { execSync } from 'child_process';

// Sync secrets
execSync('npm run worf:dev', { stdio: 'inherit' });

// Now use secrets
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
```

### Integration with Other Tools

Worf can be integrated with:
- **Terraform**: Use `.env.local` for variable files
- **Docker**: Mount `.env.local` as environment file
- **Kubernetes**: Generate secrets from `.env.local`

## Command Reference

| Command | Description |
|---------|-------------|
| `npm run worf` | Show help |
| `npm run worf:dev` | Setup local development |
| `npm run worf:ci` | Setup CI/CD secrets |
| `npm run worf:supabase` | Run Supabase workflow |
| `npm run worf:status` | Show security status |
| `npm run worf:audit` | View audit log |
| `npm run worf sync` | Sync from ~/.zshrc |
| `npm run worf validate` | Validate secrets |
| `npm run worf local` | Copy to .env.local |
| `npm run worf github` | Push to GitHub Actions |

## Files and Directories

```
scripts/worf/
├── worf.sh                    # Main CLI script
└── security-manifest.json     # Security configuration

.secrets/
├── .env.local                 # Encrypted secrets vault
└── audit.log                  # Security audit log

scripts/secrets/
├── allowlist.env              # Allowed secret keys
└── gh_sync_secrets.sh         # GitHub sync script

scripts/ts/secrets/
└── sync-from-shell.ts         # TypeScript sync implementation
```

## Security Manifest

The `security-manifest.json` defines:
- Secret categories
- Source/destination mappings
- Workflow definitions
- Validation rules
- Audit requirements

View with:
```bash
cat scripts/worf/security-manifest.json | jq '.'
```

## Contributing

When adding new secrets:

1. Add to `~/.zshrc`
2. Add to `scripts/secrets/allowlist.env`
3. Add to `security-manifest.json` (optional)
4. Document in this guide
5. Run `npm run worf:dev` to test

## Support

For issues with the Worf Security System:

1. Check `npm run worf:status`
2. Review `npm run worf:audit`
3. Validate `.secrets/.env.local` exists and has correct permissions
4. Ensure `~/.zshrc` has all required exports

---

**"Today is a good day to secure secrets"** - Lt. Worf

*Part of the Alex AI Security Framework*
