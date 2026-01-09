# Patch: lib/auth/api-keys.ts scopes optional-safe

Fixes TS error:
- `Property 'scopes' does not exist on type ApiKey Row`

This patch updates `lib/auth/api-keys.ts` to treat `scopes` as optional runtime data:
- `apiKey.scopes.includes(scope)` -> `(((apiKey as any).scopes ?? []) as string[]).includes(scope)`

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_api_keys_scopes_guard_lib.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_api_keys_scopes_guard_lib.zip

chmod +x scripts/maintenance/patch-api-keys-lib-scopes.sh
bash scripts/maintenance/patch-api-keys-lib-scopes.sh

npm run build
```
