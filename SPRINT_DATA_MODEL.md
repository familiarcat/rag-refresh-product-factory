# Sprint Data Model: Database Schema & TypeScript Interfaces

**Design Date:** December 28, 2025
**Architects:** Commander Data (Data Modeling), Chief O'Brien (Database), Geordi La Forge (Performance)

---

## Overview

This document defines the complete data model for the Sprint Management System, including:
- Database schema (PostgreSQL/Supabase)
- TypeScript interfaces for type safety
- API endpoint specifications
- Data relationships and constraints
- Migration scripts

---

## Database Schema (PostgreSQL)

### 1. Sprints Table

```sql
CREATE TABLE sprints (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Timeline
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Metadata
  goals TEXT[], -- Array of sprint goals
  status VARCHAR(20) NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'active', 'completed', 'canceled')),
  velocity INTEGER DEFAULT 0, -- Story points capacity

  -- Metrics
  total_story_points INTEGER DEFAULT 0,
  completed_story_points INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date > start_date),
  CONSTRAINT non_negative_velocity CHECK (velocity >= 0)
);

-- Indexes for performance
CREATE INDEX idx_sprints_project_id ON sprints(project_id);
CREATE INDEX idx_sprints_status ON sprints(status);
CREATE INDEX idx_sprints_dates ON sprints(start_date, end_date);

-- Trigger for updated_at
CREATE TRIGGER update_sprints_updated_at
  BEFORE UPDATE ON sprints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### 2. Stories Table

```sql
CREATE TABLE stories (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Content
  title VARCHAR(500) NOT NULL,
  description TEXT,

  -- Classification
  story_type VARCHAR(20) NOT NULL DEFAULT 'user_story'
    CHECK (story_type IN ('user_story', 'developer_story', 'bug', 'spike', 'technical_debt')),
  persona_type VARCHAR(20) NOT NULL DEFAULT 'user'
    CHECK (persona_type IN ('user', 'developer')),
  persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,

  -- Assignment
  assigned_crew_member VARCHAR(50) REFERENCES crew_members(id),

  -- Estimation
  story_points INTEGER CHECK (story_points IN (1, 2, 3, 5, 8, 13, 21)),
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'todo'
    CHECK (status IN ('backlog', 'todo', 'in_progress', 'review', 'done', 'blocked', 'canceled')),
  priority VARCHAR(10) NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('critical', 'high', 'medium', 'low')),

  -- Metadata
  labels TEXT[], -- Array of tags
  external_links JSONB, -- { "github": "...", "figma": "..." }

  -- Dates
  due_date DATE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  -- Constraints
  CONSTRAINT non_negative_hours CHECK (estimated_hours >= 0 AND actual_hours >= 0)
);

-- Indexes
CREATE INDEX idx_stories_sprint_id ON stories(sprint_id);
CREATE INDEX idx_stories_project_id ON stories(project_id);
CREATE INDEX idx_stories_assigned_crew ON stories(assigned_crew_member);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_persona ON stories(persona_id);
CREATE INDEX idx_stories_labels ON stories USING GIN (labels);

-- Full-text search index
CREATE INDEX idx_stories_fulltext ON stories USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '')));
```

---

### 3. Acceptance Criteria Table

```sql
CREATE TABLE acceptance_criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,

  -- Content
  description TEXT NOT NULL,
  format VARCHAR(20) DEFAULT 'given_when_then'
    CHECK (format IN ('given_when_then', 'checklist', 'rule')),

  -- Order
  position INTEGER NOT NULL DEFAULT 0,

  -- Status
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT non_negative_position CHECK (position >= 0)
);

-- Indexes
CREATE INDEX idx_acceptance_criteria_story_id ON acceptance_criteria(story_id);
CREATE INDEX idx_acceptance_criteria_position ON acceptance_criteria(story_id, position);
```

---

### 4. Tasks Table

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,

  -- Content
  title VARCHAR(500) NOT NULL,
  description TEXT,

  -- Assignment
  assigned_crew_member VARCHAR(50) REFERENCES crew_members(id),

  -- Estimation
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'done')),

  -- Order
  position INTEGER NOT NULL DEFAULT 0,

  -- Dates
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tasks_story_id ON tasks(story_id);
CREATE INDEX idx_tasks_assigned_crew ON tasks(assigned_crew_member);
CREATE INDEX idx_tasks_position ON tasks(story_id, position);
```

---

