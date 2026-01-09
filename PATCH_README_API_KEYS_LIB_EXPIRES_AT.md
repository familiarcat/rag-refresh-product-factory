# Patch: lib/auth/api-keys.ts expires_at optional-safe

Fixes TS error:
- `Property 'expires_at' does not exist on type ApiKey Row`

This patch updates `lib/auth/api-keys.ts` to read `expires_at` via `(apiKeyData as any).expires_at`.

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_api_keys_expires_at_guard_lib.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_api_keys_expires_at_guard_lib.zip

chmod +x scripts/maintenance/patch-api-keys-lib-expires-at.sh
bash scripts/maintenance/patch-api-keys-lib-expires-at.sh

npm run build
```
