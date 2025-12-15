# Unified CI/CD Steps (GitHub → AWS → EC2 + n8n + App)

## 1) Connect repo origin
```bash
npm run bootstrap:init
```

## 2) Sync local secrets from ~/.zshenv or ~/.zshrc
```bash
npm run secrets:sync
npm run check:env
```

## 3) Push allowlisted secrets to GitHub (requires gh auth)
```bash
npm run secrets:gh
```

## 4) Provision infra (choose one)
### Option A: run terraform locally (recommended first time)
```bash
cd infra
terraform init
terraform apply
```
Copy outputs to GitHub Secrets (especially `EC2_HOST` if not using ALB/TLS yet).

### Option B: run terraform from GitHub Actions
Set GitHub secret `EC2_KEY_NAME`, then run:
GitHub → Actions → **Infra + Deploy (Terraform → ECR → EC2)** → Run workflow with `run_terraform=true`.

## 5) Deploy
Run the workflow:
GitHub → Actions → **Infra + Deploy (Terraform → ECR → EC2)** → Run workflow

This workflow:
- builds/pushes the app image to ECR
- copies docker stacks + deploy scripts to EC2
- runs a health-gated deploy (n8n must be ready before app deploy proceeds)
