# Supabase Canonical Client Patch

This patch adds canonical Supabase client modules and maintenance scripts:

- lib/supabase-server.ts
- lib/supabase-browser.ts
- scripts/maintenance/dedupe-lib-supabase.sh
- scripts/maintenance/fix-imports-supabase.sh
- scripts/maintenance/validate-supabase-imports.sh

## Apply

1) Copy the zip into repo root (or use your Downloads-to-repo overlay flow)
2) Apply patch overlay using your existing upgrade script:
   bash scripts/maintenance/upgrade-and-verify.sh ./rag-refresh-product-factory_patch_supabase_heal.zip

## Run (in order)

npm run secrets:sync
bash scripts/maintenance/dedupe-lib-supabase.sh
bash scripts/maintenance/fix-imports-supabase.sh
bash scripts/maintenance/validate-supabase-imports.sh
npm run build
