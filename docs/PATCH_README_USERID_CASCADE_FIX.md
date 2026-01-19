# Patch: UserId normalization cascade fix

## Fixes
- Repairs broken `userId` guard in `app/api/auth/api-keys/route.ts` (Cannot find name 'userId')
- Adds a *cascading* codemod that normalizes `user.id` usage across Next.js route handlers:
  - Replaces `user.id` passed as an argument with `normalizeUserId(user)`
  - Automatically injects `import { normalizeUserId } from "@/lib/auth/user-id";` into affected route files

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_userid_cascade_fix.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_userid_cascade_fix.zip

chmod +x scripts/maintenance/fix-api-keys-userid-normalization-v2.sh
bash scripts/maintenance/fix-api-keys-userid-normalization-v2.sh

chmod +x scripts/maintenance/codemod-userid-normalize-routes.sh
bash scripts/maintenance/codemod-userid-normalize-routes.sh

npm run build
```

## Notes
This focuses on `app/api/**/route.ts` first (highest ROI for build).
Once build is green, we can extend the codemod to `lib/auth/*` and other server-only modules.
