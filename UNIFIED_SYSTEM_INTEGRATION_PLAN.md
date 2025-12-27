# Alex AI - Unified System Integration Plan

**Goal**: Create a seamless, crew-coordinated system that unifies dashboard, VSCode extension, and sitemap functionality with AI-powered mission assignments.

## Current State Analysis

### ✅ What Works
1. **VSCode Extension** - Full-featured AI assistant with:
   - 8 crew member personas
   - Chat interface (sidebar + native)
   - File operations (read/write/patch)
   - Project/sprint browsing
   - Code analysis & completions

2. **Dashboard** (rag.pbradygeorgen.com) - Next.js app with:
   - Project CRUD (/projects/new, /projects/[id])
   - Sprint management
   - Crew member coordination
   - API endpoints at /api/*

3. **Sitemap System** - WordPress XML → Mermaid visualization:
   - Parses WordPress sitemaps
   - Generates interactive Mermaid diagrams
   - Thought Map with drill-down
   - Located in dist/sitemap/

4. **Worf Security** - AI-powered secrets management:
   - Bash CLI + TypeScript agent
   - API endpoint at /api/crew/worf
   - n8n workflow integration

5. **RBAC System** - Role-based access control:
   - Database schema designed
   - Middleware ready
   - API routes created (route.v2.ts)
   - **PENDING**: Migration not yet applied

### ❌ What's Missing

1. **Image/OCR in VSCode Extension**
   - No vision model integration
   - No image paste/upload
   - No OCR capabilities

2. **Unified UI**
   - Dashboard and extension have different visual styles
   - No shared component library
   - Disconnected state management

3. **Sitemap ↔ Project Integration**
   - Sitemaps exist independently
   - No project-to-sitemap generation
   - No sitemap-to-project import

4. **Crew Mission System**
   - No formal mission assignment
   - No crew hierarchy for task delegation
   - No progress tracking per crew member

5. **Extension ↔ Dashboard Sync**
   - One-way communication (extension reads from dashboard)
   - No real-time updates
   - No collaborative editing

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Alex AI Unified System                      │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Dashboard  │    │   VSCode     │    │   n8n        │
│   (Next.js)  │◄──►│  Extension   │◄──►│  Workflows   │
└──────┬───────┘    └──────┬───────┘    └──────────────┘
       │                   │
       │    Supabase DB    │
       │   ┌───────────┐   │
       └──►│  Shared   │◄──┘
           │  State    │
           └─────┬─────┘
                 │
          ┌──────┴──────┐
          │             │
     Projects      Missions
     Sitemaps      Crew Data
     RBAC          Files
```

## Phase 1: Complete Foundation (Today)

### 1.1 Apply Supabase RBAC Migration ✓ (15 min)

**Action**: Apply the simplified migration SQL

```bash
# Option A: Via Supabase CLI
supabase db push

# Option B: Via dashboard (manual paste)
# Use: supabase/migrations/001_simple_rbac.sql
```

**Verification**:
```bash
npm run db:verify:quick
curl http://localhost:3001/api/dev/test-auth
```

### 1.2 Update Worf to Use .env.local (10 min)

**Issue**: Worf validates against .secrets vault but credentials are in .env.local

**Fix**: Modify `scripts/worf/worf.sh` to check .env.local first

### 1.3 Verify Extension ↔ Dashboard Communication (10 min)

**Test**:
```typescript
// In VSCode extension
- Open Chat
- Select project
- Verify sprint data loads
- Test crew member chat
```

## Phase 2: Add Image/OCR to Extension (2-3 hours)

### 2.1 Add Vision Model Support

**Location**: `vscode-extension/src/client.ts`

```typescript
interface VisionCapableModel {
  id: string;
  name: string;
  vision: boolean;
  cost: number;
}

const VISION_MODELS = [
  'anthropic/claude-3.5-sonnet',
  'openai/gpt-4-vision-preview',
  'google/gemini-pro-vision'
];

async function analyzeImage(
  imageData: string, // base64
  prompt: string,
  model: string = 'anthropic/claude-3.5-sonnet'
): Promise<string> {
  // OpenRouter vision API call
}
```

### 2.2 Add Image Paste Handler

**Location**: `vscode-extension/src/chatView.ts`

```typescript
// In webview HTML
<input
  type="file"
  id="imageUpload"
  accept="image/*"
  style="display:none"
/>
<button onclick="document.getElementById('imageUpload').click()">
  📷 Add Image
</button>

// In webview script
window.addEventListener('paste', async (e) => {
  const items = e.clipboardData?.items;
  for (let item of items) {
    if (item.type.indexOf('image') !== -1) {
      const blob = item.getAsFile();
      const base64 = await blobToBase64(blob);
      vscode.postMessage({
        command: 'analyzeImage',
        image: base64
      });
    }
  }
});
```

### 2.3 Add OCR Capability

**Dependencies**: Tesseract.js or Vision API

```typescript
import Tesseract from 'tesseract.js';

async function extractTextFromImage(imageData: string): Promise<string> {
  const { data: { text } } = await Tesseract.recognize(imageData, 'eng');
  return text;
}
```

### 2.4 Chat Integration

**Usage in Chat**:
```
User: [pastes screenshot of code]
Alex AI: I can see this code snippet. Let me analyze it...
[OCR extracts text]
[Vision model analyzes context]
[Crew member provides recommendation]
```

## Phase 3: Sitemap ↔ Project Integration (3-4 hours)

### 3.1 Add Sitemap to Project Model

**Location**: `lib/projects.ts`

```typescript
interface Project {
  // ... existing fields
  sitemap?: {
    url?: string; // Original sitemap URL
    generated_at?: string;
    nodes: SitemapNode[];
    structure: 'wordpress' | 'nextjs' | 'custom';
  };
}

interface SitemapNode {
  id: string;
  url: string;
  title: string;
  type: 'page' | 'post' | 'category' | 'asset';
  children: string[]; // Node IDs
  metadata: Record<string, any>;
}
```

### 3.2 Sitemap Generation API

**Location**: `app/api/projects/[id]/sitemap/route.ts`

```typescript
export async function GET(req, { params }) {
  const project = await loadProject(params.id);

  // Generate sitemap from project structure
  const sitemap = await generateSitemapFromProject(project);

  return NextResponse.json({ sitemap });
}

export async function POST(req, { params }) {
  const { sitemapUrl } = await req.json();

  // Import sitemap into project
  const parsed = await parseSitemap(sitemapUrl);
  await updateProjectSitemap(params.id, parsed);

  return NextResponse.json({ success: true });
}
```

### 3.3 Sitemap Visualization Component

**Location**: `app/projects/[id]/sitemap/page.tsx`

```typescript
'use client';

export default function ProjectSitemapPage({ params }) {
  const [sitemap, setSitemap] = useState(null);

  useEffect(() => {
    fetch(`/api/projects/${params.id}/sitemap`)
      .then(res => res.json())
      .then(data => setSitemap(data.sitemap));
  }, [params.id]);

  return (
    <div className="sitemap-container">
      <h1>Project Sitemap</h1>
      <MermaidDiagram data={sitemap} interactive />
      <SitemapEditor sitemap={sitemap} onChange={setSitemap} />
    </div>
  );
}
```

### 3.4 WordPress Sitemap Import

**Location**: `app/projects/new/from-sitemap/page.tsx`

```typescript
export default function NewProjectFromSitemap() {
  const [sitemapUrl, setSitemapUrl] = useState('');

  async function importSitemap() {
    // Parse WordPress sitemap
    const sitemap = await parseSitemap(sitemapUrl);

    // Analyze structure with AI
    const analysis = await analyzeWithCrew(sitemap, 'data');

    // Generate project
    const project = await createProject({
      name: extractSiteName(sitemap),
      sitemap,
      domains: inferDomainsFromSitemap(sitemap)
    });

    router.push(`/projects/${project.id}`);
  }

  return (
    <form onSubmit={importSitemap}>
      <input
        placeholder="WordPress Sitemap URL"
        value={sitemapUrl}
        onChange={e => setSitemapUrl(e.target.value)}
      />
      <button>Import & Analyze</button>
    </form>
  );
}
```

### 3.5 VSCode Extension Integration

**Location**: `vscode-extension/src/sitemapView.ts`

```typescript
export class SitemapViewProvider {
  async showProjectSitemap(projectId: string) {
    const sitemap = await this.client.get(`/projects/${projectId}/sitemap`);

    this.panel.webview.html = this.getWebviewContent(sitemap);
  }

  private getWebviewContent(sitemap: Sitemap): string {
    return `
      <div id="sitemap">
        ${this.renderMermaid(sitemap)}
        <div class="controls">
          <button onclick="zoomIn()">+</button>
          <button onclick="zoomOut()">-</button>
          <button onclick="exportSVG()">Export</button>
        </div>
      </div>
    `;
  }
}
```

## Phase 4: Crew Mission System (4-5 hours)

### 4.1 Mission Database Schema

**Location**: `supabase/migrations/005_crew_missions.sql`

```sql
CREATE TABLE crew_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT REFERENCES crew_members(crew_id),
  assigned_by UUID REFERENCES auth_profiles(id),
  status TEXT CHECK (status IN ('pending', 'in_progress', 'review', 'completed', 'blocked')),
  priority INTEGER CHECK (priority BETWEEN 1 AND 5),
  dependencies TEXT[], -- Mission IDs
  artifacts JSONB DEFAULT '[]'::jsonb, -- Files created/modified
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mission_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID REFERENCES crew_missions(id),
  crew_id TEXT REFERENCES crew_members(crew_id),
  role TEXT CHECK (role IN ('lead', 'support', 'reviewer')),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

### 4.2 Mission Assignment API

**Location**: `app/api/missions/route.ts`

```typescript
export async function POST(req: NextRequest) {
  const { projectId, title, description, assignTo } = await req.json();

  // Create mission
  const mission = await supabase.from('crew_missions').insert({
    project_id: projectId,
    title,
    description,
    assigned_to: assignTo,
    status: 'pending',
    priority: calculatePriority(description) // AI-powered
  }).select().single();

  // Notify crew member via n8n
  await notifyCrewMember(assignTo, mission);

  return NextResponse.json({ mission });
}
```

### 4.3 Crew Hierarchy & Auto-Assignment

**Location**: `lib/crew/mission-coordinator.ts`

```typescript
export class MissionCoordinator {
  private hierarchy = {
    picard: { level: 1, can_assign: ['riker', 'data', 'laforge', 'troi', 'worf'] },
    riker: { level: 2, can_assign: ['data', 'laforge', 'worf', 'obrien'] },
    data: { level: 3, can_assign: ['laforge', 'obrien'] },
    // ...
  };

  async assignMission(task: string, context: any) {
    // AI analysis of task
    const analysis = await this.analyzeTask(task);

    // Find best crew member
    const crew = this.selectOptimalCrew(analysis);

    // Check hierarchy
    if (!this.canAssign(context.requestedBy, crew)) {
      return this.escalate(task, crew, context.requestedBy);
    }

    // Create mission
    return this.createMission(task, crew, analysis);
  }

  private selectOptimalCrew(analysis: TaskAnalysis): string {
    const scores = {};
    for (const [crewId, member] of Object.entries(CREW_MEMBERS)) {
      scores[crewId] = this.scoreMatch(member.expertise, analysis.requirements);
    }
    return Object.keys(scores).sort((a, b) => scores[b] - scores[a])[0];
  }
}
```

### 4.4 Mission UI in Extension

**Location**: `vscode-extension/src/missionTree.ts`

```typescript
export class MissionTreeProvider implements vscode.TreeDataProvider<Mission> {
  async getChildren(element?: Mission): Promise<Mission[]> {
    if (!element) {
      // Show all active missions
      return this.service.getMyMissions();
    }

    // Show mission details
    return this.service.getMissionSteps(element.id);
  }

  getTreeItem(mission: Mission): vscode.TreeItem {
    return {
      label: mission.title,
      description: mission.assigned_to,
      iconPath: this.getCrewIcon(mission.assigned_to),
      contextValue: 'mission',
      command: {
        command: 'alexAi.openMission',
        arguments: [mission]
      }
    };
  }
}
```

### 4.5 Mission Execution in Chat

**Usage**:
```
User: @alex I need to refactor the authentication system
Riker: I'll coordinate this mission. Let me assign the team...
[AI analyzes task]
Riker: This requires security expertise. Assigning to Worf as lead, Data for architecture review.
[Creates missions]
Riker: Mission assigned: AUTH-001
- Lead: Worf (security implementation)
- Support: Data (architecture guidance)
- Reviewer: Picard (final approval)
Would you like to view the mission plan?
```

## Phase 5: UI Unification (3-4 hours)

### 5.1 Shared Design System

**Location**: `lib/ui/design-tokens.ts`

```typescript
export const designTokens = {
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    crew: {
      picard: '#1e40af',
      riker: '#7c2d12',
      data: '#fbbf24',
      // ...
    }
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  }
};
```

### 5.2 Extension Webview Styles

**Location**: `vscode-extension/src/chatView.ts`

```typescript
private getWebviewContent(): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          :root {
            --color-primary: ${designTokens.colors.primary};
            --color-secondary: ${designTokens.colors.secondary};
            --font-family: ${designTokens.typography.fontFamily};
          }

          body {
            font-family: var(--font-family);
            /* Mirror dashboard styles */
          }

          .crew-badge {
            background: var(--color-crew-${crewId});
            /* Identical to dashboard */
          }
        </style>
      </head>
      <body>
        ${this.renderChatUI()}
      </body>
    </html>
  `;
}
```

