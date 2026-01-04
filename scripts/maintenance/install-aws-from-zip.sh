#!/usr/bin/env bash
set -euo pipefail

ZIP_PATH="${1:-}"
[[ -n "$ZIP_PATH" ]] || { echo "Usage: $0 /path/to/.aws.zip"; exit 1; }
[[ -f "$ZIP_PATH" ]] || { echo "❌ Zip not found: $ZIP_PATH"; exit 1; }

DEST="$HOME/.aws"
TMP="$(mktemp -d)"
cleanup(){ rm -rf "$TMP"; }
trap cleanup EXIT

echo "📦 Installing AWS config into: $DEST"
mkdir -p "$DEST"
chmod 700 "$DEST"

# Unzip into temp, then copy only safe core files
unzip -q "$ZIP_PATH" -d "$TMP"

# Expect .aws/config and .aws/credentials
[[ -f "$TMP/.aws/config" ]] || { echo "❌ Missing .aws/config in zip"; exit 1; }
[[ -f "$TMP/.aws/credentials" ]] || { echo "❌ Missing .aws/credentials in zip"; exit 1; }

cp "$TMP/.aws/config" "$DEST/config"
cp "$TMP/.aws/credentials" "$DEST/credentials"

# Lock permissions
chmod 600 "$DEST/config" "$DEST/credentials"

# Optional: wipe caches copied from other machines (recommended)
rm -rf "$DEST/cli/cache" "$DEST/sso/cache" "$DEST/amazonq/cache" 2>/dev/null || true

echo "✅ Installed ~/.aws/config and ~/.aws/credentials (permissions hardened)"
echo "Next:"
echo "  AWS_PROFILE=rag-refresh-deploy aws sts get-caller-identity"
