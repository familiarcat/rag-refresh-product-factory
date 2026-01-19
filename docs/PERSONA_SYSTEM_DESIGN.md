# Persona System Design: User & Developer Personas for Agile Sprint Planning

**Design Date:** December 28, 2025
**Design Team:** Counselor Troi (UX & Empathy), Commander Data (Persona Analytics), Captain Picard (Strategic Direction)
**Analysis Source:** data/projects.json (7 active projects analyzed)

---

## Executive Summary

This document defines a comprehensive persona system for the RAG Product Factory sprint management tool. By analyzing existing projects (AI Writing Assistant, DocuSearch Enterprise, Feedback Widget, Code Review Automation, and Alex AI Self-Development), we identified patterns in user types, developer roles, and team structures. The persona system maps to our 10-member crew (Star Trek characters) and supports both **user personas** (who benefits from features) and **developer personas** (who builds features).

**Key Insights:**
- **7 distinct user personas** identified across projects
- **6 developer personas** mapped to technical specializations
- **10 crew members** with unique expertise areas
- **Persona-driven story generation** enables better sprint planning
- **Crew optimization algorithm** matches personas to crew expertise

---

## Persona Taxonomy

### Persona Categories

1. **User Personas** - External users who benefit from product features
2. **Developer Personas** - Internal team members who build features
3. **Crew Personas** - RAG Product Factory team members (Star Trek crew)

---

## Part 1: User Personas

User personas represent the people who will use the product. These are derived from analyzing target markets, user flows, and feature requirements across all projects.

### 1. End User (General)

**Who They Are:**
- Primary consumer of the product
- Non-technical, seeks simplicity
- Values ease of use and speed

**Goals:**
- Complete tasks quickly
- Intuitive interface
- Reliable performance

**Pain Points:**
- Complexity and steep learning curves
- Slow or buggy software
- Lack of clear instructions

**Technical Level:** Low (1-2/10)

**Projects Where Prominent:**
- AI Writing Assistant (writers, bloggers)
- Feedback Widget (website visitors)

**Example User Stories:**
```
As an End User
I want to submit feedback with one click
So that I can quickly share my thoughts without filling out long forms

As an End User
I want AI writing suggestions as I type
So that I can overcome writer's block and write faster
```

**Crew Affinity:**
- **Counselor Troi** (UX, empathy, user needs)
- **Dr. Crusher** (clarity, simplicity, health of user experience)

---

### 2. Power User / Advanced User

**Who They Are:**
- Experienced user who leverages advanced features
- Comfortable with complexity if it adds value
- Often becomes product advocate

**Goals:**
- Maximize productivity with shortcuts and customization
- Automation of repetitive tasks
- Deep feature integration

**Pain Points:**
- Limited customization options
- Missing power user features (keyboard shortcuts, bulk actions)
- Slow workflows due to lack of automation

**Technical Level:** Medium (5-6/10)

**Projects Where Prominent:**
- AI Writing Assistant (professional writers)
- DocuSearch Enterprise (legal/healthcare researchers)

**Example User Stories:**
```
As a Power User
I want keyboard shortcuts for all actions
So that I can work faster without using the mouse

As a Power User
I want to create custom writing templates
So that I can standardize my content creation workflow
```

**Crew Affinity:**
- **Commander Riker** (execution, efficiency)
- **Lieutenant Uhura** (communication, API power features)

---

### 3. Administrator / System Admin

**Who They Are:**
- Manages users, permissions, and system configuration
- Technical but focused on operations, not development
- Ensures security, compliance, and uptime

**Goals:**
- Centralized user management
- Audit logs and compliance reporting
- System health monitoring

**Pain Points:**
- Lack of granular permissions
- No audit trail for compliance
- Difficult to onboard/offboard users

**Technical Level:** Medium-High (6-7/10)

**Projects Where Prominent:**
- DocuSearch Enterprise (IT admins)
- Code Review Automation (team leads)

**Example User Stories:**
```
As an Administrator
I want role-based access control
So that I can ensure only authorized users access sensitive documents

As an Administrator
I want audit logs of all user actions
So that I can comply with HIPAA/GDPR requirements
```

**Crew Affinity:**
- **Lieutenant Worf** (security, compliance, protocols)
- **Chief O'Brien** (system maintenance, reliability)

---

### 4. Content Creator / Creative Professional

**Who They Are:**
- Writers, designers, marketers creating content
- Values creativity tools and collaboration features
- Needs inspiration and productivity aids

**Goals:**
- AI-powered content assistance
- Collaboration with team members
- Version control and iteration

**Pain Points:**
- Writer's block / creative fatigue
- Lack of collaboration features
- No version history or rollback

**Technical Level:** Low-Medium (3-4/10)

