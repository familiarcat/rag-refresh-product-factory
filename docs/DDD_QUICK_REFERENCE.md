# DDD Next.js Quick Reference
## Alex AI System - Cheat Sheet

**Last Updated:** 2025-12-26

---

## 🚀 Quick Start

### Generate New DDD Project
```bash
cd /Users/bradygeorgen/Documents/workspace/rag-refresh-product-factory
node scripts/scaffold-ddd-project.mjs my-project graph user order
cd my-project
npm install
npm run dev
```

### Use Template in Alex AI
```bash
# Option 1: API
curl -X POST http://localhost:3000/api/projects/create \
  -d '{"name":"My Project","categorySlug":"ddd-web-architecture"}'

# Option 2: Copy template
cp templates/projects/sitemap-visualization-ddd.json data/projects/my-project.json
```

---

## 📁 Files Created

| File | Purpose | Size |
|------|---------|------|
| `lib/categories.ts` | Added "ddd-web-architecture" category | +10 lines |
| `lib/projectTemplates.ts` | Added DDD template sections | +15 lines |
| `templates/ddd-nextjs-architecture.md` | Complete architecture guide | 1,200+ lines |
| `templates/projects/sitemap-visualization-ddd.json` | Reference implementation | 400+ lines |
| `scripts/scaffold-ddd-project.mjs` | Project generator script | 800+ lines |
| `docs/DDD_NEXTJS_INTEGRATION_GUIDE.md` | Integration documentation | 900+ lines |
| `docs/DDD_QUICK_REFERENCE.md` | This quick reference | You are here |

**Total**: ~3,500 lines of documentation and tooling

---

## 🏗️ Project Structure

```
your-ddd-project/
├── app/                      # Presentation (Next.js)
│   ├── page.tsx
│   ├── api/                  # API routes
│   └── _components/          # UI components
│
├── src/
│   ├── domain/               # CORE BUSINESS LOGIC
│   │   └── [context]/
│   │       ├── entities/
│   │       ├── value-objects/
│   │       ├── repositories/
│   │       └── services/
│   │
│   ├── application/          # USE CASES
│   │   ├── queries/          # Read operations
│   │   ├── commands/         # Write operations
│   │   └── dtos/             # Data transfer
│   │
│   ├── infrastructure/       # EXTERNAL ADAPTERS
│   │   ├── persistence/      # Repositories
│   │   ├── http/             # API clients
│   │   └── rendering/        # Renderers
│   │
│   └── shared/               # SHARED UTILITIES
│       ├── types/
│       └── utils/
│
├── tests/
│   ├── unit/                 # Domain tests
│   ├── integration/          # Application tests
│   └── e2e/                  # End-to-end tests
│
├── package.json
├── tsconfig.json
└── next.config.js
```

---

## 🎯 Layer Responsibilities

| Layer | What Goes Here | What Stays Out |
|-------|----------------|----------------|
| **Domain** | Entities, Value Objects, Business Logic | Framework code, I/O, databases |
| **Application** | Use Cases, DTOs, Orchestration | Business logic, framework code |
| **Infrastructure** | Repositories, HTTP clients, I/O | Business logic |
| **Presentation** | React components, API routes | Business logic, data access |

### Dependency Rule
```
Presentation → Application → Domain → (none)
Infrastructure → Domain (via interfaces)
```

---

## 🔑 Key Patterns

### Entity
```typescript
export class Product {
  private constructor(
    private readonly _id: ProductId,
    private _name: string
  ) {
    this.validate();
  }

  static create(id: ProductId, name: string): Product {
    return new Product(id, name);
  }

  get id(): ProductId { return this._id; }
  get name(): string { return this._name; }

  updateName(newName: string): void {
    // Business logic here
    this._name = newName;
  }

  private validate(): void {
    if (!this._name) {
      throw new ProductError('Name required');
    }
  }
}
```

