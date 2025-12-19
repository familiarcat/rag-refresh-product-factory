# Alex AI File System Operations Guide

The Alex AI code assistant extension can now read and write to the file system, enabling crew recommendations and plans to be persisted and executed automatically.

## Overview

The extension provides three main capabilities:

1. **Save Crew Recommendations** - Store analysis and advice from crew members
2. **Save Execution Plans** - Create multi-step plans coordinated by the crew
3. **Execute Recommendations** - Apply code changes recommended by crew members

## Directory Structure

When enabled, the extension manages these directories:

```
workspace/
├── data/
│   ├── recommendations/        # Individual crew recommendations
│   ├── plans/                  # Coordinated execution plans
│   ├── crew_memories.json      # Shared crew insights and memories
│   └── CREW_RECOMMENDATIONS.md # Exported recommendations
└── crew-members/               # Crew member profiles
    ├── picard.json
    ├── riker.json
    ├── data.json
    └── ...
```

## API Methods

### Saving Recommendations

Save an individual crew member's recommendation:

```typescript
// From chat participant or command handler
const filename = await alexAiService.saveRecommendation(
  'data',           // crew member ID
  {
    title: 'Optimize Database Query',
    content: 'Your SELECT statement could use an INDEX on the user_id column...',
    context: 'Analyzing app/api/users.ts',
    action: {
      type: 'code-change',
      file: 'app/api/users.ts',
      line: 42
    },
    priority: 'high',
    file: 'app/api/users.ts',
    lineStart: 40,
    lineEnd: 50
  }
);
// Returns: 'data-recommendation-2025-01-15T14-30-45-123Z.json'
```

### Saving Plans

Save a coordinated multi-step execution plan:

```typescript
const filename = await alexAiService.savePlan({
  name: 'Refactor Authentication System',
  description: 'Upgrade from basic auth to JWT-based authentication',
  objectives: [
    'Replace session-based auth with JWT tokens',
    'Update database schema for token storage',
    'Migrate existing sessions to JWT format'
  ],
  steps: [
    {
      step: 1,
      task: 'Review authentication architecture',
      assignedTo: 'picard',
      priority: 'high'
    },
    {
      step: 2,
      task: 'Design JWT token schema',
      assignedTo: 'data',
      priority: 'high'
    },
    {
      step: 3,
      task: 'Implement JWT middleware',
      assignedTo: 'geordi',
      priority: 'high'
    },
    {
      step: 4,
      task: 'Add security tests',
      assignedTo: 'worf',
      priority: 'high'
    },
    {
      step: 5,
      task: 'Update documentation',
      assignedTo: 'troi',
      priority: 'medium'
    }
  ],
  estimatedTime: '3 days',
  files: ['src/auth/jwt.ts', 'src/middleware/auth.ts'],
  metadata: {
    complexity: 'high',
    risk: 'medium',
    impact: 'critical'
  }
});
// Returns: 'Refactor Authentication System-2025-01-15T14-30-45-123Z.json'
```

### Executing Recommendations

Apply code changes directly:

```typescript
const success = await alexAiService.executeCodeRecommendation(
  'src/components/Button.tsx',
  `const Button = ({ onClick, children }) => (
  <button onClick={onClick}>{children}</button>
);`,
  `const Button = ({ onClick, children, disabled = false }) => (
  <button onClick={onClick} disabled={disabled}>{children}</button>
);`
);
```

### Loading Crew Memories

Access shared insights across the crew:

```typescript
const memories = await alexAiService.loadCrewMemories();
// Returns: { architecture_decisions: [...], patterns_observed: [...] }
```

### Updating Crew Memories

Store new insights for future reference:

```typescript
await alexAiService.updateCrewMemories({
  lastAnalyzed: {
    file: 'src/components/Modal.tsx',
    issues: ['Missing error boundary', 'Accessibility issues'],
    suggestions: ['Wrap in ErrorBoundary', 'Add ARIA labels']
  },
  patterns_observed: [
    'Inconsistent error handling',
    'Props not validated'
  ]
});
```

### Querying Saved Items

Retrieve recommendations and plans:

```typescript
// Get recent recommendations (last 5)
const recommendations = await alexAiService.getRecentRecommendations(5);
// Returns: Array<{ filename: string, data: RecommendationData }>

// Get recent plans (last 5)
const plans = await alexAiService.getRecentPlans(5);
// Returns: Array<{ filename: string, data: PlanData }>
```

## VS Code Commands

The following commands are available in the Command Palette:

