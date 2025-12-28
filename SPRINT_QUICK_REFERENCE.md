# Sprint System Quick Reference

**One-Page Implementation Guide**
**Last Updated:** December 28, 2025

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     RAG PRODUCT FACTORY                         │
│                  Sprint Management System                       │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│  │   Sprints    │───▶│   Stories    │───▶│  Crew        │    │
│  │              │    │              │    │  Assignment  │    │
│  │ - Timeline   │    │ - User       │    │              │    │
│  │ - Goals      │    │ - Developer  │    │ - AI Match   │    │
│  │ - Velocity   │    │ - Personas   │    │ - Workload   │    │
│  └──────────────┘    └──────────────┘    └──────────────┘    │
│                                                                 │
│  Visualized via: SprintTimeline Component                     │
│  (Horizontal timeline with crew swimlanes)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Features (The Essentials)

### 1. Sprint Timeline
- **Horizontal timeline** with crew member swimlanes
- **Drag-and-drop** stories between crew members
- **Real-time filtering** by crew, persona, status
- **Sprint burndown** visualization

### 2. Persona System
- **7 User Personas:** End User, Power User, Admin, Content Creator, Developer, Enterprise, Domain Specialist
- **6 Developer Personas:** Frontend, Backend, Full-Stack, DevOps, Designer, QA
- **10 Crew Members:** Picard, Riker, Data, Geordi, Troi, Worf, Crusher, O'Brien, Quark, Uhura

### 3. AI Crew Assignment
- **Skill matching** based on story requirements
- **Persona affinity** scoring
- **Workload balancing** across sprint
- **Top 3 recommendations** with reasoning

---

## Data Model (Core Entities)

### Sprint
```typescript
interface Sprint {
  id: string;
  name: string;              // "Sprint 12"
  projectId: string;
  startDate: string;         // "2026-01-06"
  endDate: string;           // "2026-01-17"
  goals: string[];
  status: 'planned' | 'active' | 'completed' | 'canceled';
  velocity: number;          // Story points capacity
}
```

### Story
```typescript
interface Story {
  id: string;
  sprintId?: string;
  title: string;
  description?: string;
  storyType: 'user_story' | 'developer_story' | 'bug' | 'spike';
  personaId?: string;
  assignedCrewMember?: string;  // 'counselor_troi'
  storyPoints?: number;          // 1, 2, 3, 5, 8, 13, 21
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  labels: string[];
  acceptanceCriteria?: AcceptanceCriterion[];
}
```

### Persona
```typescript
interface Persona {
  id: string;
  name: string;
  type: 'user' | 'developer';
  primaryCrewMembers: string[];  // Affinity mapping
  goals: string[];
  painPoints: string[];
}
```

---

## API Endpoints (Quick Reference)

### Sprints
```bash
# List sprints
GET /api/sprints?projectId={id}&status=active

# Get sprint details
GET /api/sprints/:id

# Create sprint
POST /api/sprints
{
  "name": "Sprint 12",
  "projectId": "proj_123",
  "startDate": "2026-01-06",
  "endDate": "2026-01-17",
  "goals": ["Complete SprintTimeline", "Deploy to staging"],
  "velocity": 45
}

# Update sprint
PATCH /api/sprints/:id
{ "status": "active" }

# Delete sprint
DELETE /api/sprints/:id
```

### Stories
```bash
# List stories
GET /api/stories?sprintId={id}&assignedCrewMember=counselor_troi

# Get story details
GET /api/stories/:id

# Create story
POST /api/stories
{
  "title": "Add password reset flow",
  "sprintId": "sprint_123",
  "projectId": "proj_123",
  "storyType": "user_story",
  "personaType": "user",
  "personaId": "persona_end_user",
  "storyPoints": 5,
  "priority": "high",
  "labels": ["frontend", "auth"],
  "acceptanceCriteria": [
    { "description": "Given user clicks Forgot Password...", "completed": false }
  ]
}

# Update story (reassign crew)
PATCH /api/stories/:id
{ "assignedCrewMember": "commander_data" }

# Delete story
DELETE /api/stories/:id
```

