# Patch: Export supabaseServer from lib/supabase.ts

Fixes build error:
- `Attempted import error: 'supabaseServer' is not exported from '@/lib/supabase'`
- `Module '@/lib/supabase' declares 'supabaseServer' locally, but it is not exported.`

This patch minimally edits `lib/supabase.ts` so `supabaseServer` (and `supabaseBrowser` if present) are exported.

## Apply

```bash
cp ~/Downloads/rag-refresh-product-factory_patch_export_supabase_server.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_export_supabase_server.zip

chmod +x scripts/maintenance/patch-export-supabase-server.sh
bash scripts/maintenance/patch-export-supabase-server.sh

npm run build
```
