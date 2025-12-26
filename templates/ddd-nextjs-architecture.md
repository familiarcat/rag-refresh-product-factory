# DDD Next.js Architecture Template
## Reusable Template for Domain-Driven Web Applications

**Version:** 1.0.0
**Created:** 2025-12-26
**Category:** DDD Web Architecture & Semantic Mapping
**Alex AI Crew:** Captain Picard (architecture), Commander Data (analysis), Geordi (infrastructure)

---

## Overview

This template provides a complete Domain-Driven Design architecture for Next.js applications with:
- **Clean layered architecture** (Domain → Application → Infrastructure → Presentation)
- **Bounded contexts** with clear domain boundaries
- **Type-safe** end-to-end TypeScript
- **Testable** business logic isolated from framework code
- **Extensible** through well-defined interfaces

---

## Project Structure

```
your-project/
├── app/                              # Next.js App Router (Presentation Layer)
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Home page
│   ├── [feature]/                    # Feature routes
│   │   └── page.tsx
│   ├── api/                          # API Routes (Application Layer Entry)
│   │   ├── [resource]/
│   │   │   └── route.ts              # GET, POST, PUT, DELETE
│   │   └── actions/                  # Server Actions
│   │       └── [action].ts
│   └── _components/                  # Private UI components
│       ├── [Feature]View.tsx
│       └── shared/
│
├── src/
│   ├── domain/                       # DOMAIN LAYER (Core Business Logic)
│   │   ├── [bounded-context-1]/      # E.g., "graph", "user", "order"
│   │   │   ├── entities/             # Aggregate roots & entities
│   │   │   │   ├── [Aggregate].ts
│   │   │   │   └── [Entity].ts
│   │   │   ├── value-objects/        # Immutable value types
│   │   │   │   ├── [ValueObject].ts
│   │   │   │   └── [Enum].ts
│   │   │   ├── repositories/         # Data access interfaces
│   │   │   │   └── I[Aggregate]Repository.ts
│   │   │   ├── services/             # Domain services (stateless logic)
│   │   │   │   └── [Domain]Service.ts
│   │   │   └── errors/               # Domain-specific errors
│   │   │       └── [Domain]Error.ts
│   │   │
│   │   └── [bounded-context-2]/      # Repeat structure
│   │
│   ├── application/                  # APPLICATION LAYER (Use Cases)
│   │   ├── queries/                  # Read operations (CQRS)
│   │   │   ├── Get[Resource]Query.ts
│   │   │   └── Search[Resource]Query.ts
│   │   ├── commands/                 # Write operations (CQRS)
│   │   │   ├── Create[Resource]Command.ts
│   │   │   ├── Update[Resource]Command.ts
│   │   │   └── Delete[Resource]Command.ts
│   │   ├── services/                 # Application services (orchestration)
│   │   │   ├── [Feature]Service.ts
│   │   │   └── [Coordination]Service.ts
│   │   └── dtos/                     # Data Transfer Objects
│   │       ├── [Resource]DTO.ts
│   │       └── [Response]DTO.ts
│   │
│   ├── infrastructure/               # INFRASTRUCTURE LAYER (External Adapters)
│   │   ├── persistence/              # Data storage implementations
│   │   │   ├── [Technology][Aggregate]Repository.ts
│   │   │   ├── InMemory[Aggregate]Repository.ts  # For testing
│   │   │   └── mappers/              # DTO ↔ Domain mapping
│   │   │       ├── [Aggregate]Mapper.ts
│   │   │       └── [Entity]Mapper.ts
│   │   ├── http/                     # External HTTP clients
│   │   │   └── [ExternalService]Client.ts
│   │   ├── rendering/                # Rendering engines
│   │   │   └── [Renderer].ts
│   │   └── cache/                    # Caching implementations
│   │       └── [Cache]Provider.ts
│   │
│   └── shared/                       # SHARED KERNEL (Common utilities)
│       ├── types/
│       │   ├── Result.ts             # Result<T, E> monad
│       │   └── Option.ts             # Optional values
│       └── utils/
│           ├── validation.ts
│           └── helpers.ts
│
├── public/                           # Static assets
├── tests/                            # Tests (mirroring src structure)
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── scripts/                          # Build & deployment scripts
├── docs/                             # Documentation
├── package.json
├── tsconfig.json
├── next.config.js
└── .env.local
```

---

## Layer Responsibilities

### 1. Domain Layer (src/domain/)

**Purpose:** Core business logic, completely framework-agnostic

**Rules:**
- ✅ Pure TypeScript (no framework imports)
- ✅ Rich domain model (not anemic)
- ✅ Enforce invariants in entities
- ✅ Business logic in domain services
- ❌ No dependencies on other layers
- ❌ No I/O operations
- ❌ No framework code

