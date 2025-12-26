# RAG Refresh Product Factory

> A Retrieval Augmented Generation (RAG) system for product information management with crew-based coordination

## 🎯 Overview

This project implements a comprehensive RAG system designed around the Alex AI crew model, featuring:

- **Memory Storage**: Vector-based memory system for storing crew decisions and analysis
- **Processing Engine**: Flexible RAG processor supporting text and image inputs
- **Crew Authorization**: Role-based access control for the AI crew members
- **API Endpoints**: FastAPI-based REST API for system interaction
- **VSCode Integration**: Seamless integration with VSCode for development (Next.js)

## What this is
A Next.js starter that turns the Review Pack into a navigable app **and** includes a minimal RAG endpoint with a feedback loop.

## Run
```bash
npm install
npm run dev
```

## Notes
- RAG retrieval is **TF-IDF** (no external embeddings) so it runs without keys.
- If you add `OPENAI_API_KEY`, `/api/ask` can optionally call a model (see code comment).


## Dependency note
This project pins to **Next 14.2.x + React 18.2** for broad npm compatibility.


## Quick links
- Docs: `/docs/overview`
- Ask: `/ask`
- Diagnostics: `/diagnostics`
- Create: `/create`


## n8n crew integration (optional)
Create a `.env.local` file (not committed) or export env vars in your shell before running `npm run dev`:

- `N8N_WEBHOOK_URL` — webhook to sync categories (returns updated scoring/descriptions)
- `N8N_PROJECT_WEBHOOK_URL` — webhook to create a new project scaffold from a category template

### Secure credentials
This Next.js app intentionally **does not read `~/.zshrc`**.
Instead:
- Export secrets in your terminal session (recommended), or
- Put them in `.env.local`.

Your n8n instance should store sensitive credentials in its own credential store/vault and not require them from the client.


## Setup (recommended)
```bash
rm -rf node_modules package-lock.json .next
npm install
cp .env.local.example .env.local
# edit .env.local — use KEY=value (equals sign), NOT hyphens
npm run dev
```

## Verify env vars
```bash
npm run check:env
# or visit /env
```


## CI/CD
See `docs/DEV_CICD_PLAYBOOK.md` for the local-to-GitHub-to-EC2 workflow.


## Milestones → Supabase RAG
See `docs/MILESTONE_RAG_PLAYBOOK.md`.

## Unified Workflow
See `docs/UNIFIED_WORKFLOW_OVERVIEW.md`.
