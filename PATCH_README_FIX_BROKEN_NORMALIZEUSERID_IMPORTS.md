# Patch: Fix broken normalizeUserId import injection

Fixes build syntax errors like:
- `Expected '}', got '{'`
- `createApiKeyimport { normalizeUserId } from "@/lib/auth/user-id";`

These happen when an automated import insertion lands inside another import block.

This patch:
- Scans `app/api/**/route.ts`
- Removes mangled inline `...import { normalizeUserId }...` occurrences
- Ensures a clean standalone import exists at the top **only if** `normalizeUserId(...)` is used.

## Apply

```bash
cp ~/Downloads/rag-refresh-product-factory_patch_fix_broken_normalizeUserId_imports.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_fix_broken_normalizeUserId_imports.zip

chmod +x scripts/maintenance/fix-broken-normalizeUserId-imports.sh
bash scripts/maintenance/fix-broken-normalizeUserId-imports.sh

npm run build
```
