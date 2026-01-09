# Patch: Supabase query boundary cast (fixes TS2589 deep instantiation)

## Why
In auth/middleware/app-route code paths, `SupabaseClient<Database>` can trigger:
- `Type instantiation is excessively deep and possibly infinite`

This patch establishes a **query boundary** by casting the client to `any` at the `.from('api_keys')` call site.

## What it changes
- Rewrites patterns like:

```ts
await supabase
  .from('api_keys')
  .select(...)
```

into:

```ts
await (supabase as any)
  .from('api_keys')
  .select(...)
```

Only for the `api_keys` table, in these files if present:
- `lib/auth/middleware.ts`
- `lib/auth/middleware2.ts`
- `lib/auth/middleware 2.ts`
- `lib/auth/api-keys.ts`

It also adds `lib/supabase/query.ts` as a cleaner optional helper going forward.

## Apply
From repo root:

```bash
cp ~/Downloads/rag-refresh-product-factory_patch_supabase_query_boundary_cast.zip .

npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_supabase_query_boundary_cast.zip

chmod +x scripts/maintenance/apply-supabase-query-boundary-cast.sh
bash scripts/maintenance/apply-supabase-query-boundary-cast.sh

# then build (use your existing clean build script if available)
npm run -s clean:build:webpack || npm run build
```

## If you still see TS2589 in another file
Run your existing candidate finder:

```bash
bash scripts/maintenance/find-supabase-query-cast-candidates.sh
```

Then apply the same `(supabase as any)` boundary only on the file/line that TS reports.
