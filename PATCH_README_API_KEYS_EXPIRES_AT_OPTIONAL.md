# Patch: api-keys route expires_at optional-safe

Fixes TS build error:
- `Property 'expires_at' does not exist on type ApiKey Row`

This patch updates `app/api/auth/api-keys/route.ts`:
- `expires_at: key.expires_at` -> `expires_at: (key as any).expires_at ?? null`

## Apply

```bash
cp ~/Downloads/rag-refresh-product-factory_patch_api_keys_expires_at_optional.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_api_keys_expires_at_optional.zip

chmod +x scripts/maintenance/patch-api-keys-route-expires-at.sh
bash scripts/maintenance/patch-api-keys-route-expires-at.sh

npm run build
```
