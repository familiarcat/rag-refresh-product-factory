# Patch: api-keys route result.record name vs label

Fixes TS build error:
- `Property 'name' does not exist on type ApiKey Row` at result.record.name.

This patch updates `app/api/auth/api-keys/route.ts` to use `label` with safe fallback:
- `name: result.record.name` -> `name: (result.record as any).label`

## Apply
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_api_keys_result_record_name_label.zip .
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_api_keys_result_record_name_label.zip

chmod +x scripts/maintenance/patch-api-keys-route-result-name-label.sh
bash scripts/maintenance/patch-api-keys-route-result-name-label.sh

npm run build
```
