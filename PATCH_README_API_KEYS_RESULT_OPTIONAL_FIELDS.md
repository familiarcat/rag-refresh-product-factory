# Patch: api-keys route result.record optional fields (key_prefix/scopes/expires_at)

Fixes TS build errors like:
- Property 'key_prefix' does not exist on type ApiKey Row

This patch updates `app/api/auth/api-keys/route.ts` to access `result.record` optional fields safely:
- `key_prefix: (result.record as any).key_prefix ?? ""`
- `scopes: (result.record as any).scopes ?? []`
- `expires_at: (result.record as any).expires_at ?? null`
- `last_used_at: (result.record as any).last_used_at ?? null` (if present)

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_api_keys_result_record_optional_fields.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_api_keys_result_record_optional_fields.zip

chmod +x scripts/maintenance/patch-api-keys-route-result-optional-fields.sh
bash scripts/maintenance/patch-api-keys-route-result-optional-fields.sh

npm run build
```
