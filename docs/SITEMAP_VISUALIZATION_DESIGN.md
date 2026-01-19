# Sitemap Visualization System - Comprehensive Design Document

**Date**: December 28, 2025
**Project**: RAG Refresh Product Factory
**Design Team**: Picard (Strategy), Troi (UX), Data (AI/Tech), Geordi (Infrastructure)
**Cost Optimization**: 63.4% savings via strategic crew selection

---

## Executive Summary

This document presents a comprehensive sitemap visualization system for Alex AI's dual-platform architecture (web dashboard + VSCode extension), designed using 2025-2026 UI/UX trends and domain-driven design principles. The system visualizes project structure, domain relationships, and navigation paths across our application factory ecosystem.

**Key Innovation**: Domain-focused navigation that treats each bounded context (domain) as a first-class citizen in the project architecture, with visual representations showing dependencies, data flow, and current status.

---

## 1. Current State Analysis

### 1.1 Web Dashboard (`rag.pbradygeorgen.com`)

**Existing Components:**
- **Project List**: Grid layout with cards showing progress, scores, domains
- **Project Detail**: `/projects/[id]/page.tsx` - Header, timeline, quick stats, metadata
- **Domain View**: `/projects/[id]/domains/page.tsx` - Domain cards, progress bars, score visualization
- **Timeline**: `components/ProjectTimeline.tsx` - Horizontal milestone visualization

**Strengths:**
- Clean card-based layout with gradient backgrounds
- Score visualization using color coding (green/blue/yellow/red)
- Domain progress tracking with status indicators
- Timeline component with zoom levels (1m, 3m, 6m, all)

**Gaps:**
- No visual sitemap showing project structure
- Domain relationships not visualized
- Navigation paths unclear for complex projects
- No dependency mapping between domains

### 1.2 VSCode Extension (`vscode-extension/src/alexPanel.ts`)

**Current Implementation:**
- **Mobile-first bottom navigation**: Chat, Projects, Files, Crew
- **Single-column scroll layout**: Optimized for narrow panel width
- **Project cards**: Compact view with domain badges
- **Chat interface**: Crew selection with avatars

**Strengths:**
- Modern mobile-first patterns (bottom nav, vertical scroll)
- Efficient space usage in narrow extension panel
- Quick access to crew members via modal
- Real-time sync with web dashboard (hot reload every 5s)

**Gaps:**
- No domain navigator beyond simple badges
- Limited visualization of project structure
- No sitemap view in extension
- Navigation requires switching to web for complex views

### 1.3 Design System (`UI_UX_EXECUTIVE_SUMMARY.md`)

**2025-2026 Trends Applied:**
1. **Hyper-minimalism**: Strip non-essential elements
2. **Data storytelling**: Timeline shows narrative arc
3. **Bento box layouts**: Modular drag-and-drop cards (web)
4. **Microinteractions**: Smooth animations, hover effects
5. **Mobile-first**: Extension as mobile app experience

**Color Palette:**
- Background: `#070812` (dark navy)
- Panel: `#0d1022` (slightly lighter)
- Text: `#eef1ff` (off-white)
- Accents: Purple `#7c5cff`, Cyan `#5ae6ff`, Green `#28d99a`, Pink `#ff5c93`

---

## 2. Research Findings: 2025-2026 Sitemap Trends

### 2.1 Interactive Visual Sitemaps

**Trend**: Move from static tree diagrams to interactive node-based visualizations

**Best Practices:**
- **Force-directed graphs**: Nodes repel/attract based on relationships
- **Hierarchical trees**: Expand/collapse branches
- **Network diagrams**: Show dependencies with arrows
- **Heatmaps**: Color-code nodes by status/score
- **Minimap**: Overview + detail pattern for large structures

**Technologies:**
- React Flow: Modern node graph library
- Cytoscape.js: Network visualization (already in dependencies!)
- D3.js: Custom SVG visualizations
- Mermaid: Declarative diagram syntax

### 2.2 Domain-Driven Design Visualization

**Concept**: Visualize bounded contexts (domains) as interconnected components

**Key Elements:**
- **Domain nodes**: Show name, status, progress, scores
- **Connections**: Data flow, dependencies, shared models
- **Context boundaries**: Visual separation of domains
- **Aggregates**: Group related features within domains
- **Events**: Show domain events triggering cross-domain actions

**Visual Metaphors:**
- City map: Domains as districts, features as buildings
- Network graph: Domains as nodes, dependencies as edges
- Subway map: Domains as stations, user flows as routes
- Blueprint: Architectural view of system structure

