# Patch: Fix user.id 'unknown' in api-keys route

Fixes TypeScript build error:
- app/api/auth/api-keys/route.ts: Argument of type 'unknown' is not assignable to parameter of type 'string'.

Applies a defensive guard that ensures `user.id` is a string before calling `listApiKeys`.

## Apply

```bash
cp ~/Downloads/rag-refresh-product-factory_patch_api_keys_userid_fix.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_api_keys_userid_fix.zip
npm run build
```
