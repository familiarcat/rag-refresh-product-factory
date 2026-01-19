# Build timeout + escape patch

This patch replaces `scripts/maintenance/next-build-with-timeout.sh` with a version that:

- runs `next build` in its **own process group**
- **kills the whole process tree** on timeout
- **kills the whole process tree** on Ctrl+C
- avoids macOS hangs when removing `.next` by **moving** it into `.trash/…` first

## Install via your patch framework

1) Copy the zip to repo root

2) Apply overlay:

```bash
npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_build_timeout_escape.zip
```

## Usage

```bash
# default 900s
bash scripts/maintenance/next-build-with-timeout.sh

# custom timeout
bash scripts/maintenance/next-build-with-timeout.sh 1200

# attempt webpack mode (disable Turbopack via env)
bash scripts/maintenance/next-build-with-timeout.sh 1200 --webpack
```

If you still experience hangs, run this once to confirm file ownership is sane:

```bash
# from repo root
sudo chown -R "$(id -un)":"$(id -gn)" .
```

(Prefer fixing ownership once over adding `sudo` into build scripts.)
