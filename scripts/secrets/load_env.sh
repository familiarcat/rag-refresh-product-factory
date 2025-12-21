#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

ENV_LOCAL="$PROJECT_ROOT/.env.local"
SECRETS_ENV="$PROJECT_ROOT/.secrets/.env.local"
SYNC_SCRIPT="$PROJECT_ROOT/scripts/secrets/sync_from_zshrc.sh"

load_env_file() {
  local file="$1"
  set -a
  source "$file"
  set +a
}

if [[ -f "$ENV_LOCAL" ]]; then
  load_env_file "$ENV_LOCAL"
elif [[ -f "$SECRETS_ENV" ]]; then
  cp "$SECRETS_ENV" "$ENV_LOCAL"
  load_env_file "$ENV_LOCAL"
elif [[ -x "$SYNC_SCRIPT" ]]; then
  "$SYNC_SCRIPT"
  cp "$SECRETS_ENV" "$ENV_LOCAL"
  load_env_file "$ENV_LOCAL"
fi
