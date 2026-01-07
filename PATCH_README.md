# Patch: Repo Hygiene + Proxy Zip + VSCode Extension Branch Sync (v2)

## Install (zip overlay)
1) Copy into repo root:
   cp ~/Downloads/rag-refresh-product-factory_patch_repo_hygiene_v2.zip .

2) Apply with overlay:
   npm run alexai:upgrade -- ./rag-refresh-product-factory_patch_repo_hygiene_v2.zip

3) Append ignores and commit:
   cat .gitignore.append.txt >> .gitignore
   git add .gitignore && git commit -m "chore: repo hygiene ignores"

## Run prune → verify → build
bash scripts/maintenance/prune-verify-build.sh

## Create a clean proxy zip (shareable, excludes node_modules/.next/.git/secrets)
bash scripts/maintenance/make-clean-patch-zip.sh
# Output: .press-logs/rag-refresh-product-factory_proxy_<timestamp>.zip

## VSCode extension branch flow (keeps extension in its own branch, stays in sync)
bash scripts/maintenance/vscode-extension-branch-sync.sh split
bash scripts/maintenance/vscode-extension-branch-sync.sh push
# later, merge back:
bash scripts/maintenance/vscode-extension-branch-sync.sh pull
