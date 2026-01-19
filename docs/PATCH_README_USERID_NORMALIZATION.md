# Patch: Canonical userId normalization (server routes)

## Why
Your build is failing because `user.id` is effectively typed as `unknown` in server routes,
and earlier patches introduced block-scoped `userId` declarations that are not visible where used.

This patch:
- Adds `lib/auth/user-id.ts` with `normalizeUserId(user)` helper (foundation for cascading normalization)
- Fixes `app/api/auth/api-keys/route.ts` deterministically by inserting a single canonical `const userId = ...`
  in the SAME scope as the first `createApiKeyForUser(...)` call, and rewriting call sites.

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_userid_normalization.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_userid_normalization.zip

chmod +x scripts/maintenance/fix-api-keys-userid-normalization.sh
bash scripts/maintenance/fix-api-keys-userid-normalization.sh

npm run build
```

## Next step (recommended)
After build is green, progressively refactor server routes to:
```ts
import { normalizeUserId } from "@/lib/auth/user-id";
const userId = normalizeUserId(user);
```
and then enforce a consistent `AuthProfile / User` type at the middleware boundary.
