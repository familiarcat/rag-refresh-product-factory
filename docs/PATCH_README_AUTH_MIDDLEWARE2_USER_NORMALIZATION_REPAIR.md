# Patch: Repair middleware 2 user normalization (fix 'used before declaration')

Fixes TS error:
- `Block-scoped variable '_user' used before its declaration`

Cause: a prior injected block created a self-referential `const _user = { ...(_user as any)... }`
or referenced `_user` before it existed.

Fix: remove the injected block and instead wrap the return's `user:` value inline:
`user: ({ user_id: ((_user as any)?.user_id ?? ""), ...(_user as any) } as any)`

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_auth_middleware2_user_normalization_repair.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_auth_middleware2_user_normalization_repair.zip

chmod +x scripts/maintenance/patch-auth-middleware2-user-normalization-repair.sh
bash scripts/maintenance/patch-auth-middleware2-user-normalization-repair.sh

npm run build
```
