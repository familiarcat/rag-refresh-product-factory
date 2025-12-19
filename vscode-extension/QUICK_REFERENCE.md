# Alex AI File System Quick Reference

## Commands Available in VS Code

| Command                           | Description                        |
| --------------------------------- | ---------------------------------- |
| `Alex AI: Save Recommendation`    | Save a crew recommendation to file |
| `Alex AI: Save Plan`              | Save an execution plan to file     |
| `Alex AI: Execute Recommendation` | Apply a code change                |
| `Alex AI: View Recommendations`   | Browse saved recommendations       |
| `Alex AI: View Plans`             | Browse saved plans                 |
| `Alex AI: Export Recommendations` | Export to Markdown                 |
| `Alex AI: Export Plans`           | Export to Markdown                 |

## API Quick Reference

```typescript
// Save Operations
await alexAiService.saveRecommendation(crewMember, {
  title: string,
  content: string,
  priority?: 'high' | 'medium' | 'low',
  file?: string,
  lineStart?: number,
  lineEnd?: number,
  context?: string,
  action?: any
})

await alexAiService.savePlan({
  name: string,
  description: string,
  objectives: string[],
  steps: Array<{
    step: number,
    task: string,
    assignedTo?: string,
    priority?: 'high' | 'medium' | 'low'
  }>,
  estimatedTime?: string,
  files?: string[]
})

// Query Operations
const recs = await alexAiService.getRecentRecommendations(limit)
const plans = await alexAiService.getRecentPlans(limit)
const memories = await alexAiService.loadCrewMemories()

// Execute Operations
const success = await alexAiService.executeCodeRecommendation(
  filePath: string,
  oldCode: string,
  newCode: string
)

// File Operations
const content = await alexAiService.getFileSystemManager().readFile(path)
await alexAiService.getFileSystemManager().writeFile(path, content)
```

## Crew Member IDs

| Crew Member        | ID       | Expertise                      |
| ------------------ | -------- | ------------------------------ |
| Captain Picard     | `picard` | Architecture, Strategy         |
| Commander Riker    | `riker`  | Coordination, Tactical         |
| Commander Data     | `data`   | Technical Analysis, Algorithms |
| Lt. Cmdr. La Forge | `geordi` | Infrastructure, DevOps         |
| Counselor Troi     | `troi`   | UX, Readability                |
| Lt. Worf           | `worf`   | Security, Testing              |
| Chief O'Brien      | `obrien` | Debugging, Implementation      |
| Quark              | `quark`  | Cost Analysis, Efficiency      |

## Directory Structure

```
data/
├── recommendations/      ← Crew recommendations
├── plans/               ← Execution plans  
├── crew_memories.json   ← Shared insights
├── CREW_RECOMMENDATIONS.md
└── CREW_PLANS.md

crew-members/
├── picard.json
├── riker.json
└── ... (others)
```

## Common Usage Patterns

### Get recommendation from crew
```typescript
const response = await alexAiService.chat('data', 'optimize this query');
await alexAiService.saveRecommendation('data', {
  title: 'Query Optimization',
  content: response,
  priority: 'high'
});
```

### Create coordinated plan
```typescript
const plan = {
  name: 'Feature Implementation',
  description: 'Multi-step feature rollout',
  objectives: ['Design', 'Implement', 'Test'],
  steps: [
    { step: 1, task: 'Design architecture', assignedTo: 'picard', priority: 'high' },
    { step: 2, task: 'Implement endpoints', assignedTo: 'geordi', priority: 'high' },
    { step: 3, task: 'Write tests', assignedTo: 'worf', priority: 'high' }
  ]
};
await alexAiService.savePlan(plan);
```

### Execute code change
```typescript
const applied = await alexAiService.executeCodeRecommendation(
  'src/api.ts',
  'old_code_pattern',
  'new_code_pattern'
);
```

### Load and update memories
```typescript
const memories = await alexAiService.loadCrewMemories();
memories.patterns = [...(memories.patterns || []), 'new_pattern'];
await alexAiService.updateCrewMemories(memories);
```

## File Locations

After saving, files are stored at:

```
// Recommendations
data/recommendations/{crewMember}-recommendation-{timestamp}.json

// Plans
data/plans/{planName}-{timestamp}.json

// Memories
data/crew_memories.json

// Exports
data/CREW_RECOMMENDATIONS.md
data/CREW_PLANS.md
```

## Error Handling

```typescript
try {
  const result = await alexAiService.saveRecommendation('picard', {
    title: 'Architecture Review',
    content: 'Consider microservices...'
  });
  console.log('✅ Saved:', result);
} catch (error) {
  console.error('❌ Error:', error.message);
}
```

## Testing

Verify file system is working:

```bash
# Build extension
npm run compile && npm run package

# Install VSIX
code --install-extension alex-ai-assistant-1.0.0.vsix

# In VS Code:
# 1. Cmd+Shift+P
# 2. "Alex AI: Save Recommendation"  
# 3. Check data/recommendations/
```

## Chat Integration

In VS Code Chat with @alex:

```
@alex data analyze this code and @save your recommendation

@alex riker create a plan to fix the issues

@alex execute step 1 of the plan
```

## Export to Markdown

```typescript
// Manually export
const recs = await alexAiService.getRecentRecommendations(50);
let md = '# Crew Recommendations\n\n';
for (const rec of recs) {
  md += `## ${rec.data.title}\n${rec.data.content}\n\n`;
}
await alexAiService.getFileSystemManager().writeFile(
  'data/EXPORT.md',
  md
);
```

## Performance Notes

- Directory creation is one-time operation (cached)
- Timestamps enable quick sorting of files
- FileSystemManager handles file operations asynchronously
- Suitable for indexing with vector database

## Troubleshooting

| Issue                    | Solution                                         |
| ------------------------ | ------------------------------------------------ |
| Files not saving         | Check workspace permissions                      |
| Files not found          | Verify file paths are relative to workspace root |
| Code change not applying | Ensure exact string match (whitespace matters)   |
| Directory errors         | Check that workspace is open                     |

## Related Files

- [FILE_SYSTEM_README.md](./FILE_SYSTEM_README.md) - Full documentation
- [FILE_SYSTEM_GUIDE.md](./FILE_SYSTEM_GUIDE.md) - Comprehensive guide  
- [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md) - Code examples
- [FILE_SYSTEM_IMPLEMENTATION.md](./FILE_SYSTEM_IMPLEMENTATION.md) - Technical details
