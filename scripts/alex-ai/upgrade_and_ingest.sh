#!/usr/bin/env bash
set -euo pipefail

# scripts/alex-ai/upgrade_and_ingest.sh
#
# One-command automation:
# - Apply enhancements patch zip(s) safely (no .git/.next/node_modules/dist/etc)
# - Run UTF-8 base64 hardening pass to prevent VS Code WebView ByteString crashes
# - Optionally import a source zip into the PM/projects structure
# - Create a memory note and ingest into Supabase RAG (milestones uploader)
#
# Usage:
#   bash scripts/alex-ai/upgrade_and_ingest.sh \
#     --enhancements /path/to/rag-refresh-product-factory_enhancements_patch.zip \
#     --orchestrator /path/to/rag-refresh-product-factory_orchestrator_patch.zip \
#     --import-zip /path/to/stldnb.zip \
#     --pm-root ./projects
#
# Env needed for RAG ingest:
#   SUPABASE_URL
#   SUPABASE_SERVICE_ROLE_KEY
#
# Optional:
#   MILESTONE_PROJECT, MILESTONE_REPO

say()  { printf "%b\n" "$*"; }
ok()   { say "✅ $*"; }
warn() { say "⚠️  $*"; }
err()  { say "❌ $*"; exit 1; }

need() { command -v "$1" >/dev/null 2>&1 || err "Missing required command: $1"; }

need unzip
need node
need npm

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

ENH_ZIP=""
ORCH_ZIP=""
IMPORT_ZIP=""
PM_ROOT="./projects"
SKIP_NPM="0"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --enhancements) ENH_ZIP="${2:-}"; shift 2 ;;
    --orchestrator) ORCH_ZIP="${2:-}"; shift 2 ;;
    --import-zip)   IMPORT_ZIP="${2:-}"; shift 2 ;;
    --pm-root)      PM_ROOT="${2:-}"; shift 2 ;;
    --skip-npm)     SKIP_NPM="1"; shift 1 ;;
    *) err "Unknown arg: $1" ;;
  esac
done

[[ -n "$ENH_ZIP" ]] || err "--enhancements is required"
[[ -f "$ENH_ZIP" ]] || err "Enhancements zip not found: $ENH_ZIP"
[[ -z "$ORCH_ZIP" || -f "$ORCH_ZIP" ]] || err "Orchestrator zip not found: $ORCH_ZIP"
[[ -z "$IMPORT_ZIP" || -f "$IMPORT_ZIP" ]] || err "Import zip not found: $IMPORT_ZIP"

refuse_if_bad_zip() {
  local z="$1"
  unzip -Z1 "$z" | grep -E '(^|/)(\.git/|node_modules/|\.next/|dist/|build/|coverage/|__MACOSX/)' >/dev/null 2>&1 && \
    err "Refusing zip (contains build/cache artifacts): $z"
}

ok "Repo root: $ROOT_DIR"

ok "Safety-checking patch zips…"
refuse_if_bad_zip "$ENH_ZIP"
[[ -n "$ORCH_ZIP" ]] && refuse_if_bad_zip "$ORCH_ZIP"

ok "Applying overlays…"
[[ -n "$ORCH_ZIP" ]] && unzip -o "$ORCH_ZIP" >/dev/null && ok "Applied orchestrator overlay"
unzip -o "$ENH_ZIP" >/dev/null && ok "Applied enhancements overlay"

# UTF-8 hardening (prevents WebView ByteString errors)
if [[ -f "scripts/maintenance/fix-utf8-base64-and-verify.sh" ]]; then
  ok "Running UTF-8 base64 hardening (apply)…"
  bash scripts/maintenance/fix-utf8-base64-and-verify.sh --apply
else
  warn "Missing scripts/maintenance/fix-utf8-base64-and-verify.sh (skipping hardening)"
fi

# Optional: import external project zip into PM system
mkdir -p "$PM_ROOT"
if [[ -n "$IMPORT_ZIP" ]]; then
  ok "Importing project zip into PM root: $PM_ROOT"
  node scripts/alex-ai/import_project_from_zip.mjs "$IMPORT_ZIP" "$PM_ROOT"
  ok "Imported: $IMPORT_ZIP"
fi

# Best-effort npm checks
if [[ "$SKIP_NPM" == "0" && -f "package.json" ]]; then
  ok "npm install (root)…"
  npm install

  run_if_script() {
    local dir="$1"; local script="$2"
    node -e "const p=require('./$dir/package.json'); process.exit(p.scripts && p.scripts['$script'] ? 0 : 1)" \
      >/dev/null 2>&1 && { ok "npm -C $dir run $script"; npm -C "$dir" run "$script"; return 0; }
    warn "No script '$script' in $dir/package.json (skipping)"
    return 0
  }

  run_if_script "." "check:env" || true
  run_if_script "." "lint" || true
  run_if_script "." "typecheck" || true
  run_if_script "." "build" || true

  if [[ -d "vscode-extension" && -f "vscode-extension/package.json" ]]; then
    ok "npm install (vscode-extension)…"
    npm -C vscode-extension install || true
    run_if_script "vscode-extension" "lint" || true
    run_if_script "vscode-extension" "typecheck" || true
    run_if_script "vscode-extension" "build" || true
  fi
else
  warn "Skipping npm checks (use --skip-npm to silence)"
fi

# Create + ingest a memory note into Supabase RAG (if env configured)
if [[ -n "${SUPABASE_URL:-}" && -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  ok "Creating + ingesting memory note into Supabase RAG…"
  node scripts/alex-ai/create_and_ingest_memory.mjs \
    --title "AlexAI enhancements: OpenRouter-only billing + VSCode UTF-8 fix + PM import" \
    --pmRoot "$PM_ROOT" \
    --importZip "${IMPORT_ZIP:-}"
  ok "Memory ingested."
else
  warn "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set; skipping RAG ingest."
  warn "Set them (e.g., via .env.local) then re-run to ingest memory."
fi

ok "Upgrade + PM import + (optional) RAG ingest complete."
