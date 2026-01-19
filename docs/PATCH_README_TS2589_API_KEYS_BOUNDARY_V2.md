# Patch: TS2589 (type instantiation excessively deep) — api_keys query boundary cast (v2)

## What this fixes
Next.js build fails with:

`Type instantiation is excessively deep and possibly infinite`

at a Supabase chain like:

```ts
const { data: apiKeyData, error: keyError } = await supabase
  .from('api_keys')
  .select('user_id, expires_at, revoked_at')
  .eq('key_hash', keyHash);
```

## How it fixes it
It casts the Supabase client **at the await boundary** so the entire chain becomes `any` and TS stops trying to compute
huge nested generic types:

```ts
const { data: apiKeyData, error: keyError } = await (supabase as any)
  .from("api_keys")
  .select("user_id, expires_at, revoked_at")
  .eq("key_hash", keyHash)
  .maybeSingle();
```

This is runtime-neutral and only affects compile-time typing.

## Apply (your patch framework)
From repo root:

```bash
cp ~/Downloads/rag-refresh-product-factory_patch_ts2589_api_keys_query_boundary_v2.zip .

npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_ts2589_api_keys_query_boundary_v2.zip

chmod +x scripts/maintenance/patch-ts2589-api-keys-boundary-v2.sh
bash scripts/maintenance/patch-ts2589-api-keys-boundary-v2.sh

npm run -s clean:build:webpack || npm run build
```

## Notes
- This patch attempts these files (first found wins; it will patch all that match):
  - `lib/auth/middleware.ts`
  - `lib/auth/middleware 2.ts`
  - `lib/auth/middleware2.ts`
- Backups are stored in `.patch-backups/ts2589_api_keys_boundary_YYYYMMDD_HHMMSS/`