**Projects Where Prominent:**
- AI Writing Assistant (primary persona)
- Feedback Widget (content teams collecting user feedback)

**Example User Stories:**
```
As a Content Creator
I want AI to suggest article outlines
So that I can quickly structure my writing

As a Content Creator
I want to collaborate with my editor in real-time
So that we can finalize content faster
```

**Crew Affinity:**
- **Counselor Troi** (creativity, empathy, user experience)
- **Commander Data** (AI assistance, pattern recognition)

---

### 5. Developer / Engineering User

**Who They Are:**
- Software developers using the product for their work
- Highly technical, values API access and integrations
- Wants programmatic control

**Goals:**
- API access for automation
- CLI tools and SDKs
- Integration with existing dev tools (GitHub, Slack, CI/CD)

**Pain Points:**
- No API or limited API
- Poor documentation
- Lack of webhooks or event system

**Technical Level:** High (8-9/10)

**Projects Where Prominent:**
- Code Review Automation (developers receiving reviews)
- DocuSearch Enterprise (dev teams searching code docs)
- Alex AI Self-Development (internal developers)

**Example User Stories:**
```
As a Developer
I want a REST API to programmatically create code review requests
So that I can integrate reviews into my CI/CD pipeline

As a Developer
I want webhook notifications when reviews are completed
So that I can automate downstream workflows
```

**Crew Affinity:**
- **Commander Data** (technical depth, AI/ML)
- **Geordi La Forge** (engineering, infrastructure)
- **Chief O'Brien** (hands-on implementation)

---

### 6. Enterprise Decision Maker

**Who They Are:**
- C-level, VPs, or managers evaluating product
- Budget authority, cares about ROI
- Less concerned with features, more with business outcomes

**Goals:**
- Clear ROI and cost justification
- Security and compliance certifications
- Scalability and vendor stability

**Pain Points:**
- Unclear pricing or hidden costs
- Lack of security certifications (SOC2, GDPR)
- Vendor lock-in concerns

**Technical Level:** Low (2-3/10), Business-savvy (9/10)

**Projects Where Prominent:**
- DocuSearch Enterprise (enterprise sales)
- Code Review Automation (engineering leadership)

**Example User Stories:**
```
As an Enterprise Decision Maker
I want a transparent pricing calculator
So that I can forecast annual costs accurately

As an Enterprise Decision Maker
I want SOC2 Type II certification
So that I can meet our security compliance requirements
```

**Crew Affinity:**
- **Captain Picard** (strategic vision, leadership)
- **Quark** (business intelligence, ROI analysis)

---

### 7. Domain Specialist (Legal, Healthcare, Finance)

**Who They Are:**
- Expert in a specific domain (law, medicine, finance)
- Needs domain-specific features and terminology
- High compliance and accuracy requirements

**Goals:**
- Domain-specific search and retrieval
- Compliance with industry regulations
- High accuracy (no hallucinations)

**Pain Points:**
- Generic tools don't understand domain nuances
- Compliance concerns (HIPAA, attorney-client privilege)
- Inaccurate results due to generic models

**Technical Level:** Low-Medium (3-5/10), Domain Expertise (9/10)

**Projects Where Prominent:**
- DocuSearch Enterprise (legal firms, healthcare, financial services)

**Example User Stories:**
```
As a Legal Specialist
I want semantic search that understands legal terminology
So that I can find relevant case law quickly

As a Healthcare Specialist
I want HIPAA-compliant document storage
So that patient data remains secure and compliant
```

**Crew Affinity:**
- **Commander Data** (knowledge retrieval, accuracy)
- **Dr. Crusher** (healthcare domain, ethical considerations)
- **Lieutenant Worf** (security, compliance)

---

## Part 2: Developer Personas

Developer personas represent the internal team members who build features. These map to our 10-member crew and guide story assignment.

### 1. Frontend Developer

**Responsibilities:**
- UI/UX implementation
- Component development (React, TypeScript)
- State management
- Responsive design
- Accessibility (WCAG)

**Skills:**
- HTML, CSS, JavaScript/TypeScript
- React, Next.js, Vue.js
- TailwindCSS, styled-components
- Storybook, testing (Jest, Cypress)

**Tools:**
- VSCode, Chrome DevTools
- Figma (design handoff)
- Git, GitHub

**Pain Points:**
- Design changes mid-sprint
- Unclear acceptance criteria for UI
- Browser compatibility issues

**Example Developer Stories:**
```
As a Frontend Developer
I need to implement the SprintTimeline component with drag-and-drop
To enable users to reassign stories between crew members

As a Frontend Developer
I need comprehensive TypeScript interfaces for Sprint/Story data
To ensure type safety and prevent runtime errors
```

**Crew Member Mapping:**
- **Counselor Troi** (primary: UX, user empathy, interface design)
- **Lieutenant Uhura** (secondary: communication interfaces, API integration)

