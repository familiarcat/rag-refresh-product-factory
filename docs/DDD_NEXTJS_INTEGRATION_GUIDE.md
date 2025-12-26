# DDD Next.js Integration Guide
## Alex AI System - Domain-Driven Design Template

**Version:** 1.0.0
**Created:** 2025-12-26
**Maintained by:** Alex AI Crew

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Template Components](#template-components)
4. [Creating New Projects](#creating-new-projects)
5. [Crew Coordination](#crew-coordination)
6. [VSCode Integration](#vscode-integration)
7. [Real-World Example: Sitemap Visualization](#real-world-example)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The DDD Next.js architecture template is a comprehensive system for building Domain-Driven Design web applications within the Alex AI ecosystem.

### What's Included

✅ **Category System**: New `ddd-web-architecture` category in the product factory
✅ **Project Template**: Complete JSON template for sitemap visualization project
✅ **Architecture Guide**: 50-page comprehensive DDD/Next.js reference
✅ **Scaffolding Script**: Automated project generation tool
✅ **Crew Integration**: Star Trek crew workflows for domain analysis
✅ **VSCode Commands**: IDE integration for common DDD tasks

### Use Cases

- **WordPress Sitemap Intelligence**: Transform sitemaps into semantic graphs
- **E-commerce Platforms**: Domain-driven product catalogs and order management
- **Content Management**: Multi-dimensional content organization
- **Enterprise Web Apps**: Clean architecture for complex business domains

---

## Quick Start

### Method 1: Using the Scaffolding Script

```bash
cd /Users/bradygeorgen/Documents/workspace/rag-refresh-product-factory

# Generate a new DDD project
node scripts/scaffold-ddd-project.mjs my-project graph user order

# Install dependencies
cd my-project
npm install

# Start development
npm run dev
```

### Method 2: Using the Alex AI API

```bash
# Create project via API
curl -X POST http://localhost:3000/api/projects/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My DDD Project",
    "categorySlug": "ddd-web-architecture",
    "source": "structured"
  }'

# Scaffold the project
curl -X POST http://localhost:3000/api/projects/{projectId}/scaffold
```

### Method 3: Import Template Project

```bash
# Copy the sitemap visualization template
cp templates/projects/sitemap-visualization-ddd.json data/projects/my-project.json

# Edit the JSON file with your project details
# Then restart the Next.js server
```

---

## Template Components

### 1. Category Definition

**File**: `lib/categories.ts`

```typescript
{
  slug: 'ddd-web-architecture',
  name: 'DDD Web Architecture & Semantic Mapping',
  tagline: 'Domain-Driven Next.js with sitemap intelligence...',
  scores: { demand: 8, effort: 6, monetization: 7, ... },
  buyers: ['WordPress agencies', 'E-commerce platforms', ...]
}
```

**Purpose**: Defines the category for categorization and scoring

### 2. Project Template

**File**: `lib/projectTemplates.ts`

```typescript
if (slug.includes('ddd-web')) {
  base.sections = [
    'Domain boundaries (bounded contexts from sitemap)',
    'Sitemap sources (WordPress XML, custom sitemaps)',
    'Graph model (nodes: site/section/page/category/date)',
    ...
  ];
}
```

**Purpose**: Provides structured sections for project planning

### 3. Complete Example Project

**File**: `templates/projects/sitemap-visualization-ddd.json`

**Contents**:
- 7 bounded contexts (graph, ingestion, visualization, etc.)
- Crew assignments (Picard, Data, Geordi, O'Brien, etc.)
- Milestones and success metrics
- Tech stack and monetization plan
- 15+ features with progress tracking

**Purpose**: Reference implementation and copy-paste starter

### 4. Architecture Reference

**File**: `templates/ddd-nextjs-architecture.md`

**50 pages covering**:
- Project structure (app/, src/domain/, src/application/, etc.)
- Layer responsibilities (Domain, Application, Infrastructure, Presentation)
- Domain modeling patterns (Entities, Value Objects, Aggregates)
- CQRS, Repository Pattern, Dependency Injection
- Testing strategy (unit, integration, E2E)
- Complete feature implementation example
- Checklist for new projects

**Purpose**: Comprehensive guide for implementing DDD in Next.js

### 5. Scaffolding Script

**File**: `scripts/scaffold-ddd-project.mjs`

**Features**:
- Generates complete directory structure
- Creates stub files for entities, repositories, services
- Sets up Next.js with TypeScript and ESLint
- Configures testing (Jest, Playwright)
- Writes README with documentation

**Usage**:
```bash
node scripts/scaffold-ddd-project.mjs <project-name> [contexts...]
```

---

## Creating New Projects

### Step 1: Choose Your Approach

**Option A: Full Automation**
Use the scaffolding script to generate everything.

**Option B: Alex AI Guided**
Let the crew analyze your requirements and suggest bounded contexts.

**Option C: Manual Template**
Copy and customize the example project JSON.

### Step 2: Define Bounded Contexts

Bounded contexts are the foundation of DDD. Examples:

**E-commerce:**
- `product` - Product catalog management
- `order` - Order processing and fulfillment
- `cart` - Shopping cart operations
- `user` - User accounts and authentication
- `payment` - Payment processing integration

**Content Management:**
- `content` - Articles, pages, media
- `taxonomy` - Categories, tags, hierarchies
- `author` - User management and permissions
- `search` - Full-text search and indexing
- `workflow` - Publishing workflows and approvals

**WordPress Sitemap:**
- `graph` - Semantic graph model
- `ingestion` - Sitemap fetching and parsing
- `visualization` - Interactive graph rendering
- `export` - Diagram generation (Mermaid, SVG)

### Step 3: Scaffold the Project

```bash
# Example: E-commerce platform
node scripts/scaffold-ddd-project.mjs my-ecommerce product order cart user payment

# Example: Blog platform
node scripts/scaffold-ddd-project.mjs my-blog content author comment taxonomy

# Example: Custom SaaS
node scripts/scaffold-ddd-project.mjs my-saas account subscription billing feature
```

### Step 4: Implement Domain Model

For each bounded context:

1. **Identify Entities** (things with identity)
   - Example: `Product`, `Order`, `User`

2. **Identify Value Objects** (immutable data)
   - Example: `ProductId`, `Money`, `Email`

3. **Define Aggregates** (transaction boundaries)
   - Example: `Order` aggregate contains `OrderItem` entities

4. **Create Repositories** (data access interfaces)
   - Example: `IProductRepository`

5. **Implement Domain Services** (cross-entity business logic)
   - Example: `PricingService`, `InventoryService`

### Step 5: Build Application Layer

1. **Create Queries** (read operations)
   - Example: `GetProductQuery`, `SearchProductsQuery`

2. **Create Commands** (write operations)
   - Example: `CreateProductCommand`, `UpdatePriceCommand`

3. **Define DTOs** (data transfer objects)
   - Example: `ProductDTO`, `OrderDTO`

### Step 6: Implement Infrastructure

1. **Repository Implementations**
   - Start with `FileSystemRepository` for prototyping
   - Migrate to `PrismaRepository` for production

2. **External Service Clients**
   - Example: `StripePaymentClient`, `SendGridEmailClient`

3. **Mappers**
   - Convert between DTOs and domain entities

### Step 7: Create Next.js UI

1. **API Routes** (`app/api/`)
   - Call application services
   - Return DTOs as JSON

2. **Pages** (`app/[feature]/page.tsx`)
   - Server Components for initial render
   - Client Components for interactivity

3. **Components** (`app/_components/`)
   - Reusable UI building blocks

---

## Crew Coordination

The Alex AI crew provides expert guidance for DDD architecture.

### Crew Roles in DDD Projects

| Crew Member | DDD Role | Responsibilities |
|------------|----------|------------------|
| **Captain Picard** | Strategic Architect | Define bounded contexts, approve architecture decisions, ensure domain alignment |
| **Commander Data** | Domain Analyst | Identify entities/value objects, design algorithms, analyze patterns |
| **Commander Riker** | Implementation Lead | Coordinate development, manage milestones, tactical execution |
| **Geordi La Forge** | Infrastructure Engineer | Set up Next.js, configure build pipeline, implement repositories |
| **Chief O'Brien** | Feature Engineer | Implement domain services, build UI components, write tests |
| **Counselor Troi** | UX Designer | Design user interactions, ensure accessibility, validate usability |
| **Lieutenant Worf** | Security & Testing | Write tests, validate invariants, ensure data integrity |
| **Dr. Crusher** | Performance Monitor | Optimize queries, monitor latency, diagnose bottlenecks |
| **Lieutenant Uhura** | API Designer | Design REST endpoints, define DTOs, document APIs |
| **Quark** | Business Analyst | Monetization strategy, pricing models, ROI analysis |

### Workflow Example: Domain Analysis

**Mission**: Analyze a WordPress sitemap to define bounded contexts

**Crew Assembly**:
1. Picard reviews requirements
2. Data analyzes sitemap structure
3. Geordi validates technical feasibility
4. Picard approves architecture

**N8N Trigger** (future):
```json
POST /api/crew/coordinate
{
  "mission": "analyze-domain",
  "projectId": "proj_ddd_001",
  "context": {
    "sitemapUrl": "https://example.com/sitemap.xml",
    "targetDomains": ["content", "navigation", "search"]
  }
}
```

### Crew Recommendations

**When starting a new DDD project:**

1. **Picard**: Review business requirements, define bounded contexts
2. **Data**: Analyze data structures, identify entities
3. **Geordi**: Set up infrastructure, choose tech stack
4. **Worf**: Define security requirements, set up testing
5. **Quark**: Validate monetization strategy

**During development:**

1. **Riker**: Coordinate sprints, manage backlog
2. **O'Brien**: Implement features, fix bugs
3. **Troi**: Review UX, gather feedback
4. **Dr. Crusher**: Monitor performance, optimize

**Before deployment:**

1. **Worf**: Security audit, penetration testing
2. **Geordi**: Infrastructure review, scaling plan
3. **Uhura**: API documentation, integration guides
4. **Picard**: Final architecture review

---

## VSCode Integration

### Planned Commands (Future)

```typescript
// vscode-extension/src/commands/ddd/

1. "Alex AI: Generate DDD Project from Sitemap"
   - Input: Sitemap URL
   - Output: Complete project with inferred bounded contexts

2. "Alex AI: Analyze Domain Boundaries"
   - Input: Current codebase
   - Output: Suggested bounded contexts, refactoring plan

3. "Alex AI: Scaffold Bounded Context"
   - Input: Context name (e.g., "product")
   - Output: Entity, repository, service stubs

4. "Alex AI: Generate Repository Implementation"
   - Input: Entity name
   - Output: FileSystem and Prisma repository implementations

5. "Alex AI: Create Use Case"
   - Input: Use case name (e.g., "CreateProduct")
   - Output: Query or command with tests

6. "Alex AI: Validate Domain Model"
   - Input: Current domain code
   - Output: DDD pattern compliance report

7. "Alex AI: Generate API Route from Use Case"
   - Input: Query/command class
   - Output: Next.js API route

8. "Alex AI: Refactor to DDD"
   - Input: Legacy monolithic code
   - Output: Refactoring plan with step-by-step migration
```

### Chat Participant Integration

```typescript
// In VSCode Chat
@alexai /ddd-analyze

// Response:
// "I've analyzed your codebase. I suggest 4 bounded contexts:
//  1. User Management (auth, profiles)
//  2. Content (articles, media)
//  3. Commerce (products, orders)
//  4. Analytics (tracking, reporting)
//
// Would you like me to scaffold these contexts?"
```

---

## Real-World Example: Sitemap Visualization

### Project Overview

**Goal**: Transform WordPress sitemap XML into interactive semantic graphs

**Bounded Contexts**:
1. **Graph Domain**: Nodes, edges, traversal algorithms
2. **Ingestion Domain**: Sitemap fetching, parsing, merging
3. **Visualization Domain**: Layouts, navigation, filtering
4. **Export Domain**: Mermaid diagrams, SVG generation

### Architecture Highlights

**Domain Layer** (`src/domain/graph/`):
```
entities/
  - Graph.ts (aggregate root)
  - Node.ts (entity)
  - Edge.ts (entity)

value-objects/
  - NodeId.ts (FNV-1a hashed identifier)
  - NodeKind.ts (site, section, page, category, date)
  - EdgeKind.ts (contains, page, member, asset)

repositories/
  - IGraphRepository.ts (interface)

services/
  - GraphTraversalService.ts (BFS, path-finding)
  - MetadataExtractionService.ts (parse URLs)
  - GraphValidationService.ts (enforce invariants)
```

**Application Layer** (`src/application/`):
```
queries/
  - GetGraphQuery.ts
  - GetSubgraphQuery.ts
  - SearchNodesQuery.ts

commands/
  - IngestSitemapCommand.ts
  - BuildGraphCommand.ts
  - ExportGraphCommand.ts

services/
  - NavigationService.ts (drill-down, breadcrumbs)
  - FilterService.ts (dimension, depth, focus mode)
```

**Infrastructure Layer** (`src/infrastructure/`):
```
persistence/
  - FileSystemGraphRepository.ts
  - mappers/GraphMapper.ts

http/
  - WordPressSitemapClient.ts

rendering/
  - MermaidRenderer.ts
  - SVGExporter.ts
```

**Presentation Layer** (`app/`):
```
page.tsx (Mermaid viewer)
thought/page.tsx (Thought Map)

api/
  - graph/route.ts (GET /api/graph)
  - search/route.ts (POST /api/search)
  - ingest/route.ts (POST /api/ingest)

_components/
  - MermaidViewer.tsx
  - ThoughtMap.tsx
  - BreadcrumbNav.tsx
  - SearchBox.tsx
```

### Key Patterns Demonstrated

1. **Rich Domain Model**
   - `Graph` enforces single root invariant
   - `Node` validates metadata
   - `GraphTraversalService` implements BFS algorithm

2. **CQRS**
   - `GetSubgraphQuery` for reads (optimized for UI)
   - `IngestSitemapCommand` for writes (complex orchestration)

3. **Repository Pattern**
   - `IGraphRepository` interface in domain
   - `FileSystemGraphRepository` implementation in infrastructure
   - Easy to swap for Prisma later

4. **Dependency Injection**
   - Application services receive repositories via constructor
   - API routes instantiate dependencies manually (simple)

5. **Clean Separation**
   - Domain logic has zero framework dependencies
   - Can be tested without Next.js
   - Can be ported to different frameworks

### Full Implementation

See the complete project at:
`/Users/bradygeorgen/Documents/workspace/stldnb/`

Comprehensive proposal at:
`/Users/bradygeorgen/Documents/workspace/stldnb/DDD_REFACTOR_PROPOSAL.md`

---

## Best Practices

### Domain Layer

✅ **Do**:
- Keep entities rich (business logic belongs here)
- Enforce invariants in constructors
- Use private constructors with static factory methods
- Make value objects immutable
- Return new instances instead of mutating

❌ **Don't**:
- Import Next.js, React, or any framework code
- Access databases directly (use repository interfaces)
- Use console.log (throw domain errors instead)
- Create anemic entities (just getters/setters)

### Application Layer

✅ **Do**:
- Separate queries from commands (CQRS)
- Return DTOs (not domain entities)
- Use Result<T, E> for error handling
- Keep use cases focused (single responsibility)

❌ **Don't**:
- Put business logic in application services
- Expose domain entities to UI
- Mix query and command operations

### Infrastructure Layer

✅ **Do**:
- Implement repository interfaces from domain
- Use mappers for DTO ↔ Domain conversion
- Handle all I/O errors gracefully
- Log infrastructure failures

❌ **Don't**:
- Let database concerns leak into domain
- Throw domain errors (throw infrastructure errors)
- Share database models across contexts

### Presentation Layer

✅ **Do**:
- Use Server Components by default
- Call application services from API routes
- Display DTOs in components
- Keep components dumb (minimal logic)

❌ **Don't**:
- Access domain entities directly
- Put business logic in components
- Fetch data in client components (use server)

---

## Troubleshooting

### Scaffolding Issues

**Problem**: Script fails with "ENOENT: no such file or directory"

**Solution**: Ensure you're running from the rag-refresh-product-factory root:
```bash
cd /Users/bradygeorgen/Documents/workspace/rag-refresh-product-factory
node scripts/scaffold-ddd-project.mjs my-project
```

**Problem**: Generated code has import errors

**Solution**: Run `npm install` in the generated project:
```bash
cd my-project
npm install
```

### Architecture Issues

**Problem**: Circular dependencies between layers

**Solution**: Ensure dependency rule:
- Presentation → Application → Domain → (none)
- Infrastructure → Domain (via interfaces only)

**Problem**: Domain layer importing Next.js

**Solution**: Refactor to use repository pattern. Domain should never import framework code.

**Problem**: Entities are anemic (just getters/setters)

**Solution**: Move business logic from services into entities. Entities should be rich with behavior.

### Testing Issues

**Problem**: Can't test domain logic without database

**Solution**: Use `InMemoryRepository` for tests:
```typescript
const repo = new InMemoryGraphRepository();
const service = new MyService(repo);
```

**Problem**: Tests fail with "Cannot find module '@/domain/...'"

**Solution**: Check `tsconfig.json` path mappings and ensure `baseUrl` is set to `"."`.

---

## Next Steps

### Immediate Actions

1. **Try the scaffolding script**
   ```bash
   node scripts/scaffold-ddd-project.mjs test-project core
   ```

2. **Review the sitemap visualization example**
   - Read: `templates/projects/sitemap-visualization-ddd.json`
   - Study: `/Users/bradygeorgen/Documents/workspace/stldnb/`

3. **Read the architecture guide**
   - File: `templates/ddd-nextjs-architecture.md`
   - Focus on: Domain modeling patterns, CQRS, Repository pattern

### Future Enhancements

- [ ] VSCode extension commands for DDD workflows
- [ ] N8N workflows for crew coordination
- [ ] AI-powered domain analysis (suggest bounded contexts from requirements)
- [ ] Database migration tools (FileSystem → Prisma)
- [ ] Multi-project templates (e-commerce, CMS, SaaS)
- [ ] Code generation from UML diagrams
- [ ] Automatic test generation

### Contributing

To add new templates:
1. Create project JSON in `templates/projects/`
2. Add category to `lib/categories.ts`
3. Update `lib/projectTemplates.ts` with sections
4. Document in this guide

---

## Resources

### Internal Documentation

- **Architecture Guide**: `templates/ddd-nextjs-architecture.md`
- **Example Project**: `templates/projects/sitemap-visualization-ddd.json`
- **Scaffolding Script**: `scripts/scaffold-ddd-project.mjs`
- **Sitemap Project**: `/Users/bradygeorgen/Documents/workspace/stldnb/`

### External Resources

- [Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/ddd/)
- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [DDD in TypeScript](https://khalilstemmler.com/articles/domain-driven-design-intro/)
- [Next.js Documentation](https://nextjs.org/docs)

---

## Changelog

**v1.0.0** (2025-12-26)
- Initial release
- Added DDD Web Architecture category
- Created sitemap visualization example project
- Built scaffolding script
- Wrote comprehensive architecture guide

---

**Questions or feedback?**

Open an issue in the Alex AI repository or contact the crew via the Observation Lounge.

**Maintained by**: Alex AI Crew (Captain Picard, Commander Data, Geordi La Forge)
**License**: MIT
