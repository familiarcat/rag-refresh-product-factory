#!/usr/bin/env bash
set -euo pipefail

# -----------------------------------------------------------------------------
# AlexAI Production Pipeline (Option A: Direct EC2 + Reverse Proxy)
#
# Steps:
#  1) AWS identity check + generate minimal EC2 Serial Console IAM policy artifact
#  2) Route53 UPSERT (rag.* and n8n.* -> EC2_IP)  [only if --apply-dns]
#  3) DNS verification (dig)
#  4) Connectivity verification (curl -Iv)
#
# Safety:
#  - Does NOT print secrets
#  - Does NOT modify DNS unless --apply-dns
#  - Will not attempt IAM escalation (cannot self-grant permissions)
# -----------------------------------------------------------------------------

# Defaults (override via env or flags)
AWS_PROFILE="${AWS_PROFILE:-rag-refresh-deploy}"
AWS_REGION="${AWS_REGION:-us-east-2}"

DOMAIN="${DOMAIN:-pbradygeorgen.com}"
RAG_SUB="${RAG_SUB:-rag}"
N8N_SUB="${N8N_SUB:-n8n}"
TTL="${TTL:-60}"

EC2_IP="${EC2_IP:-3.21.117.131}"

APPLY_DNS=0
ENABLE_SERIAL=0   # informational only; cannot enable without perms
DNS_WAIT_SECONDS="${DNS_WAIT_SECONDS:-0}" # optional wait after applying DNS

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

usage(){
  cat <<EOF
Usage: $0 [--apply-dns] [--wait <seconds>] [--domain <apex>] [--ip <ec2-ip>]

Env:
  AWS_PROFILE (default: rag-refresh-deploy)
  AWS_REGION  (default: us-east-2)
  DOMAIN      (default: pbradygeorgen.com)
  EC2_IP      (default: 3.21.117.131)
  TTL         (default: 60)

Flags:
  --apply-dns         Actually apply Route53 UPSERT changes (default: dry-run)
  --wait <seconds>    Wait after DNS apply before verification (default: 0)
  --domain <apex>     Set apex domain, e.g. pbradygeorgen.com
  --ip <ec2-ip>       Set target EC2 public IP

Examples:
  # Safe dry-run (no DNS change)
  bash $0

  # Apply DNS and verify
  bash $0 --apply-dns --wait 45 --ip 3.21.117.131

EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply-dns) APPLY_DNS=1; shift ;;
    --wait) DNS_WAIT_SECONDS="${2:-}"; [[ -n "$DNS_WAIT_SECONDS" ]] || err "Missing value for --wait"; shift 2 ;;
    --domain) DOMAIN="${2:-}"; [[ -n "$DOMAIN" ]] || err "Missing value for --domain"; shift 2 ;;
    --ip) EC2_IP="${2:-}"; [[ -n "$EC2_IP" ]] || err "Missing value for --ip"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) err "Unknown arg: $1 (use --help)" ;;
  esac
done

command -v aws >/dev/null 2>&1 || err "aws CLI not found"
command -v dig >/dev/null 2>&1 || warn "dig not found (DNS verification may be limited)"
command -v curl >/dev/null 2>&1 || err "curl not found"

