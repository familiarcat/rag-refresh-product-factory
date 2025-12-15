#!/usr/bin/env bash
set -euo pipefail

: "${EC2_HOST:?set EC2_HOST}"
: "${EC2_USER:?set EC2_USER}"

rsync -avz --delete   --exclude node_modules   --exclude .next   --exclude .git   ./docker ./scripts/ec2   "${EC2_USER}@${EC2_HOST}:/opt/app/"

echo "✅ Copied docker stacks + ec2 scripts to /opt/app on EC2"
