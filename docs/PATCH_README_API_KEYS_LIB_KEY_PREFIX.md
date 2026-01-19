# Patch: lib/auth/api-keys.ts key_prefix optional-safe

Fixes TS error:
- `Property 'key_prefix' does not exist on type ApiKey Row`

This patch updates `lib/auth/api-keys.ts` to access `result.record.key_prefix` via `(result.record as any).key_prefix`
(and also guards `result.record.scopes` if present).

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_api_keys_key_prefix_guard_lib.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_api_keys_key_prefix_guard_lib.zip

chmod +x scripts/maintenance/patch-api-keys-lib-key-prefix.sh
bash scripts/maintenance/patch-api-keys-lib-key-prefix.sh

npm run build
```
