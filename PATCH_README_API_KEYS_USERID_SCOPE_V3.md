# Patch: Fix userId scope in api-keys route (v3)

Fixes TypeScript error:
- app/api/auth/api-keys/route.ts: Cannot find name 'userId'

Earlier patch rewrote callsites to use `userId`, but the guard/definition was inserted in a different scope.
This patch inserts a `const userId = ...` + 401 guard **immediately before the first use of `userId`**,
ensuring it is in the correct block scope.

## Apply

```bash
cp ~/Downloads/rag-refresh-product-factory_patch_api_keys_userid_scope_fix_v3.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_api_keys_userid_scope_fix_v3.zip

chmod +x scripts/maintenance/patch-api-keys-userid-scope-v3.sh
bash scripts/maintenance/patch-api-keys-userid-scope-v3.sh

npm run build
```
