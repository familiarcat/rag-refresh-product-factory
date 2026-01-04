#!/usr/bin/env bash
set -euo pipefail

# -----------------------------------------------------------------------------
# Project-local install/build helper for:
# - Next.js dashboard (repo root)
# - VSCode extension (./vscode-extension)
#
# Goals:
# - Deterministic installs (lockfile-based when possible)
# - No secrets printed
# - No repo bloat (never commit node_modules; never include in patch zips)
# -----------------------------------------------------------------------------

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

export NEXT_TELEMETRY_DISABLED=1

detect_pm() {
  if command -v pnpm >/dev/null 2>&1 && [[ -f "pnpm-lock.yaml" ]]; then
    echo "pnpm"
  elif [[ -f "package-lock.json" ]]; then
    echo "npm"
  else
    echo "npm"
  fi
}

pm_run() {
  local script="$1"
  if [[ "$PM" == "pnpm" ]]; then
    pnpm run "$script"
  else
    npm run "$script"
  fi
}

PM="$(detect_pm)"
ok "Project root: $ROOT_DIR"
ok "Package manager: $PM"

install_dir() {
  local dir="$1"
  [[ -d "$dir" ]] || return 0
  [[ -f "$dir/package.json" ]] || return 0

  say ""
  say "📦 Installing deps in: $dir"
  pushd "$dir" >/dev/null

  if [[ "$PM" == "pnpm" ]]; then
    pnpm install --frozen-lockfile
  else
    if [[ -f "package-lock.json" ]]; then
      npm ci
    else
      npm install
    fi
  fi

  popd >/dev/null
  ok "Install complete: $dir"
}

build_dir() {
  local dir="$1"
  [[ -d "$dir" ]] || return 0
  [[ -f "$dir/package.json" ]] || return 0

  say ""
  say "🏗️  Building: $dir"
  pushd "$dir" >/dev/null

  if node -e "const p=require('./package.json'); process.exit(p.scripts&&p.scripts.build?0:1)"; then
    pm_run build
    ok "Build complete: $dir"
  else
    warn "No build script in $dir (skipping)"
  fi

  popd >/dev/null
}

# 1) Root install + build
install_dir "$ROOT_DIR"
build_dir "$ROOT_DIR"

# 2) VSCode extension install + build (if present)
install_dir "$ROOT_DIR/vscode-extension"
build_dir "$ROOT_DIR/vscode-extension"

say ""
ok "Local install/build automation complete."
say "Next:"
say "  - Next.js dev:   (${PM}) run dev"
say "  - Extension dev: open ./vscode-extension and press F5 (Run Extension)"
