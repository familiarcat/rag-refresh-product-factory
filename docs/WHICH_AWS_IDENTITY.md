# Which AWS IAM Identity Should I Use?

**Quick Answer:** Use the **`rag-refresh-deploy`** IAM user (or create a new one with this name).

---

## 🔍 Your Current AWS Profiles

I found 3 AWS profiles in `~/.aws/credentials`:

| Profile Name | Access Key ID | Status | Recommended Use |
|--------------|---------------|--------|-----------------|
| **rag-refresh-deploy** | `AKIA4QTAGEWRPWZVIC4N` | ❌ INVALID | ✅ **USE THIS** for RAG Refresh deployments |
| pbradygeorgen-amplify | `AKIA4QTAGEWRG5QIXPHW` | ❌ INVALID | ⚠️ Keep for Amplify projects |
| AmplifyUser | `AKIA4QTAGEWRPEIRHLQC` | ❌ INVALID | ⚠️ Keep for Amplify projects |

**All credentials are currently invalid/expired.**

---

## ✅ Recommended: `rag-refresh-deploy`

### Why This Identity?

1. **Name matches project**: "rag-refresh" aligns with "rag-refresh-product-factory"
2. **Purpose-built**: Created specifically for this deployment workflow
3. **Clean separation**: Separate from Amplify/other AWS projects
4. **Already configured**: Deployment scripts expect account `860268930466`

### What This IAM User Needs

**Required Permissions:**
- ✅ **ECR (Elastic Container Registry)** - Push Docker images
  - `ecr:GetAuthorizationToken`
  - `ecr:BatchCheckLayerAvailability`
  - `ecr:PutImage`
  - `ecr:InitiateLayerUpload`
  - `ecr:UploadLayerPart`
  - `ecr:CompleteLayerUpload`

- ✅ **EC2** - Describe instances
  - `ec2:DescribeInstances`

- ✅ **SSM (Systems Manager)** - Deploy to EC2 without SSH
  - `ssm:SendCommand`
  - `ssm:GetCommandInvocation`

- ✅ **STS** - Validate credentials
  - `sts:GetCallerIdentity`

**Managed Policies (Easiest):**
- `AmazonEC2ContainerRegistryFullAccess`
- `AmazonSSMManagedInstanceCore`
- `AmazonEC2ReadOnlyAccess`

**Or Custom Inline Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RAGRefreshDeployment",
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

---

## 📋 Step-by-Step: Update `rag-refresh-deploy` Credentials

### Option A: Create New Access Key for Existing IAM User

**If the IAM user `rag-refresh-deploy` exists in AWS Console:**

1. **Login to AWS Console**
   - Go to: https://console.aws.amazon.com/
   - Account: `860268930466`

2. **Navigate to IAM Users**
   - Services → IAM → Users
   - Search for: `rag-refresh-deploy`

3. **Check if user exists**
   - If YES → Go to Step 4
   - If NO → See Option B below

