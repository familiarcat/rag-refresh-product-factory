# Patch: Fix middleware 2 user profile normalization (remove apiKeyData reference)

Fixes TS error:
- `Cannot find name 'apiKeyData'` in `lib/auth/middleware 2.ts`

This patch adjusts the prior injected `_user` normalization to only depend on `user`:
- `user_id: (user as any)?.user_id ?? ""`

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_auth_middleware2_user_profile_fix_v2.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_auth_middleware2_user_profile_fix_v2.zip

chmod +x scripts/maintenance/patch-auth-middleware2-user-profile-fix-v2.sh
bash scripts/maintenance/patch-auth-middleware2-user-profile-fix-v2.sh

npm run build
```