### Crew Assignment
```bash
# Get crew recommendations
POST /api/crew/assign
{
  "storyId": "story_123",
  "requiredSkills": ["frontend", "ux"]
}

# Response:
{
  "recommendations": [
    {
      "crewId": "counselor_troi",
      "score": 0.95,
      "reasoning": "Matched 2 required skills: frontend, ux. Available (60% utilization).",
      "matchedSkills": ["frontend", "ux"],
      "currentLoad": 21,
      "maxCapacity": 35,
      "availability": "available"
    }
  ]
}

# Get crew workload
GET /api/crew/workload?sprintId=sprint_123
```

---

## Component Usage

### SprintTimeline Component

```tsx
import { SprintTimeline } from '@/components/SprintTimeline';

<SprintTimeline
  sprint={sprint}
  stories={stories}
  crewMembers={crewMembers}
  onStoryClick={(story) => openDetailPanel(story)}
  onStoryDrag={(story, targetCrewId) => updateStoryAssignment(story.id, targetCrewId)}
  onFilterChange={(filters) => setFilters(filters)}
  interactive={true}
  mode="detailed"
/>
```

**Props:**
- `sprint`: Sprint object
- `stories`: Array of Story objects
- `crewMembers`: Array of CrewMember objects
- `onStoryClick`: Callback when story is clicked
- `onStoryDrag`: Callback when story is dragged to new crew
- `onFilterChange`: Callback when filters change
- `interactive`: Enable/disable drag-drop (default: true)
- `mode`: 'compact' | 'detailed' (default: 'compact')

---

## User Story Templates

### User Story (End User Persona)
```markdown
# User Story: Add Password Reset Flow

**Persona:** End User
**User Type:** Writer / Blogger

## Story
As an **End User**
I want to **reset my password if I forget it**
So that **I can regain access to my account**

## Acceptance Criteria
- [ ] **Given** I am on the login page
      **When** I click "Forgot Password"
      **Then** I should see a password reset form

- [ ] **Given** I enter a valid email address
      **When** I submit the form
      **Then** I should receive a reset link via email within 30 seconds

- [ ] **Given** I click the reset link
      **When** the link is less than 24 hours old
      **Then** I should be able to set a new password

**Story Points:** 5
**Sprint:** Sprint 12
**Assigned Crew:** Counselor Troi
**Priority:** High
```

