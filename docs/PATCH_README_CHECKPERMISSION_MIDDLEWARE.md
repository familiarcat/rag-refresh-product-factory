# Patch: checkPermission() call signature fix (middleware)

## Symptom
TypeScript error in `lib/auth/middleware.ts`:
- `Expected 1 arguments, but got 3.`

## Fix
Rewrite `checkPermission(user.id, permission, projectId)` to the object signature:

```ts
checkPermission({ userId, permission, projectId })
```

Also ensures `normalizeUserId` import exists and is used to derive `userId`.

## Apply
From repo root:

```bash
cp ~/Downloads/rag-refresh-product-factory_patch_checkPermission_object_signature_middleware.zip .

npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_checkPermission_object_signature_middleware.zip

chmod +x scripts/maintenance/patch-checkPermission-middleware.sh
bash scripts/maintenance/patch-checkPermission-middleware.sh

npm run -s clean:build:webpack || npm run build
```