### 5.3 Component Mirroring

**Shared Components**:
- Crew badges
- Message bubbles
- Project cards
- Sprint boards
- Mission cards
- File tree
- Loading states

**Implementation**: Extract dashboard components, export CSS, import in extension

## Phase 6: Real-Time Sync (2-3 hours)

### 6.1 WebSocket Server

**Location**: `app/api/ws/route.ts`

```typescript
export async function GET(req: NextRequest) {
  const { socket, response } = await upgradeWebSocket(req);

  socket.on('message', async (msg) => {
    const data = JSON.parse(msg);

    switch (data.type) {
      case 'subscribe_project':
        await subscribeToProject(socket, data.projectId);
        break;
      case 'mission_update':
        await broadcastMissionUpdate(data);
        break;
      case 'file_changed':
        await notifyFileChange(data);
        break;
    }
  });

  return response;
}
```

### 6.2 Extension WebSocket Client

**Location**: `vscode-extension/src/syncService.ts`

```typescript
export class SyncService {
  private ws: WebSocket;

  connect() {
    this.ws = new WebSocket('ws://localhost:3001/api/ws');

    this.ws.on('message', (data) => {
      const event = JSON.parse(data);
      this.handleEvent(event);
    });
  }

  subscribeToProject(projectId: string) {
    this.ws.send(JSON.stringify({
      type: 'subscribe_project',
      projectId
    }));
  }

  private handleEvent(event: any) {
    switch (event.type) {
      case 'mission_assigned':
        this.refreshMissions();
        vscode.window.showInformationMessage(
          `New mission assigned: ${event.mission.title}`
        );
        break;
      case 'project_updated':
        this.refreshProject(event.projectId);
        break;
    }
  }
}
```

