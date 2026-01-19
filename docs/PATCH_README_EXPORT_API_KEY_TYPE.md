# Patch: Export ApiKey types from @/lib/supabase

Fixes build error:
- `Module "@/lib/supabase" has no exported member "ApiKey".`

Some code imports:
```ts
import { supabase, ApiKey } from "@/lib/supabase";
```

This patch adds type-only exports to `lib/supabase.ts`:
- `ApiKey`, `ApiKeyInsert`, `ApiKeyUpdate` derived from `@/types/supabase` table `api_keys`.

## Apply

```bash
cp ~/Downloads/rag-refresh-product-factory_patch_export_api_key_type.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_export_api_key_type.zip

chmod +x scripts/maintenance/patch-export-api-key-type.sh
bash scripts/maintenance/patch-export-api-key-type.sh

npm run build
```

## Note
If your Supabase table is not named `api_keys`, update the table key in the type exports accordingly.
