# CI/CD Setup Guide

This project uses GitHub Actions for automated deployment when app code changes.

## How It Works

1. **On push to `main`**: If app code files changed, GitHub Actions automatically:
   - Builds Docker image for `linux/amd64`
   - Pushes to ECR with commit SHA and `latest` tags
   - Deploys to EC2 via SSM (no SSH keys needed!)

2. **Milestone pushes**: The milestone script detects app changes and notifies you that CI/CD will auto-deploy.

3. **Manual deploy**: Run `./scripts/deploy-app.sh` for immediate deployment.

## Path Filters

CI/CD only triggers when these paths change:
- `app/**` - Next.js routes and pages
- `components/**` - React components
- `lib/**` - Utility libraries
- `public/**` - Static assets
- `package.json`, `package-lock.json` - Dependencies
- `Dockerfile` - Container config
- `next.config.js`, `tsconfig.json` - Build config

Docs, milestones, and Terraform changes do NOT trigger deploys.

## Required GitHub Secrets

Go to: **Settings → Secrets and variables → Actions**

| Secret | Value | Description |
|--------|-------|-------------|
| `AWS_ACCESS_KEY_ID` | `AKIA...` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | `XtLX...` | IAM user secret key |

### Setting Secrets via CLI

```bash
gh secret set AWS_ACCESS_KEY_ID --body "YOUR_ACCESS_KEY_ID"
gh secret set AWS_SECRET_ACCESS_KEY --body "YOUR_SECRET_ACCESS_KEY"
```

Or sync from your environment:
```bash
gh secret set AWS_ACCESS_KEY_ID --body "$AWS_ACCESS_KEY_ID"
gh secret set AWS_SECRET_ACCESS_KEY --body "$AWS_SECRET_ACCESS_KEY"
```

## Verifying Setup

1. Make a change to any app file
2. Commit and push
3. Check Actions tab: https://github.com/familiarcat/rag-refresh-product-factory/actions
4. Verify at: https://rag.pbradygeorgen.com

## Manual Deployment

For immediate deployment without waiting for CI/CD:

```bash
# Set AWS credentials first
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...

# Run deploy
./scripts/deploy-app.sh
```

Or with a specific tag:
```bash
./scripts/deploy-app.sh v1.0.0
```

## Troubleshooting

### "Deployment failed"
- Check SSM permissions on the IAM user
- Verify EC2 instance is running
- Check EC2 has the IAM instance profile attached

### "ECR login failed"
- Verify AWS credentials are set correctly
- Check ECR repository exists

### "docker: command not found" on EC2
- SSH to EC2 and install Docker:
  ```bash
  sudo yum install -y docker
  sudo systemctl start docker
  sudo systemctl enable docker
  ```