### 5. Personas Table

```sql
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('user', 'developer')),

  -- User Persona Fields
  role VARCHAR(100),
  industry VARCHAR(100),
  technical_level INTEGER CHECK (technical_level BETWEEN 1 AND 10),
  domain_expertise INTEGER CHECK (domain_expertise BETWEEN 1 AND 10),

  -- Developer Persona Fields
  specialization VARCHAR(100), -- 'frontend', 'backend', 'devops', etc.
  experience_level VARCHAR(20) CHECK (experience_level IN ('junior', 'mid', 'senior', 'staff', 'principal')),
  primary_skills TEXT[],

  -- Attributes
  goals TEXT[],
  pain_points TEXT[],
  motivations TEXT[],

  -- Crew Mapping
  primary_crew_members TEXT[], -- ['counselor_troi', 'dr_crusher']
  secondary_crew_members TEXT[],

  -- Metadata
  story_template_id UUID,
  default_priority VARCHAR(10) DEFAULT 'medium',

  -- Project Context
  project_ids TEXT[], -- Projects where this persona is relevant

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_personas_type ON personas(type);
CREATE INDEX idx_personas_specialization ON personas(specialization);
```

---

### 6. Crew Members Table (Reference)

```sql
CREATE TABLE crew_members (
  id VARCHAR(50) PRIMARY KEY, -- 'counselor_troi'
  name VARCHAR(100) NOT NULL,
  rank VARCHAR(50),

  -- Expertise
  primary_expertise TEXT[],
  secondary_expertise TEXT[],
  skills TEXT[],

  -- Mapping
  developer_persona_fit TEXT[],
  user_persona_affinity TEXT[],

  -- Performance
  avg_velocity INTEGER DEFAULT 0,
  avg_cycle_time DECIMAL(10,2),
  specialty_areas TEXT[],

  -- Capacity
  max_capacity INTEGER DEFAULT 40, -- Max story points per sprint

  -- Metadata
  avatar_url VARCHAR(500),
  bio TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initial crew data (seed)
INSERT INTO crew_members (id, name, rank, primary_expertise, skills, max_capacity) VALUES
('captain_picard', 'Captain Jean-Luc Picard', 'Captain',
 ARRAY['strategy', 'leadership', 'diplomacy'],
 ARRAY['leadership', 'strategy', 'diplomacy', 'decision-making'], 30),
('commander_riker', 'Commander William Riker', 'Commander',
 ARRAY['execution', 'team-coordination', 'tactical'],
 ARRAY['execution', 'team-coordination', 'tactical', 'leadership'], 40),
('commander_data', 'Commander Data', 'Commander',
 ARRAY['analysis', 'technical', 'ai', 'ml'],
 ARRAY['analysis', 'technical', 'computation', 'logic', 'ai', 'ml'], 50),
('geordi_la_forge', 'Lt. Commander Geordi La Forge', 'Lt. Commander',
 ARRAY['engineering', 'infrastructure', 'optimization'],
 ARRAY['engineering', 'infrastructure', 'optimization', 'systems'], 45),
('counselor_troi', 'Counselor Deanna Troi', 'Counselor',
 ARRAY['ux', 'psychology', 'empathy', 'communication'],
 ARRAY['ux', 'psychology', 'empathy', 'communication', 'design'], 35),
('lieutenant_worf', 'Lieutenant Worf', 'Lieutenant',
 ARRAY['security', 'protocols', 'testing'],
 ARRAY['security', 'protocols', 'testing', 'reliability', 'compliance'], 40),
('dr_crusher', 'Dr. Beverly Crusher', 'Doctor',
 ARRAY['health-checks', 'diagnostics', 'documentation'],
 ARRAY['health-checks', 'diagnostics', 'documentation', 'science'], 30),
('chief_obrien', 'Chief Miles O''Brien', 'Chief',
 ARRAY['implementation', 'hands-on', 'maintenance'],
 ARRAY['implementation', 'hands-on', 'maintenance', 'troubleshooting'], 45),
('quark', 'Quark', 'Civilian',
 ARRAY['business', 'analytics', 'monetization'],
 ARRAY['business', 'analytics', 'monetization', 'negotiation', 'roi'], 25),
('lieutenant_uhura', 'Lieutenant Uhura', 'Lieutenant',
 ARRAY['apis', 'communication', 'integration'],
 ARRAY['apis', 'communication', 'integration', 'external-systems'], 40);
```

