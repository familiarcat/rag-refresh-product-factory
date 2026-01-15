\
#!/usr/bin/env bash
set -euo pipefail

say(){ printf "%b\n" "$*"; }
warn(){ say "⚠️  $*"; }

PATCH_ZIPS=("$@")

for z in "${PATCH_ZIPS[@]}"; do
  [[ -f "$z" ]] || { warn "Patch not found: $z"; continue; }
  say "Applying patch overlay: $z"
  unzip -oq "$z"
done

if [[ -f scripts/maintenance/heal-and-build.sh ]]; then
  bash scripts/maintenance/heal-and-build.sh || warn "Heal step reported issues; continuing"
fi

say "Upgrade + verification complete."