**Example: Entity**
```typescript
// src/domain/graph/entities/Graph.ts
export class Graph {
  private constructor(
    private readonly _id: GraphId,
    private _nodes: Map<NodeId, Node>
  ) {
    this.validate();
  }

  static create(id: GraphId): Graph {
    return new Graph(id, new Map());
  }

  addNode(node: Node): void {
    if (this._nodes.has(node.id)) {
      throw new DomainError('Node already exists');
    }
    this._nodes.set(node.id, node);
  }

  private validate(): void {
    // Enforce invariants
  }
}
```

### 2. Application Layer (src/application/)

**Purpose:** Use cases, orchestration, DTOs

**Rules:**
- ✅ Coordinates domain objects
- ✅ Implements use cases (queries/commands)
- ✅ Depends on domain layer
- ✅ Returns DTOs (not entities)
- ❌ No business logic (delegate to domain)
- ❌ No direct framework dependencies
- ❌ No database/HTTP implementation details

**Example: Query**
```typescript
// src/application/queries/GetGraphQuery.ts
export class GetGraphQuery {
  constructor(
    private readonly graphRepository: IGraphRepository
  ) {}

  async execute(id: string): Promise<GraphDTO> {
    const graphId = GraphId.fromString(id);
    const graph = await this.graphRepository.findById(graphId);

    if (!graph) {
      throw new NotFoundError('Graph not found');
    }

    return graph.toDTO();
  }
}
```

### 3. Infrastructure Layer (src/infrastructure/)

**Purpose:** External concerns (DB, HTTP, file system)

**Rules:**
- ✅ Implements repository interfaces
- ✅ Handles I/O operations
- ✅ Maps between DTOs and domain
- ✅ Framework-specific code allowed
- ❌ No business logic

**Example: Repository**
```typescript
// src/infrastructure/persistence/FileSystemGraphRepository.ts
export class FileSystemGraphRepository implements IGraphRepository {
  async findById(id: GraphId): Promise<Graph | null> {
    const data = await fs.readFile(`./data/${id.value}.json`, 'utf-8');
    const dto = JSON.parse(data);
    return GraphMapper.toDomain(dto);
  }
}
```

### 4. Presentation Layer (app/)

**Purpose:** Next.js UI, API routes, user interaction

**Rules:**
- ✅ React Server Components
- ✅ API routes call application services
- ✅ Client components for interactivity
- ✅ Display DTOs (not entities)
- ❌ No direct domain access
- ❌ No business logic

**Example: API Route**
```typescript
// app/api/graph/route.ts
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');

  const query = new GetGraphQuery(graphRepository);
  const result = await query.execute(id);

  return NextResponse.json(result);
}
```

---

## Domain Modeling Patterns

### Entities vs Value Objects

**Entity:**
- Has identity (unique ID)
- Mutable
- Lifecycle (created, modified, deleted)
- Example: User, Order, Graph

**Value Object:**
- No identity (equality by value)
- Immutable
- Replaceable
- Example: Email, Money, NodeId

### Aggregates

**Definition:** Cluster of entities/VOs with single root

**Rules:**
- External references only via root
- Enforce invariants across cluster
- Transaction boundary

**Example:**
```
Graph (Aggregate Root)
  ├── Node (Entity)
  ├── Edge (Entity)
  └── GraphMetadata (Value Object)
```

### Repository Pattern

**Interface (Domain Layer):**
```typescript
// src/domain/graph/repositories/IGraphRepository.ts
export interface IGraphRepository {
  findById(id: GraphId): Promise<Graph | null>;
  save(graph: Graph): Promise<void>;
  delete(id: GraphId): Promise<void>;
}
```

**Implementation (Infrastructure Layer):**
```typescript
// src/infrastructure/persistence/FileSystemGraphRepository.ts
export class FileSystemGraphRepository implements IGraphRepository {
  // Implementation details
}
```

### Domain Services

**When to use:**
- Business logic doesn't fit in a single entity
- Operates on multiple entities
- Stateless

**Example:**
```typescript
// src/domain/graph/services/GraphTraversalService.ts
export class GraphTraversalService {
  static bfs(graph: Graph, start: NodeId, depth: number): Set<NodeId> {
    // Breadth-first search logic
  }
}
```

---

## CQRS Pattern

Separate **queries** (reads) from **commands** (writes)

### Queries (Read Side)
```typescript
// src/application/queries/GetGraphQuery.ts
export class GetGraphQuery {
  async execute(id: string): Promise<GraphDTO> {
    // Read-optimized
  }
}
```

### Commands (Write Side)
```typescript
// src/application/commands/CreateGraphCommand.ts
export class CreateGraphCommand {
  async execute(input: CreateGraphInput): Promise<void> {
    // Write-optimized
  }
}
```

---

