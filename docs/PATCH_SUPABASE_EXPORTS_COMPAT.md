# Patch: Supabase Export Compatibility

This patch updates `lib/supabase/index.ts` to export:
- `supabaseServer`
- `supabaseBrowser`
- `supabase` (alias of `supabaseServer` for back-compat)
- `checkPermission`, `logAudit`, `AuthProfile` (minimal compat for older auth middleware)

Why:
Some modules still import `{ supabase }` from `@/lib/supabase`. The newer
`lib/supabase` module previously exported only `supabaseServer` / `supabaseBrowser`,
causing Next/TS build failures.

After applying:
- Prefer: `import { supabaseServer } from "@/lib/supabase";`
- Legacy still works: `import { supabase } from "@/lib/supabase";`
