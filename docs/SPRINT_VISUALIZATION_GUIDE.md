# Sprint Visualization Guide

**Shared Sprint Timeline Component for Web & IDE**

Complete guide to using the sprint visualization system across both web dashboard and VSCode extension.

---

## Overview

The Sprint Visualization system provides a unified, content-reactive timeline view that works identically in:
- ✅ **Web Dashboard** (Production & Local)
- ✅ **VSCode IDE Extension**
- ✅ **Shared Data** via Supabase

### Key Features

1. **Two View Modes**:
   - **Global View**: All active sprints across all projects
   - **Project View**: Sprints for a specific project

2. **Responsive Scaling**:
   - **Full Mode**: Complete timeline with all features (web)
   - **Compact Mode**: Optimized for IDE sidebar (VSCode)

3. **Real-Time Sync**:
   - Changes in web appear in IDE
   - Changes in IDE appear in web
   - Shared Supabase database

4. **Interactive Features**:
   - Click sprint header → Opens sprint details
   - Click story card → Opens story details
   - Filter by status, crew member
   - Refresh to get latest data

---

## Access Points

### Web Dashboard

**All Active Sprints**:
```
Production: https://rag-refresh-product-factory.vercel.app/sprints
Local:      http://localhost:3000/sprints
```

**Project-Specific Sprints**:
```
Production: https://rag-refresh-product-factory.vercel.app/projects/{project-id}/sprints
Local:      http://localhost:3000/projects/{project-id}/sprints
```

### VSCode Extension

**Open Sprint Timeline**:
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
2. Type: `Alex AI: View Sprints`
3. Select:
   - `All Active Sprints` (global view)
   - `Project Sprints` (select project)

**Commands**:
```
Alex AI: View Sprints              → Open sprint timeline
Alex AI: View Project Sprints      → Sprints for specific project
Alex AI: Create Sprint             → Create new sprint
Alex AI: Refresh Sprints           → Reload sprint data
```

---

## Component Structure

### Shared Component: `SprintTimeline.tsx`

Located: `components/SprintTimeline.tsx`

**Props**:
```typescript
interface SprintTimelineProps {
  projectId?: string;           // Filter to project (undefined = all)
  viewMode?: 'compact' | 'full'; // Display density
  showFilters?: boolean;         // Show filter controls
  height?: number;               // Custom height (for IDE)
  onStoryClick?: (story) => void;
  onSprintClick?: (sprint) => void;
}
```

**Usage Examples**:

```tsx
// All active sprints (web)
<SprintTimeline viewMode="full" showFilters={true} />

// Project-specific (web)
<SprintTimeline
  projectId="alex-ai"
  viewMode="full"
  showFilters={true}
/>

// Compact mode (IDE)
<SprintTimeline
  projectId="alex-ai"
  viewMode="compact"
  height={600}
  onStoryClick={(story) => console.log(story)}
/>
```

---

## Visual Layout

### Sprint Card Structure

```
┌─────────────────────────────────────────────────┐
│ Sprint Header (Blue Gradient)                   │
│                                                 │
│ Sprint Name                        21/34 points │
│ 2025-01-01 - 2025-01-14                        │
│                                                 │
│ ████████████░░░░░░ 62% Complete | 5 days left  │
│                                                 │
│ Goals: • Setup • Build UI • Deploy             │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ 👤 Commander Data                    13 pts     │
│ ┌─────┐ ┌─────┐ ┌─────┐                        │
│ │Story│ │Story│ │Story│ →                      │
│ │ #1  │ │ #2  │ │ #3  │                        │
│ └─────┘ └─────┘ └─────┘                        │
├─────────────────────────────────────────────────┤
│ 👤 Counselor Troi                     8 pts     │
│ ┌─────┐ ┌─────┐                                │
│ │Story│ │Story│ →                              │
│ │ #4  │ │ #5  │                                │
│ └─────┘ └─────┘                                │
└─────────────────────────────────────────────────┘
```

### Story Card (180px × 100px)

```
┌────────────────────┐
│ in_progress  5 pts │
│                    │
│ Build sprint API   │
│ endpoints          │
│                    │
│ dev_story      P1  │
└────────────────────┘
```