## Implementation Timeline

### Today (Day 1): Foundation
- [x] Apply Supabase RBAC migration
- [ ] Fix Worf validation
- [ ] Test extension ↔ dashboard communication
- [ ] Plan image/OCR integration

### Day 2-3: Image & Sitemap
- [ ] Add vision model support
- [ ] Implement image paste/OCR
- [ ] Create sitemap ↔ project integration
- [ ] Build sitemap import flow

### Day 4-5: Crew Missions
- [ ] Design mission database schema
- [ ] Build mission assignment API
- [ ] Create mission coordinator
- [ ] Add mission UI to extension

### Day 6-7: UI & Sync
- [ ] Extract shared design system
- [ ] Unify extension webview styles
- [ ] Implement WebSocket sync
- [ ] Polish and test

## Success Criteria

1. ✅ User can paste image in VSCode chat and get OCR + AI analysis
2. ✅ User can import WordPress sitemap and create Alex AI project
3. ✅ User can view project sitemap in both dashboard and extension
4. ✅ User can receive crew mission assignments in extension
5. ✅ UI looks consistent between dashboard and extension
6. ✅ Changes in dashboard appear in extension in real-time
7. ✅ Crew members can coordinate on missions via hierarchy

## Next Immediate Steps

1. **Apply Supabase Migration** (manual via dashboard)
2. **Test Current System** (verify extension works)
3. **Begin Image/OCR Integration** (add vision models)
4. **Create Sitemap Integration** (import flow)

---

Ready to begin implementation!
