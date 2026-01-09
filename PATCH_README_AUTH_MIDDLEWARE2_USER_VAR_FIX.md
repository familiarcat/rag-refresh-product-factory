# Patch: Fix middleware 2 user variable name in normalization block

Fixes TS error:
- `Cannot find name 'user'. Did you mean '_user'?` in `lib/auth/middleware 2.ts`

This patch rewrites the injected normalization block to use `_user` (the actual variable in scope)
instead of `user`.

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_auth_middleware2_user_var_fix.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_auth_middleware2_user_var_fix.zip

chmod +x scripts/maintenance/patch-auth-middleware2-user-var-fix.sh
bash scripts/maintenance/patch-auth-middleware2-user-var-fix.sh

npm run build
```
