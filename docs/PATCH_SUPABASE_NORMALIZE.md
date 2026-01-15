# Supabase Import Normalization Patch (Final)

This patch makes Supabase usage deterministic by enforcing a single canonical export surface:

```
lib/supabase/
  index.ts
  server.ts
  browser.ts
```

## What it does
- Creates `lib/supabase/server.ts` and `lib/supabase/browser.ts`
- Creates `lib/supabase/index.ts` barrel export
- Removes legacy files:
  - `lib/supabase.ts`
  - `lib/supabase-server.ts`
  - `lib/supabase-browser.ts`
  - `lib/supabase 2.ts`
- Adds `alexai:ts:heal` to `package.json`

## Apply (recommended)
From repo root:

1) Copy zip into repo root (or Downloads then copy):
   `cp ~/Downloads/rag-refresh-product-factory_patch_supabase_normalize_final.zip .`

2) Overlay it using your patch process:
   `bash scripts/maintenance/upgrade-and-verify.sh ./rag-refresh-product-factory_patch_supabase_normalize_final.zip`

3) Apply chmod + package.json patch:
   `bash scripts/maintenance/apply-supabase-normalization-patch.sh`

## Run
`npm run alexai:ts:heal`

If it fails, it will print the exact files still importing:
- `@/lib/supabase-server`
- `@/lib/supabase-browser`

Update those imports to:
- `import { supabaseServer } from '@/lib/supabase'`
- `import { supabaseBrowser } from '@/lib/supabase'`
