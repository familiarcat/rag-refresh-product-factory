# Sprint Timeline Design: UI/UX Specifications

**Design Date:** December 28, 2025
**Design Team:** Counselor Troi (UX Lead), Commander Data (Component Architecture), Geordi La Forge (Performance)
**Status:** Design Phase - Ready for Implementation

---

## Executive Summary

This document specifies the complete UI/UX design for the **SprintTimeline** component, a horizontal interactive timeline for sprint visualization and management. The design integrates with the existing **ProjectTimeline** component while adding crew-based swimlanes, drag-and-drop story management, and persona-driven filtering.

**Key Features:**
- **Horizontal swimlane timeline** (one row per crew member)
- **Interactive story cards** with drag-and-drop reassignment
- **Sprint boundary visualization** with start/end dates
- **Filtering** by sprint, crew, persona, status
- **Story detail panel** (side drawer)
- **Mobile-responsive** design for VSCode extension
- **Integration** with existing ProjectTimeline component

---

## Design Principles

### 1. Performance First
- **Target:** <50ms interactions, <200ms API calls
- **Inspiration:** Linear's speed-obsessed approach
- **Techniques:**
  - Virtual scrolling for 100+ stories
  - Optimistic UI updates
  - Debounced drag operations
  - Lazy loading for story details

### 2. Clarity Over Complexity
- **Target:** User understands the sprint at a glance
- **Inspiration:** Linear's minimalism
- **Techniques:**
  - Clean typography (system fonts)
  - Subtle colors (avoid visual noise)
  - Generous whitespace
  - Clear visual hierarchy

### 3. Mobile-First (VSCode Extension)
- **Target:** Works in narrow VSCode panels (300px+)
- **Techniques:**
  - Horizontal scrolling for timeline
  - Collapsible swimlanes
  - Touch-friendly drag targets (44px minimum)
  - Responsive breakpoints

### 4. Keyboard Accessibility
- **Target:** Power users can navigate without mouse
- **Inspiration:** Linear's keyboard shortcuts
- **Techniques:**
  - Arrow keys to navigate stories
  - Enter to open story details
  - Cmd+K command palette
  - Tab navigation for all controls

---

## Component Architecture

### Component Hierarchy

```
SprintTimeline (parent)
├── SprintHeader
│   ├── SprintSelector (dropdown)
│   ├── SprintInfo (name, dates, progress)
│   └── SprintActions (filters, settings)
├── TimelineAxis (months/weeks)
├── SwimlanesContainer
│   ├── CrewSwimlane (repeats per crew member)
│   │   ├── SwimlaneHeader (crew name, avatar, story count)
│   │   ├── StoryTrack (horizontal stories container)
│   │   │   └── StoryCard (repeats per story)
│   │   │       ├── StoryBadge (status, points)
│   │   │       ├── StoryTitle
│   │   │       ├── StoryMeta (persona, labels)
│   │   │       └── StoryActions (quick actions)
│   │   └── AddStoryButton
│   └── UnassignedSwimlane (stories without crew)
├── StoryDetailPanel (side drawer, overlay)
│   ├── StoryHeader (title, status, actions)
│   ├── StoryMeta (persona, crew, points, etc.)
│   ├── StoryDescription
│   ├── AcceptanceCriteria
│   ├── Comments/Activity
│   └── RelatedStories
└── CommandPalette (Cmd+K overlay)
```

### Integration with ProjectTimeline

The SprintTimeline **complements** the existing ProjectTimeline component:

| Component | Purpose | View Type | Time Granularity | Use Case |
|-----------|---------|-----------|------------------|----------|
| **ProjectTimeline** | High-level milestones | Horizontal timeline | Weeks/Months | Project roadmap, stakeholder communication |
| **SprintTimeline** | Detailed sprint work | Horizontal swimlanes | Days/Weeks | Sprint planning, team coordination |

**Shared Elements:**
- Timeline axis (months/weeks markers)
- Color palette (STATUS_COLORS)
- Drag-and-drop patterns
- Responsive design

