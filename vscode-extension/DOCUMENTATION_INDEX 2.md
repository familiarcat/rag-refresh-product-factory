# Alex AI Extension - File System Operations Documentation Index

## 📚 Documentation Overview

The Alex AI extension now has complete file system read/write capabilities for crew recommendations and plans. This directory contains comprehensive documentation on how to use these features.

## 📖 Documents

### For Quick Start
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** ⭐ START HERE
  - Quick API reference
  - Common usage patterns
  - Command palette shortcuts
  - Crew member IDs
  - Troubleshooting table

### For Implementation Details
- **[FILE_SYSTEM_README.md](./FILE_SYSTEM_README.md)**
  - Architecture overview
  - Core methods and APIs
  - Complete workflow example
  - File formats explained
  - Best practices

### For Comprehensive Guide
- **[FILE_SYSTEM_GUIDE.md](./FILE_SYSTEM_GUIDE.md)**
  - Complete API documentation
  - Directory structure
  - All methods with examples
  - VS Code command reference
  - Integration with RAG system
  - Troubleshooting guide

### For Code Examples
- **[INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md)**
  - 8 working code examples
  - Complete workflows
  - Chat integration patterns
  - Memory management examples
  - Command examples

### For Implementation Details
- **[FILE_SYSTEM_IMPLEMENTATION.md](./FILE_SYSTEM_IMPLEMENTATION.md)**
  - What was implemented
  - Architecture decisions
  - File formats and structure
  - Feature list
  - Next steps and enhancements

## 🚀 Quick Start

### 1. Save a Recommendation
```typescript
const filename = await alexAiService.saveRecommendation('picard', {
  title: 'Architecture Suggestion',
  content: 'Consider implementing a layered architecture...',
  priority: 'high'
});
```

### 2. Create an Execution Plan
```typescript
const planId = await alexAiService.savePlan({
  name: 'Feature Implementation',
  description: 'Coordinated plan for new feature',
  objectives: ['Design', 'Implement', 'Test'],
  steps: [
    { step: 1, task: 'Design API', assignedTo: 'picard', priority: 'high' },
    { step: 2, task: 'Implement', assignedTo: 'geordi', priority: 'high' }
  ]
});
```

### 3. Execute Code Changes
```typescript
const applied = await alexAiService.executeCodeRecommendation(
  'src/api.ts',
  'const old = () => {};',
  'const old = (options) => { return options; };'
);
```

## 📁 File System Structure

```
workspace/
├── data/
│   ├── recommendations/
│   │   └── [crew]-recommendation-[timestamp].json
│   ├── plans/
│   │   └── [plan-name]-[timestamp].json
│   ├── crew_memories.json
│   ├── CREW_RECOMMENDATIONS.md (exported)
│   └── CREW_PLANS.md (exported)
└── crew-members/
    └── [crew-member-profiles]
```

## 🎯 VS Code Commands

All available in Command Palette (Cmd+Shift+P):

- `Alex AI: Save Recommendation`
- `Alex AI: Save Plan`
- `Alex AI: Execute Recommendation`
- `Alex AI: View Recommendations`
- `Alex AI: View Plans`
- `Alex AI: Export Recommendations`
- `Alex AI: Export Plans`

## 💡 Use Cases

### Use Case 1: Save Crew Analysis
```
@alex data review this code and @save your recommendation
```

### Use Case 2: Create Execution Plan
```
@alex riker create a plan to implement data's suggestions
```

### Use Case 3: Execute Fixes Automatically
```
@alex execute step 1: apply geordi's optimization
```

### Use Case 4: Export for Team Review
```
@alex export all recommendations to markdown for team review
```

## 🔑 Core Methods

### AlexAiService Methods

```typescript
// Save content
saveRecommendation(crewMember, recommendation)
savePlan(plan)
updateCrewMemories(memories)

// Query content
getRecentRecommendations(limit)
getRecentPlans(limit)
loadCrewMemories()

// Execute actions
executeCodeRecommendation(file, oldCode, newCode)

// Access file system
getFileSystemManager()
```

### FileSystemManager Methods

```typescript
// Save operations
saveRecommendation(crewMember, recommendation)
savePlan(plan)
updateCrewMemories(memories)

// Read operations
loadCrewProfile(crewMember)
loadCrewMemories()
readFile(filePath)
writeFile(filePath, content)

// List operations
listRecommendations()
listPlans()
getRecentRecommendations(limit)
getRecentPlans(limit)

// Execute operations
executeCodeRecommendation(file, oldCode, newCode)
```

## 👥 Crew Members

