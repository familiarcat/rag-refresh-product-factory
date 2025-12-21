#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ALLOWLIST="$ROOT/scripts/secrets/allowlist.env"
OUT="$ROOT/.secrets/.env.local"

mkdir -p "$ROOT/.secrets"
: > "$OUT"

while read -r key; do
  [[ -z "$key" || "$key" =~ ^# ]] && continue
  val="${!key:-}"
  [[ -z "$val" ]] && continue
  printf '%s=%q\n' "$key" "$val" >> "$OUT"
done < "$ALLOWLIST"

chmod 600 "$OUT"
