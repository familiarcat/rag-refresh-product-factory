# Supabase import unification patch

This patch fixes inconsistencies that were causing build-time failures:

- Adds a real `lib/supabase-server.ts` implementation exporting:
  - `supabaseServer`
  - `checkSupabaseConnection`
  - `getDatabaseStats`
- Standardizes `lib/supabase.ts` as the unified import surface exporting:
  - `supabaseServer`, `supabaseBrowser`, `supabase` (legacy alias)
  - `AuthProfile`, `checkPermission`, `logAudit`
- Adds a portable normalization script:
  - `scripts/maintenance/normalize-supabase-imports.sh`

## Apply via your patch system

```bash
# copy patch into repo root, then:
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_supabase_unify_imports.zip
# or, if you use Downloads auto-apply:
npm run alexai:upgrade:latest
```

## Normalize imports (optional but recommended)

```bash
chmod +x scripts/maintenance/normalize-supabase-imports.sh
bash scripts/maintenance/normalize-supabase-imports.sh
```

## Build

```bash
npm run build
```

Notes:
- `supabaseBrowser` is imported from `@/supabase/browser` (your repo already contains `/supabase/browser.ts`).
- `checkPermission` and `logAudit` are defensive/no-op friendly to keep build green while DB typing stabilizes.
