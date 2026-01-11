# Patch: getUserId() returns a string | null (middleware)

## Symptom
TypeScript error in `lib/auth/middleware.ts`:
- `Type 'unknown' is not assignable to type 'string'.`
at `return authResult.success ? authResult.user.id : null;`

## Fix
Cast the user id to string safely:
```ts
return authResult.success ? String((authResult as any).user?.id ?? '') : null;
```

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_middleware_getUserId_string_cast.zip .

npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_middleware_getUserId_string_cast.zip

chmod +x scripts/maintenance/patch-middleware-getUserId-cast.sh
bash scripts/maintenance/patch-middleware-getUserId-cast.sh

npm run -s clean:build:webpack || npm run build
```
