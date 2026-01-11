# Patch: Export `supabaseBrowser` from `@/lib/supabase`

## Symptom
Build fails with:
`Module "@/lib/supabase" declares 'supabaseBrowser' locally, but it is not exported.`
at `lib/supabase-browser.ts:1:10`

## Fix
Ensures your canonical Supabase barrel exports:
- `supabaseBrowser`
- `supabaseServer`
- legacy `supabase` alias (server default)

This keeps imports consistent across:
- `@/lib/supabase-browser.ts`
- API routes / middleware

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_export_supabaseBrowser.zip .

npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_export_supabaseBrowser.zip

chmod +x scripts/maintenance/patch-export-supabaseBrowser.sh
bash scripts/maintenance/patch-export-supabaseBrowser.sh

npm run -s clean:build:webpack || npm run build
```

## Why you see build twice
Your `alexai:upgrade` wrapper calls `heal-and-build.sh --build`, and then you manually run `npm run build` again.
After applying the patch, run **only one** build command (prefer `npm run -s clean:build:webpack`).
