# Patch: Fix TS2589 in lib/auth/middleware.ts (api_keys query)

## What this fixes
- `Type instantiation is excessively deep and possibly infinite` at:
  `lib/auth/middleware.ts` around `.from('api_keys')`

## Why this works
Supabase's generic query builder can exceed TypeScript's instantiation depth in auth/middleware paths.
Casting only at the **table boundary** keeps runtime behavior unchanged while preventing TS recursion.

## How to apply (your patch framework)

From repo root:

```bash
cp ~/Downloads/rag-refresh-product-factory_patch_middleware_api_keys_ts2589_fix.zip .

npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_middleware_api_keys_ts2589_fix.zip

chmod +x scripts/maintenance/patch-middleware-api-keys-ts2589.sh
bash scripts/maintenance/patch-middleware-api-keys-ts2589.sh

npm run -s clean:build:webpack || npm run build
```

## If your file name differs
If your error is in `lib/auth/middleware 2.ts` or `lib/auth/middleware2.ts`,
edit the `FILE=...` line inside `scripts/maintenance/patch-middleware-api-keys-ts2589.sh`
and re-run it.