# Basic IP sanity check
if ! [[ "$EC2_IP" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
  err "EC2_IP does not look like IPv4: $EC2_IP"
fi

FQDN_RAG="${RAG_SUB}.${DOMAIN}"
FQDN_N8N="${N8N_SUB}.${DOMAIN}"
ZONE_NAME="${DOMAIN}."

RUN_ID="$(date +%Y%m%d_%H%M%S)"
LOG_DIR=".press-logs/pipeline/${RUN_ID}"
mkdir -p "$LOG_DIR"

# tee all output to a log
exec > >(tee -a "$LOG_DIR/run.log") 2>&1

say "🧭 AlexAI Production Pipeline"
say "   Run ID     : $RUN_ID"
say "   AWS_PROFILE : $AWS_PROFILE"
say "   AWS_REGION  : $AWS_REGION"
say "   DOMAIN      : $DOMAIN"
say "   EC2_IP      : $EC2_IP"
say "   APPLY_DNS   : $APPLY_DNS"
say "   WAIT        : $DNS_WAIT_SECONDS"
say "   Targets     : https://${FQDN_RAG} , https://${FQDN_N8N}"
say ""

# -----------------------------------------------------------------------------
# 1) AWS identity check + generate minimal IAM policy artifact
# -----------------------------------------------------------------------------
say "🔐 Step 1: Verify AWS identity (no secrets printed)..."
AWS_PROFILE="$AWS_PROFILE" AWS_REGION="$AWS_REGION" aws sts get-caller-identity --output json > "$LOG_DIR/sts_identity.json" \
  || err "AWS identity check failed for profile '$AWS_PROFILE'"
ok "AWS identity verified. Wrote: $LOG_DIR/sts_identity.json"

ACCOUNT_ID="$(AWS_PROFILE="$AWS_PROFILE" aws sts get-caller-identity --query Account --output text)"
ARN="$(AWS_PROFILE="$AWS_PROFILE" aws sts get-caller-identity --query Arn --output text)"
say "   Account: $ACCOUNT_ID"
say "   ARN    : $ARN"
say ""

say "🧾 Step 1b: Generate minimal EC2 Serial Console IAM policy artifact..."
IAM_POLICY_DIR=".press-logs/iam"
IAM_POLICY_FILE="$IAM_POLICY_DIR/allow-ec2-serial-console.json"
mkdir -p "$IAM_POLICY_DIR"
cat > "$IAM_POLICY_FILE" <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowEC2SerialConsoleAccess",
      "Effect": "Allow",
      "Action": [
        "ec2:GetSerialConsoleAccessStatus",
        "ec2:EnableSerialConsoleAccess",
        "ec2:DisableSerialConsoleAccess",
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceStatus",
        "ec2:DescribeIamInstanceProfileAssociations"
      ],
      "Resource": "*"
    }
  ]
}
JSON
ok "Wrote policy: $IAM_POLICY_FILE"
say ""

say "🔎 Step 1c: Check whether this identity has EC2 Serial Console permissions..."
SERIAL_OK=0
if AWS_PROFILE="$AWS_PROFILE" AWS_REGION="$AWS_REGION" aws ec2 get-serial-console-access-status --region "$AWS_REGION" >/dev/null 2>&1; then
  ok "EC2 Serial Console status: allowed"
  SERIAL_OK=1
else
  warn "EC2 Serial Console status: NOT allowed"
  warn "Attach $IAM_POLICY_FILE using an admin-capable identity if you want Serial Console access."
  say "   USER attach (admin identity required):"
  say "   aws iam put-user-policy --user-name rag-refresh-deployer --policy-name AllowEC2SerialConsoleAccess --policy-document file://$IAM_POLICY_FILE"
fi
say ""

# -----------------------------------------------------------------------------
# 2) Route53 UPSERT (Option A) - only if --apply-dns
# -----------------------------------------------------------------------------
say "🌐 Step 2: Route53 Option A (rag + n8n -> EC2_IP)"
say "   Planned records:"
say "   - ${FQDN_RAG}  A  ${EC2_IP}"
say "   - ${FQDN_N8N}  A  ${EC2_IP}"
say ""

say "🔎 Locating hosted zone for: $ZONE_NAME"
ZONE_ID="$(
  AWS_PROFILE="$AWS_PROFILE" AWS_REGION="$AWS_REGION" aws route53 list-hosted-zones-by-name \
    --dns-name "$ZONE_NAME" \
    --query "HostedZones[?Name=='$ZONE_NAME']|[0].Id" \
    --output text 2>/dev/null || true
)"
[[ -n "$ZONE_ID" && "$ZONE_ID" != "None" ]] || err "No hosted zone found for '$ZONE_NAME' in this AWS account."
ZONE_ID="${ZONE_ID##*/}"
ok "Hosted zone found: $ZONE_ID"
say ""

CHANGE_BATCH="$LOG_DIR/route53-change-batch.json"
cat > "$CHANGE_BATCH" <<JSON
{
  "Comment": "Option A: point rag and n8n subdomains directly to EC2 public IP (${EC2_IP})",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "${FQDN_RAG}.",
        "Type": "A",
        "TTL": ${TTL},
        "ResourceRecords": [{ "Value": "${EC2_IP}" }]
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "${FQDN_N8N}.",
        "Type": "A",
        "TTL": ${TTL},
        "ResourceRecords": [{ "Value": "${EC2_IP}" }]
      }
    }
  ]
}
JSON
ok "Prepared change batch: $CHANGE_BATCH"
say ""

