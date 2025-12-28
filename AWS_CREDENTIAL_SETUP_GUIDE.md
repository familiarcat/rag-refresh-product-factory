# Step-by-Step: AWS Credentials Setup for Worf CI/CD Integration

**Current Status:**
- ✅ Worf vault exists: `~/.alexai-secrets/api-keys.env`
- ✅ `load_alex_ai_secrets()` function working in `~/.zshrc`
- ✅ Region correctly set: `us-east-2`
- ❌ AWS credentials are **invalid/expired**
- ❌ Deployment will fail until credentials are updated

**Goal:** Get valid AWS credentials and integrate them with Worf secure vault for CI/CD deployments.

---

## 🎯 Quick Fix (Recommended)

Use the interactive credential fixer that integrates with Worf:

```bash
./scripts/fix-aws-credentials.sh
```

**What it does:**
1. Checks current credential status
2. Prompts for new AWS credentials
3. Validates credentials work
4. Updates Worf vault (`~/.alexai-secrets/api-keys.env`)
5. Syncs to project `.env.local` for immediate use
6. Preserves existing non-AWS secrets

**Choose Option 1** when prompted (Worf secure vault - RECOMMENDED)

---

## 📋 Manual Step-by-Step Process

If you prefer to do it manually or need to understand what's happening:

### Step 1: Get AWS Credentials from AWS Console

#### Option A: Use Existing IAM User

1. **Login to AWS Console**: https://console.aws.amazon.com/
2. **Navigate to IAM**:
   - Services → IAM → Users
3. **Find your user** (or create a new one):
   - Look for existing user: `brady`, `pbradygeorgen`, `rag-deploy`, etc.
4. **Create Access Key**:
   - Click on username → Security credentials tab
   - Scroll to "Access keys" section
   - Click **"Create access key"**
5. **Choose use case**:
   - Select: **"Command Line Interface (CLI)"**
   - Check: "I understand the above recommendation"
   - Click: **"Next"**
6. **Add description tag** (optional):
   - Description: "RAG Refresh deployment - Dec 2025"
   - Click: **"Create access key"**
7. **Save credentials immediately**:
   ```
   Access Key ID: AKIA... (starts with AKIA)
   Secret Access Key: ... (long random string)
   ```
   ⚠️ **CRITICAL**: You can only see the secret key once! Download CSV or copy now.

#### Option B: Check if You Have Valid Credentials Elsewhere

Check if you have valid credentials in password manager, notes, or previous terminal sessions.

### Step 2: Verify IAM Permissions

Your IAM user needs these permissions for deployment:

**Required AWS Services:**
- ✅ ECR (Elastic Container Registry) - Push Docker images
- ✅ EC2 - Manage instances
- ✅ SSM (Systems Manager) - Deploy via SSM
- ✅ STS (Security Token Service) - Validate credentials

**Recommended Managed Policies:**
- `AmazonEC2ContainerRegistryFullAccess`
- `AmazonSSMManagedInstanceCore`
- `AmazonEC2ReadOnlyAccess`

**Or create inline policy:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ssm:SendCommand",
        "ssm:GetCommandInvocation",
        "ec2:DescribeInstances",
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```

### Step 3: Update Worf Vault with New Credentials

#### Method A: Using Interactive Script (Recommended)

```bash
./scripts/fix-aws-credentials.sh
```

When prompted:
- **Storage location**: Choose `1` (Worf secure vault)
- **AWS Access Key ID**: Paste `AKIA...`
- **AWS Secret Access Key**: Paste secret key
- **AWS Region**: Press Enter for default `us-east-2`

The script will:
- ✅ Backup existing vault
- ✅ Preserve all non-AWS secrets (Supabase, OpenRouter, N8N, etc.)
- ✅ Update only AWS credentials
- ✅ Test credentials with `aws sts get-caller-identity`
- ✅ Sync to `.env.local` for immediate use
- ✅ Set proper permissions (600)

#### Method B: Manual Edit of Worf Vault

```bash
# Backup current vault
cp ~/.alexai-secrets/api-keys.env ~/.alexai-secrets/api-keys.env.backup.$(date +%Y%m%d-%H%M%S)

