# Patch: logAudit legacy positional args compatibility

Fixes Next build TS error:
- app/api/auth/api-keys/route.ts: Expected 1 arguments, but got 7.

Your newer `logAudit` helper in `lib/supabase.ts` expects a single object argument,
but some routes still call it using the older positional signature.

This patch updates `lib/supabase.ts` so `logAudit` supports BOTH:
1) logAudit({ userId, action, resource?, metadata? })
2) logAudit(userId, action, resource?, metadata?, ...extra)

## Apply

```bash
cp ~/Downloads/rag-refresh-product-factory_patch_logAudit_legacy_args.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_logAudit_legacy_args.zip
chmod +x scripts/maintenance/patch-logAudit-legacy.sh
bash scripts/maintenance/patch-logAudit-legacy.sh
npm run build
```
