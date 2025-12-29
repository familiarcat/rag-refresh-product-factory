#!/bin/bash
set -euo pipefail

dnf update -y || true
dnf install -y docker git curl

systemctl enable docker
systemctl start docker

mkdir -p /opt/stacks/n8n /opt/stacks/app /opt/app/docker/stacks/n8n /opt/app/docker/stacks/app /opt/app/scripts/ec2
echo "bootstrapped $(date -Is)" > /opt/BOOTSTRAPPED.txt
