# Patch: Fix checkPermission call signature in lib/auth/middleware 2.ts

Fixes TS error:
- `Expected 1 arguments, but got 3.`

Updates:
- `checkPermission(user.id, permission, projectId)`
to the canonical object form:
- `checkPermission({ userId, permission, projectId })`

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_checkPermission_call_signature_middleware2.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_checkPermission_call_signature_middleware2.zip

chmod +x scripts/maintenance/patch-middleware2-checkPermission-args.sh
bash scripts/maintenance/patch-middleware2-checkPermission-args.sh

npm run build
```
