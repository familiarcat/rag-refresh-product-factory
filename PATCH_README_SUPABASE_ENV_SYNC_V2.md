# Patch v2: Supabase env sync from ~/.zshrc (and/or current env)

If you still see `Error: supabaseUrl is required`, it means **SUPABASE_URL is not present in the environment seen by Next build**.

This patch improves the extractor:
- reads both `export VAR=...` **and** plain `VAR=...` lines from ~/.zshrc
- falls back to the **current exported environment** if the file doesn't contain the var

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_supabase_env_sync_v2.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_supabase_env_sync_v2.zip
chmod +x scripts/secrets/sync_supabase_from_zshrc.sh
```

## Run
```bash
# (optional) ensure your shell has exports loaded
source ~/.zshrc

bash scripts/secrets/sync_supabase_from_zshrc.sh

# confirm the value is present for Node/Next
grep -n 'SUPABASE_URL' .env.local || true
node -e 'console.log("SUPABASE_URL:", process.env.SUPABASE_URL)'

npm run -s check:env
npm run -s clean:build:webpack || npm run build
```

## If you store exports in ~/.zshenv
```bash
ZSHRC_PATH=~/.zshenv bash scripts/secrets/sync_supabase_from_zshrc.sh
```
