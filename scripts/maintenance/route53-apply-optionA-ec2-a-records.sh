#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${DOMAIN:-pbradygeorgen.com}"
AWS_PROFILE="${AWS_PROFILE:-rag-refresh-deploy}"
AWS_REGION="${AWS_REGION:-us-east-2}"
EC2_IP="${EC2_IP:-3.21.117.131}"
TTL="${TTL:-60}"
APPLY=0

say(){ printf "%b\n" "$*"; }
err(){ say "❌ $*"; exit 1; }

for a in "$@"; do [[ "$a" == "--apply" ]] && APPLY=1; done

command -v aws >/dev/null || err "aws CLI not found"
AWS_PROFILE="$AWS_PROFILE" AWS_REGION="$AWS_REGION" aws sts get-caller-identity >/dev/null

ZONE_NAME="${DOMAIN}."
ZONE_ID=$(AWS_PROFILE="$AWS_PROFILE" AWS_REGION="$AWS_REGION" aws route53 list-hosted-zones-by-name --dns-name "$ZONE_NAME" --query "HostedZones[?Name=='$ZONE_NAME']|[0].Id" --output text)
[[ "$ZONE_ID" == "None" || -z "$ZONE_ID" ]] && err "No hosted zone for $ZONE_NAME"
ZONE_ID="${ZONE_ID##*/}"

F_RAG="rag.${DOMAIN}."
F_N8N="n8n.${DOMAIN}."

TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
BATCH="$TMP/batch.json"
cat > "$BATCH" <<JSON
{"Comment":"Option A: rag/n8n -> ${EC2_IP}","Changes":[
{"Action":"UPSERT","ResourceRecordSet":{"Name":"$F_RAG","Type":"A","TTL":$TTL,"ResourceRecords":[{"Value":"$EC2_IP"}]}},
{"Action":"UPSERT","ResourceRecordSet":{"Name":"$F_N8N","Type":"A","TTL":$TTL,"ResourceRecords":[{"Value":"$EC2_IP"}]}}
]}
JSON

say "HostedZone: $ZONE_ID"
say "Planned: $F_RAG A $EC2_IP (TTL $TTL)"
say "Planned: $F_N8N A $EC2_IP (TTL $TTL)"

if [[ $APPLY -ne 1 ]]; then
  say "⚠️  Dry run. Re-run with --apply to execute."
  exit 0
fi

AWS_PROFILE="$AWS_PROFILE" AWS_REGION="$AWS_REGION" aws route53 change-resource-record-sets --hosted-zone-id "$ZONE_ID" --change-batch "file://$BATCH" >/dev/null
say "✅ Submitted Route53 changes. Verify with: dig +short rag.${DOMAIN} n8n.${DOMAIN}"