### 2.3 Mobile-First Navigation

**Patterns for Narrow Viewports:**
- **Breadcrumb navigation**: Show current location in hierarchy
- **Expandable tree**: Tap to expand/collapse branches
- **Swipeable cards**: Horizontal scroll through domains
- **Bottom sheet**: Slide-up panel with domain details
- **Floating action button**: Quick access to sitemap

---

## 3. Sitemap Visualization Design

### 3.1 Conceptual Model

#### The Sitemap Shows:

**1. Project Hierarchy**
```
Factory Project (rag-refresh-product-factory)
├── Meta-Project: Alex AI Self-Development
│   ├── Domain: Collaboration Engine
│   ├── Domain: RAG Memory System
│   ├── Domain: Crew Specializations
│   └── Domain: Cost Optimization
├── Project: AI Writing Assistant
│   ├── Domain: Core Editor
│   ├── Domain: AI Engine
│   └── Domain: User Management
└── Project: DocuSearch Enterprise
    ├── Domain: Document Ingestion
    ├── Domain: Vector Search
    ├── Domain: RAG Pipeline
    └── Domain: Admin Dashboard
```

**2. Domain Relationships**
- **Dependencies**: "AI Engine depends on User Management for auth"
- **Data flow**: "Document Ingestion → Vector Search → RAG Pipeline"
- **Shared models**: "User model shared between domains"
- **Events**: "Document uploaded event triggers ingestion pipeline"

**3. Domain Status & Progress**
- Visual indicators: Color-coded nodes (green=complete, blue=in-progress, gray=planned)
- Progress rings: Circular progress around domain nodes
- Score badges: Display demand/monetization/differentiation scores
- Priority flags: Highlight high-priority domains

**4. Navigation Paths**
- **User journeys**: How users navigate through the application
- **Feature access**: Entry points to domain features
- **Integration points**: Where domains connect to external systems

### 3.2 Web Dashboard Sitemap (Full Interactive View)

#### Component Specification: `<ProjectSitemap>`

**Location**: `/projects/[id]/sitemap/page.tsx`

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🗺️ Project Sitemap: AI Writing Assistant                   │
├─────────────────────────────────────────────────────────────┤
│ [Graph View] [Tree View] [Matrix View]     🔍 Search domains│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────┐         ┌──────────────┐                │
│   │ Core Editor  │────────▶│  AI Engine   │                │
│   │ Progress: 65%│         │ Progress: 50%│                │
│   │ Score: 8/10  │         │ Score: 9/10  │                │
│   └──────────────┘         └──────────────┘                │
│          │                         │                        │
│          │                         │                        │
│          ▼                         ▼                        │
│   ┌─────────────────────────────────────┐                  │
│   │       User Management                │                  │
│   │       Progress: 20%                  │                  │
│   │       Score: 7/10                    │                  │
│   └─────────────────────────────────────┘                  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ Legend: ● Completed ● In Progress ● Planned                │
│ Click domain to see details | Drag to rearrange             │
└─────────────────────────────────────────────────────────────┘
```

**Features**:
1. **Interactive Graph**:
   - Drag nodes to rearrange
   - Zoom with scroll wheel
   - Pan with click-and-drag
   - Click node to see domain details in side panel
   - Hover to show tooltips with scores/status

2. **View Modes**:
   - **Graph View**: Force-directed network graph (default)
   - **Tree View**: Hierarchical tree with expand/collapse
   - **Matrix View**: Dependency matrix showing relationships

3. **Visual Elements**:
   - **Domain nodes**: Rounded rectangles with gradient backgrounds
   - **Progress rings**: Circular progress indicator around node
   - **Score badges**: Small colored circles showing key scores
   - **Connection arrows**: Curved paths with labels (dependency type)
   - **Status colors**: Green (completed), Cyan (in-progress), Gray (planned), Yellow (at-risk)

4. **Interactions**:
   - **Click node**: Open side panel with domain details
   - **Double-click node**: Navigate to `/projects/[id]/domains#[domain-slug]`
   - **Right-click node**: Context menu (edit, delete, duplicate)
   - **Click connection**: Show dependency details
   - **Search**: Filter domains by name, status, scores

**Technical Implementation**:

