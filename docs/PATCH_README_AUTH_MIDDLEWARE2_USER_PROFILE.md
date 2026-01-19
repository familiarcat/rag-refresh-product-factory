# Patch: Fix AuthProfile typing in lib/auth/middleware 2.ts

Fixes TS error:
- `Property 'user_id' is missing in type '{}' but required in type 'AuthProfile'`

This patch updates the success return block to wrap `user` into `_user` with a guaranteed `user_id`
derived from `apiKeyData.user_id` (fallback to `user.user_id`, else empty string).

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_auth_middleware2_user_profile_fix.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_auth_middleware2_user_profile_fix.zip

chmod +x scripts/maintenance/patch-auth-middleware2-user-profile.sh
bash scripts/maintenance/patch-auth-middleware2-user-profile.sh

npm run build
```
