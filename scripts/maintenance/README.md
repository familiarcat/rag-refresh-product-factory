# Maintenance Scripts

These scripts are **project-local** (bounded context: `rag-refresh-product-factory`) and are intended to support repeatable ops without installing global tooling.

## Scripts

### install-and-build-local.sh
Installs dependencies and builds:
- repo root (Next.js dashboard)
- `./vscode-extension` (if present)

Deterministic behavior:
- Uses `pnpm install --frozen-lockfile` if `pnpm-lock.yaml` exists and `pnpm` is available
- Else uses `npm ci` when `package-lock.json` exists

Run:
```bash
bash scripts/maintenance/install-and-build-local.sh
```

### make-chatgpt-zip.sh
Creates a **small, legible** zip in `~/Downloads` excluding:
- `node_modules`, `.next`, `dist`, `.git`, `.press-logs`, secrets folders

Run:
```bash
bash scripts/maintenance/make-chatgpt-zip.sh
```

### ec2-healthcheck-linux.sh
Linux-only health check meant to be run **on the EC2 host**, not on macOS.

Run on EC2:
```bash
bash scripts/maintenance/ec2-healthcheck-linux.sh
```

## Principles

- `#!/usr/bin/env bash` is used for portability across macOS/Linux/CI; this does **not** make scripts global.
- Large/generated artifacts should never be committed or included in patch zips.