### Value Object
```typescript
export class ProductId {
  private constructor(private readonly _value: string) {}

  static generate(): ProductId {
    return new ProductId(`prod_${Date.now()}`);
  }

  static fromString(value: string): ProductId {
    return new ProductId(value);
  }

  get value(): string { return this._value; }

  equals(other: ProductId): boolean {
    return this._value === other._value;
  }
}
```

### Repository Interface (Domain)
```typescript
export interface IProductRepository {
  findById(id: ProductId): Promise<Product | null>;
  save(product: Product): Promise<void>;
}
```

### Repository Implementation (Infrastructure)
```typescript
export class FileSystemProductRepository implements IProductRepository {
  async findById(id: ProductId): Promise<Product | null> {
    const data = await fs.readFile(`./data/${id.value}.json`, 'utf-8');
    return ProductMapper.toDomain(JSON.parse(data));
  }

  async save(product: Product): Promise<void> {
    await fs.writeFile(
      `./data/${product.id.value}.json`,
      JSON.stringify(product.toDTO())
    );
  }
}
```

### Query (Application)
```typescript
export class GetProductQuery {
  constructor(private repo: IProductRepository) {}

  async execute(id: string): Promise<ProductDTO> {
    const productId = ProductId.fromString(id);
    const product = await this.repo.findById(productId);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product.toDTO();
  }
}
```

### API Route (Presentation)
```typescript
// app/api/products/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const repo = new FileSystemProductRepository();
  const query = new GetProductQuery(repo);

  try {
    const product = await query.execute(params.id);
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }
}
```

---

## 🧪 Testing

### Unit Test (Domain)
```typescript
describe('Product', () => {
  it('should not allow empty name', () => {
    const id = ProductId.generate();

    expect(() => {
      Product.create(id, '');
    }).toThrow(ProductError);
  });
});
```

### Integration Test (Application)
```typescript
describe('GetProductQuery', () => {
  it('should return product DTO', async () => {
    const repo = new InMemoryProductRepository();
    const query = new GetProductQuery(repo);

    const result = await query.execute('prod_123');

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name');
  });
});
```

---

## 👨‍🚀 Crew Roles

| Crew Member | DDD Responsibility |
|-------------|-------------------|
| **Picard** | Define bounded contexts, approve architecture |
| **Data** | Identify entities, design algorithms |
| **Riker** | Coordinate development, manage sprints |
| **Geordi** | Set up infrastructure, configure Next.js |
| **O'Brien** | Implement features, write code |
| **Troi** | Design UX, validate usability |
| **Worf** | Write tests, ensure security |
| **Crusher** | Monitor performance, optimize |
| **Uhura** | Design APIs, document endpoints |
| **Quark** | Monetization, pricing strategy |

---

## 📋 Checklist: New DDD Project

### Planning Phase
- [ ] Define business requirements
- [ ] Identify bounded contexts (with Picard + Data)
- [ ] List entities per context
- [ ] List value objects per context
- [ ] Define aggregate boundaries
- [ ] Sketch repository interfaces

### Implementation Phase
- [ ] Run scaffolding script
- [ ] Implement entities with business logic
- [ ] Create value objects (IDs, enums, etc.)
- [ ] Define repository interfaces in domain
- [ ] Implement domain services
- [ ] Write unit tests for domain

- [ ] Create queries (read operations)
- [ ] Create commands (write operations)
- [ ] Define DTOs
- [ ] Write integration tests for application

- [ ] Implement repositories (infrastructure)
- [ ] Create mappers (DTO ↔ Domain)
- [ ] Add external service clients (if needed)

- [ ] Create API routes
- [ ] Build React components
- [ ] Add URL routing
- [ ] Write E2E tests

### Deployment Phase
- [ ] Set up CI/CD
- [ ] Configure environment variables
- [ ] Deploy to Vercel/Netlify
- [ ] Monitor performance (with Crusher)
- [ ] Gather user feedback (with Troi)

---

## 🐛 Common Mistakes

### ❌ Domain Importing Next.js
```typescript
// BAD - domain/product/entities/Product.ts
import { NextRequest } from 'next/server';
```

**Fix**: Domain layer must be framework-agnostic.