**Specialization Tags:** `frontend`, `ui`, `react`, `typescript`, `design`

---

### 2. Backend Developer

**Responsibilities:**
- API development (REST, GraphQL)
- Database design and optimization
- Business logic implementation
- Authentication and authorization
- Performance optimization

**Skills:**
- Node.js, Python, Go, Java
- Express, FastAPI, Django
- PostgreSQL, MongoDB, Redis
- API design (REST, GraphQL)
- Authentication (JWT, OAuth)

**Tools:**
- Postman, Insomnia
- DataGrip, pgAdmin
- Docker, Docker Compose

**Pain Points:**
- Unclear data models from frontend
- Changing requirements mid-sprint
- Database migration issues

**Example Developer Stories:**
```
As a Backend Developer
I need to create Sprint and Story API endpoints (CRUD operations)
To enable the frontend to manage sprint data

As a Backend Developer
I need to optimize the crew assignment algorithm for large datasets
To ensure sprint planning remains fast even with 1000+ stories
```

**Crew Member Mapping:**
- **Commander Data** (primary: data processing, AI/ML, algorithms)
- **Chief O'Brien** (secondary: hands-on implementation, database work)

**Specialization Tags:** `backend`, `api`, `database`, `nodejs`, `python`

---

### 3. DevOps / Infrastructure Engineer

**Responsibilities:**
- CI/CD pipeline setup
- Infrastructure as Code (Terraform, CloudFormation)
- Container orchestration (Docker, Kubernetes)
- Monitoring and alerting
- Deployment automation

**Skills:**
- AWS, Azure, GCP
- Docker, Kubernetes
- Terraform, Ansible
- GitHub Actions, CircleCI, Jenkins
- Monitoring (Datadog, Prometheus, Grafana)

**Tools:**
- Terraform, kubectl
- AWS CLI, Azure CLI
- GitHub Actions

**Pain Points:**
- Environment drift (dev vs. prod)
- Manual deployment processes
- Lack of infrastructure documentation

**Example Developer Stories:**
```
As a DevOps Engineer
I need to set up a Supabase deployment pipeline with GitHub Actions
To automate sprint data migrations on every release

As a DevOps Engineer
I need monitoring dashboards for sprint API performance
To identify and resolve bottlenecks proactively
```

**Crew Member Mapping:**
- **Geordi La Forge** (primary: infrastructure, systems engineering, performance)
- **Lieutenant Worf** (secondary: security hardening, compliance)

**Specialization Tags:** `devops`, `infrastructure`, `aws`, `terraform`, `docker`

---

### 4. Full-Stack Developer

**Responsibilities:**
- End-to-end feature development
- Frontend and backend integration
- Prototyping and MVPs
- Cross-functional collaboration

**Skills:**
- Frontend: React, Next.js, TypeScript
- Backend: Node.js, Express, Next.js API
- Database: PostgreSQL, Supabase
- Deployment: Vercel, AWS

**Tools:**
- VSCode, Postman
- Supabase Studio
- Vercel CLI

**Pain Points:**
- Context switching between frontend and backend
- Lack of clear ownership boundaries
- Need to stay current in multiple domains

**Example Developer Stories:**
```
As a Full-Stack Developer
I need to build the complete Sprint CRUD feature (UI + API + DB)
To enable end-to-end sprint management

As a Full-Stack Developer
I need to integrate the crew assignment API with the SprintTimeline UI
To show auto-suggested crew members when creating stories
```

**Crew Member Mapping:**
- **Commander Riker** (primary: execution, coordination, cross-domain work)
- **Chief O'Brien** (secondary: pragmatic implementation, full-stack mindset)

**Specialization Tags:** `fullstack`, `frontend`, `backend`, `react`, `nodejs`

---

### 5. Designer (UI/UX)

**Responsibilities:**
- User research and personas
- Wireframing and prototyping
- Visual design (colors, typography, spacing)
- Design system creation
- Usability testing

**Skills:**
- Figma, Sketch, Adobe XD
- Design systems (Material, Tailwind)
- User research methods
- Prototyping and animation

**Tools:**
- Figma, FigJam
- Miro (user journey mapping)
- UserTesting, Hotjar

**Pain Points:**
- Designs not implemented as specified
- Lack of design system adherence
- No time for user testing

**Example Developer Stories:**
```
As a Designer
I need to create wireframes for the SprintTimeline component
To define the user flow and interaction patterns

As a Designer
I need to design the StoryCard component with variants (compact, detailed)
To ensure consistent visual language across sprint views
```

**Crew Member Mapping:**
- **Counselor Troi** (primary: empathy, user needs, aesthetics)
- **Captain Picard** (secondary: strategic design decisions)

