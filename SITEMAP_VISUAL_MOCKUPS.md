# Sitemap Visualization - Visual Mockups

## Web Dashboard: Full Interactive Sitemap

### View 1: Graph View (Force-Directed Layout)

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│  🗺️ Project Sitemap: AI Writing Assistant                                         │
│  ────────────────────────────────────────────────────────────────────────────────│
│  [⚫ Graph] [⚪ Tree] [⚪ Matrix]     Filter: [All ▾]     🔍 [Search domains...] │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│                                                                                    │
│                       ┌────────────────────────┐                                  │
│                       │   🎨 Core Editor       │                                  │
│                    ┌──│   ━━━━━━━━━━━━━━━━━   │                                  │
│                    │  │   65% ▓▓▓▓▓▓▓░░░      │                                  │
│                    │  │                        │                                  │
│                    │  │   D:9  M:8  U:7       │                                  │
│                    │  │   ✅ In Progress       │                                  │
│                    │  └────────────────────────┘                                  │
│                    │                                                               │
│                    │  "Text input for AI processing"                              │
│                    │                                                               │
│                    ▼                                                               │
│          ┌────────────────────────┐                                               │
│          │   🤖 AI Engine         │                                               │
│       ┌──│   ━━━━━━━━━━━━━━━━━   │                                               │
│       │  │   50% ▓▓▓▓▓░░░░       │                                               │
│       │  │                        │                                               │
│       │  │   D:8  M:9  U:8       │                                               │
│       │  │   ⚡ In Progress       │                                               │
│       │  └────────────────────────┘                                               │
│       │                                                                            │
│       │  "API key validation"                                                     │
│       │                                                                            │
│       ▼                                                                            │
│  ┌────────────────────────┐                                                       │
│  │  👤 User Management    │                                                       │
│  │  ━━━━━━━━━━━━━━━━━    │◀───────────────────────────────────┐                │
│  │  20% ▓▓░░░░░░░        │  "Shared User model"                │                │
│  │                        │                                      │                │
│  │  D:6  M:7  U:3        │                                      │                │
│  │  📅 Planned            │                                      │                │
│  └────────────────────────┘                                      │                │
│                                                                   │                │
│                                                                   │                │
│                                                                                    │
│                                                                                    │
│  ┌─ Legend ────────────────────────────────────────────────────────────────────┐ │
│  │  ● Completed  ● In Progress  ● Planned  ● At Risk  ● Blocked              │ │
│  │  D: Demand  M: Monetization  U: Unique                                      │ │
│  │  Click node for details  |  Drag to rearrange  |  Scroll to zoom           │ │
│  └──────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                    │
│  [Minimap]                                                                        │
│  ┌────┐                                                                           │
│  │ ◢◣ │  Overview of entire graph                                                │
│  │ ◥◤ │  (You are here: ▭)                                                       │
│  └────┘                                                                           │
│                                                                                    │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### View 2: Domain Detail Side Panel (Opened on Click)

```
┌──────────────────────────────────────────┬────────────────────────────────────┐
│  Graph View (Left 70%)                   │  Domain Details (Right 30%)       │
│                                          │                                    │
│                                          │  🤖 AI Engine                      │
│         ┌────────────────────┐           │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│         │   AI Engine        │◀──selected│                                    │
│         │   50% ▓▓▓▓▓░░░░   │           │  ⚡ In Progress                    │
│         │   D:8 M:9 U:8     │           │  50% Complete                      │
│         └────────────────────┘           │                                    │
│                                          │  Description                       │
│                                          │  ─────────────                     │
│        (Rest of graph...)                │  LLM integration for content       │
│                                          │  generation, summarization,        │
│                                          │  and style transfer                │
│                                          │                                    │
│                                          │  Scores                            │
│                                          │  ──────                            │
│                                          │  Demand         ▓▓▓▓▓▓▓▓░░ 8/10   │
│                                          │  Effort         ▓▓▓▓▓▓▓▓░░ 8/10   │
│                                          │  Monetization   ▓▓▓▓▓▓▓▓▓░ 9/10   │
│                                          │  Unique         ▓▓▓▓▓▓▓▓░░ 8/10   │
│                                          │  Risk           ▓▓▓▓░░░░░░ 4/10   │
│                                          │                                    │
│                                          │  Features                          │
│                                          │  ────────                          │
│                                          │  • GPT-4 integration               │
│                                          │  • Context window management       │
│                                          │  • Prompt templates                │
│                                          │  • Response streaming              │
│                                          │                                    │
│                                          │  Dependencies                      │
│                                          │  ────────────                      │
│                                          │  ↓ User Management                 │
│                                          │    Type: shared-model              │
│                                          │    API key validation              │
│                                          │                                    │
│                                          │  ↑ Core Editor                     │
│                                          │    Type: data-flow                 │
│                                          │    Receives text input             │
│                                          │                                    │
│                                          │  Milestones                        │
│                                          │  ──────────                        │
│                                          │  • Editor MVP (✅ Completed)       │
│                                          │  • Beta Launch (⚡ In Progress)    │
│                                          │                                    │
│                                          │  [View Domain Page] [Edit Domain] │
│                                          │                        [Close ✕]  │
└──────────────────────────────────────────┴────────────────────────────────────┘
```

