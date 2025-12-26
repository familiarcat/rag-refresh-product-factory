# Alex AI File System Operations

Enable the Alex AI VS Code extension to read and write files, allowing crew recommendations and plans to be persisted and executed automatically.

## Quick Start

### 1. Enable File System Operations

The file system manager initializes automatically when the extension loads:

```typescript
// In extension.ts - automatically initialized
const alexAiService = new AlexAiService(context);
// FileSystemManager is automatically initialized
```

### 2. Save a Recommendation

```typescript
const filename = await alexAiService.saveRecommendation('picard', {
  title: 'Architecture Review',
  content: 'Consider implementing a layered architecture...',
  priority: 'high'
});
```

### 3. Create an Execution Plan

```typescript
const planId = await alexAiService.savePlan({
  name: 'API Refactoring',
  description: 'Refactor REST API to follow OpenAPI standards',
  objectives: ['Standardize endpoints', 'Add validation'],
  steps: [
    { step: 1, task: 'Review current API', assignedTo: 'picard' },
    { step: 2, task: 'Design new schema', assignedTo: 'data' }
  ]
});
```

### 4. Execute a Recommendation

```typescript
const success = await alexAiService.executeCodeRecommendation(
  'src/components/Modal.tsx',
  'const Modal = () => { /* old */ }',
  'const Modal = () => { /* new */ }'
);
```

## Architecture

```
FileSystemManager
├── save/read recommendations
├── save/read plans
├── execute code changes
├── manage crew memories
└── directory management
    ├── data/recommendations/
    ├── data/plans/
    ├── crew-members/
    └── data/
```

## File Organization

```
workspace/
├── data/
│   ├── recommendations/
│   │   ├── picard-recommendation-2025-01-15T14-30-45.json
│   │   ├── data-recommendation-2025-01-15T14-31-12.json
│   │   └── ...
│   ├── plans/
│   │   ├── API Refactoring-2025-01-15T14-32-00.json
│   │   └── ...
│   ├── crew_memories.json
│   ├── CREW_RECOMMENDATIONS.md
│   └── CREW_PLANS.md
└── crew-members/
    ├── picard.json
    ├── riker.json
    ├── data.json
    └── ...
```

## Core Methods

### Saving Content

- `saveRecommendation(crewMember, recommendation)` - Save crew recommendation
- `savePlan(plan)` - Save execution plan
- `updateCrewMemories(memories)` - Update shared crew insights

### Retrieving Content

- `getRecentRecommendations(limit)` - Get last N recommendations
- `getRecentPlans(limit)` - Get last N plans
- `loadCrewMemories()` - Load shared crew insights

### Executing Actions

- `executeCodeRecommendation(file, oldCode, newCode)` - Apply code change
- `readFile(filePath)` - Read any workspace file
- `writeFile(filePath, content)` - Write to any workspace file

### Management

- `getWorkspaceRoot()` - Get workspace root URI
- `getDataDir()` - Get data directory URI
- `getRecommendationsDir()` - Get recommendations directory
- `getPlansDir()` - Get plans directory

## VS Code Command Palette Integration

Available commands:

- **Alex AI: Save Recommendation** - Save crew recommendation to file
- **Alex AI: Save Plan** - Save execution plan to file
- **Alex AI: Execute Recommendation** - Apply code recommendation
- **Alex AI: View Recommendations** - Browse saved recommendations
- **Alex AI: View Plans** - Browse saved plans
- **Alex AI: Export Recommendations** - Export to Markdown
- **Alex AI: Export Plans** - Export to Markdown

## Example: Complete Workflow

```typescript
// 1. Analyze code with crew
const analysis = await alexAiService.chat(
  'worf',
  'Security audit of authentication module'
);

// 2. Save recommendation
const recFile = await alexAiService.saveRecommendation('worf', {
  title: 'Security Vulnerabilities Found',
  content: analysis,
  priority: 'high',
  file: 'src/auth.ts'
});

// 3. Create execution plan
const planFile = await alexAiService.savePlan({
  name: 'Security Hardening',
  description: 'Fix identified vulnerabilities',
  objectives: ['Fix SQL injection risk', 'Add input validation'],
  steps: [
    {
      step: 1,
      task: 'Add SQL parameterization',
      assignedTo: 'geordi',
      priority: 'high'
    }
  ]
});

// 4. Execute fix
const applied = await alexAiService.executeCodeRecommendation(
  'src/auth.ts',
  'const query = `SELECT * FROM users WHERE id = ${id}`;',
  'const query = "SELECT * FROM users WHERE id = $1"; // Use prepared statements'
);

// 5. Log success
if (applied) {
  console.log('✅ Security fix applied');
}
```

## File Formats

### Recommendation JSON

```json
{
  "id": "rec_2025-01-15T14-30-45-123Z",
  "crewMember": "worf",
  "timestamp": "2025-01-15T14:30:45.123Z",
  "title": "Security Vulnerabilities",
  "content": "Found SQL injection vulnerability...",
  "priority": "high",
  "file": "src/auth.ts",
  "lineStart": 42,
  "lineEnd": 50
}
```

### Plan JSON

```json
{
  "id": "plan_2025-01-15T14-30-45-123Z",
  "timestamp": "2025-01-15T14:30:45.123Z",
  "name": "Security Hardening",
  "description": "Fix identified vulnerabilities",
  "objectives": ["Fix SQL injection", "Add validation"],
  "steps": [
    {
      "step": 1,
      "task": "Add SQL parameterization",
      "assignedTo": "geordi",
      "priority": "high"
    }
  ],
  "estimatedTime": "4 hours",
  "files": ["src/auth.ts", "tests/auth.test.ts"]
}
```

## Integration with Chat Participants

When using @alex in VS Code Chat:

```
@alex worf, audit this code for security issues and @save your findings
```

The extension automatically:
1. Sends code to Worf for analysis
2. Saves the recommendation to file
3. Shows the recommendation in chat
4. Offers options to execute fixes

## Error Handling

All operations include error handling:

```typescript
try {
  const result = await alexAiService.saveRecommendation('picard', {
    title: 'Architecture',
    content: 'Review complete'
  });
  console.log('✅ Saved:', result);
} catch (error) {
  console.error('❌ Failed:', error.message);
  // User sees friendly error message
}
```

## Best Practices

1. **Include Context** - Add file paths and line numbers to recommendations
2. **Set Priority** - Mark high-priority issues appropriately
3. **Assign Steps** - Specify which crew member should handle each step
4. **Update Memories** - Save crew learnings for future use
5. **Regular Exports** - Periodically export recommendations and plans to markdown
6. **Version Control** - Commit plan files to track execution history

## Troubleshooting

### Files not saving

- ✅ Check workspace is open
- ✅ Verify write permissions
- ✅ Check logs in Output panel

### Recommendations not appearing

- ✅ Verify crew member ID (picard, data, riker, etc.)
- ✅ Check recommendations directory exists
- ✅ Ensure JSON is valid

### Code execution failing

- ✅ Verify file paths are relative to workspace root
- ✅ Check exact code string matching (whitespace matters)
- ✅ Test with simpler changes first

## Related Documentation

- [FILE_SYSTEM_GUIDE.md](./FILE_SYSTEM_GUIDE.md) - Comprehensive guide with examples
- [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md) - Code examples and patterns
- [README.md](./README.md) - Extension overview
