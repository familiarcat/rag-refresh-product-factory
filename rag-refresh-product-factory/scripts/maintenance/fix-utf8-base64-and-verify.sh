#!/usr/bin/env bash
# scripts/maintenance/fix-utf8-base64-and-verify.sh
#
# Automates the Unicode-safe base64 hardening across:
# - VS Code extension WebView UI (most common place for ByteString errors)
# - Next.js web dashboard (if applicable)
#
# Fixes the common crash:
#   "Cannot convert argument to a ByteString ... value is greater than 255"
# which is typically caused by calling btoa()/atob() on Unicode (e.g., ✅).
#
# Usage:
#   bash scripts/maintenance/fix-utf8-base64-and-verify.sh            # dry-run
#   bash scripts/maintenance/fix-utf8-base64-and-verify.sh --apply    # apply + run checks
set -euo pipefail

MODE="dry-run"
if [[ "${1:-}" == "--apply" ]]; then MODE="apply"; fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

need(){ command -v "$1" >/dev/null 2>&1 || err "Missing required command: $1"; }
need rg
need node
need npm
need python3

LOG_DIR=".press-logs"
mkdir -p "$LOG_DIR"
PATCH_LOG="$LOG_DIR/utf8-base64-fix-$(date +%Y%m%d_%H%M%S).log"

ok "Repo root: $ROOT_DIR"
ok "Mode: $MODE"
say "📝 Log: $PATCH_LOG"

# Restrict to directories that likely contain WebView/web code.
TARGET_DIRS=(vscode-extension app src components lib)

HELPER_PATH="lib/encoding/base64.ts"

create_helper() {
  mkdir -p "$(dirname "$HELPER_PATH")"
  cat > "$HELPER_PATH" <<'EOF'
// lib/encoding/base64.ts
// UTF-8 safe base64 helpers for browser/WebView contexts.
// Fixes "Cannot convert argument to a ByteString..." errors when strings contain Unicode (e.g., ✅).

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
EOF
}

if [[ "$MODE" == "apply" ]]; then
  if [[ ! -f "$HELPER_PATH" ]]; then
    create_helper
    ok "Created $HELPER_PATH"
  else
    ok "Helper exists: $HELPER_PATH"
  fi
else
  [[ -f "$HELPER_PATH" ]] && ok "Helper exists: $HELPER_PATH" || warn "Helper missing (dry-run): would create $HELPER_PATH"
fi

say ""
say "🔎 Scanning for btoa()/atob() usage…"

# Build ripgrep globs
GLOBS=()
for d in "${TARGET_DIRS[@]}"; do
  [[ -d "$d" ]] && GLOBS+=(-g "$d/**")
done

mapfile -t FILES < <(rg -n --hidden   --glob '!**/.git/**' --glob '!**/node_modules/**' --glob '!**/.next/**' --glob '!**/dist/**' --glob '!**/build/**'   "${GLOBS[@]}" -g "*.ts" -g "*.tsx" -g "*.js" -g "*.jsx" "(\bbtoa\(|\batob\()" 2>/dev/null | cut -d: -f1 | sort -u || true)

if [[ ${#FILES[@]} -eq 0 ]]; then
  ok "No btoa()/atob() usage found in target dirs."
  exit 0
fi

say "Found ${#FILES[@]} file(s):"
for f in "${FILES[@]}"; do say "  - $f"; done | tee -a "$PATCH_LOG"

if [[ "$MODE" == "dry-run" ]]; then
  ok "Dry run complete. Re-run with --apply to patch."
  exit 0
fi

BACKUP_DIR=".patch-backups/utf8-base64"
mkdir -p "$BACKUP_DIR"

# Python helpers
py_rel='import os,sys; root=sys.argv[1]; src=sys.argv[2]; helper=os.path.join(root,"lib","encoding","base64"); rel=os.path.relpath(helper, os.path.dirname(os.path.join(root,src))); rel=rel.replace(os.sep,"/"); print(rel if rel.startswith(".") else "./"+rel)'
py_insert='import re,sys; content=sys.stdin.read(); imp=sys.argv[1]; 
if imp in content: sys.stdout.write(content); sys.exit(0); 
m=re.search(r"^(\s*[\"\']use client[\"\'];\s*\n)", content, flags=re.M); 
if m: i=m.end(1); sys.stdout.write(content[:i]+"\n"+imp+"\n"+content[i:]); sys.exit(0); 
m=re.match(r"^(?:\s*(?:/\*\*[\s\S]*?\*/\s*\n|//.*\n)+)", content); 
if m: i=m.end(0); sys.stdout.write(content[:i]+imp+"\n"+content[i:]); sys.exit(0); 
sys.stdout.write(imp+"\n"+content)'

for f in "${FILES[@]}"; do
  [[ -f "$f" ]] || continue
  # Patch only module-like files
  rg -q "(\bimport\b|\bexport\b|<\w)" "$f" || { warn "Skipping non-module file: $f" | tee -a "$PATCH_LOG"; continue; }

  NEED_ENC=0; NEED_DEC=0
  rg -q "\bbtoa\(" "$f" && NEED_ENC=1 || true
  rg -q "\batob\(" "$f" && NEED_DEC=1 || true

  REL="$(python3 -c "$py_rel" "$ROOT_DIR" "$f")"
  if [[ "$NEED_ENC" == "1" && "$NEED_DEC" == "1" ]]; then
    IMP="import { base64EncodeUtf8, base64DecodeUtf8 } from \"$REL\";"
  elif [[ "$NEED_ENC" == "1" ]]; then
    IMP="import { base64EncodeUtf8 } from \"$REL\";"
  else
    IMP="import { base64DecodeUtf8 } from \"$REL\";"
  fi

  cp -p "$f" "$BACKUP_DIR/$(echo "$f" | tr '/' '__')"

  perl -0777 -i -pe 's/\bbtoa\(/base64EncodeUtf8(/g; s/\batob\(/base64DecodeUtf8(/g' "$f"
  tmp="$(mktemp)"
  python3 -c "$py_insert" "$IMP" < "$f" > "$tmp"
  mv "$tmp" "$f"

  ok "Patched: $f" | tee -a "$PATCH_LOG"
done

say ""
say "🧪 Running best-effort checks…"

run(){
  local dir="$1"; local s="$2";
  [[ -f "$dir/package.json" ]] || { warn "No package.json in $dir"; return 0; }
  node -e "const p=require('./$dir/package.json'); process.exit(p.scripts && p.scripts['$s'] ? 0 : 1);" >/dev/null 2>&1 || { warn "No script '$s' in $dir (skip)"; return 0; }
  ok "Running: npm -C $dir run $s"
  npm -C "$dir" run "$s"
}

run "." "check:env" || true
run "." "lint" || true
run "." "typecheck" || true
run "." "build" || true
[[ -d "vscode-extension" ]] && { run "vscode-extension" "typecheck" || true; run "vscode-extension" "build" || true; }

ok "Done. Log: $PATCH_LOG"