### View 3: Tree View (Hierarchical)

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│  🗺️ Project Sitemap: AI Writing Assistant                                         │
│  ────────────────────────────────────────────────────────────────────────────────│
│  [⚪ Graph] [⚫ Tree] [⚪ Matrix]     Filter: [All ▾]     🔍 [Search domains...] │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│  AI Writing Assistant                                                             │
│  ├─ 🎨 Core Editor                                            ▓▓▓▓▓▓▓░░░ 65%    │
│  │  ├─ Rich Text Editing                                      ✅ Completed       │
│  │  ├─ AI Autocomplete                                        ⚡ In Progress     │
│  │  ├─ Style Suggestions                                      📅 Planned         │
│  │  └─ Grammar Check                                          📅 Planned         │
│  │                                                                                 │
│  ├─ 🤖 AI Engine                                              ▓▓▓▓▓░░░░░ 50%    │
│  │  ├─ GPT-4 Integration                                      ⚡ In Progress     │
│  │  ├─ Context Window Management                              📅 Planned         │
│  │  ├─ Prompt Templates                                       📅 Planned         │
│  │  └─ Response Streaming                                     📅 Planned         │
│  │                                                                                 │
│  └─ 👤 User Management                                        ▓▓░░░░░░░░ 20%    │
│     ├─ OAuth Login                                            📅 Planned         │
│     ├─ User Profiles                                          📅 Planned         │
│     ├─ Subscription Tiers                                     📅 Planned         │
│     └─ Usage Tracking                                         📅 Planned         │
│                                                                                    │
│  Dependencies                                                                      │
│  └─ Core Editor → AI Engine (data-flow)                                          │
│  └─ Core Editor → User Management (shared-model)                                 │
│  └─ AI Engine → User Management (shared-model)                                   │
│                                                                                    │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### View 4: Matrix View (Dependency Matrix)

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│  🗺️ Project Sitemap: AI Writing Assistant                                         │
│  ────────────────────────────────────────────────────────────────────────────────│
│  [⚪ Graph] [⚪ Tree] [⚫ Matrix]     Filter: [All ▾]     🔍 [Search domains...]  │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│  Dependency Matrix                                                                │
│  (Rows depend on Columns)                                                         │
│                                                                                    │
│                    │ Core Editor │ AI Engine │ User Mgmt │                       │
│  ──────────────────┼─────────────┼───────────┼───────────┤                       │
│  Core Editor       │      -      │     ✓     │     ✓     │                       │
│                    │             │  data-flow│shared-model│                       │
│  ──────────────────┼─────────────┼───────────┼───────────┤                       │
│  AI Engine         │             │     -     │     ✓     │                       │
│                    │             │           │shared-model│                       │
│  ──────────────────┼─────────────┼───────────┼───────────┤                       │
│  User Management   │             │           │     -     │                       │
│                    │             │           │           │                       │
│  ──────────────────┴─────────────┴───────────┴───────────┘                       │
│                                                                                    │
│  ✓ = Has dependency (click to see details)                                       │
│  - = No dependency                                                                 │
│                                                                                    │
│  Insights:                                                                         │
│  • No circular dependencies detected ✅                                           │
│  • User Management is a foundational domain (no outgoing dependencies)            │
│  • Core Editor is the entry point (most dependencies on other domains)            │
│                                                                                    │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## VSCode Extension: Compact Domain Navigator

### View 1: Domain List (Default)

