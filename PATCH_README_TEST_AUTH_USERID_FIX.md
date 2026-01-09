# Patch: test-auth route userId normalization

Fixes TS error: Cannot find name 'userId' in `app/api/dev/test-auth/route.ts`

This patch only:
- Inserts a `const userId = normalizeUserId(...)` + 401 guard immediately before the `const permissions = { ... }` block.
- Does NOT rewrite your permissions map or other logic.
- Does NOT touch any other files.

## Apply

```bash
cp ~/Downloads/rag-refresh-product-factory_patch_test_auth_userid_fix.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_test_auth_userid_fix.zip

chmod +x scripts/maintenance/patch-test-auth-userid.sh
bash scripts/maintenance/patch-test-auth-userid.sh

npm run build
```