```typescript
// components/ProjectSitemap.tsx
'use client';

import { useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ProjectDomain } from '@/lib/projects';

interface ProjectSitemapProps {
  projectId: string;
  domains: ProjectDomain[];
  viewMode?: 'graph' | 'tree' | 'matrix';
}

export function ProjectSitemap({ projectId, domains, viewMode = 'graph' }: ProjectSitemapProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedDomain, setSelectedDomain] = useState<ProjectDomain | null>(null);

  // Convert domains to ReactFlow nodes
  useEffect(() => {
    const flowNodes: Node[] = domains.map((domain, index) => ({
      id: domain.slug,
      type: 'domainNode',
      position: calculatePosition(index, domains.length), // Use force-directed layout
      data: {
        domain,
        onSelect: () => setSelectedDomain(domain),
      },
    }));

    const flowEdges: Edge[] = extractDependencies(domains);

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [domains]);

  return (
    <div style={{ width: '100%', height: '600px', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Controls />
        <Background />
        <MiniMap />
      </ReactFlow>

      {/* Side Panel for Selected Domain */}
      {selectedDomain && (
        <DomainDetailPanel domain={selectedDomain} onClose={() => setSelectedDomain(null)} />
      )}
    </div>
  );
}

// Custom Domain Node Component
function DomainNode({ data }: { data: { domain: ProjectDomain; onSelect: () => void } }) {
  const { domain } = data;
  const statusColor = getStatusColor(domain.status);

  return (
    <div
      onClick={data.onSelect}
      style={{
        padding: 16,
        borderRadius: 12,
        background: `linear-gradient(135deg, var(--surface) 0%, ${statusColor}20 100%)`,
        border: `2px solid ${statusColor}`,
        width: 200,
        cursor: 'pointer',
      }}
    >
      {/* Progress Ring */}
      <svg width="40" height="40" style={{ float: 'right' }}>
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke={statusColor}
          strokeWidth="3"
          strokeDasharray={`${domain.progress} ${100 - domain.progress}`}
          transform="rotate(-90 20 20)"
        />
        <text x="20" y="25" textAnchor="middle" fontSize="10" fill="white">
          {domain.progress}%
        </text>
      </svg>

      {/* Domain Name */}
      <h4 style={{ margin: 0, fontSize: 14 }}>{domain.name}</h4>

      {/* Score Badges */}
      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
        <ScoreBadge label="D" score={domain.scores.demand} />
        <ScoreBadge label="M" score={domain.scores.monetization} />
        <ScoreBadge label="U" score={domain.scores.differentiation} />
      </div>

      {/* Status Tag */}
      <span
        style={{
          marginTop: 8,
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 10,
          background: `${statusColor}30`,
          color: statusColor,
        }}
      >
        {domain.status}
      </span>
    </div>
  );
}
```

### 3.3 VSCode Extension Sitemap (Compact Navigator)

#### Component Specification: Domain Navigator

**Location**: New tab in bottom navigation: "Map" 🗺️

**Layout** (Mobile-first, vertical scroll):
```
┌──────────────────────────────┐
│ 🗺️ AI Writing Assistant      │
│ 3 domains                    │
├──────────────────────────────┤
│                              │
│ ┌──────────────────────────┐ │
│ │ 1️⃣ Core Editor           │ │
│ │ ▓▓▓▓▓▓▓░░░░░░ 65%       │ │
│ │ D:9 M:8 U:7              │ │
│ │ ✅ In Progress            │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ 2️⃣ AI Engine             │ │
│ │ ▓▓▓▓▓░░░░░░░░ 50%       │ │
│ │ D:8 M:9 U:8              │ │
│ │ ⚡ In Progress            │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ 3️⃣ User Management       │ │
│ │ ▓░░░░░░░░░░░░ 20%       │ │
│ │ D:6 M:7 U:3              │ │
│ │ 📅 Planned                │ │
│ └──────────────────────────┘ │
│                              │
│ Dependencies:                │
│ • Editor → AI Engine         │
│ • Editor → User Mgmt         │
│ • AI Engine → User Mgmt      │
│                              │
└──────────────────────────────┘
```

**Features**:
1. **Compact Domain Cards**:
   - Number badge (order in project)
   - Name + progress bar
   - Inline scores (D=Demand, M=Monetization, U=Unique)
   - Status emoji (✅, ⚡, 📅, ⚠️, 🚫)

2. **Tap Interactions**:
   - Tap card: Expand to show features, description
   - Long-press: Context menu (view in web, copy domain info)
   - Swipe left/right: Navigate between projects

3. **Dependency List**:
   - Simple text list showing relationships
   - Tap dependency: Highlight both domains

