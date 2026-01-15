#!/usr/bin/env bash
set -euo pipefail

EXCLUDES=(
  "./node_modules"
  "./.next"
  "./.git"
  "./.trash"
  "./.press-logs"
  "./.press-pids"
  "./.alexai-secrets"
)

# Build find prune args
PRUNE_ARGS=()
for p in "${EXCLUDES[@]}"; do
  PRUNE_ARGS+=( -path "$p" -o )
done
unset 'PRUNE_ARGS[${#PRUNE_ARGS[@]}-1]' # drop trailing -o

echo "🔎 Scanning filesystem (this can take a bit on macOS fileprovider mounts)…"
echo "    Excluding: ${EXCLUDES[*]}"
echo

tmp_sizes="$(mktemp)"
tmp_errs="$(mktemp)"
count=0
start_ts="$(date +%s)"

# Produce "size path" lines with progress
find . \( "${PRUNE_ARGS[@]}" \) -prune -o -type f -print0 |
  while IFS= read -r -d '' f; do
    ((count++)) || true

    # progress heartbeat every 2000 files
    if (( count % 2000 == 0 )); then
      now="$(date +%s)"
      elapsed=$((now - start_ts))
      printf "… scanned %'d files (%ds)\r" "$count" "$elapsed"
    fi

    # stat (macOS)
    if sz="$(stat -f "%z" "$f" 2>>"$tmp_errs")"; then
      printf "%s\t%s\n" "$sz" "$f" >>"$tmp_sizes"
    fi
  done

echo
echo "✅ Scan complete. Sorting…"

# Top 50
sort -nr "$tmp_sizes" | head -n 50 |
  awk -F'\t' '{mb=$1/1024/1024; printf "%8.2f MB  %s\n", mb, $2}'

echo
echo "⚠️  Stat errors (if any):"
tail -n 20 "$tmp_errs" || true

rm -f "$tmp_sizes" "$tmp_errs"