**Differences:**
- ProjectTimeline: Milestone-centric, no swimlanes
- SprintTimeline: Story-centric, crew swimlanes

---

## Detailed UI Specifications

### 1. SprintTimeline Container

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│  SPRINT HEADER                                                 │
│  Sprint 12 | Jan 6-17, 2026 | 60% Complete | [Filters] [⚙️] │
├────────────────────────────────────────────────────────────────┤
│  TIMELINE AXIS                                                 │
│  Jan 6 | Jan 8 | Jan 10 | Jan 12 | Jan 14 | Jan 16 | Jan 17  │
├────────────────────────────────────────────────────────────────┤
│  SWIMLANES (scrollable vertically and horizontally)           │
│                                                                 │
│  👤 Counselor Troi (3 stories, 13 pts) ▼                      │
│  ┌──────┐  ┌──────┐  ┌──────┐                                │
│  │Story1│  │Story2│  │Story3│           [+ Add Story]        │
│  └──────┘  └──────┘  └──────┘                                │
│                                                                 │
│  👤 Commander Data (5 stories, 21 pts) ▼                      │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐           │
│  │Story4│  │Story5│  │Story6│  │Story7│  │Story8│  [+ Add]  │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘           │
│                                                                 │
│  👤 Geordi La Forge (2 stories, 8 pts) ▼                      │
│  ┌──────┐  ┌──────┐                                           │
│  │Story9│  │Story│                       [+ Add Story]        │
│  └──────┘  └──────┘                                           │
│                                                                 │
│  📦 Unassigned (4 stories, 17 pts) ▼                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                     │
│  │Story │  │Story │  │Story │  │Story │                     │
│  └──────┘  └──────┘  └──────┘  └──────┘                     │
└────────────────────────────────────────────────────────────────┘
```

**Dimensions:**
- Min Height: 400px
- Max Height: 80vh (viewport height)
- Width: 100% (parent container)
- Swimlane Height: 120px (collapsed), 200px (expanded with details)

**Styling:**
```css
.sprint-timeline {
  background: var(--panel, #0d1022);
  border: 1px solid var(--line, rgba(255, 255, 255, 0.13));
  border-radius: 12px;
  padding: 20px;
  color: var(--text, #eef1ff);
  overflow: hidden;
}
```

---

### 2. Sprint Header

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│  Sprint 12 ▼ | Jan 6-17, 2026 | 60% Complete | 🎯 Goals  │
│  [Crew: All ▼] [Persona: All ▼] [Status: All ▼] [🔍]     │
└────────────────────────────────────────────────────────────┘
```

**Elements:**

**Sprint Selector:**
- Dropdown showing all sprints (past, current, future)
- Current sprint highlighted
- Quick jump to sprint by number

**Sprint Info:**
- Sprint name (editable inline)
- Date range (Jan 6-17, 2026)
- Progress % (based on completed story points)
- Sprint goals (hover to see list)

**Filter Controls:**
- Crew dropdown (All, Troi, Data, Geordi, ...)
- Persona dropdown (All, End User, Admin, ...)
- Status dropdown (All, To Do, In Progress, Done, Blocked)
- Search input (Cmd+F)

**Actions:**
- Settings icon (configure columns, swimlane order)
- Export (CSV, PDF)
- Share sprint (copy link)

**Responsive:**
- Desktop: All on one row
- Tablet: Two rows (info, then filters)
- Mobile: Collapsible filter panel

---

### 3. Timeline Axis

**Visual Design:**
```
Jan 6    Jan 8    Jan 10   Jan 12   Jan 14   Jan 16   Jan 17
  |        |        |        |        |        |        |
  ●────────────────────────────────────────────────────●
  ^                     TODAY                          ^
START                   ▼                            END
```

**Elements:**
- Date markers (every 2 days for 2-week sprint, every day for 1-week)
- Sprint start marker (green dot ●)
- Sprint end marker (red dot ●)
- Today indicator (vertical line with label)
- Progress line (horizontal bar, 0-100% width)

**Behavior:**
- Sticky on scroll (stays at top when scrolling swimlanes)
- Zoom controls (1 day, 2 days, 1 week granularity)
- Click date to filter stories by due date

**Styling:**
```css
.timeline-axis {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: 0;
  background: var(--panel);
  z-index: 10;
}

.date-marker {
  font-size: 11px;
  color: var(--muted, #b9c0e5);
  position: relative;
}

.today-indicator {
  position: absolute;
  width: 2px;
  height: 100%;
  background: var(--accent, #5ae6ff);
  top: 0;
}
```

---

### 4. Crew Swimlane

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│ 👤 Counselor Troi       3 stories, 13 pts    [▼] [+]      │
├────────────────────────────────────────────────────────────┤
│ ┌─────────┐  ┌─────────┐  ┌─────────┐                    │
│ │ Story 1 │  │ Story 2 │  │ Story 3 │   [+ Add Story]    │
│ │ 5 pts   │  │ 3 pts   │  │ 5 pts   │                    │
│ │ End User│  │ Admin   │  │ Power   │                    │
│ └─────────┘  └─────────┘  └─────────┘                    │
└────────────────────────────────────────────────────────────┘
```

**Swimlane Header:**
- Crew avatar (32px circle, crew member photo/icon)
- Crew name (Counselor Troi)
- Story count (3 stories)
- Total story points (13 pts)
- Collapse/expand toggle (▼/▶)
- Add story button (+)

**Story Track:**
- Horizontal scrolling container
- Stories positioned left-to-right in chronological order
- Drop zone for drag-and-drop (entire track is a valid drop target)
- Empty state ("No stories assigned")

**Responsive:**
- Desktop: 120px height (collapsed), 200px (expanded)
- Mobile: Full width, stacked vertically

**Styling:**
```css
.crew-swimlane {
  border-bottom: 1px solid var(--line, rgba(255, 255, 255, 0.08));
  padding: 12px 0;
}

.swimlane-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
}

.swimlane-header:hover {
  background: rgba(255, 255, 255, 0.05);
}

.crew-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--accent);
}

