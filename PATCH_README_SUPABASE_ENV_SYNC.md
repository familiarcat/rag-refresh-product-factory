# Patch: Supabase env sync (local ~/.zshrc -> .secrets/.env.local) + GitHub Secrets sync

## Symptom
`next build` fails with:
`Error: supabaseUrl is required`

This happens when your Supabase client initializes with missing env vars during build-time evaluation.

## What this patch adds
- `scripts/secrets/sync_supabase_from_zshrc.sh`
  - Extracts `export SUPABASE_*=` lines from `~/.zshrc` (does **not** source it)
  - Writes `.secrets/.env.local`
  - Mirrors to repo root `.env.local`

- `scripts/secrets/gh_sync_supabase_secrets.sh`
  - Pushes the same values into GitHub repo secrets using `gh secret set`

## Apply (repo root)
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_supabase_env_sync.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_supabase_env_sync.zip
chmod +x scripts/secrets/sync_supabase_from_zshrc.sh scripts/secrets/gh_sync_supabase_secrets.sh
```

## Local build flow
```bash
bash scripts/secrets/sync_supabase_from_zshrc.sh
npm run -s check:env
npm run -s clean:build:webpack || npm run build
```

## CI/CD flow (recommended)
```bash
bash scripts/secrets/sync_supabase_from_zshrc.sh
set -a; source .env.local; set +a
bash scripts/secrets/gh_sync_supabase_secrets.sh
```

Then in GitHub Actions, expose them:
```yaml
env:
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
  SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
  SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
```

## Notes
- Ensure `.secrets/` and `.env.local` are ignored by git.
- If you store exports in `~/.zshenv`, run: `ZSHRC_PATH=~/.zshenv bash scripts/secrets/sync_supabase_from_zshrc.sh`