---

### 7. Comments Table

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL,
  content_format VARCHAR(20) DEFAULT 'markdown'
    CHECK (content_format IN ('plain', 'markdown', 'html')),

  -- Author
  author_crew_member VARCHAR(50) REFERENCES crew_members(id),
  author_user_id UUID REFERENCES users(id),

  -- Threading
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,

  -- Metadata
  attachments JSONB,
  mentions TEXT[], -- Array of mentioned crew/user IDs

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_comments_story_id ON comments(story_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
```

---

## TypeScript Interfaces

### Core Interfaces

```typescript
// Sprint Interface
export interface Sprint {
  id: string;
  name: string;
  projectId: string;

  // Timeline
  startDate: string; // ISO 8601 date
  endDate: string;

  // Metadata
  goals: string[];
  status: 'planned' | 'active' | 'completed' | 'canceled';
  velocity: number;

  // Metrics
  totalStoryPoints: number;
  completedStoryPoints: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;

  // Relations (optional, populated on query)
  stories?: Story[];
  project?: Project;
}

// Story Interface
export interface Story {
  id: string;
  sprintId?: string;
  projectId: string;

  // Content
  title: string;
  description?: string;

  // Classification
  storyType: 'user_story' | 'developer_story' | 'bug' | 'spike' | 'technical_debt';
  personaType: 'user' | 'developer';
  personaId?: string;

  // Assignment
  assignedCrewMember?: string; // crew_member.id

  // Estimation
  storyPoints?: number; // 1, 2, 3, 5, 8, 13, 21
  estimatedHours?: number;
  actualHours?: number;

  // Status
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'blocked' | 'canceled';
  priority: 'critical' | 'high' | 'medium' | 'low';

  // Metadata
  labels: string[];
  externalLinks?: Record<string, string>; // { github: "url", figma: "url" }

  // Dates
  dueDate?: string;
  startedAt?: string;
  completedAt?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  createdBy?: string;

  // Relations (optional)
  acceptanceCriteria?: AcceptanceCriterion[];
  tasks?: Task[];
  comments?: Comment[];
  persona?: Persona;
  sprint?: Sprint;
}

// Acceptance Criterion Interface
export interface AcceptanceCriterion {
  id: string;
  storyId: string;

  // Content
  description: string;
  format: 'given_when_then' | 'checklist' | 'rule';

  // Order
  position: number;

  // Status
  completed: boolean;
  completedAt?: string;
  completedBy?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Task Interface
export interface Task {
  id: string;
  storyId: string;

  // Content
  title: string;
  description?: string;

  // Assignment
  assignedCrewMember?: string;

  // Estimation
  estimatedHours?: number;
  actualHours?: number;

  // Status
  status: 'todo' | 'in_progress' | 'done';

  // Order
  position: number;

  // Dates
  startedAt?: string;
  completedAt?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Persona Interfaces
export interface UserPersona {
  id: string;
  name: string;
  type: 'user';

  // Demographics
  role: string; // "Writer", "Legal Analyst", "CTO"
  industry?: string;
  technicalLevel: number; // 1-10
  domainExpertise?: number; // 1-10

  // Attributes
  goals: string[];
  painPoints: string[];
  motivations: string[];

  // Crew Mapping
  primaryCrewMembers: string[];
  secondaryCrewMembers: string[];

  // Metadata
  storyTemplateId?: string;
  defaultPriority: 'critical' | 'high' | 'medium' | 'low';
  projectIds: string[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface DeveloperPersona {
  id: string;
  name: string;
  type: 'developer';

  // Technical Skills
  specialization: 'frontend' | 'backend' | 'fullstack' | 'devops' | 'designer' | 'qa' | 'data' | 'ml';
  experienceLevel: 'junior' | 'mid' | 'senior' | 'staff' | 'principal';
  primarySkills: string[];

  // Attributes
  goals: string[];
  painPoints: string[];

  // Crew Mapping
  primaryCrewMembers: string[];
  secondaryCrewMembers: string[];

  // Metadata
  storyTemplateId?: string;
  defaultPriority: 'critical' | 'high' | 'medium' | 'low';

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export type Persona = UserPersona | DeveloperPersona;

// Crew Member Interface
export interface CrewMember {
  id: string; // 'counselor_troi'
  name: string;
  rank: string;

  // Expertise
  primaryExpertise: string[];
  secondaryExpertise: string[];
  skills: string[];

  // Mapping
  developerPersonaFit: string[];
  userPersonaAffinity: string[];

  // Performance
  avgVelocity: number;
  avgCycleTime: number;
  specialtyAreas: string[];

  // Capacity
  maxCapacity: number;

  // Metadata
  avatarUrl?: string;
  bio?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Comment Interface
export interface Comment {
  id: string;
  storyId: string;

  // Content
  content: string;
  contentFormat: 'plain' | 'markdown' | 'html';

  // Author
  authorCrewMember?: string;
  authorUserId?: string;

  // Threading
  parentCommentId?: string;

  // Metadata
  attachments?: Record<string, any>;
  mentions?: string[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
  editedAt?: string;

  // Relations (optional)
  author?: CrewMember;
  replies?: Comment[];
}
```

---

## API Endpoints

### Sprint Endpoints

```typescript
// GET /api/sprints?projectId=proj_123&status=active
interface GetSprintsRequest {
  projectId: string;
  status?: 'planned' | 'active' | 'completed' | 'canceled';
  limit?: number;
  offset?: number;
}

interface GetSprintsResponse {
  sprints: Sprint[];
  total: number;
  hasMore: boolean;
}

// GET /api/sprints/:id
interface GetSprintResponse {
  sprint: Sprint;
  stories: Story[];
  metrics: {
    velocityTrend: number[];
    burndown: { date: string; remaining: number }[];
    completionRate: number;
  };
}

// POST /api/sprints
interface CreateSprintRequest {
  name: string;
  projectId: string;
  startDate: string;
  endDate: string;
  goals: string[];
  velocity?: number;
}

interface CreateSprintResponse {
  sprint: Sprint;
}

// PATCH /api/sprints/:id
interface UpdateSprintRequest {
  name?: string;
  startDate?: string;
  endDate?: string;
  goals?: string[];
  status?: 'planned' | 'active' | 'completed' | 'canceled';
  velocity?: number;
}

interface UpdateSprintResponse {
  sprint: Sprint;
}

// DELETE /api/sprints/:id
interface DeleteSprintResponse {
  success: boolean;
  deletedId: string;
}
```

### Story Endpoints

```typescript
// GET /api/stories?sprintId=sprint_123&status=in_progress
interface GetStoriesRequest {
  sprintId?: string;
  projectId?: string;
  assignedCrewMember?: string;
  status?: Story['status'];
  personaId?: string;
  labels?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

interface GetStoriesResponse {
  stories: Story[];
  total: number;
  hasMore: boolean;
}

// GET /api/stories/:id
interface GetStoryResponse {
  story: Story;
  acceptanceCriteria: AcceptanceCriterion[];
  tasks: Task[];
  comments: Comment[];
  relatedStories: Story[];
}

// POST /api/stories
interface CreateStoryRequest {
  sprintId?: string;
  projectId: string;
  title: string;
  description?: string;
  storyType: Story['storyType'];
  personaType: Story['personaType'];
  personaId?: string;
  assignedCrewMember?: string;
  storyPoints?: number;
  priority: Story['priority'];
  labels?: string[];
  dueDate?: string;
  acceptanceCriteria?: Omit<AcceptanceCriterion, 'id' | 'storyId' | 'createdAt' | 'updatedAt'>[];
}

interface CreateStoryResponse {
  story: Story;
  suggestedCrewMembers?: { crewId: string; score: number; reasoning: string }[];
}

// PATCH /api/stories/:id
interface UpdateStoryRequest {
  title?: string;
  description?: string;
  sprintId?: string;
  assignedCrewMember?: string;
  storyPoints?: number;
  status?: Story['status'];
  priority?: Story['priority'];
  labels?: string[];
  dueDate?: string;
}

interface UpdateStoryResponse {
  story: Story;
}

// DELETE /api/stories/:id
interface DeleteStoryResponse {
  success: boolean;
  deletedId: string;
}
```

### Crew Assignment Endpoint

```typescript
// POST /api/crew/assign
interface CrewAssignmentRequest {
  storyId: string;
  requiredSkills?: string[];
  preferredCrewMembers?: string[];
  excludeCrewMembers?: string[];
}

interface CrewAssignmentResponse {
  recommendations: {
    crewId: string;
    crewName: string;
    score: number;
    reasoning: string;
    matchedSkills: string[];
    currentLoad: number;
    maxCapacity: number;
    availability: 'available' | 'at_capacity' | 'overloaded';
  }[];
}

// GET /api/crew/workload?sprintId=sprint_123
interface CrewWorkloadRequest {
  sprintId: string;
}

interface CrewWorkloadResponse {
  workload: {
    crewId: string;
    crewName: string;
    assignedStories: number;
    totalStoryPoints: number;
    maxCapacity: number;
    utilization: number; // 0-100%
    stories: Story[];
  }[];
}
```

---

## Crew Optimization Algorithm

```typescript
export class CrewOptimizationEngine {
  /**
   * Assign optimal crew members to a story based on:
   * - Required skills
   * - Persona affinity
   * - Current workload
   * - Historical performance
   */
  async assignOptimalCrew(story: Story): Promise<CrewAssignmentResponse> {
    // 1. Extract required skills from story
    const requiredSkills = this.extractSkillsFromStory(story);

    // 2. Get all crew members
    const crewMembers = await this.getAllCrewMembers();

    // 3. Score each crew member
    const scores = crewMembers.map(crew => ({
      crewId: crew.id,
      crewName: crew.name,
      score: this.calculateCrewScore(crew, story, requiredSkills),
      matchedSkills: this.getMatchedSkills(crew.skills, requiredSkills),
      currentLoad: this.getCurrentLoad(crew.id, story.sprintId),
      maxCapacity: crew.maxCapacity,
      availability: this.getAvailability(crew.id, story.sprintId),
      reasoning: ''
    }));

    // 4. Apply persona affinity boost
    if (story.personaId) {
      const persona = await this.getPersona(story.personaId);
      scores.forEach(s => {
        const affinityBoost = persona.primaryCrewMembers.includes(s.crewId) ? 1.3 : 1.0;
        s.score *= affinityBoost;
      });
    }

    // 5. Apply workload balancing penalty
    scores.forEach(s => {
      const utilization = s.currentLoad / s.maxCapacity;
      if (utilization > 0.8) {
        s.score *= 0.7; // Penalize overloaded crew
      }
    });

    // 6. Generate reasoning
    scores.forEach(s => {
      s.reasoning = this.generateReasoning(s);
    });

    // 7. Sort by score and return top 3
    scores.sort((a, b) => b.score - a.score);

    return {
      recommendations: scores.slice(0, 3)
    };
  }

  private calculateCrewScore(
    crew: CrewMember,
    story: Story,
    requiredSkills: string[]
  ): number {
    // Skill matching score (0-1)
    const skillScore = requiredSkills.filter(skill =>
      crew.skills.some(cs => cs.toLowerCase().includes(skill.toLowerCase()))
    ).length / Math.max(requiredSkills.length, 1);

    // Story type matching
    const storyTypeScore = this.getStoryTypeScore(crew, story.storyType);

    // Historical performance
    const performanceScore = crew.avgVelocity / 50; // Normalize by max velocity

    // Weighted average
    return (skillScore * 0.5) + (storyTypeScore * 0.3) + (performanceScore * 0.2);
  }

  private extractSkillsFromStory(story: Story): string[] {
    const skills: string[] = [];
    const text = `${story.title} ${story.description}`.toLowerCase();

    // Keyword detection
    const skillKeywords: Record<string, string[]> = {
      'frontend': ['ui', 'react', 'component', 'frontend', 'design'],
      'backend': ['api', 'database', 'backend', 'server', 'endpoint'],
      'devops': ['deploy', 'infrastructure', 'aws', 'docker', 'pipeline'],
      'security': ['security', 'auth', 'permission', 'compliance', 'encryption'],
      'ux': ['user experience', 'ux', 'usability', 'interface'],
      'ai': ['ai', 'ml', 'machine learning', 'algorithm', 'model']
    };

    for (const [skill, keywords] of Object.entries(skillKeywords)) {
      if (keywords.some(kw => text.includes(kw))) {
        skills.push(skill);
      }
    }

    return skills;
  }

  private getCurrentLoad(crewId: string, sprintId?: string): number {
    // Query database for total story points assigned to crew in sprint
    // Implementation would use database query
    return 0; // Placeholder
  }

  private getAvailability(crewId: string, sprintId?: string): 'available' | 'at_capacity' | 'overloaded' {
    const load = this.getCurrentLoad(crewId, sprintId);
    const capacity = this.getCrewCapacity(crewId);

    if (load < capacity * 0.8) return 'available';
    if (load < capacity) return 'at_capacity';
    return 'overloaded';
  }

  private generateReasoning(score: CrewAssignmentScore): string {
    const reasons: string[] = [];

    if (score.matchedSkills.length > 0) {
      reasons.push(`Matched ${score.matchedSkills.length} required skills: ${score.matchedSkills.join(', ')}`);
    }

    if (score.availability === 'available') {
      reasons.push(`Available (${Math.round((score.currentLoad / score.maxCapacity) * 100)}% utilization)`);
    } else if (score.availability === 'overloaded') {
      reasons.push(`⚠️ Overloaded (${Math.round((score.currentLoad / score.maxCapacity) * 100)}% utilization)`);
    }

    return reasons.join('. ');
  }
}
```

---

## Data Relationships

```
┌─────────────┐
│  Projects   │
└──────┬──────┘
       │
       │ 1:N
       ▼
┌─────────────┐       ┌─────────────┐
│   Sprints   │◄──────│   Stories   │
└──────┬──────┘  N:1  └──────┬──────┘
       │                      │
       │                      │ 1:N
       │                      ├───────────┐
       │                      │           │
       │                      ▼           ▼
       │               ┌─────────────┐ ┌──────────┐
       │               │ Acceptance  │ │  Tasks   │
       │               │  Criteria   │ └──────────┘
       │               └─────────────┘
       │                      │
       │                      │ 1:N
       │                      ▼
       │               ┌─────────────┐
       │               │  Comments   │
       │               └─────────────┘
       │
       │               ┌─────────────┐
       └───────────────┤  Personas   │
                       └─────────────┘

┌──────────────────┐
│  Crew Members    │ (Referenced by Stories, Tasks)
└──────────────────┘
```

---

## Migration Scripts

### Initial Migration

```sql
-- migrations/001_create_sprint_system.sql

-- Create enum types
CREATE TYPE sprint_status AS ENUM ('planned', 'active', 'completed', 'canceled');
CREATE TYPE story_status AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done', 'blocked', 'canceled');
CREATE TYPE story_priority AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE story_type AS ENUM ('user_story', 'developer_story', 'bug', 'spike', 'technical_debt');
CREATE TYPE persona_type AS ENUM ('user', 'developer');

-- Create tables (as defined above)
CREATE TABLE sprints ( ... );
CREATE TABLE stories ( ... );
CREATE TABLE acceptance_criteria ( ... );
CREATE TABLE tasks ( ... );
CREATE TABLE personas ( ... );
CREATE TABLE crew_members ( ... );
CREATE TABLE comments ( ... );

-- Create indexes
-- (as defined above)

-- Create triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sprints_updated_at BEFORE UPDATE ON sprints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- (repeat for other tables)

-- Seed crew members data
INSERT INTO crew_members ( ... );
```

---

## Example Queries

### Get Sprint with Stories and Crew Workload

```sql
SELECT
  s.id AS sprint_id,
  s.name AS sprint_name,
  s.start_date,
  s.end_date,
  s.status,
  s.total_story_points,
  s.completed_story_points,
  ROUND((s.completed_story_points::DECIMAL / NULLIF(s.total_story_points, 0)) * 100, 1) AS progress_percentage,

  -- Crew workload
  cm.id AS crew_id,
  cm.name AS crew_name,
  COUNT(st.id) AS assigned_stories,
  COALESCE(SUM(st.story_points), 0) AS total_points,
  cm.max_capacity,
  ROUND((COALESCE(SUM(st.story_points), 0)::DECIMAL / cm.max_capacity) * 100, 1) AS utilization

FROM sprints s
LEFT JOIN stories st ON st.sprint_id = s.id
LEFT JOIN crew_members cm ON st.assigned_crew_member = cm.id
WHERE s.id = 'sprint_123'
GROUP BY s.id, cm.id
ORDER BY utilization DESC;
```

### Full-Text Search for Stories

```sql
SELECT
  id,
  title,
  description,
  status,
  story_points,
  assigned_crew_member,
  ts_rank(to_tsvector('english', title || ' ' || COALESCE(description, '')), plainto_tsquery('english', 'password reset')) AS rank
FROM stories
WHERE to_tsvector('english', title || ' ' || COALESCE(description, '')) @@ plainto_tsquery('english', 'password reset')
ORDER BY rank DESC
LIMIT 20;
```

---

**Document Version:** 1.0
**Last Updated:** December 28, 2025
