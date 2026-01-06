# Supabase import normalization + safer build

This patch adds two maintenance scripts:

- `scripts/maintenance/normalize-supabase-imports.sh`
  - Portable Node-based walker that normalizes *import paths* to:
    - `@/lib/supabase`
    - `@/lib/supabase-server`
    - `@/lib/supabase-browser`

- `scripts/maintenance/next-build-with-timeout.sh [seconds]`
  - Avoids `rm -rf .next` hangs by moving `.next` into `.trash/` first.
  - Runs `npm run build` under `gtimeout`/`timeout` if available.

If you are on macOS and want hard timeouts, install coreutils:

```bash
brew install coreutils
```