.story-track {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 12px;
  min-height: 100px;
}

.story-track::-webkit-scrollbar {
  height: 8px;
}

.story-track::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}
```

---

### 5. Story Card

**Visual Design:**
```
┌─────────────────────┐
│ ⚡ 5pts  [End User] │ <- Header (status icon, points, persona)
│                     │
│ Add Password Reset  │ <- Title (bold, 14px)
│                     │
│ 🏷️ frontend 🏷️ auth│ <- Labels
│                     │
│ 👤 Troi  📅 Jan 10  │ <- Footer (assignee, due date)
└─────────────────────┘
```

**Card States:**
- **To Do**: Gray border, ⏱️ icon
- **In Progress**: Blue border, ⚡ icon
- **Review**: Purple border, 👀 icon
- **Done**: Green border, ✅ icon
- **Blocked**: Red border, 🚫 icon

**Card Sizes:**
- **Compact**: 180px width, 100px height (default)
- **Detailed**: 240px width, 140px height (on hover or selected)

**Interactive States:**
- **Default**: Subtle shadow
- **Hover**: Lift effect (shadow increased), show quick actions
- **Dragging**: Semi-transparent, slight rotation
- **Drop Target**: Dashed border highlight

**Quick Actions (on hover):**
- Edit (pencil icon)
- Assign (person icon)
- Change status (status icon)
- Delete (trash icon)

**Styling:**
```css
.story-card {
  width: 180px;
  min-height: 100px;
  background: var(--panel2, #0b0f1d);
  border: 2px solid var(--line);
  border-left: 4px solid var(--status-color); /* Status-specific */
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.story-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  border-color: var(--accent);
}

.story-card.dragging {
  opacity: 0.6;
  transform: rotate(2deg);
  cursor: grabbing;
}

.story-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
}

.story-points {
  font-weight: 600;
  color: var(--accent);
}