### Compact Mode (IDE - 140px × 80px)

```
┌──────────────┐
│ progress 5pts│
│              │
│ Build API    │
│              │
│ dev      P1  │
└──────────────┘
```

---

## Navigation Integration

### Web Dashboard Header

Add to main navigation:

```tsx
// In components/Header.tsx or layout
<nav>
  <a href="/">Dashboard</a>
  <a href="/projects">All Projects</a>
  <a href="/sprints">🚀 Active Sprints</a>  {/* NEW */}
</nav>
```

### Project Pages

Add "View Sprints" button to project cards:

```tsx
// In project card component
<div className="project-card">
  <h3>{project.name}</h3>
  <div className="actions">
    <a href={`/projects/${project.id}`}>View Details</a>
    <a href={`/projects/${project.id}/sprints`}>View Sprints</a>
  </div>
</div>
```

### VSCode Extension

Commands registered in `package.json`:

```json
{
  "contributes": {
    "commands": [
      {
        "command": "alexAI.viewSprints",
        "title": "Alex AI: View Sprints"
      },
      {
        "command": "alexAI.viewProjectSprints",
        "title": "Alex AI: View Project Sprints"
      },
      {
        "command": "alexAI.createSprint",
        "title": "Alex AI: Create Sprint"
      }
    ]
  }
}
```

---

## Data Flow

### Shared Data Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Supabase Database                   │
│                                                      │
│  ┌──────────┐  ┌─────────┐  ┌───────────┐         │
│  │ sprints  │  │ stories │  │ personas  │         │
│  └──────────┘  └─────────┘  └───────────┘         │
└──────────────────────────────────────────────────────┘
              ▲                          ▲
              │                          │
    ┌─────────┴─────────┐      ┌────────┴────────┐
    │                   │      │                 │
┌───▼────────────┐  ┌───▼────────────┐  ┌───────▼──────┐
│ Web Dashboard  │  │ VSCode Extension│  │  Mobile App  │
│                │  │                 │  │  (Future)    │
│ Production     │  │ Local Dev       │  │              │
│ Local Dev      │  │                 │  │              │
└────────────────┘  └─────────────────┘  └──────────────┘
```

### API Endpoints Used

```typescript
// Fetch sprints
GET /api/sprints?project_id={id}&status=active&include_stories=true

// Create sprint
POST /api/sprints
{
  "project_id": "alex-ai",
  "name": "Sprint 1",
  "start_date": "2025-01-01",
  "end_date": "2025-01-14",
  ...
}

// Update story status
PATCH /api/stories/{id}
{
  "status": "in_progress",
  "assigned_crew_member": "data"
}

// Get AI crew assignment
POST /api/stories/{id}/assign
```

---

## Environment Configuration

### Web Dashboard

Set environment in `.env.local`:

```bash
# Use production API
NEXT_PUBLIC_API_URL=https://rag-refresh-product-factory.vercel.app/api

# Or use local API
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### VSCode Extension

Set in VSCode settings (`.vscode/settings.json`):

```json
{
  "alexAI.environment": "local",
  "alexAI.production.apiUrl": "https://rag-refresh-product-factory.vercel.app/api",
  "alexAI.local.apiUrl": "http://localhost:3000/api"
}
```

**Switch Environment**:
1. `Cmd+Shift+P` → `Alex AI: Switch Environment`
2. Select: `Production` or `Local`

---

## Usage Examples

### Example 1: View All Active Sprints

**Web**:
```bash
# Open in browser
open https://rag-refresh-product-factory.vercel.app/sprints
```

**VSCode**:
```
Cmd+Shift+P → "Alex AI: View Sprints"
```

### Example 2: View Project Sprints

**Web**:
```bash
# Navigate to project, then click "View Sprints"
open http://localhost:3000/projects/alex-ai/sprints
```

**VSCode**:
```
Cmd+Shift+P → "Alex AI: View Project Sprints" → Select "alex-ai"
```

### Example 3: Create Sprint via API

