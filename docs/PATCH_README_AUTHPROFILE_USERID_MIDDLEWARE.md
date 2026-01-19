# Patch: Fix AuthProfile typing in lib/auth/middleware.ts

## Symptom
TypeScript error:
- `Property 'user_id' is missing in type '{}' but required in type 'AuthProfile'`
at `lib/auth/middleware.ts` around the `return { success: true, user }` block.

## What this patch does
- Ensures `normalizeUserId(user)` is used to populate `user.user_id`
- Wraps returned user as an object containing `user_id` plus spread of the original `user`

This is runtime-safe and fixes the typing contract.

## Apply

```bash
cp ~/Downloads/rag-refresh-product-factory_patch_authprofile_user_id_middleware_fix.zip .

npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_authprofile_user_id_middleware_fix.zip

chmod +x scripts/maintenance/patch-authprofile-userid-middleware.sh
bash scripts/maintenance/patch-authprofile-userid-middleware.sh

npm run -s clean:build:webpack || npm run build
```
