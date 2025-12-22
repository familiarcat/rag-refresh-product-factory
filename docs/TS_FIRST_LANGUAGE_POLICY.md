# TypeScript-first Language Policy

We aim to keep this codebase in TypeScript as much as possible (Next.js app, VS Code extension, automation scripts).

## Why Python might still exist
Some legacy prototypes and experiments are currently present as `.py` files. They are not part of the preferred runtime path.

## Preventing fragmentation (enforced)
We enforce a **no-Python-creep** rule:

- `data/python-allowlist.json` contains the currently known `.py` files.
- `scripts/ts/guards/no-python-creep.ts` fails CI/local checks if any **new** `.py` file appears.

Run:
- `pnpm report:python-inventory` to list current python files
- `pnpm check:no-python-creep` to enforce the allowlist

## Migration plan
When a Python utility becomes important, we should:
1) Port it to TypeScript under `scripts/ts/**` (or the appropriate TS runtime area)
2) Remove the `.py` file
3) Update `data/python-allowlist.json`
