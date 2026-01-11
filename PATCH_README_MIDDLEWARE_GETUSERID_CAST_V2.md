# Patch v2: Fix getUserId() return cast (middleware.ts)

## Symptom
`lib/auth/middleware.ts:245`:
- `Type 'unknown' is not assignable to type 'string'.`
with code like:
```ts
return authResult.success ? authResult.user!.id : null;
```

## Fix
Replace the return statement with a safe cast:
```ts
return authResult.success ? String((authResult as any).user?.id ?? (authResult as any).user?.user_id ?? '') : null;
```

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_middleware_getUserId_cast_v2.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_middleware_getUserId_cast_v2.zip
chmod +x scripts/maintenance/patch-middleware-getUserId-cast-v2.sh
bash scripts/maintenance/patch-middleware-getUserId-cast-v2.sh
npm run -s clean:build:webpack || npm run build
```