```bash
curl -X POST "http://localhost:3000/api/sprints" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "alex-ai",
    "name": "Sprint 1 - Foundation",
    "sprint_number": 1,
    "start_date": "2025-01-01",
    "end_date": "2025-01-14",
    "goals": ["Setup sprint system", "Build timeline UI"],
    "velocity_target": 34
  }'
```

Then refresh both web and IDE to see the new sprint.

### Example 4: Side-by-Side Comparison

1. **Open Web Dashboard**:
   ```bash
   open http://localhost:3000/sprints
   ```

2. **Open VSCode Sprint Panel**:
   ```
   Cmd+Shift+P → "Alex AI: View Sprints"
   ```

3. **Tile Windows**:
   - Left: Web browser
   - Right: VSCode with sprint panel

4. **Create Sprint** in web → See it appear in VSCode
5. **Update Story** in VSCode → See it update in web

---

## Customization

### Theme Customization

The component uses CSS variables that adapt to both web and IDE themes:

```css
/* Web (Tailwind) */
.sprint-timeline {
  --color-primary: #2563eb;
  --color-success: #10b981;
  --color-warning: #f59e0b;
}

/* VSCode (uses VSCode theme variables) */
.sprint-timeline {
  color: var(--vscode-foreground);
  background: var(--vscode-editor-background);
  border-color: var(--vscode-panel-border);
}
```

### Size Customization

```tsx
// Small (IDE sidebar)
<SprintTimeline viewMode="compact" height={400} />

// Medium (IDE main panel)
<SprintTimeline viewMode="compact" height={600} />

// Large (web full screen)
<SprintTimeline viewMode="full" />
```

---

## Troubleshooting

### Sprint Timeline Not Loading

**Check API Connection**:
```bash
# Test endpoint
curl http://localhost:3000/api/sprints?status=active

# Should return JSON with sprints array
```

**Check Environment**:
- Web: Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- IDE: Check `alexAI.environment` in VSCode settings

### Stories Not Appearing

**Verify Sprint Has Stories**:
```bash
curl "http://localhost:3000/api/sprints?include_stories=true"
```

**Check Story Status**:
- Filter may be excluding stories
- Try changing status filter to "All"

### Sync Issues Between Web and IDE

**Force Refresh**:
- Web: Click "Refresh" button
- IDE: `Cmd+Shift+P` → `Alex AI: Refresh Sprints`

**Check Shared Database**:
```bash
# Verify migration applied
node scripts/alex-ai/auto-migrate.mjs --verify-only
```

---

## Performance Optimization

### Web Dashboard

- Pagination: Limit sprints per page
- Lazy Loading: Load stories on demand
- Caching: Cache sprint data for 30 seconds

### VSCode Extension

- Retain Context: `retainContextWhenHidden: true`
- Debounce Refresh: Wait 500ms before refetching
- Virtual Scrolling: For large story lists

---

## Keyboard Shortcuts

### Web Dashboard

| Shortcut | Action |
|----------|--------|
| `r` | Refresh sprints |
| `n` | New sprint |
| `f` | Focus filter |
| `?` | Show help |

### VSCode Extension

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+P` → `Alex AI: View Sprints` | Open sprint panel |
| `Cmd+R` | Refresh (in panel) |
| `Escape` | Close panel |

---

## Next Steps

1. **Update Extension**:
   ```bash
   cd vscode-extension && npm run dev:reload
   ```

2. **Open Both Views**:
   - Web: http://localhost:3000/sprints
   - IDE: `Cmd+Shift+P` → `Alex AI: View Sprints`

3. **Create Test Sprint**:
   ```bash
   ./scripts/test-api-examples.sh
   ```

4. **Verify Sync**:
   - Create sprint in web
   - Refresh in IDE
   - Verify it appears

---

## API Reference

See complete API documentation: `docs/SPRINT_API.md`

**Quick Links**:
- Sprint CRUD: `/api/sprints`
- Story CRUD: `/api/stories`
- AI Assignment: `/api/stories/[id]/assign`

---

**Generated**: December 28, 2025
**Purpose**: Unified sprint visualization across web and IDE
**Status**: Ready for use