```
┌──────────────────────────────────┐
│  🖖 Alex AI                      │
│  Crew Code Assistant             │
├──────────────────────────────────┤
│                                  │
│  Main Content Area               │
│  (Scrollable)                    │
│                                  │
│  ┌────────────────────────────┐  │
│  │ 🗺️ AI Writing Assistant    │  │
│  │ 3 domains                  │  │
│  │                            │  │
│  │ Overall Progress           │  │
│  │ ▓▓▓▓▓░░░░░░░░░░░ 45%     │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ 1️⃣ Core Editor             │  │
│  │ ▓▓▓▓▓▓▓░░░░░░ 65%        │  │
│  │                            │  │
│  │ D:9  M:8  U:7             │  │
│  │ ✅ In Progress             │  │
│  │                            │  │
│  │ [Tap to expand ▼]         │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ 2️⃣ AI Engine               │  │
│  │ ▓▓▓▓▓░░░░░░░░ 50%        │  │
│  │                            │  │
│  │ D:8  M:9  U:8             │  │
│  │ ⚡ In Progress             │  │
│  │                            │  │
│  │ [Tap to expand ▼]         │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ 3️⃣ User Management         │  │
│  │ ▓░░░░░░░░░░░░ 20%        │  │
│  │                            │  │
│  │ D:6  M:7  U:3             │  │
│  │ 📅 Planned                 │  │
│  │                            │  │
│  │ [Tap to expand ▼]         │  │
│  └────────────────────────────┘  │
│                                  │
│  Dependencies                    │
│  ────────────                    │
│  • Editor → AI Engine            │
│  • Editor → User Mgmt            │
│  • AI Engine → User Mgmt         │
│                                  │
├──────────────────────────────────┤
│ 💬   📦   📁   🗺️   👥          │
│ Chat Proj Files Map  Crew       │
│              ^^^^                │
│            (Active)              │
└──────────────────────────────────┘
```

### View 2: Domain Card Expanded

```
┌──────────────────────────────────┐
│  Main Content Area               │
│  (Scrollable)                    │
│                                  │
│  ┌────────────────────────────┐  │
│  │ 1️⃣ Core Editor             │  │
│  │ ▓▓▓▓▓▓▓░░░░░░ 65%        │  │
│  │                            │  │
│  │ D:9  M:8  U:7             │  │
│  │ ✅ In Progress             │  │
│  │────────────────────────────│  │
│  │                            │  │
│  │ Description:               │  │
│  │ Rich text editor with AI-  │  │
│  │ powered suggestions and    │  │
│  │ real-time assistance       │  │
│  │                            │  │
│  │ Features:                  │  │
│  │ • Rich text editing ✅    │  │
│  │ • AI autocomplete ⚡      │  │
│  │ • Style suggestions 📅    │  │
│  │ • Grammar check 📅        │  │
│  │                            │  │
│  │ Dependencies:              │  │
│  │ ↓ AI Engine (data-flow)   │  │
│  │ ↓ User Mgmt (shared-model)│  │
│  │                            │  │
│  │ [View in Web] [Close ▲]   │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ 2️⃣ AI Engine               │  │
│  │ [Tap to expand ▼]         │  │
│  └────────────────────────────┘  │
│                                  │
│  (Scroll for more domains...)    │
│                                  │
└──────────────────────────────────┘
```

### View 3: Context Menu (Long-Press)

```
┌──────────────────────────────────┐
│  ┌────────────────────────────┐  │
│  │ 2️⃣ AI Engine               │  │
│  │ ▓▓▓▓▓░░░░░░░░ 50%        │  │
│  │                            │  │
│  │ D:8  M:9  U:8             │  │
│  │ ⚡ In Progress    ┌────────┤  │
│  │                   │        │  │
│  │ [Tap to expand ▼] │        │  │
│  └────────────────────┤────────┤  │
│                       │        │  │
│    ┌──────────────────┴──────┐│  │
│    │  🌐 View in Web        ││  │
│    │  📋 Copy Domain Info   ││  │
│    │  ✏️  Edit Domain        ││  │
│    │  📊 View Scores        ││  │
│    │  🔗 Show Dependencies  ││  │
│    │  ✕  Cancel             ││  │
│    └────────────────────────┘│  │
│                              │  │
│  ┌────────────────────────────┐  │
│  │ 3️⃣ User Management         │  │
│  │ [Tap to expand ▼]         │  │
│  └────────────────────────────┘  │
│                                  │
└──────────────────────────────────┘
```

---

## Dogfooding: Factory Meta-Project Sitemap

