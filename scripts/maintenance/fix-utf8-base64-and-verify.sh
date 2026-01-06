#!/usr/bin/env bash
set -euo pipefail

# macOS bash 3.2 compatible (no mapfile). Avoids patching node_modules.
# Fixes Unicode btoa/atob usage by replacing with UTF-8 safe helpers.

MODE="dry-run"
if [[ "${1:-}" == "--apply" ]]; then MODE="apply"; fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

command -v rg >/dev/null 2>&1 || err "ripgrep (rg) required"
command -v python3 >/dev/null 2>&1 || err "python3 required"
command -v perl >/dev/null 2>&1 || err "perl required"

HELPER_PATH="lib/encoding/base64.ts"

if [[ "$MODE" == "apply" ]]; then
  mkdir -p "lib/encoding"
  if [[ ! -f "$HELPER_PATH" ]]; then
    cat > "$HELPER_PATH" <<'TS'
export function base64EncodeUtf8(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export function base64DecodeUtf8(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
TS
    ok "Created $HELPER_PATH"
  else
    ok "Helper exists: $HELPER_PATH"
  fi
else
  [[ -f "$HELPER_PATH" ]] && ok "Helper exists: $HELPER_PATH" || warn "Would create $HELPER_PATH"
fi

# Only patch your source folders, never deps
TARGET_DIRS=( "app" "src" "components" "lib" "vscode-extension/src" "vscode-extension/webview" )
INCLUDE_GLOBS=()
for d in "${TARGET_DIRS[@]}"; do
  [[ -d "$d" ]] && INCLUDE_GLOBS+=("--glob" "$d/**")
done

FILES=()
while IFS= read -r f; do
  [[ -n "$f" ]] && FILES+=("$f")
done < <(
  rg -n --hidden \
    --glob '!**/.git/**' \
    --glob '!**/node_modules/**' \
    --glob '!**/.next/**' \
    --glob '!**/dist/**' \
    --glob '!**/build/**' \
    "${INCLUDE_GLOBS[@]}" \
    --glob '*.{ts,tsx,js,jsx}' \
    '(\bbtoa\(|\batob\)'

  2>/dev/null | cut -d: -f1 | sort -u
)

if [[ ${#FILES[@]} -eq 0 ]]; then
  ok "No btoa()/atob() usage found in target dirs."
  exit 0
fi

say "Found ${#FILES[@]} file(s) using btoa/atob:"
printf " - %s\n" "${FILES[@]}"

if [[ "$MODE" != "apply" ]]; then
  ok "Dry-run complete. Re-run with --apply to patch."
  exit 0
fi

py_rel='
import os, sys
root=sys.argv[1]; src=sys.argv[2]
helper=os.path.join(root,"lib","encoding","base64")
rel=os.path.relpath(helper, os.path.dirname(os.path.join(root,src))).replace(os.sep,"/")
if not rel.startswith("."): rel="./"+rel
print(rel)
'

insert_import='
import re, sys
content=sys.stdin.read()
import_line=sys.argv[1].rstrip("\n")
if import_line in content:
  sys.stdout.write(content); sys.exit(0)
use_client=re.search(r"^(\s*[\"\\\']use client[\"\\\'];\s*\n)", content, flags=re.M)
if use_client:
  idx=use_client.end(1)
  sys.stdout.write(content[:idx]+"\n"+import_line+"\n"+content[idx:]); sys.exit(0)
m=re.match(r"^(?:\s*(?:/\*\*[\s\S]*?\*/\s*\n|//.*\n)+)", content)
if m:
  idx=m.end(0)
  sys.stdout.write(content[:idx]+import_line+"\n"+content[idx:]); sys.exit(0)
sys.stdout.write(import_line+"\n"+content)
'

mkdir -p ".patch-backups/utf8-base64"

for f in "${FILES[@]}"; do
  [[ -f "$f" ]] || continue

  NEED_ENC=0; NEED_DEC=0
  rg -q '\bbtoa\(' "$f" && NEED_ENC=1 || true
  rg -q '\batob\(' "$f" && NEED_DEC=1 || true

  REL_IMPORT="$(python3 -c "$py_rel" "$ROOT_DIR" "$f")"

  if [[ "$NEED_ENC" == "1" && "$NEED_DEC" == "1" ]]; then
    IMPORT="import { base64EncodeUtf8, base64DecodeUtf8 } from \"${REL_IMPORT}\";"
  elif [[ "$NEED_ENC" == "1" ]]; then
    IMPORT="import { base64EncodeUtf8 } from \"${REL_IMPORT}\";"
  else
    IMPORT="import { base64DecodeUtf8 } from \"${REL_IMPORT}\";"
  fi

  cp -p "$f" ".patch-backups/utf8-base64/$(echo "$f" | tr '/' '__')"

  perl -0777 -i -pe 's/\bbtoa\(/base64EncodeUtf8(/g; s/\batob\(/base64DecodeUtf8(/g' "$f"

  tmp="$(mktemp)"
  python3 -c "$insert_import" "$IMPORT" < "$f" > "$tmp"
  mv "$tmp" "$f"

  ok "Patched: $f"
done

ok "Backups saved under .patch-backups/utf8-base64/"
