# Patch: Step 1 — stabilize build by fixing getUserId typing + introduce canonical userId helper + tools to remove duplicates

This patch does **three** safe, additive things:

1) Fixes `lib/auth/middleware 2.ts` getUserId() return typing by casting `authResult.user.id` (unknown) to string.
2) Adds a canonical helper at `lib/auth/user-id.ts`:
   - `normalizeUserId(user)`
   - `requireUserId(user)`
3) Adds duplicate-file tools:
   - `scripts/maintenance/find-duplicate-2-files.sh`
   - `scripts/maintenance/quarantine-duplicate-2-files.sh` (non-destructive; moves to `.trash/...`)

## Apply

```bash
cp ~/Downloads/rag-refresh-product-factory_patch_userid_unify_and_dedupe_step1.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_userid_unify_and_dedupe_step1.zip

chmod +x scripts/maintenance/patch-middleware2-getUserId-cast-v2.sh
bash scripts/maintenance/patch-middleware2-getUserId-cast-v2.sh
```

## Find dupes (recommended)

```bash
chmod +x scripts/maintenance/find-duplicate-2-files.sh
bash scripts/maintenance/find-duplicate-2-files.sh
```

## Quarantine dupes (recommended once you confirm they're not needed)

```bash
chmod +x scripts/maintenance/quarantine-duplicate-2-files.sh
bash scripts/maintenance/quarantine-duplicate-2-files.sh
```

## Then rebuild

```bash
npm run build
```

## Next step (after duplicates are quarantined)

Run a codemod to replace patterns like:
- `user.id`
- `user.user_id`
- `authResult.user?.id`
with `requireUserId(user)` or `normalizeUserId(user)` depending on context.

I can generate that as Step 2 once the build passes this stage.