.story-persona {
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
}

.story-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.story-labels {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.story-label {
  font-size: 10px;
  background: var(--label-color);
  padding: 2px 6px;
  border-radius: 4px;
}

.story-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: var(--muted);
  margin-top: auto;
}

.quick-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.story-card:hover .quick-actions {
  opacity: 1;
}

.quick-action-btn {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

### 6. Story Detail Panel

**Layout:**
```
┌────────────────────────────────────┐
│  ← Back   Story #123   [Edit] [X] │ <- Header
├────────────────────────────────────┤
│                                    │
│  Add Password Reset Flow           │ <- Title
│  ⚡ In Progress | 5 pts | High     │ <- Meta
│                                    │
│  👤 Counselor Troi                 │ <- Assignee
│  🧑 End User Persona               │ <- Persona
│  📅 Due Jan 10, 2026               │ <- Due Date
│  🏷️ frontend, auth, security      │ <- Labels
│                                    │
├────────────────────────────────────┤
│  DESCRIPTION                       │
│  As an End User                    │
│  I want to reset my password...    │
│                                    │
├────────────────────────────────────┤
│  ACCEPTANCE CRITERIA               │
│  ☐ Given user clicks "Forgot"...  │
│  ☐ When email is valid...         │
│  ☑ Then reset link is sent...     │
│                                    │
├────────────────────────────────────┤
│  COMMENTS (3)                      │
│  👤 Worf: Security review needed   │
│  👤 Data: Implemented reset logic  │
│  👤 Troi: UI looks great!          │
│                                    │
└────────────────────────────────────┘
```

**Panel Behavior:**
- Slide in from right (300ms animation)
- Overlay mode (darkens background)
- Click outside to close
- Esc to close
- Width: 400px (desktop), 100vw (mobile)

**Sections:**

**1. Header:**
- Back button (returns to timeline)
- Story ID (e.g., "Story #123")
- Edit button (enters edit mode)
- Close button (X)

**2. Meta Section:**
- Story title (editable)
- Status badge (clickable to change)
- Story points (editable)
- Priority (editable)

**3. Details Section:**
- Assigned crew (dropdown to reassign)
- Persona (dropdown)
- Due date (date picker)
- Labels (multi-select tags)

**4. Description:**
- Rich text editor (markdown)
- User story format highlighted
- Image upload support

**5. Acceptance Criteria:**
- Checklist with checkboxes
- Add/remove criteria
- Given/When/Then format suggested

**6. Comments/Activity:**
- Threaded comments
- Activity log (status changes, assignments)
- @mentions support

**7. Related Stories:**
- Dependencies (blocks, blocked by)
- Related stories (same epic)
- Subtasks

**Styling:**
```css
.story-detail-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: var(--panel, #0d1022);
  border-left: 1px solid var(--line);
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  overflow-y: auto;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

---

### 7. Drag-and-Drop Interactions

**Drag Sources:**
- Story cards (from any swimlane)

**Drop Targets:**
- Crew swimlanes (reassigns story to crew member)
- Story track (reorders within same crew)
- Status columns (if status filter enabled, changes story status)

**Visual Feedback:**

**1. Drag Start:**
- Card becomes semi-transparent (60% opacity)
- Card rotates slightly (2deg)
- Cursor changes to "grabbing"

**2. Dragging Over Valid Target:**
- Drop zone highlights with dashed border
- Background color changes subtly
- Drop hint appears ("Drop here to assign to Troi")

**3. Dragging Over Invalid Target:**
- Cursor changes to "not-allowed"
- Drop zone grays out

**4. Drop:**
- Card animates to new position (300ms)
- Swimlane updates story count and points
- Optimistic update (shows immediately, syncs to API)

**Implementation (React DnD or native drag API):**
```typescript
const handleDragStart = (e: DragEvent, story: Story) => {
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('story', JSON.stringify(story));

  // Visual feedback
  (e.target as HTMLElement).classList.add('dragging');
};

const handleDragOver = (e: DragEvent, crewId: string) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  // Highlight drop zone
  const swimlane = e.currentTarget as HTMLElement;
  swimlane.classList.add('drop-target');
};

