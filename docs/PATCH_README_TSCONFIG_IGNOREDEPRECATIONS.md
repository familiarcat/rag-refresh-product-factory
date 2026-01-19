# Patch: Fix `ignoreDeprecations` value for TypeScript 5.9

## Symptom
Next/TypeScript build fails with:
`Type error: Invalid value for '--ignoreDeprecations'.`

This happens when tsconfig.json contains a **future** value like `"6.0"` or a **non-accepted** value like `"5.9"`.

## Fix
Set:

```json
"ignoreDeprecations": "5.0"
```

This keeps TS 5.9 happy while suppressing deprecation warnings.

## Apply (repo root)
```bash
cp ~/Downloads/rag-refresh-product-factory_patch_tsconfig_ignoreDeprecations_fix.zip .

npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_tsconfig_ignoreDeprecations_fix.zip

chmod +x scripts/maintenance/patch-tsconfig-ignoredeprecations.sh
bash scripts/maintenance/patch-tsconfig-ignoredeprecations.sh
```

## Build once (avoid “double build”)
- `npm run alexai:upgrade` already runs a build through `heal-and-build.sh --build`.
- So after upgrade, **don’t immediately run `npm run build` again** unless you’re validating.

If you want a single explicit build step, run this **instead of** `alexai:upgrade`’s build:
```bash
npm run -s clean:build:webpack
```

Backups are saved under `.patch-backups/tsconfig_ignoreDeprecations_*/`.
