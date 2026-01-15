# Patch: Build Timeout + Escape (Next.js)

This patch fixes the "build hangs and can't be escaped" issue by replacing your `scripts/maintenance/next-build-with-timeout.sh` with a version that:

- Runs `next build` in its **own process group**
- Enforces a **hard timeout** and kills the **entire process tree**
- Ensures **Ctrl+C** also kills the whole build tree
- Optionally forces **webpack** mode to bypass Turbopack
- Writes build output to a log so you always get feedback

It also adds `scripts/maintenance/safe-trash.sh` to safely move `.next` (or anything) into `.trash` without hanging.

## Install (via your zip overlay)

1) Copy the zip to your repo root:

```bash
cp /path/to/rag-refresh-product-factory_patch_build_timeout_escape.zip .
```

2) Apply with your standard overlay:

```bash
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_build_timeout_escape.zip
```

## Use

### Fast: build with a hard timeout

```bash
bash scripts/maintenance/next-build-with-timeout.sh 900
```

### Force webpack (recommended while Turbopack is suspect)

```bash
bash scripts/maintenance/next-build-with-timeout.sh 900 --webpack
```

### If `.next` delete/move hangs

```bash
bash scripts/maintenance/safe-trash.sh .next 30
```

## Notes

- Logs are written to: `.press-logs/next-build_YYYYmmdd_HHMMSS.log`
- If the build is killed, the last ~200 lines are printed to the terminal.
