#!/usr/bin/env bash
set -euo pipefail

# This script orchestrates the full deployment to AWS.
# 1. Deploys the infrastructure and application using Terraform and Docker.
# 2. Captures the public IP of the EC2 instance from the Terraform output.
# 3. Updates the Route53 DNS records to point rag.pbradygeorgen.com to the new IP.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Run the AWS deployment script
bash "$PROJECT_ROOT/scripts/deploy-to-aws.sh" deploy

# Get the public IP from Terraform output
echo "Fetching EC2 public IP from Terraform output..."
EC2_PUBLIC_IP=$(cd "$PROJECT_ROOT/infra" && terraform output -raw public_ip)

if [ -z "$EC2_PUBLIC_IP" ]; then
  echo "Error: Could not retrieve EC2 public IP from Terraform output."
  exit 1
fi

echo "EC2 public IP: $EC2_PUBLIC_IP"

# Run the production pipeline script to update DNS
echo "Updating DNS records..."
bash "$PROJECT_ROOT/scripts/maintenance/production-pipeline.sh" --apply-dns --ip "$EC2_PUBLIC_IP"

echo "Deployment to rag.pbradygeorgen.com complete."
