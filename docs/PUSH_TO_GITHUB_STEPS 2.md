# Push this pack into your repo

1) Unzip and merge the contents into your repo root.

2) Commit + push:
```bash
git add -A
git commit -m "infra: terraform + health-gated deploy for n8n + app"
git push origin main
```

3) Configure GitHub Secrets/Variables (see `docs/INFRA_DEPLOY_PLAYBOOK.md`).

4) Run the workflow:
GitHub → Actions → **Infra + Deploy (Terraform → ECR → EC2)** → Run workflow.
