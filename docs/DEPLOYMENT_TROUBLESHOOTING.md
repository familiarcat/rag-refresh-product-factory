# Deployment Troubleshooting Guide

**Quick fixes for common deployment issues**

---

## ❌ Error: Invalid AWS Credentials

### Symptom

```
An error occurred (UnrecognizedClientException) when calling the GetAuthorizationToken operation:
The security token included in the request is invalid.
Error: Cannot perform an interactive login from a non TTY device
```

Or:

```
An error occurred (InvalidClientTokenId) when calling the GetCallerIdentity operation:
The security token included in the request is invalid.
```

### Cause

Your AWS credentials in `.env.local` are either:
- Invalid (wrong keys)
- Expired
- Not set correctly
- Region is incorrect

### Quick Fix

**Option 1: Use Worf Secure Vault (Recommended)**

```bash
./scripts/fix-aws-credentials.sh
# Choose option 1: Worf secure vault
```

This stores credentials in `~/.alexai-secrets/api-keys.env` which:
- ✅ Is automatically loaded via `load_alex_ai_secrets()` in your `~/.zshrc`
- ✅ Works across all projects
- ✅ Is centrally managed by Worf security system
- ✅ Supports sync to GitHub Actions secrets

**Option 2: Use Project-Local Storage**

```bash
./scripts/fix-aws-credentials.sh
# Choose option 2: Local project only
```

This stores credentials in `.env.local` for this project only.

### Worf Security System Integration

You can also use Worf directly:

```bash
# Full development setup (sync all secrets)
./scripts/worf/worf.sh dev

# Just sync AWS secrets from ~/.alexai-secrets
source ~/.zshrc  # Loads load_alex_ai_secrets()

# Secure deployment with pre-checks
./scripts/worf/secure-deployment.sh deploy
```

### Manual Fix

1. **Get valid AWS credentials:**

   Go to AWS Console → IAM → Users → Your User → Security Credentials → Create Access Key

2. **Update `.env.local`:**

   ```bash
   # Edit .env.local
   AWS_ACCESS_KEY_ID=AKIA...  # Your actual key
   AWS_SECRET_ACCESS_KEY=...   # Your actual secret
   AWS_REGION=us-east-2        # Correct region
   AWS_ACCOUNT_ID=860268930466
   EC2_INSTANCE_ID=i-006cd2a8477f36489
   ```

3. **Load the credentials:**

   ```bash
   source .env.local
   ```

4. **Test the credentials:**

   ```bash
   aws sts get-caller-identity
   ```

   Should output:
   ```json
   {
       "UserId": "AIDA...",
       "Account": "860268930466",
       "Arn": "arn:aws:iam::860268930466:user/your-user"
   }
   ```

5. **Try deployment again:**

   ```bash
   ./scripts/deploy-app.sh
   ```

---

## ❌ Error: Region Endpoint Not Found

### Symptom

```
Could not connect to the endpoint URL: "https://sts.us-es-2.amazonaws.com/"
```

### Cause

AWS region is set incorrectly (e.g., `us-es-2` instead of `us-east-2`)

### Fix

Update `.env.local`:

```bash
AWS_REGION=us-east-2  # Correct
# NOT: us-es-2, use-east-2, etc.
```

Valid regions:
- `us-east-1` (N. Virginia)
- `us-east-2` (Ohio) ← **We use this**
- `us-west-1` (N. California)
- `us-west-2` (Oregon)

---

## ❌ Error: Docker Login Failed

### Symptom

```
Error saving credentials: error storing credentials - err: exit status 1
```

### Fix

```bash
# Clear Docker credentials
rm ~/.docker/config.json

# Login again
aws ecr get-login-password --region us-east-2 | \
  docker login --username AWS --password-stdin \
  860268930466.dkr.ecr.us-east-2.amazonaws.com
```

---

## ❌ Error: Permission Denied on EC2

### Symptom

```
An error occurred (AccessDeniedException) when calling the SendCommand operation
```

### Cause

Your IAM user doesn't have SSM permissions

### Fix

Add these IAM policies to your user:
- `AmazonSSMManagedInstanceCore`
- `AmazonEC2ContainerRegistryFullAccess`

Or create inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:SendCommand",
        "ssm:GetCommandInvocation",
        "ecr:*"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## ❌ Error: Docker Build Failed

### Symptom

```
ERROR: failed to solve: process "/bin/sh -c npm ci" did not complete successfully
```

### Fix

1. **Check Node version in Dockerfile:**

   ```dockerfile
   FROM node:20-alpine  # Should be 20+
   ```

2. **Clean npm cache:**

   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Try build locally first:**

   ```bash
   docker build -t test-build .
   ```

---

## ❌ Error: Container Won't Start on EC2

### Symptom

```
docker: Error response from daemon: driver failed programming external connectivity
```

### Cause

Port 3000 already in use

### Fix

```bash
# SSH to EC2
ssh ec2-user@<ec2-ip>

# Find process using port 3000
sudo lsof -i :3000

# Kill old container
docker stop rag-app
docker rm rag-app

# Start new container
docker run -d --name rag-app -p 3000:3000 --restart always <image>
```