## Dependency Injection

Use constructor injection for testability:

```typescript
// Application service
export class NavigationService {
  constructor(
    private readonly graphRepository: IGraphRepository,
    private readonly traversalService: GraphTraversalService
  ) {}
}

// API route
const graphRepo = new FileSystemGraphRepository('./data/graphs');
const navigationService = new NavigationService(graphRepo, new GraphTraversalService());
```

For production, consider:
- Manual composition (simple projects)
- `tsyringe` (lightweight DI container)
- `inversify` (full-featured DI)

---

## Testing Strategy

### Unit Tests (Domain Layer)
```typescript
// tests/unit/domain/Graph.test.ts
describe('Graph', () => {
  it('should not allow duplicate nodes', () => {
    const graph = Graph.create(GraphId.generate());
    const node = Node.create(NodeKind.Page, 'Test');

    graph.addNode(node);

    expect(() => graph.addNode(node)).toThrow(DomainError);
  });
});
```

### Integration Tests (Application Layer)
```typescript
// tests/integration/queries/GetGraphQuery.test.ts
describe('GetGraphQuery', () => {
  it('should return graph DTO', async () => {
    const repo = new InMemoryGraphRepository();
    const query = new GetGraphQuery(repo);

    const result = await query.execute('test-id');

    expect(result).toHaveProperty('nodes');
  });
});
```

### E2E Tests (API Routes)
```typescript
// tests/e2e/api/graph.test.ts
describe('GET /api/graph', () => {
  it('should return 200 with graph data', async () => {
    const response = await fetch('/api/graph?id=test-id');
    expect(response.status).toBe(200);
  });
});
```

---

## Migration from Monolithic Code

### Step 1: Extract Domain Model
1. Identify entities (things with ID)
2. Identify value objects (immutable data)
3. Define aggregates (transaction boundaries)
4. Extract business logic into domain services

### Step 2: Define Repositories
1. Create interfaces in domain layer
2. Move data access to infrastructure layer
3. Implement mappers (DTO ↔ Domain)

### Step 3: Create Application Services
1. Extract use cases
2. Create queries (reads)
3. Create commands (writes)
4. Define DTOs for API boundaries

### Step 4: Update Presentation Layer
1. Change API routes to call application services
2. Update components to use DTOs
3. Remove direct data access

---

## Environment Configuration

```bash
# .env.local

# Application
NEXT_PUBLIC_APP_NAME=My DDD App
NEXT_PUBLIC_API_URL=http://localhost:3000

# Database (future)
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# External Services
EXTERNAL_API_KEY=xxx

# Feature Flags
FEATURE_ADVANCED_SEARCH=true
```

---

## Scripts & Commands

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "playwright test",
    "type-check": "tsc --noEmit",
    "domain:validate": "node scripts/validate-domain-model.js"
  }
}
```

---

## Crew Coordination (Alex AI Integration)

### Domain Analysis Workflow

**Crew Members:**
- **Captain Picard** - Strategic architecture decisions
- **Commander Data** - Technical analysis, pattern recognition
- **Geordi La Forge** - Infrastructure setup
- **Chief O'Brien** - Implementation

**Process:**
1. Picard reviews project requirements → defines bounded contexts
2. Data analyzes domain model → identifies entities, VOs, aggregates
3. Geordi sets up infrastructure → repository implementations
4. O'Brien implements features → uses application services

### N8N Workflow Trigger

```javascript
// Trigger domain analysis
POST /api/crew/coordinate
{
  "mission": "analyze-domain",
  "projectId": "ddd-web-arch-001",
  "context": {
    "sitemapUrl": "https://example.com/sitemap.xml",
    "targetDomains": ["content", "navigation", "search"]
  }
}
```

---

## Best Practices

### ✅ Do
- Keep domain layer pure (no framework dependencies)
- Use value objects for concepts without identity
- Enforce invariants in aggregates
- Return DTOs from application layer
- Test domain logic extensively
- Use Result<T, E> for error handling
- Document ubiquitous language

### ❌ Don't
- Put business logic in API routes
- Expose entities directly to UI
- Let infrastructure leak into domain
- Create anemic domain models (just getters/setters)
- Skip validation in entities
- Use database IDs in domain layer (use domain IDs)
- Share entities between bounded contexts

---

## Example: Complete Feature Implementation

### Requirement
"Add ability to drill down into graph sections"

### 1. Domain Layer
```typescript
// src/domain/graph/value-objects/NodeId.ts
export class NodeId {
  private constructor(private readonly _value: string) {}

  static fromString(value: string): NodeId {
    return new NodeId(value);
  }

  get value(): string { return this._value; }
  equals(other: NodeId): boolean {
    return this._value === other._value;
  }
}

