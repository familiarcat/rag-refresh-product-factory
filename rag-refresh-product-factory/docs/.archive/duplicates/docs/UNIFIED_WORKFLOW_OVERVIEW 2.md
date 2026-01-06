# Unified Workflow Overview (No Hidden Steps)

This repo provides a unified, auditable developer workflow that avoids order-of-operations failures.

## Components
- **Milestone journal → Supabase RAG**: shared didactic history (chunked + optionally embedded)
- **Health-gated infrastructure deploy**: n8n must be ready before the app deploy proceeds
- **Secrets hygiene**: allowlisted exports from `~/.zshenv`/`~/.zshrc` → `.secrets/` + GitHub Secrets

## Primary commands
- Doctor:
  - `npm run doctor`
- Set origin (only if needed):
  - `npm run bootstrap:init`
- Local setup (secrets + optional GitHub secret sync):
  - `npm run bootstrap:setup`
- Milestone push:
  - `npm run milestone -- "Your milestone title"`
- Prune local milestone artifacts:
  - `npm run milestone:prune`

## CI/CD deploy
Run the GitHub Action:
- **Infra + Deploy (Terraform → ECR → EC2)**

It will:
1) optionally run terraform apply
2) build/push app image to ECR
3) copy stack files + deploy scripts to EC2 (`/opt/app`)
4) run `deploy_all.sh` on EC2:
   - deploy n8n first + wait for readiness
   - deploy app + wait for health

## What is intentionally NOT implicit
- DNS + TLS termination (add Route53/ACM/ALB later if you want)
- Your EC2 keypair and SSH private key storage (`EC2_SSH_PRIVATE_KEY`)