const handleDrop = (e: DragEvent, targetCrewId: string) => {
  e.preventDefault();

  const storyData = e.dataTransfer.getData('story');
  const story = JSON.parse(storyData);

  // Optimistic update
  updateStoryCrewLocally(story.id, targetCrewId);

  // Sync to API
  updateStoryCrewAPI(story.id, targetCrewId).catch(() => {
    // Rollback on error
    revertStoryCrewLocally(story.id);
    showErrorToast('Failed to reassign story');
  });
};
```

---

### 8. Filtering System

**Filter Controls:**
```
[Crew: All ▼] [Persona: All ▼] [Status: All ▼] [🔍 Search]
```

**Crew Filter:**
- Dropdown with all crew members
- Multi-select (show multiple crew swimlanes)
- "All" option (shows all crew)

**Persona Filter:**
- Dropdown with all personas (End User, Admin, etc.)
- Multi-select
- "All" option

**Status Filter:**
- Dropdown with all statuses (To Do, In Progress, Done, etc.)
- Multi-select
- "All" option

**Search:**
- Text input (Cmd+F shortcut)
- Searches story title, description, labels
- Real-time filtering (debounced 300ms)
- Highlight matches in results

**Filter Behavior:**
- Filters are cumulative (AND logic)
- Active filters show badge count (e.g., "Filters (3)")
- Clear all filters button
- Filters persist in URL query params (shareable)

**Implementation:**
```typescript
const filteredStories = useMemo(() => {
  let results = stories;

  // Filter by crew
  if (selectedCrew.length > 0 && !selectedCrew.includes('all')) {
    results = results.filter(s => selectedCrew.includes(s.assignedCrewId));
  }

  // Filter by persona
  if (selectedPersonas.length > 0 && !selectedPersonas.includes('all')) {
    results = results.filter(s => selectedPersonas.includes(s.personaId));
  }

  // Filter by status
  if (selectedStatuses.length > 0 && !selectedStatuses.includes('all')) {
    results = results.filter(s => selectedStatuses.includes(s.status));
  }

  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    results = results.filter(s =>
      s.title.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query) ||
      s.labels.some(l => l.toLowerCase().includes(query))
    );
  }

  return results;
}, [stories, selectedCrew, selectedPersonas, selectedStatuses, searchQuery]);
```

---

### 9. Keyboard Shortcuts

**Global Shortcuts:**
- `Cmd+K` / `Ctrl+K`: Open command palette
- `Cmd+F` / `Ctrl+F`: Focus search
- `Cmd+N` / `Ctrl+N`: Create new story
- `Esc`: Close panel/modal
- `?`: Show keyboard shortcuts help

**Navigation:**
- `Arrow Up/Down`: Navigate between stories
- `Arrow Left/Right`: Navigate within story track
- `Enter`: Open selected story
- `Space`: Select/deselect story (for bulk actions)

**Story Actions:**
- `e`: Edit story
- `d`: Delete story
- `c`: Change status
- `a`: Assign to crew member

**Command Palette (Cmd+K):**
```
┌────────────────────────────────────┐
│  Type a command...                 │
├────────────────────────────────────┤
│  📝 Create New Story               │
│  🔍 Search Stories                 │
│  👤 Assign to Crew                 │
│  📊 View Sprint Report             │
│  ⚙️  Sprint Settings               │
│  📤 Export Sprint                  │
└────────────────────────────────────┘
```

---

### 10. Responsive Design

**Breakpoints:**
- **Desktop**: 1024px+
- **Tablet**: 768px - 1023px
- **Mobile**: < 768px

**Desktop (1024px+):**
- Full horizontal timeline
- All swimlanes visible
- Story cards 180px width
- Detail panel 400px width

**Tablet (768-1023px):**
- Horizontal timeline (scrollable)
- Collapsible swimlanes (expand one at a time)
- Story cards 160px width
- Detail panel 100% width (overlay)

**Mobile (<768px):**
- Vertical timeline (no horizontal axis)
- Single swimlane view (dropdown to switch crew)
- Story cards full width
- Detail panel full screen

**VSCode Extension (300px+ panel width):**
- Compact mode forced
- Horizontal scrolling emphasized
- Collapsible headers
- Icon-only actions

---

### 11. Performance Optimization

**Virtualization:**
```typescript
import { FixedSizeList } from 'react-window';

