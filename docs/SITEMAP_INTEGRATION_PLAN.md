# Sitemap Visualization Integration Plan

**Objective:** Integrate sitemap visualization into Next.js dashboard and VSCode extension for project architecture visualization

**Date:** 2025-12-27
**Status:** Planning Phase

---

## 🎯 Strategic Assessment (Captain Picard)

### Vision
Transform the sitemap visualization from a standalone DDD template into a core feature of the product factory that enables:
1. **Project Architecture Visualization** - Visual understanding of project structure
2. **Cross-Project Pattern Recognition** - Identify architectural patterns across projects
3. **Domain Boundary Discovery** - Help identify bounded contexts in existing codebases
4. **IDE-Integrated Navigation** - Navigate codebase visually within VSCode

### Alignment with Factory Mission
- **Accelerates Understanding**: Visual architecture comprehension vs reading code
- **Supports DDD Practices**: Makes domain boundaries visible
- **Crew Collaboration**: Crew can reference visual architecture in discussions
- **Dogfooding**: Use our own visualization to improve the factory

### Strategic Decision
**Proceed with dual integration** (Next.js + VSCode) using shared core visualization library.

---

## 🤖 Technical Architecture (Commander Data)

### Core Components to Integrate

```
┌─────────────────────────────────────────────────────────┐
│           Shared Visualization Core                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Graph Domain (from sitemap template)             │  │
│  │  - Node, Edge entities                           │  │
│  │  - GraphTraversalService                         │  │
│  │  - MetadataExtractionService                     │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Visualization Services                           │  │
│  │  - Cytoscape.js adapter                          │  │
│  │  - Mermaid renderer                              │  │
│  │  - Layout engine (breadthfirst, radial, etc)    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
              │                           │
              ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐
    │  Next.js App    │         │ VSCode Extension │
    │  Integration    │         │  Integration     │
    └─────────────────┘         └─────────────────┘
```

### Data Flow

**For Project Visualization:**
```
Project Data (projects.json)
  ↓
Transform to Graph (adapt to sitemap schema)
  ↓
Graph Domain Model
  ↓
Cytoscape.js JSON / Mermaid Diagram
  ↓
Render in UI (Next.js) or Webview (VSCode)
```

### Key Adaptations

1. **Source Transformation**
   - WordPress Sitemap → File system project structure
   - URL paths → File paths
   - Sitemap sections → Project domains
   - Images/assets → Project resources

2. **Graph Schema Mapping**
   ```typescript
   // Sitemap nodes → Project nodes
   site → project (root)
   section → domain
   page → feature/component
   category → tag/classification
   date → milestone/sprint
   image → asset
   asset_host → dependency
   ```

3. **Metadata Extraction**
   - Extract from file paths (src/domains/auth/LoginPage.tsx)
   - Parse package.json for dependencies
   - Read domain boundaries from directory structure
   - Detect bounded contexts from imports

---

## 🔧 Infrastructure Implementation (Geordi La Forge)

### Phase 1: Shared Library Setup

**Create:** `/lib/visualization/`

```
lib/visualization/
├── core/
│   ├── Graph.ts              # Domain model
│   ├── Node.ts
│   ├── Edge.ts
│   └── NodeId.ts
├── services/
│   ├── GraphTraversalService.ts
│   ├── LayoutEngineService.ts
│   └── ProjectGraphBuilder.ts   # NEW: Build graph from project data
├── adapters/
│   ├── CytoscapeAdapter.ts
│   └── MermaidAdapter.ts
└── index.ts
```

**Dependencies:**
```json
{
  "dependencies": {
    "cytoscape": "^3.30.0",
    "cytoscape-dagre": "^2.5.0",
    "mermaid": "^11.0.0"
  }
}
```

### Phase 2: Next.js Dashboard Integration

**Create:** `/app/projects/[id]/architecture/page.tsx`

```typescript
// Server Component - fetches project data
export default async function ProjectArchitecturePage({ params }) {
  const project = await getProject(params.id);
  const graph = await buildProjectGraph(project);

  return <ArchitectureViewer graph={graph} />;
}
```

