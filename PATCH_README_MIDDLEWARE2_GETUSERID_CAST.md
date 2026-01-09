# Patch: Fix getUserId() return typing in lib/auth/middleware 2.ts

Fixes TS error:
- `Type 'unknown' is not assignable to type 'string'.` at getUserId()

Cause:
- `authResult.user.id` is inferred as `unknown` from the auth helper.

Fix:
- Cast `authResult.user.id` to string safely: `(authResult.user as any)?.id?.toString?.() ?? null`

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_middleware2_getUserId_cast.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_middleware2_getUserId_cast.zip

chmod +x scripts/maintenance/patch-middleware2-getUserId-cast.sh
bash scripts/maintenance/patch-middleware2-getUserId-cast.sh

npm run build
```
