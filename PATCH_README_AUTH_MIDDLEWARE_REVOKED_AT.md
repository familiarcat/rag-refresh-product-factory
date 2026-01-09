# Patch: lib/auth/middleware.ts revoked_at optional-safe

Fixes TS error:
- `Property 'revoked_at' does not exist ...` (often triggered by inferred select types)

This patch updates `lib/auth/middleware.ts`:
- `apiKeyData.revoked_at` -> `(apiKeyData as any).revoked_at`
(and also guards `expires_at` if present)

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_auth_middleware_revoked_at_guard.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_auth_middleware_revoked_at_guard.zip

chmod +x scripts/maintenance/patch-auth-middleware-revoked-at.sh
bash scripts/maintenance/patch-auth-middleware-revoked-at.sh

npm run build
```
