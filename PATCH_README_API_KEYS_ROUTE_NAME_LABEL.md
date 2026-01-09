# Patch: api-keys route `name` vs `label`

Fixes TS build error:
- `Property 'name' does not exist on type '{ id; user_id; api_key_hash; label; created_at; revoked_at; }'`

Your Supabase `api_keys` row typing uses `label` not `name`.
This patch updates `app/api/auth/api-keys/route.ts` to map:
- `name: key.name` -> `name: key.label` (with safe fallback)

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_api_keys_route_name_label.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_api_keys_route_name_label.zip

chmod +x scripts/maintenance/patch-api-keys-route-name-label.sh
bash scripts/maintenance/patch-api-keys-route-name-label.sh

npm run build
```
