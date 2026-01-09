# Patch: Query-cast Supabase api_keys query in lib/auth/middleware 2.ts + scanner

## Fixes current error
- `Type instantiation is excessively deep and possibly infinite` in `lib/auth/middleware 2.ts`

By casting only the query boundary:
- `supabase.from('api_keys')` → `(supabase as any).from("api_keys")`

This is runtime-neutral and stops TS from recursing through generic types.

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_query_cast_api_keys_middleware2.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_query_cast_api_keys_middleware2.zip

chmod +x scripts/maintenance/patch-middleware2-query-cast-api-keys.sh
bash scripts/maintenance/patch-middleware2-query-cast-api-keys.sh

npm run build
```

## Identify other files that may need query-cast
```bash
chmod +x scripts/maintenance/find-supabase-query-cast-candidates.sh
bash scripts/maintenance/find-supabase-query-cast-candidates.sh
```

Only apply casts to files/lines that actually throw the deep-instantiation error.
