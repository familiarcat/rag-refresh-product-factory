# Milestone → Supabase RAG Playbook

Goal:
- Every developer can run a **milestone push** that generates a human-readable artifact locally,
  ingests it into Supabase (for shared RAG), and avoids repo bloat by pruning local artifacts after 14 days.

## One-time setup

1) Put exports in your `~/.zshrc` (or preferably `~/.zshenv`):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- (optional) `OPENAI_API_KEY`, `OPENAI_EMBED_MODEL`
- `AWS_REGION`, `AWS_ACCOUNT_ID`, `ECR_REPO`, `AWS_ROLE_TO_ASSUME`
- `EC2_HOST`, `EC2_USER`
- `N8N_WEBHOOK_URL`, `N8N_PROJECT_WEBHOOK_URL`

2) Generate local env files:
```bash
npm run secrets:sync
npm run check:env
```

This creates:
- `.secrets/.env.local` (gitignored)
- `.env.local` (gitignored; used by Next.js server-side + scripts)

## Milestone push (shared dev journal)

```bash
npm run milestone -- "Implement sidebar categories dashboard"
```

This will:
- create `milestones/<timestamp>__<slug>.md`
- upload milestone + chunks to Supabase
- (optional) add embeddings if `OPENAI_API_KEY` is set
- commit & push your code changes

## Pruning (keep repo clean)

Manual:
```bash
npm run milestone:prune
```

Automated:
- GitHub Actions runs `.github/workflows/prune_milestones.yml` daily.
- It deletes only if Supabase ingestion is confirmed and logs a 'pruned' event.

## CI/CD secrets

Sync allowlisted variables to GitHub Secrets:
```bash
npm run secrets:gh
```

Also add manually:
- `EC2_SSH_PRIVATE_KEY`
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must exist for the prune workflow.