### Factory Domains Visualization

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│  🗺️ Project Sitemap: RAG Refresh Product Factory (Meta-Project)                   │
│  ────────────────────────────────────────────────────────────────────────────────│
│  [⚫ Graph] [⚪ Tree] [⚪ Matrix]     Filter: [All ▾]     🔍 [Search domains...] │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────────┐    │
│  │  🏭 FACTORY DOMAINS (Templates for Generated Projects)                   │    │
│  └──────────────────────────────────────────────────────────────────────────┘    │
│                                                                                    │
│         ┌─────────────────────────────────┐                                       │
│         │  🔍 AI Observability Layer      │                                       │
│         │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━  │                                       │
│         │  35% ▓▓▓▓░░░░░░░░░░░░         │                                       │
│         │                                 │                                       │
│         │  D:10  M:9  U:10               │                                       │
│         │  ⚡ In Progress                 │                                       │
│         │                                 │                                       │
│         │  • Crew System                  │                                       │
│         │  • Collaboration Engine         │                                       │
│         │  • RAG Memory                   │                                       │
│         └─────────────────────────────────┘                                       │
│                        │                                                           │
│                        │ spawns                                                    │
│                        ▼                                                           │
│  ┌──────────────────────────────────────────────────────────┐                    │
│  │                GENERATED PROJECTS                        │                    │
│  │  (Inherit factory domains as initial structure)          │                    │
│  └──────────────────────────────────────────────────────────┘                    │
│         │                      │                      │                           │
│         ▼                      ▼                      ▼                           │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐                      │
│  │ AI Writing  │      │ DocuSearch  │      │ Code Review │                      │
│  │ Assistant   │      │ Enterprise  │      │ Automation  │                      │
│  │             │      │             │      │             │                      │
│  │ 3 domains   │      │ 4 domains   │      │ 3 domains   │                      │
│  │ 45% ▓▓▓░░  │      │ 30% ▓▓░░░  │      │ 20% ▓░░░░  │                      │
│  └─────────────┘      └─────────────┘      └─────────────┘                      │
│                                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  💡 Dogfooding Insight:                                                     │ │
│  │  This sitemap shows how the factory itself is structured and generates      │ │
│  │  child projects with similar domain patterns. Factory domains are templates.│ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                    │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### Cross-Project Shared Domains

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│  🗺️ Cross-Project Sitemap: All Projects                                           │
│  ────────────────────────────────────────────────────────────────────────────────│
│  [⚫ Graph] [⚪ Tree] [⚪ Matrix]     Filter: [All ▾]     🔍 [Search domains...] │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│  SHARED DOMAINS DETECTED                                                          │
│                                                                                    │
│                   ┌─────────────────────────────┐                                 │
│                   │  👤 User Management         │                                 │
│                   │  (Shared across 2 projects) │                                 │
│                   └─────────────────────────────┘                                 │
│                              ▲         ▲                                           │
│                              │         │                                           │
│                   ┌──────────┘         └──────────┐                               │
│                   │                                │                               │
│          ┌────────────────┐              ┌────────────────┐                       │
│          │ AI Writing     │              │ DocuSearch     │                       │
│          │ Assistant      │              │ Enterprise     │                       │
│          └────────────────┘              └────────────────┘                       │
│                                                                                    │
│                                                                                    │
│                   ┌─────────────────────────────┐                                 │
│                   │  🤖 AI Engine               │                                 │
│                   │  (Shared across 2 projects) │                                 │
│                   └─────────────────────────────┘                                 │
│                              ▲         ▲                                           │
│                              │         │                                           │
│                   ┌──────────┘         └──────────┐                               │
│                   │                                │                               │
│          ┌────────────────┐              ┌────────────────┐                       │
│          │ AI Writing     │              │ Code Review    │                       │
│          │ Assistant      │              │ Automation     │                       │
│          └────────────────┘              └────────────────┘                       │
│                                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  💡 Insight:                                                                │ │
│  │  • User Management appears in 2 projects → Consider extracting as shared   │ │
│  │    service or library                                                       │ │
│  │  • AI Engine appears in 2 projects → Opportunity to standardize API        │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                    │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## Timeline + Sitemap Integration