// Virtualize swimlanes for 100+ stories
<FixedSizeList
  height={600}
  itemCount={swimlanes.length}
  itemSize={120}
  width="100%"
>
  {({ index, style }) => (
    <CrewSwimlane style={style} swimlane={swimlanes[index]} />
  )}
</FixedSizeList>
```

**Lazy Loading:**
- Load story details on demand (when panel opens)
- Load comments on scroll (paginated)
- Load images lazily (intersection observer)

**Memoization:**
```typescript
const MemoizedStoryCard = React.memo(StoryCard, (prev, next) => {
  return prev.story.id === next.story.id &&
         prev.story.status === next.story.status &&
         prev.story.assignedCrewId === next.story.assignedCrewId;
});
```

**Debouncing:**
```typescript
const debouncedSearch = useMemo(
  () => debounce((query: string) => setSearchQuery(query), 300),
  []
);
```

---

### 12. Accessibility (WCAG AA)

**Keyboard Navigation:**
- All interactive elements focusable (tabindex)
- Focus indicators visible (outline)
- Logical tab order

**Screen Readers:**
- Semantic HTML (header, nav, main, section)
- ARIA labels for icons and actions
- Live regions for dynamic updates

**Color Contrast:**
- Text: 4.5:1 contrast ratio minimum
- Interactive elements: 3:1 contrast ratio
- Status colors meet WCAG AA standards

**Focus Management:**
- Modal/panel opens: focus moves to panel
- Modal closes: focus returns to trigger
- Keyboard trap within modals (Esc to exit)

**Example:**
```html
<div
  className="story-card"
  role="button"
  tabindex="0"
  aria-label="Story: Add Password Reset, 5 story points, assigned to Counselor Troi"
  onKeyDown={(e) => e.key === 'Enter' && openStory()}
>
  ...
</div>
```

---

### 13. Animation & Motion

**Principles:**
- **Purposeful**: Animations guide attention
- **Fast**: 200-300ms max duration
- **Subtle**: Ease-in-out easing

**Animations:**

**1. Card Hover:**
```css
.story-card {
  transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
}

.story-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}
```

**2. Panel Slide:**
```css
@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.story-detail-panel {
  animation: slideIn 0.3s ease-out;
}
```

**3. Drag Feedback:**
```css
.story-card.dragging {
  opacity: 0.6;
  transform: rotate(2deg) scale(1.05);
  transition: transform 0.1s;
}
```

**4. Filter Transition:**
```css
.swimlanes-container {
  transition: opacity 0.2s, transform 0.2s;
}

.swimlanes-container.filtering {
  opacity: 0.6;
}
```

---

### 14. Error States

**API Errors:**
```
┌────────────────────────────────────┐
│  ⚠️ Failed to load sprint data    │
│  Unable to connect to API.         │
│  [Retry] [Dismiss]                 │
└────────────────────────────────────┘
```

**Empty States:**
```
┌────────────────────────────────────┐
│         📭                         │
│  No stories in this sprint yet     │
│  [+ Create First Story]            │
└────────────────────────────────────┘
```

**No Results (Filtering):**
```
┌────────────────────────────────────┐
│         🔍                         │
│  No stories match your filters     │
│  [Clear Filters]                   │
└────────────────────────────────────┘
```

---

### 15. Loading States

**Initial Load:**
- Skeleton screens for swimlanes
- Shimmer animation
- Progressive loading (header → axis → swimlanes)

**Lazy Loading:**
- Spinner for detail panel
- Skeleton for comments section

**Optimistic Updates:**
- Show change immediately
- Spinner in corner during sync
- Rollback on error

**Example Skeleton:**
```html
<div className="story-card skeleton">
  <div className="skeleton-header"></div>
  <div className="skeleton-title"></div>
  <div className="skeleton-labels"></div>
