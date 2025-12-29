# Dev + CI/CD Playbook (ECR → EC2)

This repo includes a secure workflow to keep secrets out of git while enabling end-to-end deployment.

## Local development (Cursor terminal)

1) Install
```bash
rm -rf node_modules package-lock.json .next
npm install
```

2) Generate secure envs from your `~/.zshrc` exports (allowlisted keys only)
```bash
./scripts/secrets/sync_from_zshrc.sh
```

3) Use generated envs locally
```bash
cp .secrets/.env.local .env.local
npm run check:env
npm run dev
```

## GitHub Actions secrets (private)

Prereqs: install GitHub CLI and login:
```bash
gh auth login
```

Sync allowlisted values into GitHub Secrets:
```bash
./scripts/secrets/gh_sync_secrets.sh
```

Also add these secrets manually in GitHub:
- `AWS_ROLE_TO_ASSUME` (OIDC role)
- `EC2_SSH_PRIVATE_KEY` (private key for SSH deploy)

## Deployment

Push to `main` → GitHub Actions builds/pushes image to ECR → SSH to EC2 → pulls image → restarts `docker compose` using `docker/compose.ec2.yml`.

## Security notes

- `.secrets/` is gitignored
- `.env.local` is gitignored
- Prefer putting automation exports in `~/.zshenv` (non-interactive) if your `.zshrc` is interactive-heavy