// src/domain/graph/services/GraphTraversalService.ts
export class GraphTraversalService {
  static getSubtree(
    graph: Graph,
    rootId: NodeId,
    depth: number
  ): Set<NodeId> {
    // BFS algorithm
    const nodes = new Set<NodeId>();
    let frontier = [rootId];

    for (let d = 0; d < depth; d++) {
      const next = [];
      for (const id of frontier) {
        const neighbors = graph.getNeighbors(id);
        neighbors.forEach(n => {
          if (!nodes.has(n.id)) {
            nodes.add(n.id);
            next.push(n.id);
          }
        });
      }
      frontier = next;
    }

    return nodes;
  }
}
```

### 2. Application Layer
```typescript
// src/application/queries/GetSubgraphQuery.ts
export interface GetSubgraphInput {
  rootNodeId: string;
  depth: number;
}

export class GetSubgraphQuery {
  constructor(private readonly graphRepo: IGraphRepository) {}

  async execute(input: GetSubgraphInput): Promise<SubgraphDTO> {
    const graph = await this.graphRepo.getDefault();
    if (!graph) throw new NotFoundError('Graph not found');

    const rootId = NodeId.fromString(input.rootNodeId);
    const nodeIds = GraphTraversalService.getSubtree(
      graph,
      rootId,
      input.depth
    );

    const nodes = Array.from(nodeIds)
      .map(id => graph.getNode(id))
      .filter((n): n is Node => n !== undefined)
      .map(n => n.toDTO());

    return { nodes, rootNodeId: input.rootNodeId };
  }
}
```

### 3. API Route
```typescript
// app/api/subgraph/route.ts
import { GetSubgraphQuery } from '@/application/queries/GetSubgraphQuery';
import { FileSystemGraphRepository } from '@/infrastructure/persistence/FileSystemGraphRepository';

const graphRepo = new FileSystemGraphRepository();

export async function GET(request: NextRequest) {
  const rootNodeId = request.nextUrl.searchParams.get('root') || 'site';
  const depth = parseInt(request.nextUrl.searchParams.get('depth') || '3');

  const query = new GetSubgraphQuery(graphRepo);
  const result = await query.execute({ rootNodeId, depth });

  return NextResponse.json(result);
}
```

### 4. React Component
```typescript
// app/_components/GraphExplorer.tsx
'use client';

import { useState, useEffect } from 'react';

export function GraphExplorer() {
  const [subgraph, setSubgraph] = useState(null);
  const [rootNode, setRootNode] = useState('site');

  useEffect(() => {
    fetch(`/api/subgraph?root=${rootNode}&depth=3`)
      .then(res => res.json())
      .then(setSubgraph);
  }, [rootNode]);

  return (
    <div>
      {subgraph?.nodes.map(node => (
        <div key={node.id} onClick={() => setRootNode(node.id)}>
          {node.label}
        </div>
      ))}
    </div>
  );
}
```

---

## Checklist: New DDD Project

- [ ] Define bounded contexts
- [ ] Identify aggregates, entities, value objects
- [ ] Create repository interfaces
- [ ] Implement domain services
- [ ] Define use cases (queries/commands)
- [ ] Create DTOs
- [ ] Implement repositories (infrastructure)
- [ ] Create API routes
- [ ] Build React components
- [ ] Write unit tests (domain)
- [ ] Write integration tests (application)
- [ ] Write E2E tests (API/UI)
- [ ] Document ubiquitous language
- [ ] Set up CI/CD
- [ ] Configure environment variables
- [ ] Deploy to production

---

## Resources

### Books
- **Domain-Driven Design** by Eric Evans
- **Implementing Domain-Driven Design** by Vaughn Vernon
- **Clean Architecture** by Robert C. Martin

### Articles
- [DDD in TypeScript](https://khalilstemmler.com/articles/domain-driven-design-intro/)
- [Next.js with Clean Architecture](https://dev.to/bespoyasov/clean-architecture-on-frontend-4311)

### Tools
- **TypeScript** - Type safety
- **Jest** - Unit testing
- **Playwright** - E2E testing
- **Zod** - Runtime validation

---

## Conclusion

This template provides a solid foundation for building maintainable, testable, and scalable Next.js applications using Domain-Driven Design principles.

**Key Benefits:**
- ✅ Clear separation of concerns
- ✅ Business logic isolated from framework
- ✅ Easy to test
- ✅ Easy to extend
- ✅ Team can work in parallel on different layers
- ✅ Future-proof (can swap frameworks/databases)

**When to use:**
- Complex business logic
- Long-lived applications
- Large teams
- Evolving requirements

**When NOT to use:**
- Simple CRUD apps
- Prototypes
- Small projects with fixed scope

---

**Template Version:** 1.0.0
**Last Updated:** 2025-12-26
**Maintained by:** Alex AI System
**License:** MIT