### Developer Story (Frontend Persona)
```markdown
# Developer Story: Implement SprintTimeline Component

**Developer Persona:** Frontend Developer
**Technical Area:** UI/UX Implementation

## Story
As a **Frontend Developer**
I need to **implement the SprintTimeline component with drag-and-drop**
To enable **users to reassign stories between crew members**

## Technical Requirements
- Framework: React 18, TypeScript 5
- Drag-and-Drop: React DnD or native API
- Responsive: Mobile, tablet, desktop
- Accessibility: WCAG AA

## Acceptance Criteria
- [ ] Component implements TypeScript interface `SprintTimelineProps`
- [ ] Drag-and-drop works across all crew swimlanes
- [ ] Component passes accessibility tests
- [ ] Unit tests achieve >80% coverage
- [ ] Storybook story created for variants

**Story Points:** 8
**Sprint:** Sprint 3
**Assigned Crew:** Counselor Troi
**Priority:** Critical
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open command palette |
| `Cmd+F` / `Ctrl+F` | Focus search |
| `Cmd+N` / `Ctrl+N` | Create new story |
| `Esc` | Close panel/modal |
| `?` | Show keyboard shortcuts |
| `↑` `↓` | Navigate stories |
| `←` `→` | Navigate within story track |
| `Enter` | Open selected story |
| `e` | Edit story |
| `d` | Delete story |
| `c` | Change status |
| `a` | Assign to crew |

---

## Crew Member Reference

| Crew ID | Name | Primary Expertise | Best For |
|---------|------|-------------------|----------|
| `captain_picard` | Captain Picard | Strategy, Leadership | Strategic planning, roadmap |
| `commander_riker` | Commander Riker | Execution, Coordination | Full-stack, cross-domain work |
| `commander_data` | Commander Data | AI/ML, Data Analysis | Backend (AI), algorithms |
| `geordi_la_forge` | Geordi La Forge | Infrastructure, Systems | DevOps, performance |
| `counselor_troi` | Counselor Troi | UX, Psychology | Frontend (UX), design |
| `lieutenant_worf` | Lieutenant Worf | Security, Testing | QA, security, compliance |
| `dr_crusher` | Dr. Crusher | Diagnostics, Documentation | Health checks, docs |
| `chief_obrien` | Chief O'Brien | Implementation, Hands-on | Full-stack, backend |
| `quark` | Quark | Business, Analytics | Business analysis, ROI |
| `lieutenant_uhura` | Lieutenant Uhura | APIs, Communication | Backend (APIs), integration |

---

## Database Schema (Quick Reference)

```sql
-- Sprints
CREATE TABLE sprints (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  project_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  goals TEXT[],
  status VARCHAR(20) DEFAULT 'planned',
  velocity INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Stories
CREATE TABLE stories (
  id UUID PRIMARY KEY,
  sprint_id UUID REFERENCES sprints(id),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  story_type VARCHAR(20) NOT NULL,
  persona_id UUID,
  assigned_crew_member VARCHAR(50),
  story_points INTEGER,
  status VARCHAR(20) DEFAULT 'todo',
  priority VARCHAR(10) DEFAULT 'medium',
  labels TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Acceptance Criteria
CREATE TABLE acceptance_criteria (
  id UUID PRIMARY KEY,
  story_id UUID REFERENCES stories(id),
  description TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  position INTEGER NOT NULL
);
```

---

## Crew Assignment Algorithm (Simplified)

```typescript
function assignOptimalCrew(story: Story): CrewRecommendation[] {
  // 1. Extract required skills from story
  const skills = extractSkills(story.title + ' ' + story.description);

  // 2. Score all crew members
  const scores = crewMembers.map(crew => ({
    crewId: crew.id,
    score: calculateScore(crew, skills, story.personaId)
  }));

  // 3. Apply persona affinity boost (1.3x if primary crew for persona)
  scores.forEach(s => {
    if (persona.primaryCrewMembers.includes(s.crewId)) {
      s.score *= 1.3;
    }
  });

  // 4. Apply workload penalty (0.7x if >80% capacity)
  scores.forEach(s => {
    const load = getCurrentLoad(s.crewId, story.sprintId);
    const capacity = getCrewCapacity(s.crewId);
    if (load / capacity > 0.8) {
      s.score *= 0.7;
    }
  });

  // 5. Sort by score, return top 3
  return scores.sort((a, b) => b.score - a.score).slice(0, 3);
}
```

---

## Common Workflows

### Create a Sprint
1. Navigate to project
2. Click "New Sprint"
3. Fill in name, dates, goals
4. Set velocity (story points capacity)
5. Click "Create"

### Add Stories to Sprint
1. Open sprint
2. Click "+ Add Story" in crew swimlane
3. Select persona (auto-fills template)
4. Fill in title, description, acceptance criteria
5. Set story points and priority
6. Click "Create" (AI suggests crew members)
7. Accept suggestion or manually assign

### Reassign Story
- **Drag-and-Drop:** Drag story card to different crew swimlane
- **Detail Panel:** Open story → change "Assigned Crew" dropdown
- **API:** `PATCH /api/stories/:id` with `{ "assignedCrewMember": "new_crew_id" }`

### Filter Stories
- Click filter dropdowns in sprint header
- Select crew members, personas, statuses
- Filters are cumulative (AND logic)
- Click "Clear Filters" to reset

### View Story Details
- Click story card
- Detail panel slides in from right
- Edit inline or click "Edit" button
- Add comments, update status
- Click "X" or press Esc to close

---

## Performance Tips

### Virtual Scrolling (for 100+ stories)
```tsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={swimlanes.length}
  itemSize={120}
>
  {({ index, style }) => (
    <CrewSwimlane style={style} swimlane={swimlanes[index]} />
  )}
</FixedSizeList>
```

### Optimistic Updates
```typescript
const handleDrop = async (storyId, targetCrewId) => {
  // 1. Update UI immediately
  updateStoryLocally(storyId, { assignedCrewMember: targetCrewId });

  try {
    // 2. Sync to API
    await updateStoryAPI(storyId, { assignedCrewMember: targetCrewId });
  } catch (error) {
    // 3. Rollback on error
    revertStoryLocally(storyId);
    showErrorToast('Failed to reassign story');
  }
};
```

### Caching
- Cache crew members (rarely change)
- Cache personas (rarely change)
- Use SWR or React Query for API calls
- Invalidate cache on mutations

---

## Troubleshooting

### Stories not appearing in swimlane
- **Check:** Is story assigned to crew member?
- **Check:** Does story match current filters?
- **Check:** Is story in the selected sprint?

### Drag-and-drop not working
- **Check:** Is `interactive={true}` prop set?
- **Check:** Browser compatibility (requires modern browser)
- **Fallback:** Use detail panel to reassign

### Crew assignment accuracy low (<80%)
- **Check:** Are skills correctly extracted from story?
- **Check:** Is persona mapping up to date?
- **Tune:** Adjust scoring weights in algorithm

### Performance slow (>50ms interactions)
- **Enable:** Virtual scrolling for large story counts
- **Enable:** Memoization for expensive components
- **Enable:** Debouncing for search/filters
- **Check:** API response times (<200ms target)

---

## Migration Checklist

### Phase 1: Database Setup
- [ ] Run initial migration (`001_create_sprint_system.sql`)
- [ ] Seed crew members data
- [ ] Create personas (user + developer)
- [ ] Test CRUD operations via SQL

### Phase 2: API Implementation
- [ ] Implement sprint endpoints
- [ ] Implement story endpoints
- [ ] Implement crew assignment endpoint
- [ ] Add authentication/authorization
- [ ] Test with Postman/Insomnia

### Phase 3: UI Implementation
- [ ] Build SprintTimeline component
- [ ] Build StoryCard component
- [ ] Build StoryDetailPanel component
- [ ] Add drag-and-drop functionality
- [ ] Add filtering and search

### Phase 4: Integration
- [ ] Integrate with ProjectTimeline
- [ ] Connect to crew assignment API
- [ ] Add persona selectors
- [ ] Test end-to-end workflows

### Phase 5: Testing & Launch
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests
- [ ] E2E tests (Cypress/Playwright)
- [ ] Accessibility audit (WCAG AA)
- [ ] Performance benchmarks (<50ms UI, <200ms API)
- [ ] Documentation (API docs, user guide)
- [ ] Launch!

---

## Support & Resources

### Documentation
- **Full Design:** `SPRINT_TIMELINE_DESIGN.md`
- **Data Model:** `SPRINT_DATA_MODEL.md`
- **Personas:** `PERSONA_SYSTEM_DESIGN.md`
- **Research:** `AGILE_TOOLS_RESEARCH.md`

### Team Contacts
- **Strategy:** Captain Picard
- **Execution:** Commander Riker
- **Technical Lead:** Commander Data
- **UX Lead:** Counselor Troi
- **Infrastructure:** Geordi La Forge

### External Tools Research
- **Jira:** https://www.atlassian.com/software/jira
- **Linear:** https://linear.app
- **Plane (OSS):** https://plane.so

---

**Quick Reference Version:** 1.0
**Last Updated:** December 28, 2025
**Print This Page:** Essential for daily use during implementation!