---

## ❌ Error: Extension Can't Connect to API

### Symptom

```
Failed to fetch projects from https://rag.pbradygeorgen.com/api/projects
```

### Fix

1. **Check extension settings:**

   Settings → "Alex AI: Base Url" → Should be `https://rag.pbradygeorgen.com`

2. **Test API manually:**

   ```bash
   curl https://rag.pbradygeorgen.com/api/projects
   ```

3. **Check CORS:**

   Extension runs in VSCode which has different CORS rules. API should allow all origins.

4. **Reload extension:**

   Cmd+Shift+P → "Developer: Reload Window"

---

## ❌ Error: Data Not Syncing

### Symptom

Changes in extension don't appear in web UI (or vice versa)

### Debug Steps

1. **Check extension URL:**

   ```javascript
   // In VSCode Developer Console (Cmd+Option+I)
   vscode.workspace.getConfiguration('alexAi').get('baseUrl')
   // Should be: "https://rag.pbradygeorgen.com"
   ```

2. **Check API is responding:**

   ```bash
   curl https://rag.pbradygeorgen.com/api/projects
   ```

3. **Check container logs:**

   ```bash
   ssh ec2-user@<ec2-ip>
   docker logs rag-app --tail 100
   ```

4. **Check extension console:**

   VSCode → Help → Toggle Developer Tools → Console
   Look for fetch errors or CORS issues

---

## ❌ Error: Deployment Takes Too Long

### Symptom

SSM command times out or takes >10 minutes

### Cause

- EC2 instance stopped
- Network issues
- Large image size

### Fix

1. **Check EC2 status:**

   ```bash
   aws ec2 describe-instances \
     --instance-ids i-006cd2a8477f36489 \
     --query 'Reservations[0].Instances[0].State.Name'
   ```

2. **Start EC2 if stopped:**

   ```bash
   aws ec2 start-instances --instance-ids i-006cd2a8477f36489
   ```

3. **Check SSM agent:**

   ```bash
   ssh ec2-user@<ec2-ip>
   sudo systemctl status amazon-ssm-agent
   ```

4. **Optimize image size:**

   Current image should be ~150MB. If larger:
   - Remove unnecessary dependencies
   - Use .dockerignore
   - Multi-stage builds (already implemented)

---

## 🔍 Diagnostic Commands

### Check AWS Setup

```bash
# Test AWS credentials
aws sts get-caller-identity

# Check ECR access
aws ecr describe-repositories --repository-names rag-refresh-product-factory

# Check EC2 status
aws ec2 describe-instances --instance-ids i-006cd2a8477f36489

# Test SSM access
aws ssm describe-instance-information --instance-ids i-006cd2a8477f36489
```

### Check Docker

```bash
# Test Docker is running
docker ps

# Check Docker version
docker --version

# Check logged in to ECR
docker system info | grep -A 5 Registry
```

### Check Deployment

```bash
# View deployment logs on EC2
ssh ec2-user@<ec2-ip>
docker logs rag-app --tail 100 --follow

# Check container status
docker ps | grep rag-app

# Test API from EC2
curl http://localhost:3000/api/projects
```

---

## 🛠️ Complete Reset Procedure

If nothing works, start fresh:

```bash
# 1. Fix AWS credentials
./scripts/fix-aws-credentials.sh

# 2. Clear Docker cache
docker system prune -a

# 3. Re-login to ECR
aws ecr get-login-password --region us-east-2 | \
  docker login --username AWS --password-stdin \
  860268930466.dkr.ecr.us-east-2.amazonaws.com

# 4. Try deployment
./scripts/deploy-app.sh

# 5. If still fails, SSH to EC2 and check
ssh ec2-user@<ec2-ip>
docker ps
docker logs rag-app
```

---

## 📞 Getting Help

### Check Logs

**Local deployment logs:**
```bash
# Check script output (saved to file if redirected)
./scripts/deploy-app.sh 2>&1 | tee deploy.log
```

**EC2 container logs:**
```bash
ssh ec2-user@<ec2-ip>
docker logs rag-app --tail 200
```

**SSM command logs:**
```bash
aws ssm get-command-invocation \
  --command-id <command-id> \
  --instance-id i-006cd2a8477f36489
```

### Debug Checklist

- [ ] AWS credentials valid: `aws sts get-caller-identity`
- [ ] Region correct: `echo $AWS_REGION` (should be us-east-2)
- [ ] Docker running: `docker ps`
- [ ] ECR accessible: `aws ecr describe-repositories`
- [ ] EC2 running: Check AWS Console
- [ ] SSM agent working: Check EC2 console
- [ ] .env.local exists and has correct values
- [ ] No typos in credentials or region

---

## 📚 Related Documentation

- [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) - Complete deployment guide
- [DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md) - Quick start
- [DATA_SYNC_STRATEGY.md](docs/DATA_SYNC_STRATEGY.md) - Data synchronization

---

**Still having issues?** Run the diagnostic helper:

```bash
./scripts/fix-aws-credentials.sh
```

This will check your setup and guide you through fixes.
