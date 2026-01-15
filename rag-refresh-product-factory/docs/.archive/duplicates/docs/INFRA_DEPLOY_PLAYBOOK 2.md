# Infra + Health-Gated Deploy (Terraform → EC2 → Docker Compose)

Adds:
- `infra/` Terraform to provision an EC2 Docker host (default VPC) + security group.
- `docker/stacks/n8n/` and `docker/stacks/app/` compose stacks for EC2.
- `scripts/ec2/deploy_all.sh` which deploys **n8n first**, waits for readiness, then deploys the app.
- GitHub Actions workflow `.github/workflows/infra_deploy.yml` to run terraform, build/push to ECR, and deploy via SSH.

## GitHub settings (Secrets & Variables)

### Secrets (required)
- `AWS_ROLE_TO_ASSUME` (OIDC role ARN)
- `AWS_ACCOUNT_ID`
- `AWS_REGION`
- `EC2_SSH_PRIVATE_KEY`
- `EC2_USER` (often `ec2-user`)
- `EC2_HOST` (set after terraform apply)

Also needed if you run terraform from Actions:
- `EC2_KEY_NAME` (the EC2 keypair name)

If your app requires these at runtime (recommended):
- `N8N_WEBHOOK_URL`
- `N8N_PROJECT_WEBHOOK_URL`

### Variables (recommended)
- `ECR_REPO_APP` (e.g. `rag-refresh-product-factory`)

Optional variables:
- `N8N_IMAGE` (default `n8nio/n8n:latest`)
- `N8N_PORT` (default 5678)
- `APP_PORT` (default 3000)

## Local first-run
```bash
cd infra
terraform init
terraform apply -var="aws_region=us-east-1" -var="key_name=YOUR_KEYPAIR_NAME"
```

Copy output `public_ip` into GitHub Secret `EC2_HOST`.

## Deploy (GitHub Actions)
GitHub → Actions → **Infra + Deploy (Terraform → ECR → EC2)** → Run workflow

The deploy on EC2:
1) starts n8n and waits for `http://localhost:5678/healthz/readiness`
2) starts app and waits for `http://localhost:3000/`


## Optional: Route53 + TLS via ALB (recommended)

Terraform now supports an optional ALB+ACM+Route53 setup that provides:
- HTTPS endpoints for `n8n.<domain>` and `app.<domain>`
- Host-based routing to the same EC2 instance on ports 5678 and 3000
- ALB health checks for both services
- Optional CloudWatch alarms for unhealthy targets

### Additional Terraform variables
- `domain_name` (e.g. `pbradygeorgen.com`)
- `route53_zone_id` (Hosted Zone ID in Route53)
- `enable_alb_tls` (default `true`)

Example local apply:
```bash
cd infra
terraform init
terraform apply -auto-approve \
  -var="aws_region=$AWS_REGION" \
  -var="key_name=YOUR_EC2_KEYPAIR_NAME" \
  -var="domain_name=pbradygeorgen.com" \
  -var="route53_zone_id=Z1234567890ABC"
```

Outputs include:
- `n8n_url`
- `app_url`
- `alb_dns_name`
