# Sitemap Visualization - Quick Reference Guide

## One-Page Summary

### What is it?
Interactive visual maps showing project structure, domain relationships, and navigation paths across the Alex AI application factory.

### Where does it appear?

**Web Dashboard** (`rag.pbradygeorgen.com`):
- Full page: `/projects/[id]/sitemap`
- Bento box widget: Draggable card on dashboard
- Integration: Linked from project detail page, timeline view

**VSCode Extension**:
- New tab: "Map" 🗺️ in bottom navigation
- Compact cards: Vertical scroll list of domains
- Tap interactions: Expand for details

---

## Key Features at a Glance

### Web Dashboard Sitemap
```
┌─────────────────────────────────────────┐
│ Interactive Graph View                  │
│ • Drag nodes to rearrange               │
│ • Zoom in/out with scroll               │
│ • Click node → Domain details           │
│ • Hover → Quick preview                 │
│                                          │
│  ┌──────┐      ┌──────┐                │
│  │Node 1│─────▶│Node 2│                │
│  └──────┘      └──────┘                │
│                                          │
│ [Graph] [Tree] [Matrix] 🔍 Search      │
└─────────────────────────────────────────┘
```

### VSCode Extension Navigator
```
┌────────────────────────┐
│ 🗺️ Domain Navigator    │
├────────────────────────┤
│ 1️⃣ Core Editor         │
│ ▓▓▓▓▓▓▓░░░ 65%        │
│ D:9 M:8 U:7           │
│ ✅ In Progress         │
├────────────────────────┤
│ 2️⃣ AI Engine           │
│ ▓▓▓▓▓░░░░░ 50%        │
│ D:8 M:9 U:8           │
│ ⚡ In Progress         │
└────────────────────────┘
```

---

## Visual Legend