### ❌ Exposing Entities in API
```typescript
// BAD - app/api/products/route.ts
return NextResponse.json(product); // Product entity
```

**Fix**: Return DTOs instead.
```typescript
return NextResponse.json(product.toDTO()); // ProductDTO
```

### ❌ Anemic Entities
```typescript
// BAD
class Product {
  get name() { return this._name; }
  set name(v) { this._name = v; }
}
```

**Fix**: Add business logic.
```typescript
class Product {
  updateName(newName: string): void {
    if (this.isDiscontinued) {
      throw new ProductError('Cannot update discontinued product');
    }
    this._name = newName;
  }
}
```

### ❌ Business Logic in Application Layer
```typescript
// BAD - application/commands/UpdatePriceCommand.ts
if (price < 0 || price > 1000) {
  throw new Error('Invalid price');
}
```

**Fix**: Move to domain entity.
```typescript
// domain/product/entities/Product.ts
updatePrice(newPrice: Money): void {
  if (!newPrice.isValid()) {
    throw new ProductError('Invalid price');
  }
  this._price = newPrice;
}
```

---

## 📊 Migration from Monolithic Code

### Step 1: Extract Domain Model
```
Old: Single file with everything
New: src/domain/[context]/entities/
```

### Step 2: Define Repositories
```
Old: Direct database access in components
New: Repository interface in domain, impl in infrastructure
```

### Step 3: Create Application Services
```
Old: Business logic in API routes
New: Queries and commands in application layer
```

### Step 4: Update Presentation
```
Old: Components call database directly
New: Components call API routes → application services
```

---

## 🔗 Links

### Documentation
- [Complete Architecture Guide](../templates/ddd-nextjs-architecture.md)
- [Integration Guide](./DDD_NEXTJS_INTEGRATION_GUIDE.md)
- [Example Project JSON](../templates/projects/sitemap-visualization-ddd.json)

### Code
- [Scaffolding Script](../scripts/scaffold-ddd-project.mjs)
- [Category Definition](../lib/categories.ts)
- [Project Templates](../lib/projectTemplates.ts)

### External Resources
- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/)
- [Clean Architecture (Bob Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Next.js Docs](https://nextjs.org/docs)

---

## 🎓 Learning Path

### Beginner
1. Read: DDD Quick Reference (this file)
2. Run: Scaffolding script with one context
3. Study: Generated code structure
4. Implement: Simple CRUD entity

### Intermediate
1. Read: Complete Architecture Guide
2. Study: Sitemap visualization example
3. Implement: Multi-context project (3-5 contexts)
4. Practice: CQRS, Repository pattern, Aggregates

### Advanced
1. Read: DDD book by Eric Evans
2. Design: Complex bounded contexts
3. Implement: Event sourcing, Sagas, Process managers
4. Architect: Large-scale DDD system

---

## 💡 Tips

### When to use DDD
✅ Complex business logic
✅ Long-lived applications (5+ years)
✅ Large teams (3+ developers)
✅ Evolving requirements

❌ Simple CRUD apps
❌ Prototypes
❌ Throwaway projects

### Performance
- Use in-memory caching for hot paths
- Implement read models for complex queries
- Consider CQRS with separate read/write databases
- Profile before optimizing

### Team Collaboration
- Document ubiquitous language
- Use bounded contexts to parallelize work
- Code review domain model changes carefully
- Pair program on complex aggregates

---

## 🆘 Support

**Questions?**
- Read: [Integration Guide](./DDD_NEXTJS_INTEGRATION_GUIDE.md)
- Study: [Architecture Guide](../templates/ddd-nextjs-architecture.md)
- Review: [Example Project](../templates/projects/sitemap-visualization-ddd.json)

**Found a bug?**
- Check: [Troubleshooting section](./DDD_NEXTJS_INTEGRATION_GUIDE.md#troubleshooting)
- File an issue in the Alex AI repository

**Want to contribute?**
- Add new templates to `templates/projects/`
- Improve scaffolding script
- Write additional documentation

---

**Version:** 1.0.0
**Maintained by:** Alex AI Crew
**License:** MIT