- **`Alex AI: Save Recommendation`** - Save a crew recommendation to file
- **`Alex AI: Save Plan`** - Save an execution plan to file
- **`Alex AI: Execute Recommendation`** - Apply a code change from a recommendation
- **`Alex AI: View Recommendations`** - Browse and view saved recommendations
- **`Alex AI: View Plans`** - Browse and view saved plans
- **`Alex AI: Export Recommendations`** - Export all recommendations to Markdown
- **`Alex AI: Export Plans`** - Export all plans to Markdown

## Integration with Chat Participants

When using the crew chat in VS Code, mention `@save` to persist recommendations:

```
@alex Data, review this database query and @save your recommendation
```

This creates a file:
```
data/recommendations/data-recommendation-2025-01-15T14-30-45-123Z.json
```

## File Format

### Recommendation File Format

```json
{
  "id": "rec_2025-01-15T14-30-45-123Z",
  "crewMember": "data",
  "timestamp": "2025-01-15T14:30:45.123Z",
  "title": "Optimize Database Query",
  "content": "Your SELECT statement...",
  "context": "Analyzing app/api/users.ts",
  "priority": "high",
  "action": {
    "type": "code-change",
    "file": "app/api/users.ts",
    "line": 42
  },
  "file": "app/api/users.ts",
  "lineStart": 40,
  "lineEnd": 50
}
```

### Plan File Format

```json
{
  "id": "plan_2025-01-15T14-30-45-123Z",
  "timestamp": "2025-01-15T14:30:45.123Z",
  "name": "Refactor Authentication System",
  "description": "Upgrade from basic auth to JWT-based authentication",
  "objectives": [...],
  "steps": [...],
  "estimatedTime": "3 days",
  "files": [...],
  "metadata": {}
}
```

## Workflow Example

### 1. Request Code Analysis

```
@alex Data, analyze our authentication middleware for security issues
```

### 2. Save Recommendation

The extension automatically saves Data's recommendation:
```
data/recommendations/data-recommendation-2025-01-15T14-30-45-123Z.json
```

### 3. Create Execution Plan

```
@alex riker, create a plan to fix the security issues
```

The plan is saved to:
```
data/plans/Security Hardening-2025-01-15T14-31-00-456Z.json
```

### 4. Execute the Plan

View the plan and execute individual steps:
- Step 1: Review architecture (Picard)
- Step 2: Design improvements (Data)
- Step 3: Implement changes (La Forge)
- Step 4: Security test (Worf)

Each step can trigger automatic code changes:
```
@alex execute step 3: apply geordi's middleware updates
```

### 5. Export and Archive

```
@alex export all recommendations and plans to markdown
```

Creates:
- `data/CREW_RECOMMENDATIONS.md`
- `data/CREW_PLANS.md`

## Integration with RAG System

The saved recommendations and plans integrate with the main RAG system:

1. **Crew Memories** - Shared insights stored in `data/crew_memories.json`
2. **Vector Embeddings** - Recommendations can be indexed for similarity search
3. **Collaboration Log** - All actions tracked in `data/collaboration_log.json`
4. **Project Context** - Plans aware of project structure and dependencies

## File Permissions

The extension requires:

- **Read access**: `crew-members/`, `data/`
- **Write access**: `data/recommendations/`, `data/plans/`, any workspace files being modified

These are standard VS Code file system permissions and don't require additional configuration.

## Error Handling

All file operations include error handling:

```typescript
try {
  await alexAiService.saveRecommendation('picard', { ... });
} catch (error) {
  // Shows user-friendly error message
  vscode.window.showErrorMessage(`Failed to save: ${error.message}`);
}
```

## Tips and Best Practices

1. **Organization** - Crew member specific recommendations are prefixed with their ID
2. **Timestamps** - All files include ISO timestamps for sorting and versioning
3. **Metadata** - Include context, priority, and action details for future reference
4. **Memory Updates** - Periodically save crew learnings to improve future analysis
5. **Plan Tracking** - Mark plans with estimated time and dependencies
6. **Execution Log** - Keep track of which recommendations have been applied

## Troubleshooting

### Files not being saved

- Check that workspace is open and has a folder
- Verify VS Code has write permissions to workspace
- Check extension logs: Output > Alex AI

### Recommendations not appearing

- Ensure crew member ID is correct (picard, data, riker, etc.)
- Check that `data/recommendations/` directory exists
- View logs for specific error messages

### Plan execution failing

- Verify file paths are correct and relative to workspace root
- Check that code snippets match exactly (whitespace matters)
- Test with simpler code changes first

## Future Enhancements

Planned features:

- [ ] Real-time file watching and immediate crew analysis
- [ ] Automatic plan execution with approval gates
- [ ] Recommendation grouping by topic/feature
- [ ] Integration with git for recommendation diffing
- [ ] Web dashboard for viewing all crew outputs
- [ ] CI/CD pipeline hooks for plan execution