</div>
```

```css
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 25%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

---

## ASCII Art Mockups

### Full SprintTimeline (Desktop)

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║ SPRINT 12 ▼ | Jan 6-17, 2026 | 60% Complete | 🎯 Goals                       ║
║ [Crew: All ▼] [Persona: All ▼] [Status: All ▼] [🔍 Search...]  [⚙️] [📤]   ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║ Jan 6      Jan 8      Jan 10     Jan 12     Jan 14     Jan 16      Jan 17    ║
║   ●──────────────────────────────▼──────────────────────────────────────●    ║
║  START                         TODAY                                    END    ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║ 👤 Counselor Troi          3 stories, 13 pts                [▼] [+]          ║
║ ┌──────────┐  ┌──────────┐  ┌──────────┐                                    ║
║ │⚡ 5pts   │  │✅ 3pts   │  │⏱️ 5pts   │        [+ Add Story]               ║
║ │End User  │  │Admin     │  │Power User│                                    ║
║ │          │  │          │  │          │                                    ║
║ │Password  │  │User Mgmt │  │Templates │                                    ║
║ │Reset     │  │Dashboard │  │Feature   │                                    ║
║ │          │  │          │  │          │                                    ║
║ │🏷️frontend│  │🏷️backend │  │🏷️frontend│                                    ║
║ │👤Troi    │  │👤Troi    │  │👤Troi    │                                    ║
║ └──────────┘  └──────────┘  └──────────┘                                    ║
║                                                                               ║
║ 👤 Commander Data          5 stories, 21 pts                [▼] [+]          ║
║ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      ║
║ │⚡ 5pts   │  │⚡ 8pts   │  │✅ 3pts   │  │⏱️ 3pts   │  │⏱️ 2pts   │ [+]  ║
║ │Developer │  │Backend   │  │AI Model  │  │API Docs  │  │Tests     │      ║
║ │...       │  │...       │  │...       │  │...       │  │...       │      ║
║ └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘      ║
║                                                                               ║
║ 👤 Geordi La Forge         2 stories, 8 pts                 [▼] [+]          ║
║ ┌──────────┐  ┌──────────┐                                                  ║
║ │⚡ 5pts   │  │⏱️ 3pts   │                  [+ Add Story]                   ║
║ │DevOps    │  │AWS Setup │                                                  ║
║ │...       │  │...       │                                                  ║
║ └──────────┘  └──────────┘                                                  ║
║                                                                               ║
║ 📦 Unassigned              4 stories, 17 pts                [▼]              ║
║ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                    ║
║ │⏱️ 5pts   │  │⏱️ 8pts   │  │⏱️ 2pts   │  │⏱️ 2pts   │                    ║
║ │Story A   │  │Story B   │  │Story C   │  │Story D   │                    ║
║ └──────────┘  └──────────┘  └──────────┘  └──────────┘                    ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Story Card (Detailed)

```
┌─────────────────────────────────────┐
│ ⚡ 5pts          [End User]  [✏️][×]│ <- Header
├─────────────────────────────────────┤
│                                     │
│ Add Password Reset Flow             │ <- Title (bold)
│                                     │
│ 🏷️ frontend  🏷️ auth  🏷️ security  │ <- Labels
│                                     │
│ "As an End User, I want to          │ <- Description (preview)
│  reset my password if I..."         │
│                                     │
├─────────────────────────────────────┤
│ 👤 Counselor Troi    📅 Jan 10     │ <- Footer
│ ✅ 2/3 AC complete                  │ <- Progress
└─────────────────────────────────────┘
```

### Story Detail Panel

