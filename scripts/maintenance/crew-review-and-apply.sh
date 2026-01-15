#!/usr/bin/env bash
set -euo pipefail

TARGET="/Users/bradygeorgen/Documents/workspace/rag-refresh-product-factory"
DOWNLOADS="$HOME/Downloads"
PATCH_PREFIX="alexai-rag-refresh-product-factory__patch__"

PATCH_ZIP=""
DO_SEND="0"
DO_APPLY="0"

WEBHOOK_URL="${N8N_CREW_WEBHOOK_URL:-${N8N_WEBHOOK_URL:-}}"

OUT_DIR=".press-logs/crew-review"
TS="$(date +%Y%m%d_%H%M%S)"
RUN_DIR="$OUT_DIR/$TS"

STRUCT_FILE="$RUN_DIR/repo_structure.txt"
PATCH_FILELIST="$RUN_DIR/patch_files.txt"
IMPACT_FILE="$RUN_DIR/patch_impact.txt"
PROMPT_FILE="$RUN_DIR/crew_prompt.md"
PAYLOAD_FILE="$RUN_DIR/crew_payload.json"

say() { printf "%b\n" "$*"; }
ok()  { say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err() { say "❌ $*"; exit 1; }

usage() {
  cat <<USAGE
Usage:
  bash scripts/maintenance/crew-review-and-apply.sh [--send] [--apply]
  bash scripts/maintenance/crew-review-and-apply.sh --patch /path/to/patch.zip [--send] [--apply]

Flags:
  --patch <zip>   Optional. If omitted, auto-detects newest canonical patch zip in ~/Downloads.
  --send          POST prompt payload to N8N_WEBHOOK_URL (or N8N_CREW_WEBHOOK_URL)
  --apply         Apply patch after generating prompt (uses scripts/patch/apply-docs-patch.sh)

Canonical naming required for auto-detect:
  ${PATCH_PREFIX}YYYY-MM-DD__<purpose>.zip
Example:
  ${PATCH_PREFIX}2026-01-02__automation-and-docs.zip
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --patch) PATCH_ZIP="${2:-}"; shift 2;;
    --send)  DO_SEND="1"; shift;;
    --apply) DO_APPLY="1"; shift;;
    -h|--help) usage; exit 0;;
    *) err "Unknown arg: $1";;
  esac
done

[[ -d "$TARGET" ]] || err "Target repo not found: $TARGET"
command -v unzip >/dev/null 2>&1 || err "unzip is required"
command -v python3 >/dev/null 2>&1 || err "python3 is required"

SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
warn "🧭 Running script: $SCRIPT_PATH"
warn "🏷️  PATCH_PREFIX: $PATCH_PREFIX"

detect_patch_zip_downloads() {
  [[ -d "$DOWNLOADS" ]] || return 1
  local match
  match="$(ls -t "$DOWNLOADS"/"${PATCH_PREFIX}"*.zip 2>/dev/null | head -n 1 || true)"
  [[ -n "$match" ]] || return 1
  echo "$match"
}

