# Alex AI for VS Code (No Cursor Required)

This guide sets up Alex AI in VS Code with full crew functionality, sprint automation, and AI assistance—without a Cursor subscription.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      VS Code                             │
├─────────────────────────────────────────────────────────┤
│  Continue.dev Extension (AI Assistant)                   │
│  └─ Uses OpenRouter/Anthropic API for AI responses      │
├─────────────────────────────────────────────────────────┤
│  Alex AI MCP Server (Crew Tools)                        │
│  └─ crew_chat, memories, sprints, milestones            │
├─────────────────────────────────────────────────────────┤
│  CLI Scripts (Sprint Automation)                         │
│  └─ npm run sprint:start, sprint:cycle, crew:chat       │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **OpenRouter API Key** - Get one at [openrouter.ai](https://openrouter.ai)
2. **VS Code** - Latest version
3. **Node.js 18+**

## Step 1: Install Continue.dev Extension

1. Open VS Code
2. Go to Extensions (Cmd+Shift+X)
3. Search for "Continue"
4. Install "Continue - Codestral, Claude, and more"

## Step 2: Configure Continue.dev

Create or edit `~/.continue/config.json`:

```json
{
  "models": [
    {
      "title": "Claude 3.5 Sonnet (OpenRouter)",
      "provider": "openrouter",
      "model": "anthropic/claude-3.5-sonnet",
      "apiKey": "YOUR_OPENROUTER_API_KEY"
    },
    {
      "title": "GPT-4 Turbo (OpenRouter)",
      "provider": "openrouter",
      "model": "openai/gpt-4-turbo",
      "apiKey": "YOUR_OPENROUTER_API_KEY"
    }
  ],
  "tabAutocompleteModel": {
    "title": "Codestral",
    "provider": "openrouter",
    "model": "mistralai/codestral-latest",
    "apiKey": "YOUR_OPENROUTER_API_KEY"
  },
  "experimental": {
    "modelContextProtocolServers": [
      {
        "transport": {
          "type": "stdio",
          "command": "node",
          "args": [
            "/Users/bradygeorgen/Documents/workspace/rag-refresh-product-factory/mcp-server/index.mjs"
          ],
          "env": {
            "OPENROUTER_API_KEY": "YOUR_OPENROUTER_API_KEY"
          }
        }
      }
    ]
  },
  "customCommands": [
    {
      "name": "crew",
      "description": "Chat with Alex AI crew member",
      "prompt": "Use the alex_ai_chat tool to respond as the requested crew member: {{{ input }}}"
    },
    {
      "name": "sprint",
      "description": "Get sprint status and run automation",
      "prompt": "Check the current sprint status using alex_ai_projects, then summarize what needs attention."
    }
  ]
}
```

## Step 3: Set Up Environment

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
# OpenRouter API Key
export OPENROUTER_API_KEY="sk-or-v1-your-key-here"

# Alex AI CLI shortcuts
alias alex="cd /Users/bradygeorgen/Documents/workspace/rag-refresh-product-factory && npm run"
alias crew="npm run crew:chat --"
alias sprint="npm run sprint:status"
```

Then reload:

```bash
source ~/.zshrc
```

## Step 4: Verify Setup

```bash
# Test MCP server
cd /Users/bradygeorgen/Documents/workspace/rag-refresh-product-factory/mcp-server
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node index.mjs

# Test CLI
cd /Users/bradygeorgen/Documents/workspace/rag-refresh-product-factory
npm run crew:chat -- "data" "What is the status of our projects?"
```

## Usage

### In VS Code with Continue.dev

Press `Cmd+L` to open Continue chat, then:

```
# Chat with crew
/crew Ask Picard about our strategic direction

# Check sprint status
/sprint

# Use MCP tools directly
@alex_ai_chat Ask Data to analyze our architecture
@alex_ai_observation_lounge topic="Should we refactor the API?"
```

### CLI Commands

```bash
# Crew chat
npm run crew:chat -- "picard" "What should our next sprint focus on?"
npm run crew:chat -- "data" "Analyze the codebase architecture"
npm run crew:chat -- "quark" "What's the ROI projection?"

# Sprint automation
npm run sprint:status                    # View current sprint
npm run sprint:start                     # Start the sprint
npm run sprint:cycle                     # Run one automation cycle
npm run sprint:run                       # Run until completion

# Milestones
npm run milestone -- "Description"       # Push milestone
npm run milestone:deploy -- "Desc"       # Push + deploy

# Observation Lounge
npm run crew:lounge -- "topic" "high"    # Convene senior staff
```

### Direct API Calls

```bash
# Check sprint status
curl -s "http://localhost:3001/api/sprints?projectId=proj_1765948227414_iw68yf" | jq

# Start sprint
curl -X POST "http://localhost:3001/api/sprints/auto-execute" \
  -H "Content-Type: application/json" \
  -d '{"action": "start-sprint", "sprintId": "YOUR_SPRINT_ID"}'

# Run automation cycle
curl -X POST "http://localhost:3001/api/sprints/auto-execute" \
  -H "Content-Type: application/json" \
  -d '{"action": "run-cycle", "sprintId": "YOUR_SPRINT_ID"}'
```

## Cost Comparison

| Service                       | Monthly Cost | What You Get                    |
| ----------------------------- | ------------ | ------------------------------- |
| **Cursor Pro**                | $20/mo       | Full IDE AI, unlimited\*        |
| **Continue.dev + OpenRouter** | $5-15/mo\*   | Same functionality, pay-per-use |
| **GitHub Copilot**            | $10-19/mo    | Code completion + chat          |

\*OpenRouter costs depend on usage. Typical costs:

- Claude 3.5 Sonnet: ~$0.003/1K input tokens, $0.015/1K output
- GPT-4 Turbo: ~$0.01/1K input, $0.03/1K output
- Codestral (autocomplete): ~$0.001/1K tokens

## Troubleshooting

### MCP Server Not Connecting

```bash
# Check if server runs
cd mcp-server && npm start

# Check logs
tail -f ~/.continue/logs/mcp.log
```

### OpenRouter API Errors

```bash
# Test API key
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
```

### Continue.dev Not Finding Tools

1. Restart VS Code
2. Check `~/.continue/config.json` syntax
3. Ensure MCP server path is absolute

## VS Code Extensions Recommended

- **Continue** - AI assistant (required)
- **GitLens** - Git insights
- **Error Lens** - Inline error display
- **Thunder Client** - API testing
- **Markdown Preview Enhanced** - Docs

## Full Feature Parity with Cursor

| Feature            | Cursor   | VS Code + Continue |
| ------------------ | -------- | ------------------ |
| AI Chat            | ✅       | ✅                 |
| Code Completion    | ✅       | ✅                 |
| Multi-file Editing | ✅       | ✅ (with Continue) |
| Alex AI Crew       | ✅ (MCP) | ✅ (MCP)           |
| Sprint Automation  | ✅ (API) | ✅ (API/CLI)       |
| Milestone Push     | ✅       | ✅ (CLI)           |
| RAG Memories       | ✅       | ✅                 |

---

🖖 "The crew is ready to serve, regardless of the bridge we're on." — Commander Riker
