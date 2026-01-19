# Patch: Fix TS "type instantiation excessively deep" in api_keys queries

Fixes error:
- `Type instantiation is excessively deep and possibly infinite.`

This is commonly triggered by `select('*')` with `@supabase/supabase-js` + large `Database` typings.

This patch updates `lib/auth/api-keys.ts` to replace `select('*')` on `api_keys` queries with explicit columns:
`id,user_id,api_key_hash,label,created_at,revoked_at`

## Apply

```bash
cp ~/Downloads/rag-refresh-product-factory_patch_api_keys_select_star_fix.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_api_keys_select_star_fix.zip

chmod +x scripts/maintenance/patch-api-keys-select-star.sh
bash scripts/maintenance/patch-api-keys-select-star.sh

npm run build
```
