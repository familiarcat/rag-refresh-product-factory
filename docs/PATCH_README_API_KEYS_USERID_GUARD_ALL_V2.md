# Patch: api-keys route userId guard (robust v2)

Fixes TypeScript build error:
- app/api/auth/api-keys/route.ts: Argument of type 'unknown' is not assignable to parameter of type 'string'

This v2 patch is more robust:
- Inserts a `userId` guard after `user` is defined (supports `const user =`, `let user =`, `const { user } =`)
- Falls back to inserting before first `user.id` usage if needed
- Rewrites `createApiKeyForUser(user.id, ...)` and `listApiKeys(user.id, ...)` to use `userId`

## Apply

```bash
cp ~/Downloads/rag-refresh-product-factory_patch_api_keys_userid_guard_all_v2.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_api_keys_userid_guard_all_v2.zip

chmod +x scripts/maintenance/patch-api-keys-userid-guard-all-v2.sh
bash scripts/maintenance/patch-api-keys-userid-guard-all-v2.sh

npm run build
```
