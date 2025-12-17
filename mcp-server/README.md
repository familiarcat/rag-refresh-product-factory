# Alex AI MCP Server

The Alex AI Crew System as an MCP (Model Context Protocol) server for Cursor and VS Code.

## Features

- **Crew Chat**: Ask questions to specific crew members (Picard, Data, Riker, etc.)
- **Coordination**: Riker's cross-project coordination analysis
- **RAG Memories**: Access and save crew memories
- **Project Management**: View and manage Product Factory projects
- **Milestones**: Push milestones to Git/Supabase with optional deployment
- **Observation Lounge**: Convene senior staff for collaborative discussions

## Installation

### For Cursor

1. Open Cursor Settings (Cmd+,)
2. Go to "MCP" or "Model Context Protocol"
3. Add a new server with these settings:

```json
{
  "alex-ai": {
    "command": "node",
    "args": ["/path/to/rag-refresh-product-factory/mcp-server/index.mjs"],
    "env": {}
  }
}
```

Or add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "alex-ai": {
      "command": "node",
      "args": ["/Users/bradygeorgen/Documents/workspace/rag-refresh-product-factory/mcp-server/index.mjs"]
    }
  }
}
```

4. Restart Cursor

### For VS Code

Use the MCP extension and add the same configuration.

## Available Tools

### `alex_ai_chat`
Chat with the crew system. Optionally specify a crew member.

```
@alex-ai chat "How should we architect the new feature?"
@alex-ai chat "What are the security implications?" --crew_member=worf
```

**Crew Members:**
- `picard` - Strategic leadership
- `riker` - Tactical coordination
- `data` - Technical analysis (default)
- `geordi` - Infrastructure
- `troi` - UX design
- `worf` - Security
- `obrien` - Implementation
- `quark` - Business strategy

### `alex_ai_coordinate`
Get Riker's coordination briefing for all projects.

### `alex_ai_memories`
Search crew RAG memories.

```
@alex-ai memories --search="docker"
@alex-ai memories --crew_member="geordi_la_forge"
```

### `alex_ai_save_memory`
Save a new lesson to crew memories.

```
@alex-ai save_memory --crew_member="commander_data" --content="RAG chunk size of 500 tokens works best" --type="lesson"
```

### `alex_ai_projects`
List Product Factory projects.

```
@alex-ai projects
@alex-ai projects --status="active"
```

### `alex_ai_milestone`
Push a milestone.

```
@alex-ai milestone --title="Feature update"
@alex-ai milestone --title="Release v1.0" --deploy=true
```

### `alex_ai_observation_lounge`
Convene the senior staff.

```
@alex-ai observation_lounge --topic="New architecture decision" --urgency="high"
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
