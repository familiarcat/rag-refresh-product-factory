#!/usr/bin/env bash
cat <<'EOF'
If you keep secrets in ~/.zshrc, make sure they are exported like:
  export N8N_WEBHOOK_URL="https://.../sync"
  export N8N_PROJECT_WEBHOOK_URL="https://.../create-project"

Then launch dev from a shell that has those exports loaded:
  source ~/.zshrc
  npm run dev

Note: Next.js reads env at startup; restart dev after changes.
EOF
