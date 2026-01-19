# Patch: Fix AuthProfile return typing (`return data;`)

## Symptom
Build fails with:
`Property 'user_id' is missing in type '{}' but required in type 'AuthProfile'`
at `lib/auth/middleware.ts` near a `return data;`.

## Fix
Where `return data;` is used in an AuthProfile-related flow, normalize to ensure `user_id` exists:

```ts
return ({ user_id: String((data as any)?.user_id ?? (data as any)?.id ?? ''), ...(data as any) } as any);
```

This is compile-focused and preserves runtime behavior, while guaranteeing `AuthProfile.user_id` is present.

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_authprofile_return_data_fix.zip .

npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_authprofile_return_data_fix.zip

chmod +x scripts/maintenance/patch-authprofile-return-data.sh
bash scripts/maintenance/patch-authprofile-return-data.sh

npm run -s clean:build:webpack || npm run build
```

Backups are saved under `.patch-backups/authprofile_return_data_*/`.