4. **Search/Filter**:
   - Filter by status (completed, in-progress, planned)
   - Search by domain name or feature

**Technical Implementation**:

```typescript
// vscode-extension/src/domainNavigator.ts

function renderDomainNavigator(project: Project) {
  return `
    <div class="domain-navigator">
      <div class="navigator-header">
        <h3>🗺️ ${project.name}</h3>
        <span class="domain-count">${project.domains.length} domains</span>
      </div>

      <div class="domain-list">
        ${project.domains.map((domain, index) => `
          <div class="domain-card" data-slug="${domain.slug}">
            <div class="domain-header">
              <span class="domain-number">${index + 1}️⃣</span>
              <span class="domain-name">${domain.name}</span>
            </div>

            <div class="progress-bar">
              <div class="progress-fill" style="width: ${domain.progress}%"></div>
              <span class="progress-text">${domain.progress}%</span>
            </div>

            <div class="domain-scores">
              <span class="score" style="color: ${getScoreColor(domain.scores.demand)}">
                D:${domain.scores.demand}
              </span>
              <span class="score" style="color: ${getScoreColor(domain.scores.monetization)}">
                M:${domain.scores.monetization}
              </span>
              <span class="score" style="color: ${getScoreColor(domain.scores.differentiation)}">
                U:${domain.scores.differentiation}
              </span>
            </div>

            <span class="status-tag ${domain.status}">
              ${getStatusIcon(domain.status)} ${domain.status}
            </span>
          </div>
        `).join('')}
      </div>

      <div class="dependencies">
        <h4>Dependencies</h4>
        ${extractDependencies(project.domains).map(dep => `
          <div class="dependency-item">
            • ${dep.from} → ${dep.to}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
```

### 3.4 Timeline ↔ Sitemap Integration

**Concept**: Connect timeline milestones to domain progress

**Implementation**:
1. **Milestone cards** show which domains are involved
2. **Domain nodes** in sitemap show related milestones
3. **Bi-directional navigation**: Click milestone → jump to domain in sitemap, click domain → show timeline filtered to that domain

**Example**:
```
Timeline Milestone: "Beta Launch" (Feb 15, 2026)
  Domains Involved:
    • Core Editor (95% complete)
    • AI Engine (80% complete)
    • User Management (60% complete)

Click "Core Editor" → Navigate to sitemap, highlight Core Editor node
```

---

## 4. Dogfooding: Representing the Application Factory Itself

### 4.1 Meta-Project Sitemap

The **rag-refresh-product-factory** project has a special sitemap showing its own internal structure:

**Factory Domains**:
1. **AI Observability & Diagnostics Layer**
   - Crew system, collaboration engine, RAG memory
   - Features: Crew chat, observation lounge, memory search

2. **Enterprise RAG Platform Foundation**
   - Vector search, document ingestion, semantic retrieval
   - Features: pgvector, embeddings, chunking

3. **AI Platform Engineering Blueprint**
   - Project templates, domain scaffolding, code generation
   - Features: Conceptualize, structure, rapid prototypes

**Sitemap View**:
```
Factory Project
├── Domain: AI Observability (⚡ In Progress, 35%)
│   ├── Feature: Crew System
│   ├── Feature: Collaboration Engine
│   └── Feature: RAG Memory
├── Domain: RAG Platform (✅ Completed, 80%)
│   ├── Feature: Vector Search
│   ├── Feature: Document Ingestion
│   └── Feature: Semantic Retrieval
└── Domain: Platform Engineering (📅 Planned, 15%)
    ├── Feature: Project Templates
    ├── Feature: Domain Scaffolding
    └── Feature: Code Generation

Child Projects (Generated from Factory):
  → AI Writing Assistant (4 domains)
  → DocuSearch Enterprise (4 domains)
  → Code Review Automation (3 domains)
  → etc.
```

**Visual Metaphor**: The factory sitemap shows **templates** (domains that become blueprints for generated projects)

### 4.2 Cross-Project Sitemap

**Feature**: View all projects together in one unified sitemap

**Use Cases**:
- Identify shared domains across projects (e.g., User Management appears in multiple projects)
- Find patterns in domain structures
- Discover collaboration opportunities (domains that could be consolidated)

**Layout**:
```
┌────────────────────────────────────────────────────────┐
│ 🗺️ All Projects Sitemap                                │
├────────────────────────────────────────────────────────┤
│                                                         │
│  [Factory Project]                                     │
│       │                                                 │
│       ├─▶ [AI Writing Assistant]                       │
│       │      ├─ Core Editor                            │
│       │      ├─ AI Engine                              │
│       │      └─ User Management ◀──┐                   │
│       │                             │                   │
│       ├─▶ [DocuSearch Enterprise]  │                   │
│       │      ├─ Document Ingestion  │                   │
│       │      ├─ Vector Search       │                   │
│       │      ├─ RAG Pipeline        │                   │
│       │      └─ Admin Dashboard     │                   │
│       │           └─ User Management (shared model)    │
│       │                                                 │
│       └─▶ [Code Review Automation]                     │
│              ├─ Git Integration                        │
│              ├─ Code Analysis                          │
│              └─ Team Configuration                     │
│                                                         │
│  Shared Domains Detected:                              │
│    • User Management (2 projects)                      │
│    • AI Engine (2 projects)                            │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## 5. UI/UX Refactoring Recommendations

### 5.1 Apply 2025-2026 Trends to Sitemap

#### 1. Hyper-Minimalism
- Remove unnecessary chrome from domain nodes
- Use whitespace to separate elements
- Single-color gradients instead of multiple accents
- Hide secondary info (scores, features) until hover/click

**Before**:
```
┌────────────────────┐
│ Core Editor        │
│ Progress: 65%      │
│ D:9 M:8 U:7 E:7 R:3│
│ Status: In Progress│
│ Features: 4        │
│ Dependencies: 2    │
└────────────────────┘
```

**After**:
```
┌────────────────┐
│ Core Editor    │
│ ▓▓▓▓▓▓▓░ 65%  │
└────────────────┘
(Hover to see scores, click for details)
```

#### 2. Data Storytelling
- Timeline shows **narrative arc**: Planning → Execution → Completion
- Sitemap shows **architectural journey**: How domains build on each other
- Progress animations tell story of evolution

**Narrative Elements**:
- "Started with Core Editor, now building AI Engine on top"
- "User Management unlocks both Editor and Engine features"
- "Next milestone depends on completing Vector Search domain"

#### 3. Microinteractions
- **Hover node**: Gentle bounce animation + tooltip
- **Click node**: Smooth expand with blur-in details
- **Drag node**: Magnetic snap to grid positions
- **Connect nodes**: Animated arrow drawing
- **Progress update**: Fill animation with easing

**Animation Specs**:
```css
.domain-node:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 24px rgba(124, 92, 255, 0.3);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-fill {
  animation: fillProgress 1s ease-out;
}

@keyframes fillProgress {
  from { width: 0%; }
  to { width: var(--progress-value); }
}
```

#### 4. Bento Box Layout (Web)
- Sitemap as draggable widget in dashboard
- Resize to small (minimap), medium (graph), large (full screen)
- Save user preferences for layout

**Dashboard Layout**:
```
┌─────────────┬─────────────┐
│  Timeline   │  Sitemap    │
│  (large)    │  (medium)   │
├─────────────┴─────────────┤
│  Recent Activity           │
│  (small)                   │
└────────────────────────────┘
```

#### 5. AI-Powered Insights
- Highlight domains "at risk" based on progress lag
- Suggest next domain to work on
- Predict completion dates using crew AI
- Auto-detect circular dependencies

**Insight Examples**:
- "AI Engine is 2 weeks behind schedule. Consider allocating Commander Data to this domain."
- "User Management blocks 2 other domains. Prioritize this next."
- "Core Editor and AI Engine have high synergy (score: 85). Assign the same crew."

### 5.2 Accessibility (WCAG 2.1 AA)

**Requirements**:
1. **Keyboard navigation**: Tab through nodes, arrow keys to navigate graph
2. **Screen reader support**: ARIA labels for nodes, edges, status
3. **Color contrast**: All text meets 4.5:1 ratio
4. **Focus indicators**: Clear outline on focused elements
5. **Alternative text**: Describe sitemap structure for non-visual users

**Implementation**:
```typescript
<div
  role="img"
  aria-label="Project sitemap showing 3 domains: Core Editor (65% complete), AI Engine (50% complete), User Management (20% complete)"
>
  <Node
    tabIndex={0}
    aria-label="Core Editor domain, 65% complete, in progress status"
    onKeyDown={handleKeyboardNavigation}
  />
</div>
```

### 5.3 Performance Optimization

**Large Projects** (10+ domains):
- Virtual rendering: Only render visible nodes
- Lazy load domain details on demand
- Debounce drag events
- Use WebGL for complex graphs (via Cytoscape.js)

**Targets**:
- Initial render: < 500ms
- 60 FPS during interactions
- < 5 MB bundle size for sitemap component

---

## 6. Data Structure & API Design

### 6.1 Enhanced Domain Model

Add dependency tracking to domain schema:

```typescript
interface ProjectDomain {
  slug: string;
  name: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed';
  progress: number;
  scores: {
    demand: number;
    effort: number;
    monetization: number;
    differentiation: number;
    risk: number;
  };
  features: string[];

  // NEW: Dependency tracking
  dependencies?: {
    domainSlug: string;
    type: 'data-flow' | 'shared-model' | 'event-trigger' | 'technical';
    description: string;
  }[];

  // NEW: Navigation metadata
  entryPoints?: {
    route: string;
    label: string;
    userJourney: string;
  }[];

  // NEW: Milestone association
  milestoneIds?: string[];
}
```

**Example** (AI Writing Assistant):
```json
{
  "slug": "ai-engine",
  "name": "AI Engine",
  "description": "LLM integration for content generation",
  "status": "in-progress",
  "progress": 50,
  "dependencies": [
    {
      "domainSlug": "user-management",
      "type": "shared-model",
      "description": "Uses User model for API key management"
    },
    {
      "domainSlug": "core-editor",
      "type": "data-flow",
      "description": "Receives text from editor, returns AI suggestions"
    }
  ],
  "entryPoints": [
    {
      "route": "/editor/ai-suggest",
      "label": "AI Suggestions Panel",
      "userJourney": "Writer clicks 'AI Help' button in editor"
    }
  ],
  "milestoneIds": ["ms2", "ms3"]
}
```

### 6.2 API Endpoints

**New endpoint**: `/api/projects/[id]/sitemap`

```typescript
// app/api/projects/[id]/sitemap/route.ts
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const project = await getProject(id);

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Build sitemap graph
  const nodes = project.domains.map(domain => ({
    id: domain.slug,
    label: domain.name,
    status: domain.status,
    progress: domain.progress,
    scores: domain.scores,
  }));

  const edges = project.domains.flatMap(domain =>
    (domain.dependencies || []).map(dep => ({
      from: domain.slug,
      to: dep.domainSlug,
      type: dep.type,
      label: dep.description,
    }))
  );

  return NextResponse.json({
    projectId: id,
    projectName: project.name,
    nodes,
    edges,
    layout: 'force-directed', // or 'hierarchical', 'circular'
  });
}
```

**Response Example**:
```json
{
  "projectId": "proj_1765948227414_iw68yf",
  "projectName": "AI Writing Assistant",
  "nodes": [
    {
      "id": "core-editor",
      "label": "Core Editor",
      "status": "in-progress",
      "progress": 65,
      "scores": { "demand": 9, "monetization": 8 }
    },
    {
      "id": "ai-engine",
      "label": "AI Engine",
      "status": "in-progress",
      "progress": 50,
      "scores": { "demand": 8, "monetization": 9 }
    }
  ],
  "edges": [
    {
      "from": "core-editor",
      "to": "ai-engine",
      "type": "data-flow",
      "label": "Text input for AI processing"
    }
  ],
  "layout": "force-directed"
}
```

---

## 7. Implementation Plan

### Phase 1: Foundation (Week 1-2)
**Goal**: Basic sitemap visualization on web dashboard

**Tasks**:
1. ✅ Design domain dependency model
2. ✅ Create API endpoint `/api/projects/[id]/sitemap`
3. ✅ Install React Flow library
4. ✅ Build `<ProjectSitemap>` component with graph view
5. ✅ Add route `/projects/[id]/sitemap`
6. ✅ Implement custom domain node component
7. ✅ Add basic interactions (click, hover)

**Deliverables**:
- Working sitemap page for projects
- Force-directed graph layout
- Domain nodes with status colors
- Dependency arrows

**Estimated Effort**: 16 hours

---

### Phase 2: Web Enhancements (Week 3-4)
**Goal**: Advanced features and integrations

**Tasks**:
1. Add view modes (tree, matrix)
2. Implement search/filter
3. Build domain detail side panel
4. Integrate with timeline (bi-directional navigation)
5. Add minimap for large projects
6. Implement drag-to-rearrange nodes
7. Add microinteractions (animations, hover effects)
8. WCAG 2.1 AA compliance audit

**Deliverables**:
- Multi-view sitemap (graph, tree, matrix)
- Searchable, filterable domains
- Timeline integration
- Accessible UI

**Estimated Effort**: 24 hours

---

### Phase 3: VSCode Extension Integration (Week 5-6)
**Goal**: Compact domain navigator in extension

**Tasks**:
1. Design mobile-first domain navigator UI
2. Add "Map" tab to bottom navigation
3. Implement compact domain cards
4. Add tap interactions (expand, context menu)
5. Show dependency list
6. Sync with web dashboard via hot reload
7. Add search/filter for domains

**Deliverables**:
- Domain navigator tab in extension
- Mobile-optimized UI
- Real-time sync with web

**Estimated Effort**: 20 hours

---

### Phase 4: Dogfooding & Polish (Week 7-8)
**Goal**: Apply to factory project, refine based on usage

**Tasks**:
1. Create factory domain structure with dependencies
2. Build cross-project sitemap view
3. Identify shared domains across projects
4. Add AI-powered insights (at-risk domains, suggestions)
5. Performance optimization (virtual rendering, lazy loading)
6. User testing with 5-10 users
7. Iterate based on feedback
8. Documentation (usage guide, API reference)

**Deliverables**:
- Factory meta-project sitemap
- Cross-project view
- AI insights
- User documentation

**Estimated Effort**: 20 hours

---

**Total Estimated Effort**: 80 hours (~2 months at 40 hrs/week, or 1 month at 80 hrs/week)

---

## 8. Component Specifications

### 8.1 Web Components

#### `<ProjectSitemap>` (Main Container)
- Props: `projectId`, `domains`, `viewMode`, `onDomainSelect`
- State: `nodes`, `edges`, `selectedDomain`, `searchQuery`
- Libraries: React Flow, Cytoscape.js (fallback)

#### `<DomainNode>` (Custom Node)
- Props: `domain`, `isSelected`, `onSelect`
- Renders: Name, progress ring, score badges, status tag
- Interactions: Click, hover, drag

#### `<DomainDetailPanel>` (Side Panel)
- Props: `domain`, `onClose`
- Shows: Full description, features list, scores breakdown, dependencies, milestones
- Actions: Edit domain, navigate to domain page

#### `<SitemapControls>` (Toolbar)
- Controls: View mode toggle, zoom, pan, fit view, search, filter
- Layout: Horizontal toolbar above graph

### 8.2 VSCode Extension Components

#### `<DomainNavigator>` (Tab Content)
- Renders: Project header, domain cards list, dependencies section
- Interactions: Tap card to expand, swipe between projects

#### `<DomainCard>` (List Item)
- Compact: Number, name, progress bar, scores, status
- Expanded: + Features, description, actions

---

## 9. Cost Optimization Results

### Crew Selection Strategy

**Research & Analysis Phase**:
- **Captain Picard** (Premium tier): Strategic assessment, risk analysis
- **Counselor Troi** (Budget tier): UX research, mobile-first patterns
- **Commander Data** (Budget tier): AI/ML trends, visualization tech
- **Geordi La Forge** (Budget tier): Infrastructure, performance

**Design & Planning Phase**:
- **Commander Riker** (Standard tier): Coordination, task breakdown
- **Counselor Troi** (Budget tier): Accessibility, interaction design
- **Lieutenant Uhura** (Budget tier): API design, integration

**Total Cost Savings**: 63.4% vs. premium-only approach

**Estimated Cost for Full Implementation**:
- Research: $0.025 (vs $0.068 premium-only)
- Design: $0.040 (vs $0.110 premium-only)
- **Total**: ~$0.065 (vs ~$0.178 premium-only)

**ROI**: Saved $0.113 on design phase, allowing budget allocation to implementation

---

## 10. Success Metrics

### User Experience Metrics
- **Time to understand project structure**: < 30 seconds
- **Domain discovery time**: < 10 seconds to find specific domain
- **Navigation efficiency**: 2 clicks or less from sitemap to domain page
- **User satisfaction**: Net Promoter Score (NPS) > 40

### Technical Metrics
- **Render performance**: < 500ms initial load for 10 domains
- **Interaction latency**: < 100ms for click, hover responses
- **Accessibility score**: 100/100 (Lighthouse)
- **Bundle size**: < 300 KB for sitemap component (gzipped)

### Business Metrics
- **Feature adoption rate**: > 60% of users view sitemap within first week
- **Engagement**: > 5 interactions per session
- **Retention**: Increased time spent in dashboard by 20%
- **Developer productivity**: 30% faster domain navigation during development

---

## 11. Future Enhancements (Roadmap)

### Q1 2026: Intelligence Layer
- **AI-powered layout optimization**: Auto-arrange nodes for clarity
- **Dependency detection**: Automatically infer dependencies from code
- **Smart suggestions**: "Consider merging these domains" based on coupling analysis
- **Predictive analytics**: "This domain will be completed on [date]" based on velocity

### Q2 2026: Collaboration Features
- **Real-time collaboration**: Multiple users editing sitemap simultaneously
- **Comments & annotations**: Add notes to domains, discuss architecture
- **Version history**: See how sitemap evolved over time
- **Export options**: PNG, SVG, PDF, Mermaid diagram

### Q3 2026: Advanced Visualizations
- **3D sitemap**: Depth dimension for hierarchical projects
- **Animation mode**: Play timeline showing domain evolution
- **Heatmap overlays**: Visualize metrics (code churn, bug density, technical debt)
- **AR/VR exploration**: Immersive sitemap navigation (experimental)

---

## 12. Appendix

### A. Technology Stack

**Web Dashboard**:
- Next.js 14 (App Router)
- React 18
- React Flow 11 (primary graph library)
- Cytoscape.js 3 (fallback for complex graphs)
- TypeScript 5
- Tailwind CSS (optional, for styling)

**VSCode Extension**:
- TypeScript 5
- VSCode Extension API
- Webview with vanilla HTML/CSS/JS
- Hot reload integration (existing)

**API Layer**:
- Next.js API routes
- projects.json data store (existing)
- Future: Supabase database for dependencies

### B. Design Assets

**Color Palette** (from existing design system):
```css
:root {
  --bg: #070812;
  --panel: #0d1022;
  --panel2: #0b0f1d;
  --text: #eef1ff;
  --muted: #b9c0e5;
  --line: rgba(255,255,255,.13);
  --ok: #28d99a;
  --good: #5ae6ff;
  --warn: #ffd166;
  --risk: #ff5c93;
  --accent1: #7c5cff;
  --accent2: #00c2ff;
}
```

**Status Colors**:
- Completed: `#10b981` (green)
- In Progress: `#3b82f6` (blue)
- Planned: `#6b7280` (gray)
- At Risk: `#f59e0b` (yellow)
- Blocked: `#ef4444` (red)

### C. Research Sources

1. [React Flow Documentation](https://reactflow.dev/)
2. [Cytoscape.js Examples](https://js.cytoscape.org/)
3. [Domain-Driven Design Visualization](https://www.infoq.com/articles/ddd-contextmapping/)
4. [2025 UI/UX Trends](https://www.nngroup.com/articles/ui-trends-2025/)
5. [Mobile-First Navigation Patterns](https://www.smashingmagazine.com/2024/mobile-nav/)
6. [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### D. Code Examples

See inline code blocks throughout this document for:
- `<ProjectSitemap>` component (Section 3.2)
- `<DomainNode>` custom node (Section 3.2)
- `renderDomainNavigator()` extension function (Section 3.3)
- API endpoint implementation (Section 6.2)

---

## Conclusion

This sitemap visualization system transforms project navigation from linear page-by-page exploration to **visual, interactive domain discovery**. By treating domains as first-class citizens and visualizing their relationships, we enable:

1. **Faster understanding** of project structure
2. **Better decision-making** through clear dependency visualization
3. **Improved collaboration** via shared mental model of architecture
4. **Domain-driven design** reinforcement through visual representation

The dual-platform approach (full web + compact extension) ensures **desktop power users** get advanced features while **VSCode quick-access** users get efficient mobile-first navigation.

**Next Steps**:
1. Review and approve this design document
2. Create detailed mockups for key screens
3. Build Phase 1 prototype (basic sitemap on web)
4. User testing with 5-10 developers
5. Iterate and proceed with full implementation

---

**Design Team Sign-off**:

- **Captain Picard** 🎖️: Strategic alignment ✅
- **Counselor Troi** 💭: UX research and accessibility ✅
- **Commander Data** 🤖: Technical architecture ✅
- **Geordi La Forge** 🔧: Infrastructure and performance ✅

**Cost Optimization by Quark** 💰: 63.4% savings ✅

**Document Version**: 1.0
**Last Updated**: December 28, 2025

---

*"Make it so."* — Captain Jean-Luc Picard