**Create:** `/components/ArchitectureViewer.tsx`
```typescript
'use client';

export function ArchitectureViewer({ graph }) {
  return (
    <Tabs defaultValue="interactive">
      <TabsList>
        <TabsTrigger value="interactive">Thought Map</TabsTrigger>
        <TabsTrigger value="diagram">Mermaid</TabsTrigger>
      </TabsList>

      <TabsContent value="interactive">
        <CytoscapeGraph graph={graph} />
      </TabsContent>

      <TabsContent value="diagram">
        <MermaidDiagram graph={graph} />
      </TabsContent>
    </Tabs>
  );
}
```

### Phase 3: VSCode Extension Integration

**Create:** `/vscode-extension/src/architecturePanel.ts`

```typescript
export class ArchitecturePanel {
  private panel: vscode.WebviewPanel;

  public async show(projectPath: string) {
    // Build graph from workspace
    const graph = await this.buildWorkspaceGraph(projectPath);

    // Render in webview
    this.panel.webview.html = this.getWebviewContent(graph);
  }

  private buildWorkspaceGraph(projectPath: string): Graph {
    // Scan file system
    // Detect domains from directory structure
    // Build graph using ProjectGraphBuilder
  }
}
```

**VSCode Command:**
```json
{
  "command": "alex-ai.showArchitecture",
  "title": "Alex AI: Show Project Architecture"
}
```

---

## 💭 UX Design (Counselor Troi)

### User Stories

**US1: Developer explores project architecture**
- As a developer joining a new project
- I want to see a visual map of the codebase
- So I can understand the domain structure quickly

**US2: Crew references architecture in discussion**
- As Commander Data analyzing a feature request
- I want to reference the visual architecture
- So I can suggest changes in context of existing structure

**US3: Team discovers bounded contexts**
- As Captain Picard reviewing architecture
- I want to see potential bounded context boundaries
- So I can guide refactoring decisions

### Interaction Patterns

1. **Drill-Down Navigation**
   - Click project → See domains
   - Click domain → See features/components
   - Click component → Open file in editor

2. **Filter & Focus**
   - Toggle: Show/hide dependencies
   - Toggle: Show/hide tests
   - Filter by: domain, category, file type

3. **Search & Highlight**
   - Search for file/component
   - Highlight matching nodes
   - Pan to selected node

4. **Export & Share**
   - Export as PNG/SVG
   - Copy Mermaid diagram
   - Share permalink (Next.js only)

### Accessibility

- Keyboard navigation (arrow keys for graph traversal)
- Screen reader support (node labels, relationships)
- High contrast mode
- Zoom controls (Ctrl+Scroll)

---

## 📡 API Design (Lt. Uhura)

### New API Routes

#### GET `/api/projects/[id]/graph`
```typescript
// Returns project architecture as graph
Response: {
  graph: {
    nodes: Node[],
    edges: Edge[]
  },
  metadata: {
    totalFiles: number,
    totalDomains: number,
    depth: number
  }
}
```

#### POST `/api/projects/[id]/graph/analyze`
```typescript
// AI-powered architecture analysis
Request: {
  graph: Graph,
  analysisType: 'bounded-contexts' | 'dependencies' | 'coupling'
}

Response: {
  insights: string[],
  suggestions: {
    type: string,
    description: string,
    affectedNodes: string[]
  }[]
}
```

#### GET `/api/workspace/graph`
```typescript
// VSCode Extension: Generate graph from workspace
Request: {
  workspacePath: string,
  includeTests: boolean,
  maxDepth: number
}

Response: {
  graph: Graph,
  warnings: string[]
}
```

### MCP Tools (for Cursor/VSCode Chat)

```typescript
// MCP Server enhancement
{
  name: "alex_ai_visualize_architecture",
  description: "Generate visual architecture diagram for workspace",
  inputSchema: {
    workspacePath: string,
    dimension: 'domain' | 'dependency' | 'layers'
  }
}
```

---

## 🛠️ Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Create `/lib/visualization/` with core domain model
- [ ] Port Graph, Node, Edge from sitemap template
- [ ] Implement ProjectGraphBuilder service
- [ ] Write unit tests for graph construction

### Phase 2: Next.js Integration (Week 1-2)
- [ ] Create `/app/projects/[id]/architecture/page.tsx`
- [ ] Implement ArchitectureViewer component
- [ ] Add Cytoscape.js interactive view
- [ ] Add Mermaid static diagram view
- [ ] Create API route `/api/projects/[id]/graph`

### Phase 3: VSCode Extension (Week 2)
- [ ] Create ArchitecturePanel webview
- [ ] Implement workspace scanning
- [ ] Add command: "Show Project Architecture"
- [ ] Integrate with existing extension UI
- [ ] Add click-to-navigate functionality

