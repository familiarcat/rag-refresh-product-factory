# Patch: api-keys route userId typing guard (all usages)

Fixes Next build TS error:
- app/api/auth/api-keys/route.ts: Argument of type 'unknown' is not assignable to parameter of type 'string'

Adds a single guard after `const user = ...;` to ensure `user.id` is a string, then defines `const userId = user.id;`
and replaces calls like:
- `listApiKeys(user.id, ...)` -> `listApiKeys(userId, ...)`
- `createApiKeyForUser(user.id, ...)` -> `createApiKeyForUser(userId, ...)`

## Apply

```bash
cp ~/Downloads/rag-refresh-product-factory_patch_api_keys_userid_guard_all.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_api_keys_userid_guard_all.zip

chmod +x scripts/maintenance/patch-api-keys-userid-guard-all.sh
bash scripts/maintenance/patch-api-keys-userid-guard-all.sh

npm run build
```
