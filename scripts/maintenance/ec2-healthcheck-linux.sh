#!/usr/bin/env bash
set -euo pipefail

# -----------------------------------------------------------------------------
# Instance-side health check (Linux only).
# Run THIS on the EC2 instance (not on macOS).
# -----------------------------------------------------------------------------

say(){ printf "%b\n" "$*"; }
ok(){ say "✅ $*"; }
warn(){ say "⚠️  $*"; }
err(){ say "❌ $*"; exit 1; }

if [[ "$(uname -s)" != "Linux" ]]; then
  err "This script is Linux-only. Run it on the EC2 host."
fi

say "🩺 EC2 host health check"
say ""

if command -v systemctl >/dev/null 2>&1; then
  say "SSM agent:"
  systemctl status amazon-ssm-agent --no-pager || true
else
  warn "systemctl not found (non-systemd distro?)"
fi

if command -v docker >/dev/null 2>&1; then
  say ""
  say "Docker containers:"
  docker ps -a || true
else
  warn "docker not found"
fi

if command -v ss >/dev/null 2>&1; then
  say ""
  say "Listening ports (80/443/5678):"
  ss -lntp | egrep ':80|:443|:5678' || true
elif command -v netstat >/dev/null 2>&1; then
  say ""
  say "Listening ports (80/443/5678):"
  netstat -lntp 2>/dev/null | egrep ':80|:443|:5678' || true
else
  warn "Neither ss nor netstat found"
fi

ok "Health check complete."
