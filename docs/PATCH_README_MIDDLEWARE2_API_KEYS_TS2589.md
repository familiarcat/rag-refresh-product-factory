# Patch: Fix TS2589 (type instantiation excessively deep) for api_keys query in middleware

## Symptom
Build fails with:
- `Type instantiation is excessively deep and possibly infinite`
at `lib/auth/middleware.ts` **or** `lib/auth/middleware 2.ts` near:
```ts
await supabase
  .from('api_keys')
  .select(...)
```

## Fix
Cast only at the table boundary (runtime-neutral):
```ts
await (supabase as any).from("api_keys")
```

## Apply (your patch framework)
From repo root:

```bash
cp ~/Downloads/rag-refresh-product-factory_patch_middleware2_api_keys_ts2589_fix.zip .

npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_middleware2_api_keys_ts2589_fix.zip

chmod +x scripts/maintenance/patch-middleware2-api-keys-ts2589.sh
bash scripts/maintenance/patch-middleware2-api-keys-ts2589.sh

# Build (prefer your clean build wrapper)
npm run -s clean:build:webpack || npm run build
```

Backups are created under `.patch-backups/`.
