# Alex AI Templates

This directory contains reusable templates for generating new projects in the Alex AI system.

## Available Templates

### 1. DDD Next.js Architecture Template

**File**: `ddd-nextjs-architecture.md`
**Type**: Architecture Reference Guide
**Size**: 1,200+ lines
**Purpose**: Comprehensive guide for implementing Domain-Driven Design in Next.js applications

**What's included**:
- Complete project structure
- Layer-by-layer breakdown (Domain, Application, Infrastructure, Presentation)
- Domain modeling patterns (Entities, Value Objects, Aggregates, Repositories)
- CQRS implementation
- Testing strategies
- Migration guide from monolithic code
- Complete feature implementation example
- Checklist for new projects

**When to use**:
- Building complex web applications
- Need maintainable, testable architecture
- Long-lived projects (5+ years)
- Large teams (3+ developers)

**Quick start**:
```bash
# Read the guide
cat templates/ddd-nextjs-architecture.md

# Generate a new project
node scripts/scaffold-ddd-project.mjs my-project graph user order
```

---

### 2. Sitemap Visualization Project Template

**File**: `projects/sitemap-visualization-ddd.json`
**Type**: Complete Project Definition
**Size**: 400+ lines
**Purpose**: Reference implementation of DDD architecture for WordPress sitemap intelligence

**What's included**:
- 7 bounded contexts (graph, ingestion, visualization, export, application, infrastructure, presentation)
- Crew assignments with specific roles
- 15+ MVP features with progress tracking
- 6 milestones from planning to production
- Complete tech stack definition
- Monetization plan ($199-$999 template licensing, $2,500-$10,000 consulting)
- Success metrics and KPIs

**When to use**:
- Building sitemap visualization tools
- Need example of DDD architecture
- Want to understand bounded context design
- Creating content-heavy web applications

**Quick start**:
```bash
# Copy as template for new project
cp templates/projects/sitemap-visualization-ddd.json data/projects/my-project.json

# Edit JSON with your project details
# Then load in Alex AI system
```

---

## Project Templates Directory

**Directory**: `projects/`

Contains complete project definitions in JSON format. Each project includes:
- Project metadata (name, tagline, description)
- Bounded contexts (domains)
- Crew assignments
- Milestones and features
- Tech stack
- Monetization plan
- Success metrics

### Current Projects

1. **sitemap-visualization-ddd.json**
   - Category: DDD Web Architecture
   - Status: Reference Implementation
   - Use Case: WordPress sitemap to semantic graph visualization

### Adding New Templates

To add a new project template:

1. Create JSON file in `projects/` directory
2. Follow the structure in `sitemap-visualization-ddd.json`
3. Include all required fields (see `lib/projects.ts` for interface)
4. Document in this README

---

## Using Templates

### Method 1: Scaffolding Script

Generate a new DDD project from scratch:

```bash
cd /Users/bradygeorgen/Documents/workspace/rag-refresh-product-factory

# Create new project with bounded contexts
node scripts/scaffold-ddd-project.mjs my-project graph user order

# Navigate to project
cd my-project

# Install dependencies
npm install

# Start development
npm run dev
```

### Method 2: Copy Template Project

Use existing project as starting point:

```bash
# Copy template
cp templates/projects/sitemap-visualization-ddd.json \
   data/projects/my-custom-project.json

# Edit the JSON file with your project details
# Important fields to update:
# - id (must be unique)
# - name
# - tagline
# - description
# - domains (bounded contexts)
# - crew assignments
# - tech stack
# - monetization plan

# Restart Alex AI to load new project
```

### Method 3: Alex AI API

Create project programmatically:

```bash
# Create via API
curl -X POST http://localhost:3000/api/projects/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My DDD Project",
    "categorySlug": "ddd-web-architecture",
    "source": "structured"
  }'

# Scaffold the project structure
curl -X POST http://localhost:3000/api/projects/{project-id}/scaffold
```

---

## Documentation

For detailed information, see:

- **Architecture Guide**: `templates/ddd-nextjs-architecture.md`
- **Integration Guide**: `docs/DDD_NEXTJS_INTEGRATION_GUIDE.md`
- **Quick Reference**: `docs/DDD_QUICK_REFERENCE.md`
- **Summary**: `DDD_INTEGRATION_SUMMARY.md`

---

## Template Structure

### Project JSON Schema

```json
{
  "id": "unique-project-id",
  "name": "Project Name",
  "tagline": "Short description",
  "description": "Detailed description",
  "primaryCategory": "category-slug",

  "domains": [
    {
      "slug": "context-name",
      "name": "Display Name",
      "description": "What this context does",
      "scores": { "demand": 8, "effort": 6, ... },
      "features": ["Feature 1", "Feature 2"],
      "status": "in-progress",
      "progress": 50
    }
  ],

  "crew": [
    {
      "memberId": "captain_picard",
      "role": "Strategic Architect",
      "assignment": "Define bounded contexts",
      "contributions": ["Achievement 1", "Achievement 2"]
    }
  ],

  "techStack": {
    "frontend": ["Next.js 14", "React 18"],
    "backend": ["Node.js 20"],
    "infrastructure": ["Vercel", "Docker"],
    "ai": ["Claude Sonnet 4.5"]
  },

  "monetization": {
    "model": "hybrid",
    "targetPrice": "$199-$999",
    "revenueStreams": ["Licensing", "Consulting"]
  },

  "milestones": [
    {
      "id": "m1",
      "name": "Domain Model Complete",
      "status": "completed"
    }
  ]
}
```

---

## Categories

Available project categories (from `lib/categories.ts`):

1. **ai-observability-diagnostics**
   - AI Observability & Diagnostics Layer
   - Tracing, failure handling, webhook diagnostics

2. **enterprise-rag-platform-foundation**
   - Enterprise RAG Platform Foundation
   - Deployable RAG systems with IaC

3. **knowledge-refresh-governance**
   - Knowledge Refresh & Governance System
   - Refresh cycles, auditability, trust controls

4. **ai-platform-engineering-blueprint**
   - AI Platform Engineering Blueprint
   - Platform ownership, contracts, reliability

5. **ddd-web-architecture** (NEW)
   - DDD Web Architecture & Semantic Mapping
   - Domain-Driven Next.js applications

---

## Contributing

To contribute a new template:

1. **For Architecture Guides**:
   - Create markdown file in `templates/`
   - Follow structure of `ddd-nextjs-architecture.md`
   - Include code examples
   - Add to this README

2. **For Project Templates**:
   - Create JSON file in `templates/projects/`
   - Follow `sitemap-visualization-ddd.json` structure
   - Validate against Project interface in `lib/projects.ts`
   - Document in this README

3. **For New Categories**:
   - Add to `lib/categories.ts`
   - Update `lib/projectTemplates.ts` with sections
   - Create example project
   - Document usage

---

## License

MIT

---

## Support

- **Documentation**: `docs/DDD_NEXTJS_INTEGRATION_GUIDE.md`
- **Quick Reference**: `docs/DDD_QUICK_REFERENCE.md`
- **Issues**: File in Alex AI repository
- **Questions**: Contact via Observation Lounge

---

**Last Updated**: 2025-12-26
**Maintained by**: Alex AI Crew
