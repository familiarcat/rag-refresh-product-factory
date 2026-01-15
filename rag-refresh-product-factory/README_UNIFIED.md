# RAG Refresh Product Factory

A **Next.js + TypeScript** product factory for building and maintaining RAG-ready “review packs” (sitemaps, project docs, structured content) with an **AlexAI crew orchestration** layer and a **bidirectional VS Code extension ↔ web dashboard** workflow.

---

## What this repo is for

This project is set up to help you:

- **Model a product/site/project** as a structured hierarchy (projects → domains → pages/assets → notes).
- Generate / maintain **review packs** (docs, sitemaps, architecture notes, milestones).
- Run **RAG-style retrieval + feedback loops** against that content (local-first by default; optional model providers).
- Use the **AlexAI “crew”** to coordinate analysis, CRUD operations, and orchestration across the app + extension.

> **Local-first default:** several features are designed to run without external API keys; provider-backed LLM calls are optional and gated by env.

---

## Primary goals (inferred from the codebase + docs)

1. **Single source of truth** for product/project documentation (markdown + structured entities).
2. **Crew-driven workflows**: define roles, run drills/orchestration, persist outcomes, and rehydrate context.
3. **Bidirectional UX** between:
   - a web UI (the “factory” dashboard), and
   - a VS Code extension (developer cockpit).
4. **Operational readiness**: scripts, infra scaffolding, and deployment guidance to keep the system shippable.

---

## LLM billing posture (OpenRouter-first)

**North star:** AlexAI should be **provider-agnostic** and **bill only through OpenRouter**.

What that means in practice:

- Treat **OpenRouter** as the single billing gateway for all model calls (even when the underlying model is from OpenAI/Anthropic/etc.).
- In production, prefer **only** `OPENROUTER_API_KEY` (and related OpenRouter config) — avoid managing separate vendor keys unless you have an explicit exception.
- Route “crew” work through **n8n orchestration** so each prompt/query can be attributed to:
  - a **crew member** (role), a **workflow**, and a **cost center**, and
  - a tracked **token + cost** record.

Where this shows up in the repo:

- `lib/llm/openrouter-client.ts` — OpenRouter client (core abstraction)
- `n8n-workflows/` — orchestration flows (the “crew” control plane)
- `app/api/n8n/track-usage/route.ts` — usage + cost tracking endpoint (OpenRouter + crew attribution)
- `app/api/n8n/cost-optimize/route.ts` — recommendation logic for cost balancing / model tier selection

**Operating rule:** if you see a direct vendor SDK/key being added (OpenAI/Anthropic/etc.), treat it as a temporary dev convenience — the durable path is **OpenRouter**.


---

## Key capabilities

### Web app (Next.js)
Common entry points you’ll use:
- `/ask` — RAG-style “ask” UI
- `/projects` — project list + project detail views
- `/sprints` — sprint planning + sprint zero generation
- `/crew` — crew roster + per-member pages
- `/observation-lounge` — orchestration hub / narrative console
- `/diagnostics` and `/env` — sanity checks

### API routes (Next.js route handlers)
Representative endpoints (see `app/api/**`):
- `POST /api/ask` (+ provider variants like `/api/ask/gemini`)
- `/api/projects/*`, `/api/sprints/*`, `/api/stories/*`
- `/api/crew/*` (execute, orchestrate, drill, metrics, collaborate)
- `/api/tools/filesystem` (file-system tooling surface for the crew)

### Crew / content
- Crew definitions and role context live under `crew-members/` and related docs.
- Content packs and structured narrative content live under `content/`, `milestones/`, and `docs/`.

---

## Repository structure (high level)

```
app/                Next.js App Router pages + API routes
components/         Shared UI components
content/            Content packs (overview/timeline/portfolio/etc.)
crew-members/       Crew definitions, personas, and role context
docs/               Project documentation (canonical docs + archives)
infra/              Infrastructure scaffolding (Terraform, etc.)
docker/             Docker-related configs and helpers
mcp-server/         MCP server implementation (if enabled in your flow)
n8n-workflows/      n8n flows (importable JSON)
scripts/            One-off + operational scripts (bootstrap, deploy, checks)
supabase/           Supabase config/migrations (if used in your deployment)
tests/              Test suite
vscode-extension/   VS Code extension for bidirectional integration
```

---

## Quick start

```bash
# 1) install
npm install

# 2) validate env (safe to run even before adding keys)
npm run check:env

# 3) run the web app
npm run dev
```

Useful pages after boot:
- http://localhost:3000/diagnostics
- http://localhost:3000/env
- http://localhost:3000/ask

---

## Scripts you’ll actually use

- `npm run dev` — next dev
- `npm run build` — next build
- `npm run start` — next start
- `npm run lint` — next lint
- `npm run check:env` — node scripts/check-env.mjs
- `npm run dev:check` — npm run check:env && next dev
- `npm run secrets:sync` — bash scripts/secrets/sync_from_zshrc.sh && cp .secrets/.env.local .env.local
- `npm run secrets:gh` — bash scripts/secrets/gh_sync_secrets.sh
- `npm run milestone` — bash scripts/milestone/run_milestone.sh
- `npm run milestone:prune` — node scripts/milestone/prune_local.mjs
- `npm run doctor` — bash scripts/bootstrap/doctor.sh
- `npm run bootstrap:init` — bash scripts/bootstrap/init_repo.sh
- `npm run bootstrap:setup` — bash scripts/bootstrap/unify_setup.sh
- `npm run infra:init` — cd infra && terraform init
- `npm run infra:apply` — cd infra && terraform apply
- `npm run infra:plan` — cd infra && terraform plan

---

## Secrets & credentials

This repo includes a strong bias toward **not committing secrets** and instead syncing them from local shell/env into safe `.env` files and/or GitHub secrets.

Start with:
- `AWS_CREDENTIAL_SETUP_GUIDE.md`
- `docs/VSCODE_SETUP.md`
- `QUICK_START_SYNC_TESTING.md`

---

## Deployment / infra (overview)

You have multiple supported execution paths depending on how you deploy:
- **Local dev**: `npm run dev`
- **Containerized / EC2** (see `docker/` + deployment docs)
- **Terraform-backed infra** (see `infra/` scripts and guides)

The deploy docs are intentionally “crew-oriented” and include health/check sequencing guidance.

---

## Documentation


### Applying this docs patch safely

If you’re using the patch ZIP, run:

```bash
bash scripts/patch/apply-docs-patch.sh path/to/rag-refresh-product-factory_patch_docs_v2.zip
```

It will:
- show a **dry-run** summary of what will change
- create a timestamped backup under `.patch-backups/`
- then overlay the patch files into your working tree


- **Canonical doc map:** see [`DOCS_INDEX.md`](./DOCS_INDEX.md)
- Many docs are also rendered through the app route: `/docs/[slug]`

### Archive policy
Docs that were duplicates (e.g., “` 2.md`” files) are preserved under:
- `docs/.archive/duplicates/`

Nothing was thrown away; duplicates were relocated so the canonical docs are easier to navigate.

---

## How this README was produced

This README was generated by scanning the file system and consolidating the markdown docs into a single coherent entry point (while preserving historical duplicates under `docs/.archive/`).
