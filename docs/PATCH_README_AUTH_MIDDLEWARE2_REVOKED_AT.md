# Patch: Guard revoked_at in lib/auth/middleware 2.ts

Fixes TS build error currently coming from the duplicate file:
- `./lib/auth/middleware 2.ts:102:20 Property 'revoked_at' does not exist on type SelectQueryError<...>`

This patch only edits **lib/auth/middleware 2.ts** to access revoked/expiry fields via `(apiKeyData as any)`.

## Apply

```bash
cp ~/Downloads/rag-refresh-product-factory_patch_auth_middleware2_revoked_at_guard.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_auth_middleware2_revoked_at_guard.zip

chmod +x scripts/maintenance/patch-auth-middleware2-revoked-at.sh
bash scripts/maintenance/patch-auth-middleware2-revoked-at.sh

npm run build
```

## Next recommended cleanup (not performed by this patch)

To stop Next/TS from picking up the duplicate file, either:
- delete `lib/auth/middleware 2.ts`, or
- update imports to reference only `lib/auth/middleware.ts`, and/or
- exclude `**/* 2.ts` patterns from compilation if appropriate.