| Member            | ID       | Expertise                 |
| ----------------- | -------- | ------------------------- |
| 🎖️ Captain Picard  | `picard` | Architecture, Strategy    |
| ⚡ Commander Riker | `riker`  | Coordination, Tactical    |
| 🤖 Commander Data  | `data`   | Technical Analysis        |
| 🔧 La Forge        | `geordi` | Infrastructure, DevOps    |
| 💭 Counselor Troi  | `troi`   | UX, Readability           |
| ⚔️ Lt. Worf        | `worf`   | Security, Testing         |
| 🛠️ Chief O'Brien   | `obrien` | Debugging, Implementation |
| 💰 Quark           | `quark`  | Cost Analysis, Efficiency |

## ✅ Features Implemented

✅ Save crew recommendations with metadata
✅ Create coordinated execution plans
✅ Execute code changes automatically
✅ Load and share crew memories
✅ Export recommendations and plans to Markdown
✅ Browse saved recommendations and plans
✅ View crew member profiles
✅ Manage shared crew insights
✅ Timestamped file organization
✅ Priority levels and assignments
✅ Error handling and user feedback
✅ VS Code integration (commands, chat)
✅ File system permissions handling
✅ Directory auto-creation

## 📚 Documentation Map

```
vscode-extension/
├── QUICK_REFERENCE.md ...................... Quick API reference ⭐
├── FILE_SYSTEM_README.md ................... Overview & architecture
├── FILE_SYSTEM_GUIDE.md .................... Complete API documentation
├── INTEGRATION_EXAMPLES.md ................. Code examples
├── FILE_SYSTEM_IMPLEMENTATION.md ........... Implementation details
├── DOCUMENTATION_INDEX.md .................. This file
└── src/
    ├── fileSystemManager.ts ............... Core file system implementation
    ├── executionCommands.ts ............... VS Code command handlers
    └── alexAiService.ts ................... Service integration
```

## 🔧 Integration Points

- **Chat Participants** - Use @save in chat
- **Code Actions** - Offer crew suggestions as fixes
- **Commands** - Full VS Code command palette integration
- **File System** - Direct workspace file access
- **Webview** - Display in sidebar and panels
- **Memory** - Persist crew learnings across sessions

## 🚀 Getting Started

1. **Read** [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for APIs
2. **Review** [FILE_SYSTEM_README.md](./FILE_SYSTEM_README.md) for overview
3. **Check** [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md) for code patterns
4. **Refer to** [FILE_SYSTEM_GUIDE.md](./FILE_SYSTEM_GUIDE.md) for complete details

## 🧪 Testing

```bash
# Compile and package
npm run compile && npm run package

# Install extension
code --install-extension alex-ai-assistant-1.0.0.vsix

# Test in VS Code
# 1. Cmd+Shift+P
# 2. "Alex AI: Save Recommendation"
# 3. Check data/recommendations/ folder
```

## ⚙️ Architecture

```
AlexAiService
└── FileSystemManager
    ├── Directory Management
    ├── Save Operations
    ├── Read Operations
    ├── List Operations
    └── Execute Operations
```

## 📊 File Formats

### Recommendation JSON
```json
{
  "id": "rec_2025-01-15T14-30-45-123Z",
  "crewMember": "data",
  "timestamp": "2025-01-15T14:30:45.123Z",
  "title": "Optimization Suggestion",
  "content": "Review text...",
  "priority": "high",
  "file": "src/app.ts"
}
```

### Plan JSON
```json
{
  "id": "plan_2025-01-15T14-30-45-123Z",
  "timestamp": "2025-01-15T14:30:45.123Z",
  "name": "Feature Implementation",
  "description": "Multi-step plan...",
  "objectives": ["Objective 1", "Objective 2"],
  "steps": [{"step": 1, "task": "Task...", "assignedTo": "picard"}]
}
```

## 🆘 Troubleshooting

See [QUICK_REFERENCE.md](./QUICK_REFERENCE.md#troubleshooting) for common issues.

## 📝 Next Steps

Planned enhancements:
- [ ] Vector database indexing for semantic search
- [ ] Git integration for automatic diffing
- [ ] Web dashboard for crew outputs
- [ ] CI/CD pipeline hooks
- [ ] Real-time file watching
- [ ] Automatic plan execution

## 📧 Support

For issues:
1. Check the relevant documentation file
2. Review code examples in INTEGRATION_EXAMPLES.md
3. Check VS Code output panel (Output > Alex AI)
4. Review error messages and logs

---

**Last Updated:** January 2025
**Extension Version:** 1.0.0
**Status:** ✅ Production Ready
