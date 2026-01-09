# Final Consolidation Patch: Canonical userId + Supabase query-boundary cast + middleware call signature fixes

## What this patch does
- Adds `lib/auth/identity.ts` with canonical:
  - `normalizeUserId(user)` -> `string | null`
  - `requireUserId(user)` -> `string`
- Patches common auth middleware variants:
  - `lib/auth/middleware.ts`
  - `lib/auth/middleware2.ts`
  - `lib/auth/middleware 2.ts`
- Fixes:
  1) getUserId() returning `unknown` by using `normalizeUserId(authResult.user)`
  2) legacy `checkPermission(user.id, permission, projectId)` to object signature
  3) casts only the Supabase query boundary for `api_keys`:
     - `supabase.from('api_keys')` -> `(supabase as any).from("api_keys")`
  4) removes common broken `_user` shadow references
- Also applies query-boundary cast in `lib/auth/api-keys.ts` if present.

## Apply (via your patch framework)
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_final_consolidation.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_final_consolidation.zip

chmod +x scripts/maintenance/final-consolidation-run.sh
bash scripts/maintenance/final-consolidation-run.sh
```

## Build
```bash
npm run -s clean:build:webpack || npm run build
```

## If you still get "Type instantiation is excessively deep"
Run the included scanner:
```bash
chmod +x scripts/maintenance/find-supabase-query-cast-candidates.sh
bash scripts/maintenance/find-supabase-query-cast-candidates.sh
```
Only apply query-casts in files/lines that the compiler flags.