if [[ -z "${PATCH_ZIP:-}" ]]; then
  PATCH_ZIP="$(detect_patch_zip_downloads || true)"
  if [[ -z "$PATCH_ZIP" ]]; then
    warn "No canonical patch zip found in $DOWNLOADS"
    say ""
    say "Expected pattern:"
    say "  $DOWNLOADS/${PATCH_PREFIX}YYYY-MM-DD__<purpose>.zip"
    say ""
    say "Newest 10 zip files in Downloads:"
    ls -t "$DOWNLOADS"/*.zip 2>/dev/null | head -n 10 | sed 's|^|  - |' || true
    say ""
    err "Place the canonical patch zip in ~/Downloads or pass --patch explicitly."
  fi
  ok "Auto-detected canonical patch zip:"
  say "   $PATCH_ZIP"
else
  [[ -f "$PATCH_ZIP" ]] || err "Patch zip not found: $PATCH_ZIP"
  ok "Using provided patch zip:"
  say "   $PATCH_ZIP"
fi

mkdir -p "$RUN_DIR"
ok "Run dir: $RUN_DIR"
ok "Target:  $TARGET"

say ""
say "🔐 Environment presence check (values NOT printed):"
[[ -n "${N8N_WEBHOOK_URL:-}" ]] && ok "N8N_WEBHOOK_URL is set" || warn "N8N_WEBHOOK_URL is not set"
[[ -n "${SUPABASE_URL:-}" ]] && ok "SUPABASE_URL is set" || warn "SUPABASE_URL is not set"
[[ -f "$HOME/.alexai-secrets/api-keys.env" ]] && ok "Secrets file exists (~/.alexai-secrets/api-keys.env)" || warn "Secrets file missing (~/.alexai-secrets/api-keys.env)"

cd "$TARGET"

# 1) Structure snapshot
{
  say "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  say "�� REPO STRUCTURE SNAPSHOT"
  say "Target: $TARGET"
  say "PWD:    $(pwd)"
  say "Time:   $TS"
  say "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  say ""
  say "TOP-LEVEL:"
  find . -maxdepth 1 -mindepth 1 | sort | sed 's|^\./|├── |'
  say ""
  say "scripts/ (maxdepth 4):"
  if [[ -d scripts ]]; then
    find scripts -maxdepth 4 | sed 's|^\./||' | awk '
      BEGIN { FS="/" }
      {
        indent = ""
        for (i = 2; i <= NF; i++) indent = indent "│   "
        print indent "├── " $NF
      }'
  else
    say "⚠️  scripts/ directory not found"
  fi
  say ""
  say "package.json locations:"
  find . -name package.json -not -path "./node_modules/*" | sed 's|^\./|├── |'
  say ""
  say "README files (maxdepth 2):"
  find . -maxdepth 2 -iname "readme*.md" | sed 's|^\./|├── |'
  say ""
  say "VS Code extension markers (maxdepth 5):"
  (find . -maxdepth 5 \( -iname "extension.ts" -o -iname "package.json" \) | grep -i "vscode" || true) | sed 's|^\./|├── |'
  say ""
  say "n8n markers (maxdepth 4):"
  (find . -maxdepth 4 -iname "*n8n*" || true) | sed 's|^\./|├── |'
  say "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
} | tee "$STRUCT_FILE" >/dev/null

ok "Wrote: $STRUCT_FILE"

# 2) Patch impact
TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

unzip -q "$PATCH_ZIP" -d "$TMP_DIR"

PATCH_ROOT="$TMP_DIR/rag-refresh-product-factory"
if [[ ! -d "$PATCH_ROOT" ]]; then
  PATCH_ROOT="$(find "$TMP_DIR" -maxdepth 1 -mindepth 1 -type d | head -n 1 || true)"
fi
[[ -d "$PATCH_ROOT" ]] || err "Could not locate patch root after unzip"

if find "$PATCH_ROOT" -type f | grep -E '/(\.git|node_modules|\.next|dist|build|coverage|__pycache__)/' >/dev/null 2>&1; then
  err "Patch includes build/cache artifacts. Refusing."
fi

( cd "$PATCH_ROOT" && find . -type f -print | sed 's|^\./||' | sort ) > "$PATCH_FILELIST"

TARGET="$TARGET" PATCH_ROOT="$PATCH_ROOT" PATCH_ZIP="$PATCH_ZIP" python3 - <<PY > "$IMPACT_FILE"
import os, pathlib
target = pathlib.Path(os.environ["TARGET"])
patch_root = pathlib.Path(os.environ["PATCH_ROOT"])
patch_zip = os.environ.get("PATCH_ZIP","")
files = [p for p in patch_root.rglob("*") if p.is_file()]
rel_files = sorted([str(p.relative_to(patch_root)) for p in files])
new, overwrite = [], []
for rf in rel_files:
    if (target / rf).exists():
        overwrite.append(rf)
    else:
        new.append(rf)
print("PATCH IMPACT SUMMARY")
print("====================")
print(f"Patch zip: {patch_zip}")
print(f"Total patch files: {len(rel_files)}")
print(f"New files:         {len(new)}")
print(f"Overwrites:        {len(overwrite)}")
print("")
print("OVERWRITES:")
for f in overwrite:
    print(f"  ✏️  {f}")
print("")
print("NEW FILES:")
for f in new:
    print(f"  ➕ {f}")
PY

ok "Wrote: $PATCH_FILELIST"
ok "Wrote: $IMPACT_FILE"

# 3) Crew prompt (write without nested heredoc issues)
{
  echo "# AlexAI Crew Review: Repo Structure + Patch Overlay Plan"
  echo ""
  echo "## North Star"
  echo "AlexAI should be **provider-agnostic** and **bill only through OpenRouter**, with n8n \"crew\" orchestration assigning **effort + cost** per prompt/query."
  echo ""
  echo "## Target repo on disk"
  echo "\`$TARGET\`"
  echo ""
  echo "## Auto-selected canonical patch zip"
  echo "\`$PATCH_ZIP\`"
  echo ""
  echo "## Repo structure snapshot"
  echo '```'
  cat "$STRUCT_FILE"
  echo '```'
  echo ""
  echo "## Patch impact summary"
  echo '```'
  cat "$IMPACT_FILE"
  echo '```'
} > "$PROMPT_FILE"

ok "Wrote: $PROMPT_FILE"

# 4) Payload (PROMPT_FILE passed via env to Python)
PROMPT_FILE="$PROMPT_FILE" TS="$TS" TARGET="$TARGET" PATCH_ZIP="$PATCH_ZIP" python3 - <<PY > "$PAYLOAD_FILE"
import json, os
payload = {
  "source": "crew-review-and-apply.sh",
  "timestamp": os.environ.get("TS",""),
  "target_repo": os.environ.get("TARGET",""),
  "patch_zip": os.environ.get("PATCH_ZIP",""),
  "goal": "OpenRouter-only billing via n8n crew orchestration; unify VS Code extension + web dashboard in TypeScript.",
  "prompt_markdown": open(os.environ["PROMPT_FILE"], "r", encoding="utf-8").read(),
  "env_presence": {
    "N8N_WEBHOOK_URL_set": bool(os.environ.get("N8N_WEBHOOK_URL","")),
    "SUPABASE_URL_set": bool(os.environ.get("SUPABASE_URL","")),
    "alexai_secrets_file_exists": os.path.exists(os.path.expanduser("~/.alexai-secrets/api-keys.env")),
  }
}
print(json.dumps(payload, indent=2))
PY

ok "Wrote: $PAYLOAD_FILE"

# 5) Send
if [[ "$DO_SEND" == "1" ]]; then
  [[ -n "${WEBHOOK_URL:-}" ]] || err "--send requested but N8N_WEBHOOK_URL (or N8N_CREW_WEBHOOK_URL) is not set"
  command -v curl >/dev/null 2>&1 || err "curl is required for --send"
  ok "Sending crew payload to n8n webhook…"
  curl -sS -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    --data-binary @"$PAYLOAD_FILE" \
    | tee "$RUN_DIR/webhook_response.txt" >/dev/null || err "Webhook send failed"
  ok "Webhook response saved: $RUN_DIR/webhook_response.txt"
else
  warn "--send not used. Crew prompt saved locally:"
  say "  $PROMPT_FILE"
fi

# 6) Apply
if [[ "$DO_APPLY" == "1" ]]; then
  [[ -f "scripts/patch/apply-docs-patch.sh" ]] || err "Missing scripts/patch/apply-docs-patch.sh in repo"
  ok "Applying patch (backs up overwritten files)…"
  bash scripts/patch/apply-docs-patch.sh "$PATCH_ZIP" --apply
  ok "Patch applied."
else
  warn "--apply not used. Repo files unchanged."
fi

ok "Done. Artifacts in: $RUN_DIR"
