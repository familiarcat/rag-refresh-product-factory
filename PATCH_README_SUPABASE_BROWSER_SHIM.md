# Patch: Supabase browser/server shims

Fixes build error:
- Module not found: Can't resolve '@/supabase/browser'

Adds:
- `supabase/browser.ts` -> re-exports from `@/lib/supabase/browser`
- `supabase/server.ts` -> re-exports from `@/lib/supabase/server` (optional convenience)

## Apply

```bash
cp ~/Downloads/rag-refresh-product-factory_patch_supabase_browser_shim.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_supabase_browser_shim.zip
npm run build
```
