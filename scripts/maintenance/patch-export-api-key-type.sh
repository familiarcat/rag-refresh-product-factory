#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

FILE="lib/supabase.ts"
if [[ ! -f "$FILE" ]]; then
  echo "❌ Not found: $FILE"
  exit 1
fi

node - <<'NODE'
const fs = require('fs');

const p = 'lib/supabase.ts';
let s = fs.readFileSync(p,'utf8');

const marker = '// AlexAI: typed re-exports';
if (!s.includes(marker)) {
  s = s.trimEnd() + "\n\n" + marker + "\n" +
`export type ApiKey = import("@/types/supabase").Database["public"]["Tables"]["api_keys"]["Row"];
export type ApiKeyInsert = import("@/types/supabase").Database["public"]["Tables"]["api_keys"]["Insert"];
export type ApiKeyUpdate = import("@/types/supabase").Database["public"]["Tables"]["api_keys"]["Update"];
` + "\n";
  fs.writeFileSync(p, s, 'utf8');
  console.log("✅ Added ApiKey type exports to", p);
} else {
  console.log("ℹ️  ApiKey type exports already present in", p);
}
NODE