# Edit vault
nano ~/.alexai-secrets/api-keys.env
```

**Find and update these lines:**

```bash
# AWS Configuration (updated YYYY-MM-DD)
export AWS_ACCESS_KEY_ID=AKIA...                    # ← Replace with new key
export AWS_SECRET_ACCESS_KEY=...                    # ← Replace with new secret
export AWS_REGION=us-east-2                         # ← Verify this is correct
export AWS_DEFAULT_REGION=us-east-2                 # ← Verify this is correct
export AWS_ACCOUNT_ID=860268930466                  # ← Keep this
```

**Save and set permissions:**

```bash
chmod 600 ~/.alexai-secrets/api-keys.env
```

### Step 4: Test New Credentials

```bash
# Reload secrets from vault
source ~/.zshrc

# Test AWS credentials
aws sts get-caller-identity
```

**Expected output:**

```json
{
    "UserId": "AIDA...",
    "Account": "860268930466",
    "Arn": "arn:aws:iam::860268930466:user/your-username"
}
```

If you see this, credentials are **VALID** ✅

If you see errors:
- ❌ `InvalidClientTokenId` - Credentials are wrong, try again
- ❌ `ExpiredToken` - Credentials expired, create new ones
- ❌ `Could not connect to endpoint` - Region typo (should be `us-east-2`)

### Step 5: Update GitHub Actions Secrets (for CI/CD)

Your GitHub Actions workflow needs the same credentials.

**Use Worf to sync:**

```bash
./scripts/worf/worf.sh ci
```

**Or manually via GitHub Web UI:**

1. Go to: https://github.com/familiarcat/rag-refresh-product-factory/settings/secrets/actions
2. Update or create these secrets:
   - `AWS_ACCESS_KEY_ID` = Your new access key ID
   - `AWS_SECRET_ACCESS_KEY` = Your new secret key
   - `AWS_REGION` = `us-east-2`

### Step 6: Sync to Project .env.local (for immediate use)

```bash
# Copy from Worf vault to project
cp ~/.alexai-secrets/api-keys.env .env.local
chmod 600 .env.local
```

Or let the deploy script do it automatically (it prefers Worf vault).

### Step 7: Test Deployment

#### Test 1: Security Pre-checks

```bash
./scripts/worf/secure-deployment.sh check
```

**Expected output:**

```
[Worf] Checking secrets source...
  ✓ Worf secure vault found: ~/.alexai-secrets/api-keys.env
  ✓ Using centralized secure storage

[Worf] Validating AWS credentials...
  ✓ Credentials valid
  ℹ️  Account: 860268930466
  ℹ️  User: arn:aws:iam::860268930466:user/your-username

[Worf] Checking for sensitive files in git...
  ✓ No sensitive files in git

[Worf] Verifying .gitignore coverage...
  ✓ .gitignore properly configured

✅ All security checks passed!
```

#### Test 2: Full Deployment

```bash
./scripts/worf/secure-deployment.sh deploy
```

This will:
1. Run all security pre-checks
2. Build Docker image
3. Push to ECR
4. Deploy to EC2 via SSM
5. Verify deployment success

**Or use quick deploy:**

```bash
./scripts/deploy-app.sh
```

---

## 🔍 Current Credential Status

I detected the following in your system:

### In ~/.zshrc (Direct Exports)

```bash
✅ OPENROUTER_API_KEY (valid)
✅ OPENROUTER_PROVISIONING_KEY (valid)
✅ SUPABASE_URL (valid)
✅ SUPABASE_SERVICE_ROLE_KEY (valid)
✅ SUPABASE_ANON_KEY (valid)
✅ N8N_API_KEY (valid)
❌ AWS_ACCESS_KEY_ID (not in zshrc - using Worf vault)
❌ AWS_SECRET_ACCESS_KEY (not in zshrc - using Worf vault)
```

### In ~/.alexai-secrets/api-keys.env (Worf Vault)

```bash
✅ All Supabase credentials (valid)
✅ OpenRouter API key (valid)
✅ N8N credentials (valid)
✅ AWS_REGION=us-east-2 (correct)
✅ AWS_ACCOUNT_ID=860268930466 (correct)
❌ AWS_ACCESS_KEY_ID (INVALID/EXPIRED)
❌ AWS_SECRET_ACCESS_KEY (INVALID/EXPIRED)
```

### In ~/.aws/credentials (AWS CLI Profiles)

Found 3 profiles:
```bash
❌ [AmplifyUser] - credentials invalid
❌ [pbradygeorgen-amplify] - credentials invalid
❌ [rag-refresh-deploy] - credentials invalid
```

**All AWS credentials need to be updated.**

---

## 🎯 Recommended Action Plan

**Choose one path:**

### Path 1: Quick Fix (5 minutes)

```bash
# Step 1: Run interactive fixer
./scripts/fix-aws-credentials.sh

# Step 2: Choose Worf vault when prompted
# Enter new AWS credentials from AWS Console