### Domain Status Colors
- 🟢 **Green (#10b981)**: Completed
- 🔵 **Blue (#3b82f6)**: In Progress
- ⚪ **Gray (#6b7280)**: Planned
- 🟡 **Yellow (#f59e0b)**: At Risk
- 🔴 **Red (#ef4444)**: Blocked

### Status Icons
- ✅ Completed
- ⚡ In Progress
- 📅 Planned
- ⚠️ At Risk
- 🚫 Blocked

### Score Indicators
- **D**: Demand (1-10)
- **M**: Monetization (1-10)
- **U**: Unique/Differentiation (1-10)
- **E**: Effort (1-10)
- **R**: Risk (1-10)

---

## View Modes (Web Only)

### 1. Graph View (Default)
Force-directed network showing domains as nodes, dependencies as arrows
- **Best for**: Understanding relationships
- **Layout**: Auto-arranged based on connections
- **Interactions**: Drag, zoom, pan

### 2. Tree View
Hierarchical tree with expand/collapse branches
- **Best for**: Parent-child relationships
- **Layout**: Top-down or left-right
- **Interactions**: Click to expand/collapse

### 3. Matrix View
Dependency matrix (rows = domains, columns = domains)
- **Best for**: Finding circular dependencies
- **Layout**: Grid with checkmarks
- **Interactions**: Click cell to see dependency details

---

## Common Workflows

### Web Dashboard

#### View Project Sitemap
1. Navigate to `/projects/[id]`
2. Click "Architecture" card
3. Or go directly to `/projects/[id]/sitemap`

#### Explore Domain
1. Click domain node in sitemap
2. Side panel opens with details
3. Click "View Domain Page" to navigate

#### Find Dependencies
1. Hover over domain node
2. Connections highlight
3. Click arrow to see dependency details

#### Search Domains
1. Use search box (top-right)
2. Type domain name or keyword
3. Graph filters to matching nodes

### VSCode Extension

#### Open Domain Navigator
1. Click "Map" 🗺️ in bottom nav
2. View list of domains
3. Scroll to browse

#### Expand Domain
1. Tap domain card
2. Card expands to show features
3. Tap again to collapse

#### View in Web Dashboard
1. Long-press domain card
2. Select "View in Web Dashboard"
3. Opens browser to full sitemap

---

## Data Model

### Domain with Dependencies
```json
{
  "slug": "ai-engine",
  "name": "AI Engine",
  "status": "in-progress",
  "progress": 50,
  "dependencies": [
    {
      "domainSlug": "user-management",
      "type": "shared-model",
      "description": "Uses User model for API keys"
    }
  ]
}
```

### Dependency Types
- **data-flow**: One domain sends data to another
- **shared-model**: Domains use common data structure
- **event-trigger**: Event in one domain triggers action in another
- **technical**: Technical dependency (e.g., library, infrastructure)

---

## API Endpoints

### Get Sitemap Data
```
GET /api/projects/[id]/sitemap

Response:
{
  "nodes": [...],
  "edges": [...],
  "layout": "force-directed"
}
```

### Update Domain Dependencies
```
PATCH /api/projects/[id]/domains/[slug]

Body:
{
  "dependencies": [...]
}
```

---

## Keyboard Shortcuts (Web)

- **Tab**: Navigate between nodes
- **Arrow Keys**: Move selected node
- **Enter**: Open domain details
- **Esc**: Close side panel
- **Ctrl/Cmd + F**: Focus search
- **Ctrl/Cmd + +/-**: Zoom in/out
- **Space + Drag**: Pan graph

---

## Accessibility

- **Screen readers**: Full ARIA labels on nodes, edges
- **Keyboard navigation**: All interactions accessible via keyboard
- **Color contrast**: Meets WCAG 2.1 AA (4.5:1 ratio)
- **Focus indicators**: Clear outlines on focused elements

---

## Performance Tips

### For Large Projects (10+ domains)
- Use search to filter nodes
- Switch to Tree view for better performance
- Zoom in on specific area instead of viewing all at once

### For Complex Dependencies
- Use Matrix view to see all at a glance
- Click edges individually to understand relationships
- Export to PNG for offline analysis

---

## Troubleshooting

**Q: Graph is too cluttered**
A: Use search to filter, or switch to Tree view

**Q: Can't find a specific domain**
A: Use search box (Ctrl/Cmd + F) and type domain name

**Q: Dependencies not showing**
A: Check that domains have `dependencies` array in data

**Q: Extension sitemap not syncing**
A: Extension syncs every 5 seconds via hot reload. Check connection to web dashboard.

**Q: Performance is slow**
A: Reduce number of visible nodes using search/filter, or upgrade to React Flow Pro for WebGL rendering

---

## Quick Implementation Checklist

### Phase 1: Basic Sitemap (Web)
- [ ] Install React Flow library
- [ ] Create `/projects/[id]/sitemap` route
- [ ] Build `<ProjectSitemap>` component
- [ ] Implement graph layout
- [ ] Add domain nodes with status colors
- [ ] Add dependency arrows
- [ ] Test with 5+ domains

### Phase 2: Advanced Features (Web)
- [ ] Add search/filter
- [ ] Implement side panel for domain details
- [ ] Add Tree view and Matrix view
- [ ] Integrate with timeline
- [ ] Add microinteractions (hover, click animations)
- [ ] WCAG 2.1 AA compliance audit

### Phase 3: VSCode Extension
- [ ] Add "Map" tab to bottom nav
- [ ] Build domain card list
- [ ] Implement tap-to-expand
- [ ] Show dependencies
- [ ] Sync with web dashboard
- [ ] Test on narrow panel width

---

## Resources

- **Design Document**: `/SITEMAP_VISUALIZATION_DESIGN.md`
- **React Flow Docs**: https://reactflow.dev/
- **Cytoscape.js**: https://js.cytoscape.org/
- **Project Data**: `/data/projects.json`
- **API Routes**: `/app/api/projects/[id]/sitemap/route.ts`

---

## Contact & Feedback

For questions or suggestions about sitemap visualization:
- Create issue in project repo
- Ping in team chat
- Dogfooding feedback: Use Alex AI crew system to suggest improvements

---

**Last Updated**: December 28, 2025
**Version**: 1.0
