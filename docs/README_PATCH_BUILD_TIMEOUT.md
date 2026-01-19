# Patch: Build timeout + escape (Next.js)

This patch fixes the "build hangs and can't be escaped" problem by:

- running the build in its own **process group**
- killing the **entire process tree** on timeout or Ctrl+C
- printing a **heartbeat** every 30 seconds so you know it’s still alive
- adding an optional safe `.next` mover that won’t hang your terminal

## Install (zip overlay)

From repo root:

```bash
# 1) copy the patch zip into repo root
cp ~/Downloads/rag-refresh-product-factory_patch_build_timeout_escape.zip .

# 2) apply via your standard overlay process
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_build_timeout_escape.zip
```

## Use

```bash
# optional: avoid rm -rf hangs by moving .next safely
bash scripts/maintenance/safe-trash.sh .next

# run a build with a hard timeout (default 900s)
bash scripts/maintenance/next-build-with-timeout.sh 900

# if you suspect Turbopack is the hang, force webpack
bash scripts/maintenance/next-build-with-timeout.sh 900 --webpack
```

## If the terminal is stuck already

In another terminal:

```bash
# kill any running next build processes
pkill -f "next build" || true
pkill -f "next-server" || true
```