# Step 3: Test deployment
./scripts/worf/secure-deployment.sh check

# Step 4: Deploy
./scripts/worf/secure-deployment.sh deploy
```

### Path 2: Manual + Worf CI Sync (10 minutes)

```bash
# Step 1: Get credentials from AWS Console (see above)

# Step 2: Edit Worf vault manually
nano ~/.alexai-secrets/api-keys.env
# Update AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY

# Step 3: Test
source ~/.zshrc
aws sts get-caller-identity

# Step 4: Sync to GitHub Actions
./scripts/worf/worf.sh ci

# Step 5: Deploy
./scripts/deploy-app.sh
```

---

## 🔐 Security Best Practices

### ✅ DO

- ✅ Store credentials in Worf vault (`~/.alexai-secrets/api-keys.env`)
- ✅ Use `load_alex_ai_secrets()` for automatic loading
- ✅ Set vault permissions to 600 (user read/write only)
- ✅ Create access keys with specific use case tags
- ✅ Rotate credentials every 90 days
- ✅ Use minimal IAM permissions (least privilege)
- ✅ Sync to GitHub Actions via `worf.sh ci`
- ✅ Use audit logging (`.secrets/audit.log`)

### ❌ DON'T

- ❌ Commit `.env.local` to git
- ❌ Export credentials directly in `~/.zshrc`
- ❌ Share credentials via email/Slack/Discord
- ❌ Use root AWS account credentials
- ❌ Give full admin permissions to deployment IAM user
- ❌ Store credentials in plaintext files with 644 permissions
- ❌ Reuse the same credentials across multiple projects

---

## 🐛 Troubleshooting

### Error: "InvalidClientTokenId"

**Problem**: Credentials are wrong or expired

**Solution**:
```bash
# Get new credentials from AWS Console
./scripts/fix-aws-credentials.sh
```

### Error: "Could not connect to endpoint URL"

**Problem**: Region typo (common: `us-es-2` instead of `us-east-2`)

**Solution**:
```bash
# Check region
grep AWS_REGION ~/.alexai-secrets/api-keys.env

# Should be: us-east-2 (not us-es-2, use-east-2, etc.)
```

### Error: "AccessDeniedException"

**Problem**: IAM user lacks required permissions

**Solution**:
1. Go to AWS Console → IAM → Users → Your User
2. Add policies:
   - `AmazonEC2ContainerRegistryFullAccess`
   - `AmazonSSMManagedInstanceCore`
   - `AmazonEC2ReadOnlyAccess`

### Error: "No credentials found"

**Problem**: Worf vault not loaded

**Solution**:
```bash
# Reload shell
source ~/.zshrc

# Verify vault exists
ls -la ~/.alexai-secrets/api-keys.env

# Manual load
source ~/.alexai-secrets/api-keys.env
```

### Credentials work locally but fail in GitHub Actions

**Problem**: GitHub Actions secrets not synced

**Solution**:
```bash
# Sync via Worf
./scripts/worf/worf.sh ci

# Or manually update at:
# https://github.com/familiarcat/rag-refresh-product-factory/settings/secrets/actions
```

---

## 📚 Related Documentation

- **DEPLOYMENT_TROUBLESHOOTING.md** - Common deployment errors
- **docs/DEPLOYMENT_GUIDE.md** - Complete deployment reference
- **scripts/worf/secure-deployment.sh** - Security-focused deployment
- **scripts/worf/worf.sh** - Worf security system documentation

---

## ✅ Verification Checklist

Before deploying, verify all checks pass:

```bash
# Run comprehensive checks
./scripts/worf/secure-deployment.sh status
```

**Expected:**

- ✅ Secrets: Worf secure vault (~/.alexai-secrets)
- ✅ AWS credentials: Valid
- ✅ Git: No sensitive files staged
- ✅ Audit log: Initialized

---

## 🎉 After Setup Complete

Once credentials are valid, you can:

1. **Deploy web dashboard**:
   ```bash
   ./scripts/worf/secure-deployment.sh deploy
   ```

2. **Deploy via GitHub Actions**:
   ```bash
   gh workflow run deploy.yml
   ```

3. **Package VSCode extension**:
   ```bash
   cd vscode-extension && npm run package
   ```

4. **View deployment metrics**:
   ```bash
   open https://rag.pbradygeorgen.com/deploy-metrics
   ```

---

**Need help?** Check `DEPLOYMENT_TROUBLESHOOTING.md` or run:

```bash
./scripts/fix-aws-credentials.sh
```
