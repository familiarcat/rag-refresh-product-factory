# Alex AI MCP Server

The Alex AI Crew System as an MCP (Model Context Protocol) server for Cursor and VS Code.

**🚀 Now powered by OpenRouter - completely independent of Cursor's AI!**

## Features

- **Crew Chat**: Get actual AI responses from specific crew members via OpenRouter
- **Coordination**: Riker's cross-project coordination analysis with AI briefings
- **RAG Memories**: Access and save crew memories for context
- **Project Management**: View and manage Product Factory projects
- **Milestones**: Push milestones to Git/Supabase with optional deployment
- **Observation Lounge**: Convene senior staff with real multi-agent discussions

## LLM Model Assignments

Each crew member uses an optimal LLM:

| Crew Member        | Model               | Reason              |
| ------------------ | ------------------- | ------------------- |
| Captain Picard     | `claude-3.5-sonnet` | Strategic thinking  |
| Commander Riker    | `claude-3.5-sonnet` | Coordination        |
| Commander Data     | `gpt-4-turbo`       | Technical analysis  |
| Lt. Cmdr. La Forge | `claude-3.5-sonnet` | Engineering         |
| Counselor Troi     | `claude-3.5-sonnet` | Empathy/UX          |
| Lt. Worf           | `gpt-4-turbo`       | Security (thorough) |
| Chief O'Brien      | `gpt-4-turbo`       | Implementation      |
| Quark              | `gpt-4-turbo`       | Business analysis   |

## Installation

### Prerequisites

1. Get an OpenRouter API key from [openrouter.ai](https://openrouter.ai)
2. Set the environment variable:

```bash
export OPENROUTER_API_KEY="sk-or-v1-your-key-here"
```

### For Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "alex-ai": {
      "command": "node",
      "args": [
        "/Users/bradygeorgen/Documents/workspace/rag-refresh-product-factory/mcp-server/index.mjs"
      ],
      "env": {
        "OPENROUTER_API_KEY": "${OPENROUTER_API_KEY}"
      }
    }
  }
}
```

Or use a hardcoded key (not recommended for shared machines):

```json
{
  "mcpServers": {
    "alex-ai": {
      "command": "node",
      "args": [
        "/Users/bradygeorgen/Documents/workspace/rag-refresh-product-factory/mcp-server/index.mjs"
      ],
      "env": {
        "OPENROUTER_API_KEY": "sk-or-v1-your-key-here"
      }
    }
  }
}
```

Restart Cursor after changes.

### For VS Code

Use the MCP extension and add the same configuration.

## Available Tools

### `alex_ai_chat`

Chat with the crew system via OpenRouter. Get real AI responses in character!

```
Use alex_ai_chat to ask Data about optimizing our RAG architecture
Use alex_ai_chat with crew_member=worf to review security implications
```

**Crew Members:**

- `picard` - Strategic leadership (claude-3.5-sonnet)
- `riker` - Tactical coordination (claude-3.5-sonnet)
- `data` - Technical analysis (gpt-4-turbo, default)
- `geordi` - Infrastructure (claude-3.5-sonnet)
- `troi` - UX design (claude-3.5-sonnet)
- `worf` - Security (gpt-4-turbo)
- `obrien` - Implementation (gpt-4-turbo)
- `quark` - Business strategy (gpt-4-turbo)

### `alex_ai_coordinate`

Get Riker's coordination briefing with AI-generated tactical analysis.

### `alex_ai_memories`

Search crew RAG memories for lessons learned and patterns.

### `alex_ai_save_memory`

Save a new lesson to crew memories for future context.

### `alex_ai_projects`

List Product Factory projects and their status.

### `alex_ai_milestone`

Push a milestone to Git/Supabase, optionally deploy to AWS.

### `alex_ai_observation_lounge`

**🌟 New!** Convene a full senior staff meeting where multiple crew members discuss a topic sequentially via OpenRouter. Each builds on the previous responses.

```
Use alex_ai_observation_lounge with topic="Should we migrate to microservices?" and urgency="high"
```

## Running Manually

```bash
cd mcp-server
npm start
```

## Development

```bash
cd mcp-server
npm run dev  # Runs with --watch for auto-reload
```

## Testing

Test the server is working:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node index.mjs
```

---

🖖 "Make it so." — Captain Picard




