# RAG Refresh Product Factory

## What is the Product Factory?

The RAG Refresh Product Factory is a **meta-application** that generates, manages, and orchestrates domain-driven projects. Think of it as a starship that launches shuttlecraft—each project is a self-contained vessel with its own mission, crew, and destination.

## Architecture Philosophy

### This Application = The Factory

This application serves as the **project generation platform**. It provides:

- **Project Creation Wizard** — Multi-path project scaffolding (Conceptualize, Structured, Rapid)
- **Domain Templates** — Pre-configured category/domain structures for new projects
- **Crew Orchestration** — AI agents that assist with project generation and maintenance
- **RAG Memory** — Institutional knowledge that informs future project decisions

### Generated Projects = Domain-Driven Applications

Each project created by the factory follows **Domain-Driven Design (DDD)** principles:

```
Generated Project Structure:
├── domains/                    # Bounded Contexts (Categories)
│   ├── core/                   # Core Domain
│   │   ├── entities/
│   │   ├── value-objects/
│   │   └── services/
│   ├── supporting/             # Supporting Domains
│   └── generic/                # Generic Subdomains
├── docs/                       # Project-Specific Documentation
│   ├── architecture.md
│   ├── domains.md
│   └── decisions/              # ADRs
├── content/                    # Domain Content/Knowledge
└── crew-members/               # Project-Specific AI Agents
```

## The Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCT FACTORY                          │
│  (This Application - Meta Level)                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Factory Docs        │ Categories = Project Templates    ││
│  │ - Overview          │ - AI Observability                ││
│  │ - Best Practices    │ - Enterprise RAG                  ││
│  │ - Architecture      │ - Knowledge Systems               ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ │
│  │ Project A       │ │ Project B       │ │ Project C     │ │
│  │ ┌─────────────┐ │ │ ┌─────────────┐ │ │ ┌───────────┐ │ │
│  │ │ Domains     │ │ │ │ Domains     │ │ │ │ Domains   │ │ │
│  │ │ - Users     │ │ │ │ - Products  │ │ │ │ - Events  │ │ │
│  │ │ - Auth      │ │ │ │ - Orders    │ │ │ │ - Venues  │ │ │
│  │ │ - Billing   │ │ │ │ - Inventory │ │ │ │ - Artists │ │ │
│  │ └─────────────┘ │ │ └─────────────┘ │ │ └───────────┘ │ │
│  │ Docs (Project)  │ │ Docs (Project)  │ │ Docs (Proj)  │ │
│  └─────────────────┘ └─────────────────┘ └───────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Categories = Domain Templates

At the factory level, **Categories** represent potential project types or domain templates:

| Category | Domain Focus | Example Projects |
|----------|-------------|------------------|
| AI Observability | Tracing, diagnostics, SRE | Monitoring dashboards, alert systems |
| Enterprise RAG | Retrieval, knowledge | Documentation search, Q&A systems |
| Knowledge Governance | Refresh cycles, audit | Compliance systems, content management |
| Platform Engineering | IaC, deployment | DevOps tools, infrastructure templates |

When you create a new project, the selected category informs the **initial domain structure**.

## Crew at Each Level

### Factory Crew (This App)
- **Picard** — Strategic project direction
- **Riker** — Project execution and deployment
- **Data** — Technical architecture decisions
- **Troi** — User experience and psychology
- **La Forge** — Infrastructure and engineering
- **O'Brien** — Practical implementation

### Project Crew (Generated Projects)
Each project can inherit the full crew or a subset relevant to its domain.

## Next Steps

1. **Create a Project** — Use the [Create](/create) wizard to scaffold a new domain-driven project
2. **Explore Categories** — Browse [Categories](/categories) to understand available domain templates
3. **Consult the Crew** — [Ask](/ask) the crew for guidance on project decisions