### Milestone View with Domain Association

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│  🗺️ Project Timeline + Sitemap: AI Writing Assistant                              │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│  TIMELINE                                                                         │
│  ━━━━━━━━━━●━━━━━━━━━━━●━━━━━━━━━━━━●━━━━━━━━━━━━━●━━━━                      │
│  Dec       Jan         Feb          Mar          Apr                             │
│                                                                                    │
│  Kickoff   Editor      Beta         Public                                        │
│  ✅ Done   ✅ Done     ⚡ Active     📅 Planned                                   │
│                                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  MILESTONE: Beta Launch (Feb 15, 2026) ⚡ In Progress                       │ │
│  │                                                                              │ │
│  │  Domains Involved:                                                           │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                     │ │
│  │  │ Core Editor  │  │  AI Engine   │  │ User Mgmt    │                     │ │
│  │  │ 65% ▓▓▓▓▓░  │  │ 50% ▓▓▓░░   │  │ 20% ▓░░░░   │                     │ │
│  │  │ ✅ On Track  │  │ ⚠️ At Risk   │  │ 📅 Planned   │                     │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                     │ │
│  │                                                                              │ │
│  │  [View Full Sitemap] [View Timeline Details]                                │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                    │
│  SITEMAP (Filtered to Beta Launch domains)                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                              │ │
│  │         ┌──────────────┐                                                    │ │
│  │         │ Core Editor  │                                                    │ │
│  │         │ 65% ▓▓▓▓▓░  │                                                    │ │
│  │         └──────────────┘                                                    │ │
│  │                │                                                             │ │
│  │                ▼                                                             │ │
│  │         ┌──────────────┐                                                    │ │
│  │         │  AI Engine   │ ⚠️                                                 │ │
│  │         │ 50% ▓▓▓░░   │                                                    │ │
│  │         └──────────────┘                                                    │ │
│  │                │                                                             │ │
│  │                ▼                                                             │ │
│  │         ┌──────────────┐                                                    │ │
│  │         │ User Mgmt    │                                                    │ │
│  │         │ 20% ▓░░░░   │                                                    │ │
│  │         └──────────────┘                                                    │ │
│  │                                                                              │ │
│  │  ⚠️ Insight: AI Engine is 2 weeks behind. Critical path for Beta Launch.   │ │
│  │                                                                              │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                    │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## Color & Typography Specs

### Color Palette

**Backgrounds:**
```
Dark Navy:     #070812  (--bg)
Panel:         #0d1022  (--panel)
Panel Alt:     #0b0f1d  (--panel2)
```

**Text:**
```
Primary:       #eef1ff  (--text)
Muted:         #b9c0e5  (--muted)
```

**Status Colors:**
```
Completed:     #10b981  🟢 (Green)
In Progress:   #3b82f6  🔵 (Blue)
Planned:       #6b7280  ⚪ (Gray)
At Risk:       #f59e0b  🟡 (Yellow)
Blocked:       #ef4444  🔴 (Red)
```

**Accents:**
```
Purple:        #7c5cff  (--accent1)
Cyan:          #5ae6ff  (--good)
Orange:        #ffb703  (--accent3)
Pink:          #ff5c93  (--risk)
```

### Typography

**Headings:**
```
H1 (Page Title):      28px, Bold, --text
H2 (Section):         18px, Semibold, --text
H3 (Card Title):      16px, Semibold, --text
H4 (Subsection):      14px, Medium, --text
```

**Body Text:**
```
Body Large:           16px, Regular, --text
Body Medium:          14px, Regular, --text
Body Small:           12px, Regular, --muted
Caption:              11px, Medium, --muted
```

**Monospace (Code, IDs):**
```
Code:                 14px, 'Monaco', 'Menlo', monospace
```

### Spacing

**Card Padding:**
```
Large:  24px
Medium: 16px
Small:  12px
```

**Gap Between Elements:**
```
Tight:  8px
Normal: 16px
Loose:  24px
```

---

## Animation Specs

### Microinteractions

**Hover (Domain Node):**
```css
transition: transform 0.2s ease, box-shadow 0.2s ease;
transform: scale(1.05);
box-shadow: 0 8px 24px rgba(124, 92, 255, 0.3);
```

**Click (Expand Card):**
```css
transition: max-height 0.3s ease-in-out, opacity 0.2s ease;
max-height: 0 → 500px;
opacity: 0 → 1;
```

**Progress Bar Fill:**
```css
@keyframes fillProgress {
  from { width: 0%; }
  to { width: var(--progress-value); }
}
animation: fillProgress 1s cubic-bezier(0.4, 0, 0.2, 1);
```

**Arrow Drawing (Connection):**
```css
@keyframes drawArrow {
  from { stroke-dashoffset: 100; }
  to { stroke-dashoffset: 0; }
}
animation: drawArrow 0.5s ease-out;
```

---

**Document Version**: 1.0
**Last Updated**: December 28, 2025

**Note**: These are ASCII mockups for conceptual visualization. Production implementation will use React Flow, Cytoscape.js, or D3.js for high-fidelity interactive graphics.