**Specialization Tags:** `design`, `ux`, `ui`, `figma`, `research`

---

### 6. QA / Test Engineer

**Responsibilities:**
- Test plan creation
- Manual and automated testing
- Bug reporting and tracking
- Regression testing
- Performance testing

**Skills:**
- Testing frameworks (Jest, Cypress, Playwright)
- Test case design
- Bug tracking (Jira, Linear)
- API testing (Postman)

**Tools:**
- Cypress, Playwright
- Postman, Newman
- BrowserStack

**Pain Points:**
- Incomplete acceptance criteria
- No time allocated for testing
- Regression bugs due to lack of test coverage

**Example Developer Stories:**
```
As a QA Engineer
I need comprehensive acceptance criteria for all sprint stories
To write effective test cases

As a QA Engineer
I need a staging environment that mirrors production
To test sprint features in realistic conditions
```

**Crew Member Mapping:**
- **Lieutenant Worf** (primary: security testing, protocol validation)
- **Dr. Crusher** (secondary: health checks, diagnostic testing)

**Specialization Tags:** `qa`, `testing`, `cypress`, `security`, `validation`

---

## Part 3: Crew Member Personas (Star Trek Crew)

Our 10-member crew represents specialized expertise areas. Each crew member is optimized for specific types of work.

### Crew Roster & Specializations

| Crew Member | Primary Expertise | Secondary Expertise | Developer Persona Fit | User Story Affinity |
|-------------|-------------------|---------------------|----------------------|---------------------|
| **Captain Picard** | Strategy, Leadership, Decision-Making | Diplomacy, Governance | Designer (strategic), PM | Enterprise Decision Maker |
| **Commander Riker** | Execution, Coordination, Tactical Planning | Team Leadership | Full-Stack, PM | Power User |
| **Commander Data** | AI/ML, Data Analysis, Algorithms | Technical Depth, Knowledge | Backend (AI/ML), Data Science | Developer User, Domain Specialist |
| **Geordi La Forge** | Infrastructure, Systems Engineering | Performance Optimization | DevOps, Infrastructure | Administrator |
| **Counselor Troi** | UX, User Empathy, Psychology | Communication, Aesthetics | Frontend (UX), Designer | End User, Content Creator |
| **Lieutenant Worf** | Security, Compliance, Protocols | Testing, Reliability | QA, Security Engineer | Administrator, Domain Specialist |
| **Dr. Crusher** | Health Checks, Diagnostics, Documentation | Ethics, Clarity | QA, Tech Writer | End User (health/clarity) |
| **Chief O'Brien** | Hands-On Implementation, Maintenance | Pragmatic Solutions, Troubleshooting | Full-Stack, Backend | Power User |
| **Quark** | Business Intelligence, ROI Analysis | Cost Optimization, Negotiation | Business Analyst, PM | Enterprise Decision Maker |
| **Lieutenant Uhura** | APIs, Communication, I/O | Integration, External Systems | Backend (APIs), Integration Engineer | Developer User |

---

## Persona-to-Crew Mapping Algorithm

When a user story is created, the system suggests the optimal crew member(s) based on:

### 1. Keyword Matching

**User Persona Keywords → Crew:**
- "End User", "simple", "intuitive" → **Counselor Troi** (UX focus)
- "Administrator", "security", "compliance" → **Lieutenant Worf** (security)
- "Developer", "API", "integration" → **Lieutenant Uhura** (APIs)
- "Enterprise", "ROI", "cost" → **Quark** (business analysis)
- "Power User", "advanced", "customization" → **Commander Riker** (execution)

**Developer Persona Keywords → Crew:**
- "frontend", "UI", "React", "component" → **Counselor Troi** (UX/frontend)
- "backend", "API", "database", "Node.js" → **Commander Data** or **Chief O'Brien**
- "DevOps", "infrastructure", "AWS", "Terraform" → **Geordi La Forge**
- "AI", "ML", "algorithm", "optimization" → **Commander Data**
- "security", "testing", "QA", "validation" → **Lieutenant Worf**
- "documentation", "health check", "diagnostics" → **Dr. Crusher**

### 2. Story Type Matching

| Story Type | Primary Crew | Secondary Crew |
|------------|--------------|----------------|
| User Story (End User) | Counselor Troi | Dr. Crusher |
| User Story (Power User) | Commander Riker | Chief O'Brien |
| User Story (Admin) | Lieutenant Worf | Geordi La Forge |
| User Story (Developer) | Commander Data | Lieutenant Uhura |
| User Story (Enterprise) | Captain Picard | Quark |
| Developer Story (Frontend) | Counselor Troi | Lieutenant Uhura |
| Developer Story (Backend) | Commander Data | Chief O'Brien |
| Developer Story (DevOps) | Geordi La Forge | Lieutenant Worf |
| Developer Story (AI/ML) | Commander Data | Captain Picard |
| Bug (Critical) | Lieutenant Worf | Chief O'Brien |
| Bug (UI/UX) | Counselor Troi | Dr. Crusher |
| Technical Debt | Chief O'Brien | Geordi La Forge |
| Documentation | Dr. Crusher | Lieutenant Uhura |
| Business Analysis | Quark | Captain Picard |