if [[ "$APPLY_DNS" -ne 1 ]]; then
  warn "Dry-run mode: not applying Route53 changes."
  say "To apply: bash $0 --apply-dns --ip $EC2_IP"
else
  say "🚀 Applying Route53 changes..."
  CHANGE_ID="$(
    AWS_PROFILE="$AWS_PROFILE" AWS_REGION="$AWS_REGION" aws route53 change-resource-record-sets \
      --hosted-zone-id "$ZONE_ID" \
      --change-batch "file://$CHANGE_BATCH" \
      --query "ChangeInfo.Id" \
      --output text
  )"
  ok "Submitted Route53 change: $CHANGE_ID"
  echo "$CHANGE_ID" > "$LOG_DIR/route53_change_id.txt"

  if [[ "$DNS_WAIT_SECONDS" -gt 0 ]]; then
    say "⏳ Waiting ${DNS_WAIT_SECONDS}s for propagation..."
    sleep "$DNS_WAIT_SECONDS"
  fi
fi

say ""

# -----------------------------------------------------------------------------
# 3) DNS verification
# -----------------------------------------------------------------------------
say "🧪 Step 3: DNS verification"
if command -v dig >/dev/null 2>&1; then
  RAG_IPS="$(dig +short "$FQDN_RAG" A | tr '\n' ' ' | sed 's/  */ /g' | sed 's/ $//')"
  N8N_IPS="$(dig +short "$FQDN_N8N" A | tr '\n' ' ' | sed 's/  */ /g' | sed 's/ $//')"
  echo "$RAG_IPS" > "$LOG_DIR/dns_rag_ips.txt"
  echo "$N8N_IPS" > "$LOG_DIR/dns_n8n_ips.txt"

  say "   ${FQDN_RAG} -> ${RAG_IPS:-<none>}"
  say "   ${FQDN_N8N} -> ${N8N_IPS:-<none>}"

  if [[ "$RAG_IPS" != *"$EC2_IP"* || "$N8N_IPS" != *"$EC2_IP"* ]]; then
    warn "DNS not yet aligned to EC2_IP ($EC2_IP). This is expected if propagation is still in-flight."
    warn "Re-run later or increase --wait."
  else
    ok "DNS alignment looks correct (both include $EC2_IP)."
  fi
else
  warn "dig unavailable; skipping DNS verification."
fi

say ""

# -----------------------------------------------------------------------------
# 4) Connectivity verification (HTTPS headers)
# -----------------------------------------------------------------------------
say "🧪 Step 4: Connectivity verification (curl -Iv headers)"
check_https(){
  local host="$1"
  local out_file="$2"
  say "   → https://${host}"
  set +e
  curl -Iv "https://${host}" --max-time 10 >"$out_file" 2>&1
  local code=$?
  set -e
  if [[ $code -eq 0 ]]; then
    ok "   HTTPS reachable: ${host}"
  else
    warn "   HTTPS not reachable yet: ${host}"
    warn "   See: $out_file"
  fi
}

check_https "$FQDN_RAG" "$LOG_DIR/curl_rag.txt"
check_https "$FQDN_N8N" "$LOG_DIR/curl_n8n.txt"

say ""
ok "Pipeline run complete."
say "Artifacts:"
say "  - $LOG_DIR/run.log"
say "  - $LOG_DIR/sts_identity.json"
say "  - $LOG_DIR/route53-change-batch.json"
say "  - $LOG_DIR/dns_rag_ips.txt / dns_n8n_ips.txt"
say "  - $LOG_DIR/curl_rag.txt / curl_n8n.txt"
say ""
say "Next operational step (once you can reach the EC2 host via SSH/SSM/Console):"
say "  sudo systemctl status amazon-ssm-agent"
say "  sudo systemctl start amazon-ssm-agent"
say "  docker ps -a"
say "  sudo ss -lntp | egrep ':80|:443|:5678' || true"