```
╔═══════════════════════════════════╗
║ ← Back   Story #123  [Edit] [×]  ║
╠═══════════════════════════════════╣
║                                   ║
║ Add Password Reset Flow           ║ <- Title (large)
║ ⚡ In Progress | 5 pts | High     ║ <- Status badges
║                                   ║
╟───────────────────────────────────╢
║ DETAILS                           ║
║ 👤 Counselor Troi                 ║
║ 🧑 End User Persona               ║
║ 📅 Due Jan 10, 2026               ║
║ 🏷️ frontend, auth, security      ║
╟───────────────────────────────────╢
║ DESCRIPTION                       ║
║ ────────────────────────────────  ║
║ As an End User                    ║
║ I want to reset my password       ║
║ So that I can regain access       ║
║                                   ║
╟───────────────────────────────────╢
║ ACCEPTANCE CRITERIA               ║
║ ────────────────────────────────  ║
║ ☑ Given user clicks "Forgot       ║
║   Password"...                    ║
║ ☑ When email is valid...          ║
║ ☐ Then reset link sent...         ║
║                                   ║
╟───────────────────────────────────╢
║ COMMENTS (3)                      ║
║ ────────────────────────────────  ║
║ 👤 Worf (2h ago)                  ║
║ "Security review needed before    ║
║  marking as done."                ║
║                                   ║
║ 👤 Data (5h ago)                  ║
║ "Implemented reset token logic."  ║
║                                   ║
║ [Write a comment...]              ║
╚═══════════════════════════════════╝
```

---

## Integration with Existing Components

### ProjectTimeline Integration

**Shared Utilities:**
- `formatDate()` function
- `getMilestonePosition()` (adapt for stories)
- `getMonthMarkers()` function
- `STATUS_COLORS` constant

**Adaptation:**
```typescript
// Reuse from ProjectTimeline.tsx
import { formatDate, STATUS_COLORS } from './ProjectTimeline';

// Adapt getMilestonePosition for stories
const getStoryPosition = (storyDueDate: string, sprintStart: string, sprintEnd: string) => {
  const startTimestamp = new Date(sprintStart).getTime();
  const endTimestamp = new Date(sprintEnd).getTime();
  const storyTimestamp = new Date(storyDueDate).getTime();
  const timeRange = endTimestamp - startTimestamp;

  return ((storyTimestamp - startTimestamp) / timeRange) * 100;
};
```

**Complementary Views:**
- **ProjectTimeline**: Show high-level milestones for stakeholders
- **SprintTimeline**: Show detailed sprint stories for team members
- **Toggle Button**: Switch between views

---

## TypeScript Interfaces

See SPRINT_DATA_MODEL.md for complete interfaces.

**Key Interfaces for UI:**
```typescript
import { Milestone, Task } from './ProjectTimeline';

export interface Sprint {
  id: string;
  name: string;
  projectId: string;
  startDate: string; // ISO 8601
  endDate: string;
  goals: string[];
  status: 'planned' | 'active' | 'completed' | 'canceled';
  velocity: number; // Average story points per sprint
  stories?: Story[];
}

export interface Story {
  id: string;
  sprintId: string;
  title: string;
  description: string;
  personaType: 'user' | 'developer';
  personaId: string;
  assignedCrewMember: string; // 'counselor_troi'
  storyPoints: number;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  labels: string[];
  dueDate?: string;
  acceptanceCriteria: AcceptanceCriterion[];
  tasks?: Task[];
  comments?: Comment[];
}

export interface AcceptanceCriterion {
  id: string;
  description: string;
  completed: boolean;
}

export interface SprintTimelineProps {
  sprint: Sprint;
  stories: Story[];
  crewMembers: CrewMember[];
  onStoryClick?: (story: Story) => void;
  onStoryDrag?: (story: Story, targetCrewId: string) => void;
  onFilterChange?: (filters: Filters) => void;
  interactive?: boolean;
  mode?: 'compact' | 'detailed';
}
```

---

**Document Version:** 1.0
**Last Updated:** December 28, 2025
**Next Review:** Implementation Phase
