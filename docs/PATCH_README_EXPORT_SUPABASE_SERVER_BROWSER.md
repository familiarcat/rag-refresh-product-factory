# Patch: Export supabaseServer + supabaseBrowser from `@/lib/supabase`

## Symptom
Build fails with:
`Module "@/lib/supabase" declares 'supabaseBrowser' locally, but it is not exported.`
from `lib/supabase-browser.ts`.

## Fix
Updates `lib/supabase.ts` to explicitly export:
- `supabaseServer`
- `supabaseBrowser`
and keeps legacy:
- `supabase` (alias to supabaseServer)

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_export_supabaseServerBrowser_from_lib_supabase.zip .

npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_export_supabaseServerBrowser_from_lib_supabase.zip

chmod +x scripts/maintenance/patch-export-supabase-server-browser.sh
bash scripts/maintenance/patch-export-supabase-server-browser.sh

npm run -s clean:build:webpack || npm run build
```

Backups are written to `.patch-backups/export_supabase_server_browser_*/`.
