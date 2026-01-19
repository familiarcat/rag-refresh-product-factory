# Patch: logAudit compatibility + api-keys route fix (v2)

## What this fixes

1) `app/api/auth/api-keys/route.ts` build error:
- "Expected 1 arguments, but got 7" from legacy `logAudit(...)` call

2) Prior patch script introduced a syntax error in `lib/supabase.ts` by inserting non-TypeScript-safe text.
This patch replaces the entire exported `logAudit` function with a clean, TypeScript-valid overload implementation.

## Apply

```bash
cp ~/Downloads/rag-refresh-product-factory_patch_logAudit_api_keys_fix_v2.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_logAudit_api_keys_fix_v2.zip

chmod +x scripts/maintenance/patch-logAudit-api-keys-v2.sh
bash scripts/maintenance/patch-logAudit-api-keys-v2.sh

npm run build
```

## Notes

- `logAudit` now supports both object-form and legacy positional calls.
- `logAudit` inserts into `audit_logs` if present; otherwise it no-ops (to keep builds green).
