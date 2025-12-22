# TypeScript-first Scripts Policy (v3.3)

Goal: keep automation and tooling in TypeScript across the system (Next.js, VS Code extension, MCP server, CLI).

## Canonical scripts
- `scripts/ts/**` (run with `tsx`)
- Bash is allowed only as a *thin wrapper* when shell needs `source` semantics (e.g., exporting dotenv into the current shell).

## Secrets
- Generate secrets file: `pnpm script:secrets:sync`
- Ensure `.env.local` exists: `pnpm script:secrets:ensure`

Wrappers (for shell compatibility):
- `scripts/secrets/load_env.sh` calls the TS ensure script, then `source`s `.env.local`.
- `scripts/secrets/sync_from_zshrc.sh` calls the TS sync script (reads from current process environment; your shell should export values from ~/.zshrc).

## Future backends
To change secrets backend (1Password/SSM/Doppler), replace the TS scripts in `scripts/ts/secrets/` without touching deploy logic.
