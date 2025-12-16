# Categories as Domain Templates

## From Categories to Domains

In the Product Factory model, **Categories** serve dual purposes:

1. **At the Factory Level** — Categories are project templates that define initial domain structures
2. **At the Project Level** — Categories become **Domains** (Bounded Contexts in DDD terminology)

## Domain-Driven Design Alignment

### Ubiquitous Language

Each category/domain should have its own **ubiquitous language**—a shared vocabulary between technical and business stakeholders:

```
Category: AI Observability
├── Ubiquitous Language:
│   ├── Trace — A complete request lifecycle
│   ├── Span — A unit of work within a trace
│   ├── Metric — A quantitative measurement
│   └── Alert — A notification of anomaly
```

### Bounded Contexts

When a project is generated, each domain becomes a **bounded context** with:

- Clear boundaries
- Own data models
- Defined interfaces to other contexts
- Independent evolution

## Category → Domain Mapping

| Factory Category | Project Domain | Bounded Context |
|-----------------|----------------|-----------------|
| AI Observability | `observability/` | Traces, Metrics, Alerts |
| Enterprise RAG | `knowledge/` | Documents, Embeddings, Retrieval |
| Knowledge Governance | `governance/` | Policies, Audits, Refresh Cycles |
| Platform Engineering | `platform/` | Infrastructure, Deployment, Config |

## Creating New Categories

New categories can be added to the factory to serve as templates for new project types:

```json
{
  "slug": "event-driven-architecture",
  "name": "Event-Driven Architecture",
  "tagline": "Async messaging, event sourcing, CQRS",
  "domains": [
    { "name": "events", "type": "core" },
    { "name": "commands", "type": "core" },
    { "name": "projections", "type": "supporting" }
  ],
  "crew": ["data", "la_forge", "obrien"]
}
```

## Project-Specific Domains

Once a project is created, its domains can evolve independently:

```
Generated Project: DJ Studio Platform
├── domains/
│   ├── tracks/          # Core Domain
│   │   ├── upload/
│   │   ├── analysis/
│   │   └── metadata/
│   ├── playlists/       # Core Domain
│   ├── mixing/          # Core Domain
│   ├── users/           # Supporting Domain
│   └── billing/         # Generic Subdomain
```

The factory provides the **initial structure**; the project team refines the domains as understanding deepens.
