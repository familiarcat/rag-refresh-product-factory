# Patch: Fix middleware 2 user normalization reference + add query-cast candidate scanner

## 1) Fix current TS error
Fixes:
- `Cannot find name '_user'` in `lib/auth/middleware 2.ts` by ensuring the inline normalization uses `user`.

## 2) Add a scanner for where query-cast may be needed
Adds:
- `scripts/maintenance/find-supabase-query-cast-candidates.sh`
This prints a ranked list of TS files in `app/` and `lib/` that contain `.from()` + `.select()`
(and prioritizes `api_keys` and `select('*')` occurrences).

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_auth_middleware2_user_ref_fix.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_auth_middleware2_user_ref_fix.zip

chmod +x scripts/maintenance/patch-auth-middleware2-user-ref-fix.sh
bash scripts/maintenance/patch-auth-middleware2-user-ref-fix.sh

# optional: scan for query-cast candidates
chmod +x scripts/maintenance/find-supabase-query-cast-candidates.sh
bash scripts/maintenance/find-supabase-query-cast-candidates.sh

npm run build
```
