# Patch: Break TS "type instantiation excessively deep" in lib/auth/api-keys.ts

If `select('*')` replacement is not enough, Supabase's generic query builder can still trigger
TypeScript's "excessively deep" instantiation.

This patch surgically casts ONLY `api_keys` queries to `any`:
- `supabase.from('api_keys')` -> `(supabase as any).from('api_keys')`

This preserves runtime behavior and unblocks compilation, without changing other tables/types.

## Apply

```bash
cp ~/Downloads/rag-refresh-product-factory_patch_api_keys_type_instantiation_break.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_api_keys_type_instantiation_break.zip

chmod +x scripts/maintenance/patch-api-keys-break-instantiation.sh
bash scripts/maintenance/patch-api-keys-break-instantiation.sh

npm run build
```
