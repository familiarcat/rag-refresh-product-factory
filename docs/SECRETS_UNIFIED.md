# Unified Secrets + Model Selection + Filesystem Tool (v3)

## Secrets
All scripts source `scripts/secrets/load_env.sh`. The backend is currently `sync_from_zshrc.sh` using an allowlist.

## Filesystem Tool (Next.js)
POST `/api/tools/filesystem` with operations: `readFile`, `writeFile`, `applyPatch`, `listDir`, `ensureDir`.
Paths are sandboxed to: workspace, projects, data, docs, src, app, vscode-extension, lib.

## OpenRouter Model Selection
Shared policy lives in:
- `data/model-policy.json`
- `data/llm-cost-database.json`

Next.js selector: `lib/llm/model-selector.ts`
MCP selector: `mcp-server/model-selector.mjs`

Goal: every OpenRouter call should select a model through these selectors.
