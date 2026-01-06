# Next.js Product Factory (AI-assisted) — Best Practices

This section is designed to be converted into a Next.js App Router project.

## Content architecture
- Keep durable knowledge in **MD/MDX** and load it as content routes (good for AI + humans).
- Use a single, predictable route tree with layouts for navigation and shared UI.
- Prefer server-side rendering / RSC where possible; keep client components only where needed.

## Reliable RAG in production (2025)
- Add evaluation suites and quality gates (CI/CD) before scaling usage.
- Instrument tracing/telemetry for every request (retrieval trace + citations + latency).
- Operate refresh as a first-class workflow (staleness is the enterprise killer).

## Evals & observability workflow
- Trace → evaluate → iterate: treat prompts/retrieval like code you can test.
- Run offline evals on fixed test sets, and run online monitoring for drift.

## Practical guidance for this project
- Use the Review Pack content as `content/` in a Next.js app.
- Add an `/api/ask` route that returns: `{answer, citations, trace}`.
- Add a `/diagnostics` page showing recent requests + failures (the demo wedge).

## Sources
- Next.js MDX guide
- Next.js routing docs
- MDN `<base>` element (for understanding link base behavior)
- Recent RAG observability + evals writeups (Langfuse and “Production RAG in 2025”)
