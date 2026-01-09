# Patch: Break TS "excessively deep" instantiation in lib/auth/middleware 2.ts

Fixes error:
- `Type instantiation is excessively deep and possibly infinite.`

Root cause: Supabase query builder generic inference on `api_keys` in this duplicate file.
Fix: Cast only the api_keys query builder to `any`.

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_auth_middleware2_instantiation_break.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_auth_middleware2_instantiation_break.zip

chmod +x scripts/maintenance/patch-auth-middleware2-break-instantiation.sh
bash scripts/maintenance/patch-auth-middleware2-break-instantiation.sh

npm run build
```
