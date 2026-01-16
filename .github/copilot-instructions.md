# AI Copilot Instructions for RAG Refresh Product Factory

## 🎯 Project Overview

This is a **Next.js + FastAPI hybrid system** implementing a Retrieval Augmented Generation (RAG) platform with crew-based AI coordination. The project fuses two architectural layers:

- **Frontend/API Layer**: Next.js 14 app with TypeScript (App Router pattern)
- **RAG Engine**: Python FastAPI service with FAISS vector search and crew authorization
- **Coordination System**: "Alex AI Crew" - Star Trek persona-based decision-making system with Supabase RAG memory

## 🏗️ Critical Architecture Patterns

### Dual-Stack Architecture
- **Never**: Assume files exist in only one language. This is a **Node + Python monorepo**.
- **Key fact**: `/app` and `/lib` are TypeScript/React. `/src` is Python. They communicate via HTTP.
- **API Communication**: Next.js routes call FastAPI endpoints. See [app/api/ask/route.ts](app/api/ask/route.ts#L38) for TF-IDF RAG queries.

### Crew Coordination System
The project uses **persona-based AI coordination** (not generic LLM chains):

```
Captain Picard (🎖️) → Strategic decisions, architecture
Commander Riker (⚡) → Tactical execution, cross-project sync
Commander Data (🤖) → RAG, algorithms, technical analysis
Lt. Cmdr. La Forge (🔧) → Infrastructure, CI/CD, Terraform
Worf (⚔️) → Security, authentication, testing
Dr. Crusher (💊) → System health, diagnostics, docs
Quark (💰) → Cost analysis, ROI, optimization
```

**Key file**: [.cursorrules](.cursorrules) - defines crew specialties and workflow patterns.

### Memory Integration
- Crew decisions stored in **Supabase RAG** (vector embeddings + PostgreSQL)
- Accessed via: `/api/crew/collaborate?action=memories`
- Memories inform future decisions via [lib/orchestration/rag-memory-integration.ts](lib/orchestration/rag-memory-integration.ts)
- **Pattern**: Query past crew decisions → enhance assignments → store new learning

## 🔧 Developer Workflows

### Build & Run
```bash
npm install                 # Install Node deps
poetry install             # Install Python deps
npm run dev               # Start Next.js (port 3000)
poetry run python -m src.rag_factory.server  # Start FastAPI (port 8000)
npm run type-check        # TypeScript validation
```

### Environment Setup
- **Critical**: Never hardcode secrets. Use `.env.local` (not committed).
- Run `npm run check:env` to validate required vars.
- AWS credentials via `.secrets/` directory or shell exports (not ~/.zshrc).

### Deployment Philosophy
**All deployments through GitHub Actions** - never local scripts. See CI/CD commands:
```bash
npm run milestone          # Commit + push to Supabase RAG
npm run alexai:ship:all  # Full heal: git sanitize + TS fixes + build + milestone
```

### Testing
```bash
npm run ci:verify         # Full CI checks: clean + env + type-check + lint
poetry run pytest tests/ -v  # Python tests
```

## 📂 Key Directories & Their Purpose

| Path | Purpose | Tech Stack |
|------|---------|-----------|
| `/app/api` | REST endpoints, crew collaboration | Next.js TypeScript |
| `/lib/alex-ai` | Crew system, collaboration engine | TypeScript |
| `/lib/orchestration` | RAG memory queries, crew assignments | TypeScript + Supabase |
| `/src/rag_factory` | RAG engine, file ops, embeddings | Python FastAPI |
| `/scripts` | Deployment, maintenance, milestones | Bash |
| `/infra` | AWS infrastructure as code | Terraform |

## 🧠 Project-Specific Patterns

### 1. RAG Without External Embeddings
- Uses **TF-IDF** (not OpenAI embeddings) for retrieval
- FAISS for vector similarity
- Works offline; optional OpenAI integration for generation
- See [lib/rag/](lib/rag/) for index building

### 2. Natural Language Commands
The system interprets natural language for deployment:
```
"make a milestone push"          → Run milestone script
"deploy" or "make a milestone push and deploy" → Git push + GitHub Actions trigger
"have Riker coordinate"          → Crew collaboration session
```

### 3. Bidirectional Learning
Claude Code actions logged to RAG via `ClaudeCodeObserver`. Crew queries Claude's history.
- Flow: Claude implementation → RAG store → Crew analysis → Applied back to codebase
- See [BIDIRECTIONAL_INTEGRATION_README.md](BIDIRECTIONAL_INTEGRATION_README.md)

### 4. Cost-Optimized Crew Activation
Quark (💰) analyzes ROI; crew activated only when justified.
- Endpoint: `/crew/orchestrate` (Python API)
- Pattern: Picard complexity analysis → Quark cost check → Minimal crew selection

## ⚠️ Common Pitfalls & Solutions

| Problem | Solution |
|---------|----------|
| **TypeScript strict mode off** | Don't force types. Project uses `"strict": false` for pragmatism. Focus on runtime checks. |
| **Dual-stack confusion** | Always check file extension: `.ts` = Node, `.py` = Python. HTTP bridges them. |
| **Missing RAG context** | Query `/api/crew/collaborate` first before assigning crew tasks. |
| **Build timeouts** | Check `.next` cache. Use `npm run clean` before rebuilds. |
| **env vars missing** | Run `npm run check:env` and verify against `.env.local.example`. |

## 🎯 When Implementing Features

1. **Identify the layer**: Frontend (Next.js) vs. RAG engine (FastAPI)?
2. **Check for crew context**: Does this task benefit from past crew memories? Query RAG first.
3. **Follow persona patterns**: Security → ask Worf. Infrastructure → ask La Forge.
4. **Store decisions in RAG**: After implementation, log to crew memories for future reference.
5. **Verify with CI**: Never assume local builds work. Run `npm run ci:verify`.

## 📋 Critical Files to Understand

- [.cursorrules](.cursorrules) - Crew system definition & workflow
- [README.md](README.md) - Project overview & quick links
- [lib/alex-ai/crew/collaboration-engine.ts](lib/alex-ai/crew/collaboration-engine.ts) - Crew roster & skills
- [src/rag_factory/api/endpoints.py](src/rag_factory/api/endpoints.py) - RAG API surface
- [lib/orchestration/rag-memory-integration.ts](lib/orchestration/rag-memory-integration.ts) - Memory queries for crew
- [package.json](package.json#L6-L46) - All deployment & ship commands

## 🚀 Next Steps for New AI Agents

1. Read `.cursorrules` to understand the crew model
2. Familiarize yourself with `/lib/alex-ai/` crew system
3. Check recent RAG memories via `/api/crew/collaborate?action=memories`
4. Identify which crew member specializes in your task
5. Query their expertise from RAG before starting
6. Implement with CI/CD in mind (always runs through GitHub Actions)
