# Patch v3: Supabase env sync (portable on macOS)

Fixes from v2:
- Uses portable date formatting (BSD date on macOS doesn't support `-Is`)
- Defaults to `~/.zshenv` first (best practice for exported env vars)
- Adds clear “missing vars” guidance
- Provides correct verify commands (no comma typo)

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_supabase_env_sync_v3.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_supabase_env_sync_v3.zip
chmod +x scripts/secrets/sync_supabase_from_zshrc.sh
```

## Run
```bash
# ensure exports are loaded
source ~/.zshenv 2>/dev/null || true
source ~/.zshrc 2>/dev/null || true

bash scripts/secrets/sync_supabase_from_zshrc.sh

grep -n 'SUPABASE_URL' .env.local || true
node -e 'console.log("SUPABASE_URL:", process.env.SUPABASE_URL); console.log("SRK:", (process.env.SUPABASE_SERVICE_ROLE_KEY||"").slice(0,6))'
```