4. **Create New Access Key**
   - Click on username: `rag-refresh-deploy`
   - Go to "Security credentials" tab
   - Scroll to "Access keys" section
   - **Delete old invalid key** (if shown):
     - Find key: `AKIA4QTAGEWRPWZVIC4N`
     - Click "Delete" (it's invalid anyway)
   - Click **"Create access key"**
   - Choose: **"Command Line Interface (CLI)"**
   - Check: "I understand the above recommendation"
   - Click: **"Next"**

5. **Add Description Tag**
   - Description: "RAG Refresh deployment - Dec 2025 - Worf integrated"
   - Click: **"Create access key"**

6. **Save Credentials IMMEDIATELY**
   ```
   Access Key ID: AKIA... (starts with AKIA)
   Secret Access Key: ... (40+ character random string)
   ```
   ⚠️ **You can only view the secret once!** Download CSV or copy now.

7. **Verify Permissions**
   - While still on this IAM user page
   - Click "Permissions" tab
   - Verify attached policies include:
     - `AmazonEC2ContainerRegistryFullAccess`
     - `AmazonSSMManagedInstanceCore`
     - OR custom policy with required actions (see above)
   - If missing, click "Add permissions" → "Attach policies"

8. **Update Worf Vault**
   ```bash
   ./scripts/fix-aws-credentials.sh
   ```
   - Choose: **1** (Worf secure vault)
   - Paste new Access Key ID
   - Paste new Secret Access Key
   - Region: `us-east-2` (default, just press Enter)

### Option B: Create New IAM User (If `rag-refresh-deploy` doesn't exist)

**If you can't find the IAM user in AWS Console:**

1. **Login to AWS Console**
   - Account: `860268930466`
   - Go to: Services → IAM → Users

2. **Create User**
   - Click **"Create user"**
   - Username: `rag-refresh-deploy`
   - Click **"Next"**

3. **Set Permissions**
   - Choose: **"Attach policies directly"**
   - Search and select:
     - ✅ `AmazonEC2ContainerRegistryFullAccess`
     - ✅ `AmazonSSMManagedInstanceCore`
     - ✅ `AmazonEC2ReadOnlyAccess`
   - Click **"Next"**

4. **Review and Create**
   - Review settings
   - Click **"Create user"**

5. **Create Access Key**
   - Click on newly created user: `rag-refresh-deploy`
   - Go to "Security credentials" tab
   - Click **"Create access key"**
   - Choose: **"Command Line Interface (CLI)"**
   - Click **"Next"**
   - Description: "RAG Refresh deployment - Dec 2025"
   - Click **"Create access key"**

6. **Save Credentials**
   ```
   Access Key ID: AKIA...
   Secret Access Key: ...
   ```
   ⚠️ Download CSV or copy immediately!

7. **Update Worf Vault**
   ```bash
   ./scripts/fix-aws-credentials.sh
   ```
   - Choose: **1** (Worf secure vault)
   - Paste credentials
   - Region: `us-east-2`

---

## 🔄 Alternative: Use Different Existing IAM User

**If you prefer to use a different IAM user** (not recommended, but possible):

### Check Which IAM Users You Have

```bash
# Login to AWS Console
# Go to: IAM → Users

# Or via AWS CLI (if you have valid admin credentials):
aws iam list-users --query 'Users[*].[UserName,CreateDate]' --output table
```

### Requirements for Any IAM User

Whichever user you choose needs:
- ✅ Valid access key (not expired/deleted)
- ✅ ECR push permissions
- ✅ SSM command permissions
- ✅ EC2 describe permissions
- ✅ In AWS account: `860268930466`
- ✅ Region: `us-east-2`

### Update Deployment Configuration

If using a different user, you'll need to update:

1. **~/.aws/credentials**
   ```ini
   [rag-refresh-deploy]
   aws_access_key_id = AKIA... (new key)
   aws_secret_access_key = ... (new secret)
   ```

2. **Worf vault**
   ```bash
   ./scripts/fix-aws-credentials.sh
   # Use the new credentials
   ```

---

## ⚠️ What About Other Profiles?

### `pbradygeorgen-amplify`

**Purpose:** For AWS Amplify deployments (separate projects)

**Keep or Delete?**
- ✅ **Keep** if you have other Amplify projects
- ✅ **Update** if you still use it for other work
- ❌ **Delete** old key if never used (from AWS Console)

**Do NOT use for RAG Refresh deployment** - keep concerns separated.

### `AmplifyUser`

**Purpose:** Another Amplify-related user

**Keep or Delete?**
- ✅ **Keep** if you have Amplify projects
- ✅ **Update** if actively using
- ❌ **Delete** old key if never used

**Do NOT use for RAG Refresh deployment** - wrong purpose.

---

## 🎯 Recommended Action Plan

### Step 1: Determine IAM User Status

**Check AWS Console:**
```
https://console.aws.amazon.com/iam/home#/users
```

**Look for:** `rag-refresh-deploy`

- **Found?** → Create new access key (see Option A)
- **Not found?** → Create new IAM user (see Option B)

### Step 2: Get New Credentials

Follow Option A or B above to get:
- New Access Key ID
- New Secret Access Key

### Step 3: Update Worf Vault

```bash
./scripts/fix-aws-credentials.sh
```

**Choose:**
- Storage: **1** (Worf secure vault)
- Paste new credentials
- Region: `us-east-2`

### Step 4: Test Credentials

```bash
# Reload from Worf vault
source ~/.zshrc

# Test credentials
aws sts get-caller-identity
```

**Expected output:**
```json
{
    "UserId": "AIDA...",
    "Account": "860268930466",
    "Arn": "arn:aws:iam::860268930466:user/rag-refresh-deploy"
}
```

### Step 5: Test Deployment

```bash
# Security pre-checks
./scripts/worf/secure-deployment.sh check

# Full deployment
./scripts/worf/secure-deployment.sh deploy
```

---

## 🔐 Security Best Practices

### ✅ DO

1. **Use dedicated IAM user for each project**
   - RAG Refresh → `rag-refresh-deploy`
   - Amplify projects → `AmplifyUser` or `pbradygeorgen-amplify`

2. **Apply least privilege permissions**
   - Only give permissions needed for deployment
   - Don't use `AdministratorAccess` policy

3. **Rotate credentials regularly**
   - Create new access key every 90 days
   - Delete old keys after rotation

4. **Use descriptive tags**
   - Tag access keys with purpose and creation date
   - Makes auditing easier

5. **Store in Worf vault**
   - Centralized: `~/.alexai-secrets/api-keys.env`
   - Auto-loaded via `load_alex_ai_secrets()`
   - 600 permissions (user only)

### ❌ DON'T

1. **Don't share credentials across projects**
   - Amplify credentials ≠ RAG Refresh credentials
   - Prevents cross-contamination

2. **Don't use root account credentials**
   - Never use AWS root account for deployments
   - Always use IAM users

3. **Don't give unnecessary permissions**
   - ECR + SSM + EC2 is enough
   - Don't need S3, RDS, Lambda, etc.

4. **Don't commit credentials to git**
   - `.env.local` in `.gitignore`
   - Worf vault never committed

---

## 📊 Summary

| Question | Answer |
|----------|--------|
| **Which profile should I use?** | `rag-refresh-deploy` |
| **Why this one?** | Purpose-built for RAG Refresh deployments |
| **Is it valid now?** | ❌ No - credentials expired |
| **What should I do?** | Create new access key for `rag-refresh-deploy` IAM user |
| **Where to get new credentials?** | AWS Console → IAM → Users → `rag-refresh-deploy` → Create access key |
| **Where to store them?** | Worf vault: `~/.alexai-secrets/api-keys.env` |
| **How to update?** | Run: `./scripts/fix-aws-credentials.sh` |
| **What about other profiles?** | Keep for Amplify projects, don't use for RAG Refresh |

---

## 🎉 After Credentials Updated

Once you've updated the `rag-refresh-deploy` credentials:

```bash
# Verify
aws sts get-caller-identity

# Deploy
./scripts/worf/secure-deployment.sh deploy

# Sync to GitHub Actions
./scripts/worf/worf.sh ci
```

**Your Worf-integrated secure CI/CD deployment system will be ready!** 🚀

---

**Still unsure?** Just run:

```bash
./scripts/fix-aws-credentials.sh
```

It will guide you through the entire process and handle the Worf vault integration automatically.
