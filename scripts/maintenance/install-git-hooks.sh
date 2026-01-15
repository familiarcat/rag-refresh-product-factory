#!/usr/bin/env bash
set -euo pipefail

HOOK_DIR=".git/hooks"
HOOK="$HOOK_DIR/pre-commit"

mkdir -p "$HOOK_DIR"

cat > "$HOOK" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
MAX_MB=95
MAX_BYTES=$((MAX_MB * 1024 * 1024))
blocked=0

while IFS= read -r file; do
  [[ ! -f "$file" ]] && continue
  size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
  if [[ "$size" -gt "$MAX_BYTES" ]]; then
    mb=$(awk "BEGIN { printf \"%.2f\", $size/1024/1024 }")
    echo "❌ BLOCKED: $file (${mb} MB)"
    blocked=1
  fi
done < <(git diff --cached --name-only)

[[ "$blocked" -eq 1 ]] && exit 1
EOF

chmod +x "$HOOK"
echo "✅ Git pre-commit hook installed."