### Phase 4: Advanced Features (Week 3)
- [ ] AI-powered architecture analysis (Data's domain)
- [ ] Bounded context suggestions (Picard's domain)
- [ ] Dependency analysis (Worf's security review)
- [ ] Export functionality (PNG, SVG, Mermaid)

### Phase 5: Polish & Documentation (Week 3)
- [ ] Accessibility improvements
- [ ] Performance optimization (large graphs)
- [ ] User documentation
- [ ] Demo video for README

---

## 📊 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Graph Generation Time** | <2s for 500 files | Performance profiling |
| **Visual Clarity** | 4.5/5 user rating | User feedback survey |
| **Navigation Accuracy** | 95% files found | Click tracking |
| **Adoption Rate** | 70% of active projects | Usage analytics |
| **Crew Usage** | 3+ crew cite architecture | Collaboration logs |

---

## 🔒 Security Considerations (Lt. Worf)

### Threat Model
1. **Sensitive Path Exposure**: Avoid showing sensitive file paths in public diagrams
2. **Dependency Confusion**: Validate external dependencies before visualizing
3. **Resource Exhaustion**: Limit graph size (max 10,000 nodes)
4. **XSS in Labels**: Sanitize all node labels before rendering

### Mitigations
```typescript
// Sanitize file paths
function sanitizePath(path: string): string {
  return path
    .replace(/\/home\/[^\/]+/g, '~')
    .replace(/\/Users\/[^\/]+/g, '~')
    .replace(/node_modules\/.*/g, 'node_modules/...');
}

// Limit graph size
const MAX_NODES = 10000;
if (nodes.length > MAX_NODES) {
  throw new Error(`Graph too large: ${nodes.length} nodes (max: ${MAX_NODES})`);
}
```

---

## 💰 Cost-Benefit Analysis (Quark)

### Development Investment
- **Week 1:** Shared library + Next.js integration (40 hours)
- **Week 2:** VSCode extension integration (30 hours)
- **Week 3:** Advanced features + polish (30 hours)
- **Total:** 100 hours (~$10K-15K at market rate)

### Expected Returns
1. **Faster Onboarding**: 50% reduction in time to understand codebase
2. **Better Architecture Decisions**: 30% fewer refactoring cycles
3. **Crew Effectiveness**: 20% improvement in collaboration quality
4. **Sales Differentiation**: Unique visualization feature for factory

### ROI Projection
- **Direct Value**: 100 hours saved across 10 projects = $15K-20K
- **Indirect Value**: Better architecture = fewer bugs, faster features
- **Strategic Value**: Reference implementation for DDD visualization

**Verdict:** Proceed. High strategic value, reasonable implementation cost.

---

## 🎯 Crew Assignments

| Crew Member | Role | Responsibilities |
|-------------|------|------------------|
| **Captain Picard** | Sponsor | Architecture review, bounded context validation |
| **Commander Riker** | Coordinator | Oversee integration across Next.js + VSCode |
| **Commander Data** | Technical Lead | Graph algorithms, AI-powered analysis |
| **Geordi La Forge** | Infrastructure | Library setup, build configuration, deployment |
| **Counselor Troi** | UX Designer | Interaction patterns, accessibility, user testing |
| **Lt. Worf** | Security | Threat modeling, sanitization, validation |
| **Chief O'Brien** | Implementation | Hands-on coding of components and services |
| **Lt. Uhura** | API Design | REST endpoints, MCP tools, documentation |
| **Quark** | Advisor | Cost tracking, ROI monitoring |

---

## 📝 Next Actions

### Immediate (Today)
1. **Data:** Review graph domain model from sitemap template
2. **La Forge:** Set up `/lib/visualization/` directory structure
3. **Uhura:** Design API contract for `/api/projects/[id]/graph`

### This Week
4. **O'Brien:** Implement ProjectGraphBuilder service
5. **Troi:** Create UX mockups for Next.js and VSCode views
6. **Worf:** Define security sanitization rules

### Next Week
7. **Riker:** Coordinate integration testing
8. **Picard:** Review and approve final architecture
9. **All Crew:** Dogfood the visualization on factory projects

---

**"Make it so."** — Captain Picard

This visualization will make the invisible visible - domain boundaries, coupling, complexity - and empower both humans and AI crew to build better software.
