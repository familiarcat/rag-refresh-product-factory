# Sprint System API Documentation

Complete API reference for the Alex AI Sprint Management System.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Sprint Endpoints](#sprint-endpoints)
- [Story Endpoints](#story-endpoints)
- [Crew Assignment](#crew-assignment)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Overview

The Sprint API provides full CRUD operations for Agile sprint management with AI-powered crew assignment recommendations.

**Base URL**: `/api`

**Tech Stack**:
- Next.js 14 App Router
- Supabase PostgreSQL
- TypeScript

## Authentication

All API endpoints require authentication via Supabase.

**Environment Variables**:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Sprint Endpoints

### List Sprints

```http
GET /api/sprints
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `project_id` | string | Filter by project |
| `status` | SprintStatus | Filter by status (`planning`, `active`, `completed`, `cancelled`) |
| `start_date_after` | string | ISO date (YYYY-MM-DD) |
| `start_date_before` | string | ISO date (YYYY-MM-DD) |
| `include_stories` | boolean | Include story details (default: `false`) |
| `limit` | number | Max results (default: `50`) |
| `offset` | number | Pagination offset (default: `0`) |

**Response**:
```json
{
  "sprints": [
    {
      "id": "uuid",
      "project_id": "my-project",
      "name": "Sprint 23",
      "sprint_number": 23,
      "start_date": "2025-01-15",
      "end_date": "2025-01-29",
      "goals": ["Implement dark mode", "Fix critical bugs"],
      "status": "active",
      "velocity_target": 34,
      "velocity_actual": 21,
      "created_at": "2025-01-10T10:00:00Z",
      "updated_at": "2025-01-20T14:30:00Z"
    }
  ],
  "count": 10,
  "filters": {...}
}
```

**Example**:
```bash
curl "https://your-app.com/api/sprints?project_id=my-project&status=active"
```

---

### Create Sprint

```http
POST /api/sprints
```

**Request Body**:
```json
{
  "project_id": "my-project",
  "name": "Sprint 24",
  "sprint_number": 24,
  "start_date": "2025-01-29",
  "end_date": "2025-02-12",
  "goals": [
    "Complete authentication system",
    "Implement user dashboard"
  ],
  "velocity_target": 40
}
```

**Validation**:
- `project_id`: Required
- `name`: Required
- `start_date`, `end_date`: Required, must be YYYY-MM-DD format
- `end_date` must be after `start_date`
- `sprint_number`: Optional
- `goals`: Optional array
- `velocity_target`: Optional number

**Response**: `201 Created`
```json
{
  "id": "uuid",
  "project_id": "my-project",
  "name": "Sprint 24",
  "status": "planning",
  ...
}
```

---

### Get Sprint by ID

```http
GET /api/sprints/{id}
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `include_stories` | boolean | Include stories (default: `true`) |
| `include_workload` | boolean | Include crew workload (default: `true`) |

**Response**:
```json
{
  "id": "uuid",
  "name": "Sprint 23",
  "stories": [...],
  "crew_workload": [...]
}
```

---

### Update Sprint

```http
PATCH /api/sprints/{id}
```

**Request Body** (all fields optional):
```json
{
  "name": "Sprint 23 - Updated",
  "status": "completed",
  "velocity_actual": 32
}
```

**Updatable Fields**:
- `name`
- `status`: `planning`, `active`, `completed`, `cancelled`
- `goals`
- `velocity_target`
- `velocity_actual`
- `start_date`, `end_date`

---

### Delete Sprint

```http
DELETE /api/sprints/{id}
```

**Warning**: Cascade deletes all stories, tasks, comments, and crew workload records.

**Response**: `200 OK`
```json
{
  "message": "Sprint deleted successfully",
  "deleted": {
    "id": "uuid",
    "name": "Sprint 23"
  }
}
```

---

## Story Endpoints

### List Stories

```http
GET /api/stories
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `project_id` | string | ✅ Yes | Filter by project |
| `sprint_id` | string \| `"backlog"` | No | Filter by sprint (`"backlog"` for unassigned) |
| `status` | StoryStatus[] | No | Filter by status |
| `story_type` | StoryType[] | No | Filter by type |
| `assigned_crew_member` | string | No | Filter by crew member |
| `persona_id` | string | No | Filter by persona |
| `priority` | number[] | No | Filter by priority (1-5) |
| `limit` | number | No | Max results (default: `100`) |
| `offset` | number | No | Pagination offset |

**Story Status Values**:
- `backlog` - Not started
- `planned` - Planned for sprint
- `in_progress` - Being worked on
- `review` - In code review
- `testing` - Being tested
- `done` - Completed
- `blocked` - Blocked by dependency

**Story Type Values**:
- `user_story` - As a [persona], I want [goal]
- `developer_story` - As a [developer persona], I need [technical goal]
- `bug` - Bug fix
- `technical_debt` - Technical debt

**Response**:
```json
{
  "stories": [
    {
      "id": "uuid",
      "sprint_id": "uuid",
      "project_id": "my-project",
      "title": "Add dark mode toggle",
      "description": "As an End User, I want to toggle dark mode...",
      "story_type": "user_story",
      "status": "in_progress",
      "persona_id": "uuid",
      "persona": {
        "name": "End User",
        "type": "user",
        "technical_level": 2
      },
      "assigned_crew_member": "troi",
      "story_points": 5,
      "priority": 2,
      "acceptance_criteria": [
        {
          "given_clause": "Given I am on the settings page",
          "when_clause": "When I click the dark mode toggle",
          "then_clause": "Then the UI switches to dark theme",
          "display_order": 1,
          "is_completed": false
        }
      ],
      "tasks": [],
      "comments": []
    }
  ],
  "count": 15,
  "filters": {...}
}
```

**Examples**:
```bash
# Get all stories for a project
curl "https://your-app.com/api/stories?project_id=my-project"

# Get backlog stories
curl "https://your-app.com/api/stories?project_id=my-project&sprint_id=backlog"

# Get stories assigned to Data
curl "https://your-app.com/api/stories?project_id=my-project&assigned_crew_member=data"

# Get in-progress and review stories
curl "https://your-app.com/api/stories?project_id=my-project&status=in_progress&status=review"
```

---

### Create Story

```http
POST /api/stories
```

**Request Body**:
```json
{
  "project_id": "my-project",
  "sprint_id": "uuid",
  "title": "Implement user authentication",
  "description": "As a Developer, I need to implement JWT-based authentication...",
  "story_type": "developer_story",
  "persona_id": "uuid",
  "story_points": 8,
  "priority": 1,
  "acceptance_criteria": [
    {
      "given_clause": "Given I have valid credentials",
      "when_clause": "When I submit the login form",
      "then_clause": "Then I receive a JWT token",
      "display_order": 1
    },
    {
      "given_clause": "Given I have an expired token",
      "when_clause": "When I make an API request",
      "then_clause": "Then I receive a 401 Unauthorized error",
      "display_order": 2
    }
  ]
}
```

**Validation**:
- `project_id`: Required
- `title`: Required
- `story_type`: Required (`user_story`, `developer_story`, `bug`, `technical_debt`)
- `priority`: Required (1-5, where 1 is highest)
- `sprint_id`: Optional (leave null for backlog)
- `story_points`: Optional (0-100, Fibonacci recommended: 1, 2, 3, 5, 8, 13, 21)

**Response**: `201 Created`
```json
{
  "id": "uuid",
  "title": "Implement user authentication",
  ...
}
```

---

### Get Story by ID

```http
GET /api/stories/{id}
```

**Response**:
```json
{
  "id": "uuid",
  "title": "Add dark mode toggle",
  "persona": {...},
  "acceptance_criteria": [...],
  "tasks": [...],
  "comments": [...]
}
```

---

### Update Story

```http
PATCH /api/stories/{id}
```

**Request Body** (all fields optional):
```json
{
  "title": "Updated title",
  "status": "review",
  "assigned_crew_member": "data",
  "story_points": 8,
  "priority": 1,
  "sprint_id": "uuid"
}
```

**Move to Backlog**:
```json
{
  "sprint_id": null
}
```

---

### Delete Story

```http
DELETE /api/stories/{id}
```

**Warning**: Cascade deletes acceptance criteria, tasks, and comments.

---

## Crew Assignment

### Get Assignment Recommendations

```http
POST /api/stories/{id}/assign
```

**Description**: Analyzes a story and recommends the best crew member(s) to assign based on AI scoring algorithm.

**Algorithm**:
```
Score = (skillMatch × 1.0) +
        (personaAffinity × 1.3) +
        (workloadBalance × 0.7) +
        (historicalPerformance × 0.5)

Max Score: 325 points
Auto-assign threshold: 260 points (80%)
```

**Scoring Factors**:

1. **Skill Match** (0-100): Matches story type and keywords to crew specialty
   - Keywords: "api", "backend" → Data
   - Keywords: "ux", "frontend" → Troi
   - Keywords: "security", "testing" → Worf
   - Story type: `bug` → Worf or O'Brien

2. **Persona Affinity** (0-100): Persona's `preferred_crew_member` gets 100, others get 40

3. **Workload Balance** (0-100): Inverse of capacity percentage (0% = 100 score, 100% = 0 score)

4. **Historical Performance** (0-100): Based on past velocity (baseline scores for now)

**Request Body**: Empty `{}`

**Response**:
```json
{
  "story": {
    "id": "uuid",
    "title": "Implement ML-powered recommendation engine",
    "story_type": "developer_story",
    "persona": {
      "name": "Backend Developer",
      "preferred_crew_member": "data"
    }
  },
  "recommendations": [
    {
      "crew_member": "data",
      "crew_member_name": "Commander Data",
      "score": 287,
      "reasoning": {
        "skill_match": 90,
        "persona_affinity": 100,
        "workload_balance": 75,
        "historical_performance": 95
      },
      "current_workload": 21,
      "capacity_percentage": 62
    },
    {
      "crew_member": "uhura",
      "crew_member_name": "Lieutenant Uhura",
      "score": 241,
      "reasoning": {
        "skill_match": 80,
        "persona_affinity": 40,
        "workload_balance": 90,
        "historical_performance": 86
      },
      "current_workload": 8,
      "capacity_percentage": 24
    }
  ],
  "auto_assigned": "data"
}
```

**Auto-Assignment**: If top recommendation score ≥ 260 (80%), story is automatically assigned and `assigned_crew_member` is updated.

**Example**:
```bash
curl -X POST "https://your-app.com/api/stories/uuid-123/assign" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Error Handling

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "details": "Technical error details"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (validation error) |
| `404` | Not Found |
| `500` | Internal Server Error |

### Common Errors

**400 Bad Request**:
```json
{
  "error": "priority must be between 1 (highest) and 5 (lowest)"
}
```

**404 Not Found**:
```json
{
  "error": "Sprint not found"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Failed to fetch sprints",
  "details": "relation \"sprints\" does not exist"
}
```

**Note**: If you see `"relation does not exist"` errors, the database migration has not been applied yet. See [Migration Guide](#migration).

---

## Examples

### Complete Workflow Example

```bash
# 1. Create a sprint
curl -X POST "http://localhost:3000/api/sprints" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "alex-ai",
    "name": "Sprint 1",
    "sprint_number": 1,
    "start_date": "2025-01-01",
    "end_date": "2025-01-14",
    "goals": ["Set up sprint system", "Build timeline UI"],
    "velocity_target": 34
  }'
# Response: {"id": "sprint-uuid-123", ...}

# 2. Create a story
curl -X POST "http://localhost:3000/api/stories" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "alex-ai",
    "sprint_id": "sprint-uuid-123",
    "title": "Implement horizontal sprint timeline",
    "description": "As a Product Manager, I want to see sprints in a horizontal timeline...",
    "story_type": "user_story",
    "persona_id": "persona-uuid-power-user",
    "story_points": 8,
    "priority": 1
  }'
# Response: {"id": "story-uuid-456", ...}

# 3. Get crew assignment recommendations
curl -X POST "http://localhost:3000/api/stories/story-uuid-456/assign"
# Response: {"recommendations": [...], "auto_assigned": "troi"}

# 4. Update story status
curl -X PATCH "http://localhost:3000/api/stories/story-uuid-456" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress"
  }'

# 5. Complete the sprint
curl -X PATCH "http://localhost:3000/api/sprints/sprint-uuid-123" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "velocity_actual": 32
  }'
```

---

## Migration

Before using the API, apply the database migration:

### Option 1: Supabase SQL Editor (Recommended)

1. Copy migration SQL: `cat supabase/migrations/20251228_create_sprint_system.sql | pbcopy`
2. Open Supabase SQL Editor: https://your-project.supabase.co/project/_/sql
3. Paste and click "Run"

### Option 2: Manual Helper Script

```bash
./scripts/apply-migration-manual.sh
```

This script:
- Copies SQL to clipboard
- Opens Supabase SQL Editor
- Verifies tables created

### Option 3: Automated Script

```bash
node scripts/alex-ai/auto-migrate.mjs
```

### Verify Migration

```bash
node scripts/alex-ai/auto-migrate.mjs --verify-only
```

Expected output:
```
✓ Table 'sprints' exists
✓ Table 'stories' exists
✓ Table 'acceptance_criteria' exists
✓ Table 'tasks' exists
✓ Table 'comments' exists
✓ Table 'personas' exists
✓ Table 'crew_workload' exists

✨ Migration verified: All 7 tables created successfully!
```

---

## TypeScript Types

All TypeScript interfaces are available in `types/sprint.ts`:

```typescript
import type {
  Sprint,
  Story,
  Persona,
  AcceptanceCriterion,
  Task,
  CrewAssignmentRecommendation,
  CreateSprintRequest,
  CreateStoryRequest,
  UpdateStoryRequest
} from '@/types/sprint';
```

---

## Next Steps

1. **Apply Migration**: Use one of the methods above to create database tables
2. **Seed Personas**: Run `node scripts/seed-personas.mjs` to insert 13 personas
3. **Test API**: Use the examples above to test CRUD operations
4. **Build UI**: Create `SprintTimeline` component to visualize sprints
5. **Add Testing**: Implement automated API tests

---

## Support

For issues or questions:
- Check migration status: `node scripts/alex-ai/auto-migrate.mjs --verify-only`
- View logs: Check Next.js console for error details
- Database access: Supabase Dashboard → Table Editor

**Generated**: 2025-12-28
**Version**: 1.0.0