### 3. Skill Matching (from crew-assignment-system.ts)

```typescript
const crewSkillsMap: Record<string, string[]> = {
  'captain_picard': ['leadership', 'strategy', 'diplomacy', 'decision-making'],
  'commander_riker': ['execution', 'team-coordination', 'tactical', 'leadership'],
  'commander_data': ['analysis', 'technical', 'computation', 'logic', 'ai', 'ml'],
  'geordi_la_forge': ['engineering', 'infrastructure', 'optimization', 'systems'],
  'counselor_troi': ['ux', 'psychology', 'empathy', 'communication', 'design'],
  'lieutenant_worf': ['security', 'protocols', 'testing', 'reliability', 'compliance'],
  'dr_crusher': ['health-checks', 'diagnostics', 'documentation', 'science'],
  'chief_obrien': ['implementation', 'hands-on', 'maintenance', 'troubleshooting'],
  'quark': ['business', 'analytics', 'monetization', 'negotiation', 'roi'],
  'lieutenant_uhura': ['apis', 'communication', 'integration', 'external-systems'],
};
```

### 4. Workload Balancing

- Check current sprint load per crew member
- Prefer crew members with lower story point totals
- Balance across specializations (don't overload one area)

### 5. Historical Performance

- Track crew member velocity (points completed per sprint)
- Prefer crew members who excel at similar story types
- Learn from past assignments (collaborative filtering)

---

## Persona-Driven Story Templates

### User Story Template (End User Persona)

```markdown
# User Story: [Concise Title]

**Persona:** End User
**User Type:** [Writer / Blogger / Content Creator]
**Technical Level:** Low (1-2/10)

## Story
As an **End User**
I want **[specific capability]**
So that **[clear benefit/value]**

## User Context
- **Goals:** [What they're trying to achieve]
- **Pain Points:** [Current frustrations]
- **Environment:** [Desktop/Mobile, Browser, etc.]

## Acceptance Criteria
- [ ] **Given** I am on the [page/screen]
      **When** I [perform action]
      **Then** I should see [expected outcome]

- [ ] **Given** [context]
      **When** [action]
      **Then** [outcome]

## UI/UX Considerations
- Simple, intuitive interface
- Clear labels and instructions
- Fast performance (<2s load time)
- Mobile-responsive

## Success Metrics
- User completion rate > 90%
- Average time to complete < 30 seconds
- User satisfaction score > 4/5

**Story Points:** [1-8]
**Sprint:** [Sprint Number]
**Epic:** [Parent Epic]
**Assigned Crew:** Counselor Troi (primary), Dr. Crusher (secondary)
**Priority:** [Critical / High / Medium / Low]
```

---

### Developer Story Template (Frontend Persona)

```markdown
# Developer Story: [Technical Task Title]

**Developer Persona:** Frontend Developer
**Technical Area:** UI/UX Implementation
**Component:** [SprintTimeline / StoryCard / etc.]

## Story
As a **Frontend Developer**
I need to **[implement specific technical capability]**
To enable **[user-facing feature or system capability]**

## Technical Context
- **Framework:** React 18, Next.js 14, TypeScript 5
- **State Management:** React hooks (useState, useReducer)
- **Styling:** TailwindCSS, styled-jsx
- **Related Components:** [List dependencies]

## Acceptance Criteria
- [ ] Component implements TypeScript interface [InterfaceName]
- [ ] Component is responsive (mobile, tablet, desktop)
- [ ] Component passes accessibility tests (WCAG AA)
- [ ] Unit tests achieve >80% code coverage
- [ ] Storybook story created for component variants

## Technical Requirements
- Drag-and-drop functionality using React DnD
- Real-time updates via WebSocket or polling
- Error handling for API failures
- Loading states and skeletons

## Dependencies
- **API Endpoints:** [List required endpoints]
- **Data Models:** [List TypeScript interfaces]
- **Design Assets:** [Link to Figma]

## Definition of Done
- [ ] Code reviewed and approved
- [ ] Tests passing (unit + integration)
- [ ] Accessibility audit passed
- [ ] Performance benchmarks met (<50ms render)
- [ ] Documentation updated (component README)

**Story Points:** [3-13]
**Sprint:** [Sprint Number]
**Epic:** [Parent Epic]
**Assigned Crew:** Counselor Troi (frontend), Lieutenant Uhura (API integration)
**Priority:** [Critical / High / Medium / Low]
```

---

### Developer Story Template (Backend Persona)

```markdown
# Developer Story: [Technical Task Title]

**Developer Persona:** Backend Developer
**Technical Area:** API / Database / Business Logic
**Service:** [Sprint Service / Story Service / etc.]

## Story
As a **Backend Developer**
I need to **[implement specific API/database feature]**
To enable **[frontend capability or system integration]**

## Technical Context
- **Language:** Node.js 20, TypeScript 5
- **Framework:** Next.js API Routes / Express
- **Database:** PostgreSQL (Supabase), Redis
- **ORM:** Prisma / Drizzle
- **Authentication:** Supabase Auth

## Acceptance Criteria
- [ ] API endpoint implements OpenAPI 3.0 spec
- [ ] Database schema follows normalization best practices
- [ ] API responses include proper error codes (400, 401, 403, 404, 500)
- [ ] Request validation using Zod schemas
- [ ] API tests achieve >90% code coverage

## API Specification
**Endpoint:** `POST /api/sprints`

**Request Body:**
```json
{
  "name": "Sprint 12",
  "projectId": "proj_123",
  "startDate": "2026-01-06",
  "endDate": "2026-01-17",
  "goals": ["Complete SprintTimeline component", "Deploy to staging"],
  "velocity": 45
}
```

**Response (201 Created):**
```json
{
  "id": "sprint_456",
  "name": "Sprint 12",
  "projectId": "proj_123",
  "startDate": "2026-01-06",
  "endDate": "2026-01-17",
  "status": "planned",
  "createdAt": "2025-12-28T10:00:00Z"
}
```

## Database Schema
```sql
CREATE TABLE sprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  project_id UUID REFERENCES projects(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  goals TEXT[],
  status VARCHAR(50) DEFAULT 'planned',
  velocity INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Performance Requirements
- API response time < 200ms (P95)
- Database query optimization (use indexes)
- Handle 100 concurrent requests
- Implement caching (Redis) for read-heavy endpoints

## Dependencies
- **Frontend:** SprintTimeline component needs this API
- **Database Migrations:** Run before deployment
- **Authentication:** Requires valid JWT token

## Definition of Done
- [ ] Code reviewed and approved
- [ ] API tests passing (unit + integration)
- [ ] Database migrations tested
- [ ] API documentation generated (Swagger/OpenAPI)
- [ ] Performance benchmarks met
- [ ] Security audit passed (SQL injection, XSS, CSRF)

**Story Points:** [5-21]
**Sprint:** [Sprint Number]
**Epic:** [Parent Epic]
**Assigned Crew:** Commander Data (AI/data), Chief O'Brien (implementation)
**Priority:** [Critical / High / Medium / Low]
```

---

### Developer Story Template (DevOps Persona)

```markdown
# Developer Story: [Infrastructure Task Title]

**Developer Persona:** DevOps Engineer
**Technical Area:** Infrastructure / Deployment / Monitoring
**Service:** [AWS / Supabase / CI/CD]

## Story
As a **DevOps Engineer**
I need to **[implement infrastructure capability]**
To enable **[deployment/monitoring/security capability]**

## Technical Context
- **Cloud Provider:** AWS / Vercel / Supabase
- **IaC Tool:** Terraform / CloudFormation
- **CI/CD:** GitHub Actions / CircleCI
- **Monitoring:** Datadog / Prometheus / Grafana

## Acceptance Criteria
- [ ] Infrastructure defined as code (Terraform)
- [ ] CI/CD pipeline runs on every PR
- [ ] Automated tests pass before deployment
- [ ] Monitoring alerts configured (Slack/PagerDuty)
- [ ] Rollback procedure documented

## Infrastructure Specification
**Resources:**
- Supabase project (PostgreSQL + Auth)
- Redis cache (ElastiCache or Upstash)
- S3 bucket for file storage
- CloudFront CDN
- Route53 DNS

**Terraform Example:**
```hcl
resource "aws_s3_bucket" "sprint_attachments" {
  bucket = "rag-factory-sprint-attachments"

  tags = {
    Project = "RAG Product Factory"
    Environment = "production"
  }
}
```

## CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy Sprint System
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test
      - name: Deploy to Vercel
        run: vercel deploy --prod
      - name: Run migrations
        run: npm run migrate
```

## Monitoring & Alerts
- **Uptime Monitor:** PingdomAPI / UptimeRobot (99.9% SLA)
- **Error Tracking:** Sentry
- **Performance:** New Relic or Datadog APM
- **Logs:** CloudWatch or Datadog Logs

**Alert Rules:**
- API error rate > 5% → Slack #alerts
- API latency P95 > 500ms → Slack #alerts
- Database CPU > 80% → PagerDuty on-call
- Disk usage > 90% → PagerDuty on-call

## Security Requirements
- [ ] Secrets stored in GitHub Secrets / AWS Secrets Manager
- [ ] IAM roles follow least-privilege principle
- [ ] SSL/TLS certificates auto-renewed
- [ ] Security groups limit inbound traffic
- [ ] VPC configured for database isolation

## Dependencies
- **Backend API:** Must be deployed before frontend
- **Database Migrations:** Run before API deployment
- **DNS Changes:** May require 24-48hr propagation

## Definition of Done
- [ ] Infrastructure deployed via IaC
- [ ] CI/CD pipeline green (all tests passing)
- [ ] Monitoring dashboards created
- [ ] Alerts firing correctly (test with simulation)
- [ ] Rollback procedure tested
- [ ] Documentation updated (runbooks)

**Story Points:** [8-21]
**Sprint:** [Sprint Number]
**Epic:** [Parent Epic]
**Assigned Crew:** Geordi La Forge (infrastructure), Lieutenant Worf (security)
**Priority:** [Critical / High / Medium / Low]
```

---

## Persona Attributes Schema

### User Persona Attributes

```typescript
interface UserPersona {
  id: string;
  name: string;
  type: 'end_user' | 'power_user' | 'admin' | 'content_creator' | 'developer' | 'enterprise' | 'domain_specialist';

  // Demographics
  role: string; // "Writer", "Legal Analyst", "CTO"
  industry?: string; // "Healthcare", "Legal", "Finance", "Tech"

  // Characteristics
  technicalLevel: number; // 1-10
  domainExpertise?: number; // 1-10

  // Goals and Motivations
  goals: string[];
  painPoints: string[];
  motivations: string[];

  // Behavior Patterns
  usageFrequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
  preferredDevices: ('desktop' | 'mobile' | 'tablet')[];
  preferredInteractionStyle: 'visual' | 'keyboard' | 'voice' | 'mixed';

  // Project Context
  projectIds: string[]; // Projects where this persona is relevant

  // Story Generation
  storyTemplateId: string;
  defaultPriority: 'critical' | 'high' | 'medium' | 'low';

  // Crew Affinity
  primaryCrew: string[]; // ['counselor_troi', 'dr_crusher']
  secondaryCrew: string[];
}
```

### Developer Persona Attributes

```typescript
interface DeveloperPersona {
  id: string;
  name: string;
  type: 'frontend' | 'backend' | 'fullstack' | 'devops' | 'designer' | 'qa' | 'data' | 'ml';

  // Technical Skills
  primarySkills: string[]; // ['React', 'TypeScript', 'CSS']
  secondarySkills: string[];
  languages: string[]; // ['JavaScript', 'Python', 'Go']
  frameworks: string[]; // ['Next.js', 'Express', 'FastAPI']
  tools: string[]; // ['VSCode', 'Docker', 'Figma']

  // Specialization
  specialization: string; // "Frontend (UX)", "Backend (AI/ML)", "DevOps (AWS)"
  experienceLevel: 'junior' | 'mid' | 'senior' | 'staff' | 'principal';

  // Work Patterns
  preferredStorySize: 'small' | 'medium' | 'large'; // 1-3 | 5-8 | 13-21 points
  avgVelocity: number; // Average story points per sprint

  // Story Context
  storyTemplateId: string;
  defaultTags: string[]; // ['frontend', 'react', 'ui']

  // Crew Member Mapping
  crewMemberId: string; // 'counselor_troi'
  backupCrewMembers: string[];
}
```

### Crew Member Persona Attributes

```typescript
interface CrewMemberPersona {
  id: string; // 'captain_picard'
  name: string; // 'Captain Jean-Luc Picard'
  rank: string; // 'Captain'

  // Expertise
  primaryExpertise: string[]; // ['strategy', 'leadership', 'diplomacy']
  secondaryExpertise: string[]; // ['decision-making', 'governance']

  // Mapping
  developerPersonaFit: string[]; // ['designer', 'pm']
  userPersonaAffinity: string[]; // ['enterprise_decision_maker']

  // Skills (from crew-assignment-system.ts)
  skills: string[]; // ['leadership', 'strategy', 'diplomacy', 'decision-making']

  // Performance Tracking
  avgVelocity: number; // Story points completed per sprint
  avgCycleTime: number; // Hours from start to done
  specialtyAreas: string[]; // ['strategic-planning', 'stakeholder-management']

  // Collaboration
  synergyWith: Record<string, number>; // { 'commander_riker': 0.95, 'counselor_troi': 0.85 }

  // Availability
  currentSprintLoad: number; // Story points assigned in current sprint
  maxCapacity: number; // Max story points per sprint

  // Character Traits (for personality)
  personality: {
    decisionStyle: 'analytical' | 'intuitive' | 'collaborative' | 'decisive';
    communicationStyle: 'formal' | 'casual' | 'technical' | 'empathetic';
    workStyle: 'strategic' | 'tactical' | 'hands-on' | 'delegative';
  };
}
```

---

## Implementation Guide

### 1. Persona Data Storage

**File Structure:**
```
data/
  personas/
    user-personas.json        # User persona definitions
    developer-personas.json   # Developer persona definitions
    crew-members.json         # Crew member definitions (extends crew-assignment-system.ts)
```

### 2. Story Template System

**Templates Directory:**
```
data/
  story-templates/
    user-story-end-user.md
    user-story-power-user.md
    user-story-admin.md
    developer-story-frontend.md
    developer-story-backend.md
    developer-story-devops.md
```

### 3. Crew Assignment Algorithm Enhancement

**Extend:** `lib/alex-ai/crew-assignment-system.ts`

**New Method:**
```typescript
assignCrewForStory(story: Story): CrewAssignment[] {
  // 1. Extract persona from story
  const userPersona = story.personaId;
  const requiredSkills = extractSkillsFromDescription(story.description);

  // 2. Score all crew members
  const scores = this.getOptimalCrew(requiredSkills, 3);

  // 3. Filter by workload (don't overload)
  const availableCrew = scores.filter(s =>
    this.getCurrentLoad(s.crewId) < this.getMaxCapacity(s.crewId)
  );

  // 4. Boost scores for persona affinity
  const boostedScores = availableCrew.map(s => ({
    ...s,
    score: s.score * this.getPersonaAffinityBoost(s.crewId, userPersona)
  }));

  // 5. Return top 2-3 crew members
  return boostedScores.sort((a, b) => b.score - a.score).slice(0, 2);
}
```

### 4. UI Integration

**SprintTimeline Component:**
- Show crew member swimlanes
- Display persona badges on StoryCards
- Filter by persona type
- Color-code by crew member

**StoryDetailPanel:**
- Persona selector (dropdown of user personas)
- Developer persona (auto-detected from story type)
- Suggested crew members (from assignment algorithm)
- Override crew assignment (manual selection)

---

## Success Metrics

### Persona System Effectiveness

**Metrics to Track:**
1. **Assignment Accuracy**: % of stories where suggested crew matches final assignment
2. **Workload Balance**: Standard deviation of story points across crew members
3. **Velocity Improvement**: Crew members working on affinity personas complete stories faster
4. **Story Quality**: Stories with clear personas have fewer clarification questions
5. **Sprint Completion**: Sprints with balanced persona distribution have higher completion rates

**Target KPIs:**
- Assignment accuracy > 80%
- Workload balance (std dev) < 15%
- Velocity improvement (affinity) > 20%
- Sprint completion rate > 90%

---

## Personas Identified from Projects

### Project Analysis Summary

| Project | User Personas | Developer Personas | Crew Assigned |
|---------|---------------|-------------------|---------------|
| AI Writing Assistant | Content Creator, Power User, End User | Frontend, Backend (AI/ML), Designer | Data, Troi, Geordi |
| DocuSearch Enterprise | Domain Specialist (Legal/Healthcare), Admin, Enterprise Decision Maker | Backend (AI/ML), DevOps, Frontend | Picard, Data, Geordi, O'Brien |
| Feedback Widget | End User, Developer (API consumer) | Full-Stack, Frontend | Geordi, Troi |
| Code Review Automation | Developer (primary), Admin, Enterprise Decision Maker | Backend (AI/ML), DevOps, QA | Data, Geordi, Worf, Quark |
| Alex AI Self-Development | Developer (internal), Admin | All personas (dogfooding) | Full crew (9 members) |

---

## Appendix: Persona Creation Worksheet

When creating a new persona, answer these questions:

### User Persona
1. **Who are they?** (Role, industry, background)
2. **What are their goals?** (What do they want to achieve?)
3. **What are their pain points?** (Current frustrations)
4. **Technical level?** (1-10 scale)
5. **Usage frequency?** (Daily, weekly, monthly)
6. **Preferred devices?** (Desktop, mobile, tablet)
7. **Which projects?** (Where is this persona relevant?)
8. **Crew affinity?** (Which crew members best serve this persona?)

### Developer Persona
1. **What do they build?** (Frontend, backend, infrastructure)
2. **Primary skills?** (Languages, frameworks, tools)
3. **Experience level?** (Junior, mid, senior, staff)
4. **Preferred story size?** (Small, medium, large)
5. **Average velocity?** (Story points per sprint)
6. **Crew member mapping?** (Primary and backup)
7. **Story template?** (Which template fits this persona?)

---

**Document Version:** 1.0
**Last Updated:** December 28, 2025
**Next Review:** Q2 2026
