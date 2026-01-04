#!/usr/bin/env bash
set -euo pipefail

AWS_PROFILE="${AWS_PROFILE:-rag-refresh-deploy}"
AWS_REGION="${AWS_REGION:-us-east-2}"
INSTANCE_ID="${INSTANCE_ID:-}"

say(){ printf '%s\n' "$*"; }
err(){ say "❌ $*"; exit 1; }

command -v aws >/dev/null || err "aws CLI not found"
mkdir -p .press-logs/iam

say "☁️  AWS Access Bootstrap"
say "   Profile: $AWS_PROFILE"
say "   Region:  $AWS_REGION"

say "\n🔎 Verifying identity..."
AWS_PROFILE="$AWS_PROFILE" AWS_REGION="$AWS_REGION" aws sts get-caller-identity --output json || err "STS call failed"

say "\n🔒 EC2 Serial Console status..."
if out=$(AWS_PROFILE="$AWS_PROFILE" AWS_REGION="$AWS_REGION" aws ec2 get-serial-console-access-status --output json 2>/dev/null); then
  say "$out"
else
  say "⚠️  Not allowed to call GetSerialConsoleAccessStatus with this identity."
  cat > .press-logs/iam/allow-ec2-serial-console.json <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:GetSerialConsoleAccessStatus",
        "ec2:EnableSerialConsoleAccess"
      ],
      "Resource": "*"
    }
  ]
}
JSON
  say "✅ Wrote policy: .press-logs/iam/allow-ec2-serial-console.json"
  say "Attach it as an admin-capable user if needed."
fi

if [[ -n "$INSTANCE_ID" ]]; then
  say "\n🧩 Instance quick look ($INSTANCE_ID)..."
  AWS_PROFILE="$AWS_PROFILE" AWS_REGION="$AWS_REGION" aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --query 'Reservations[0].Instances[0].{State:State.Name,PublicIp:PublicIpAddress,IamProfile:IamInstanceProfile.Arn}' --output json || true
fi

say "\nNext (on the instance, once you can connect):"
say "  sudo systemctl status amazon-ssm-agent"
say "  sudo systemctl restart amazon-ssm-agent"
