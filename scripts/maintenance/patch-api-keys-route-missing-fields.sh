#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"
FILE="app/api/auth/api-keys/route.ts"
if [[ ! -f "$FILE" ]]; then echo "❌ Not found: $FILE"; exit 1; fi
node - <<'NODE'
const fs=require('fs');
const p='app/api/auth/api-keys/route.ts';
let s=fs.readFileSync(p,'utf8');
const orig=s;
s=s.replace(/\bkey_prefix:\s*key\.key_prefix\s*,/g,'key_prefix: (key as any).key_prefix ?? "",');
s=s.replace(/\bscopes:\s*key\.scopes\s*,/g,'scopes: (key as any).scopes ?? [],');
s=s.replace(/\blast_used_at:\s*key\.last_used_at\s*,/g,'last_used_at: (key as any).last_used_at ?? null,');
s=s.replace(/\bkey_prefix:\s*key\.api_key_prefix\s*,/g,'key_prefix: (key as any).api_key_prefix ?? (key as any).key_prefix ?? "",');
if(s!==orig){fs.writeFileSync(p,s,'utf8');console.log('✅ Patched api-keys route missing ApiKey fields with safe fallbacks:',p);} else {console.log('ℹ️  No changes made (patterns not found):',p);} 
NODE
