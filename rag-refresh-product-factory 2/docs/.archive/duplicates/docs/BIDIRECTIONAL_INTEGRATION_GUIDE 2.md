# Bidirectional Integration Guide: Alex AI ↔ Claude Code

## 🎯 Overview

This guide explains how to use the bidirectional learning integration between Alex AI crew and Claude Code. This system enables both AI agents to learn from each other's actions, creating a compound intelligence system.

## 📚 Table of Contents

1. [Quick Start](#quick-start)
2. [Core Concepts](#core-concepts)
3. [API Reference](#api-reference)
4. [MCP Tools](#mcp-tools)
5. [Usage Examples](#usage-examples)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- RAG API server running (`python -m src.rag_factory.server`)
- MCP server configured in Cursor/VSCode
- OpenRouter API key configured

### Basic Usage

#### 1. Claude Code logs an action:

```typescript
// Via VSCode extension
import { AlexAiClient } from './client';

const client = new AlexAiClient();
await client.logClaudeAction({
    action_type: "bug_fix",
    summary: "Fixed authentication redirect loop",
    reasoning: "Session TTL mismatch with refresh check",
    files_affected: ["src/auth/session.ts"],
    outcome: "success",
    tags: ["authentication", "bug_fix"]
});
```

#### 2. Crew member queries Claude's history:

```python
# Via REST API
import requests

response = requests.post("http://localhost:8000/claude/query_history", json={
    "query": "authentication bug fixes",
    "limit": 5
})

actions = response.json()["actions"]
```

#### 3. Collaborative problem solving (via MCP):

```javascript
// In Cursor/Claude Code
// Use MCP tool: alex_ai_collaborative_solve
{
    "problem": "Should we use microservices or monolith?",
    "claude_analysis": "Current scale doesn't justify microservices complexity...",
    "crew_members": ["captain_picard", "commander_data", "quark"]
}
```

---

## Core Concepts

### 1. **Unified Memory**

Both Claude Code and Alex AI crew share a unified memory system stored in FAISS + Supabase:

```
┌─────────────────┐
│  Claude Code    │──┐
└─────────────────┘  │
                     ├──> Unified RAG Memory
┌─────────────────┐  │
│  Alex AI Crew   │──┘
└─────────────────┘
```

### 2. **Crew Analog Mapping**

Every Claude action is automatically mapped to the crew member whose expertise best matches:

```python
Action: "Fixed authentication bug"
→ Crew Analog: "chief_obrien" (implementation/debugging)

Action: "Architecture decision analysis"
→ Crew Analog: "captain_picard" (strategy/decisions)

Action: "Performance optimization"
→ Crew Analog: "dr_crusher" (diagnostics/performance)
```

### 3. **Bidirectional Learning Paths**

```
Claude implements → Logged to RAG → Crew learns from Claude
     ↑                                         ↓
     └──────── Crew provides perspective ──────┘
```

---

## API Reference

### FastAPI Endpoints

#### POST /claude/log_action

Log a Claude Code action to the RAG system.

**Request:**
```json
{
    "action_type": "code_modification",
    "summary": "Implemented Redis caching for products",
    "detailed_content": {
        "description": "Added caching layer",
        "files": ["src/cache/redis.ts"]
    },
    "reasoning": "Database queries taking 200ms, reduced to 15ms with cache",
    "outcome": "success",
    "confidence": 1.0,
    "files_affected": ["src/cache/redis.ts", "src/repositories/product.ts"],
    "tags": ["caching", "optimization", "performance"],
    "user_request": "Improve product query performance"
}
```

**Response:**
```json
{
    "status": "success",
    "memory_id": "mem_2025-12-19_1234",
    "crew_analog": "chief_obrien",
    "message": "Claude Code action logged to Alex AI RAG"
}
```

#### POST /claude/log_code_modification

Convenience endpoint for code changes.

**Request:**
```json
{
    "files_modified": ["src/auth/session.ts"],
    "summary": "Extended session TTL to 24 hours",
    "reasoning": "Fixing auth redirect loops caused by TTL mismatch",
    "outcome": "success",
    "tags": ["authentication", "bug_fix"]
}
```

#### POST /claude/log_decision

Log architectural or strategic decisions.

**Request:**
```json
{
    "decision": "Use modular monolith architecture",
    "reasoning": "Current scale doesn't justify microservices complexity",
    "alternatives": [
        "Microservices (rejected: too complex)",
        "Pure monolith (rejected: hard to evolve)"
    ],
    "context": {
        "team_size": 3,
        "user_count": 500,
        "growth_projection": "moderate"
    },
    "confidence": 0.85
}
```

#### POST /claude/log_bug_fix

Log bug fixes with root cause analysis.

**Request:**
```json
{
    "bug_description": "Users stuck in infinite redirect loop",
    "root_cause": "Session TTL (1h) < refresh check interval (2h)",
    "solution": "Extended session TTL to 24h, added token rotation",
    "files_affected": ["src/auth/session.ts", "src/middleware/auth.ts"],
    "outcome": "success"
}
```

#### POST /claude/query_history

Query Claude's past actions.

**Request:**
```json
{
    "query": "authentication and security fixes",
    "action_type": "bug_fix",
    "min_confidence": 0.7,
    "limit": 5
}
```

**Response:**
```json
{
    "status": "success",
    "count": 3,
    "actions": [
        {
            "id": "mem_2025-12-19_1234",
            "content": {
                "summary": "Fixed auth redirect loop",
                "reasoning": "Session TTL mismatch",
                "outcome": "success",
                "crew_analog": "chief_obrien",
                "confidence": 1.0
            },
            "timestamp": "2025-12-19T10:30:00Z"
        }
    ]
}
```

#### GET /claude/session_summary

Get summary of Claude's actions in current session.

**Response:**
```json
{
    "status": "success",
    "summary": {
        "total_actions": 15,
        "actions_by_type": {
            "bug_fix": 5,
            "code_modification": 7,
            "analysis": 3
        },
        "actions_by_crew_analog": {
            "chief_obrien": 8,
            "commander_data": 4,
            "geordi_la_forge": 3
        },
        "outcome_distribution": {
            "success": 14,
            "partial": 1
        }
    }
}
```

---

## MCP Tools

### alex_ai_learn_from_claude

Log Claude Code action to Alex AI RAG.

**Parameters:**
- `action_type`: Type of action (code_modification, decision, bug_fix, etc.)
- `summary`: Brief description
- `reasoning`: Why Claude chose this approach
- `files_affected`: List of files modified
- `outcome`: success | failure | partial | pending
- `user_request`: Original user request
- `tags`: Categorization tags

**Example:**
```javascript
{
    "action_type": "optimization",
    "summary": "Implemented connection pooling for database",
    "reasoning": "Too many connections being created, added pool to reuse connections",
    "files_affected": ["src/database/connection.ts"],
    "outcome": "success",
    "tags": ["performance", "database", "optimization"]
}
```

### alex_ai_query_claude_history

Query Claude's past actions from RAG.

**Parameters:**
- `query`: Natural language query
- `action_type`: Optional filter
- `limit`: Max results (default: 5)

**Example:**
```javascript
{
    "query": "How did Claude handle database optimization?",
    "action_type": "optimization",
    "limit": 5
}
```

### alex_ai_collaborative_solve

Collaborate with crew to solve a problem.

**Parameters:**
- `problem`: Problem description
- `claude_analysis`: Claude's initial thoughts
- `crew_members`: Optional specific crew to consult

**Example:**
```javascript
{
    "problem": "Performance bottleneck in product search",
    "claude_analysis": "Database query taking 2s, likely N+1 query issue. Need to add eager loading and caching.",
    "crew_members": ["commander_data", "dr_crusher", "geordi_la_forge"]
}
```

---

## Usage Examples

### Example 1: Logging a Bug Fix

```python
# Claude Code just fixed a bug
import requests

response = requests.post("http://localhost:8000/claude/log_bug_fix", json={
    "bug_description": "API returning 500 on concurrent requests",
    "root_cause": "Race condition in cache update logic",
    "solution": "Added mutex lock around cache write operations",
    "files_affected": [
        "src/cache/manager.ts",
        "src/middleware/cache.ts"
    ],
    "outcome": "success",
    "tags": ["bug_fix", "concurrency", "race_condition", "cache"]
})

print(f"Logged to RAG: {response.json()['memory_id']}")
print(f"Crew analog: {response.json()['crew_analog']}")
# Output: Crew analog: chief_obrien
```

### Example 2: Crew Member Queries Claude's History

```python
# Lt. Worf wants to review past security fixes
response = requests.post("http://localhost:8000/claude/query_history", json={
    "query": "security vulnerabilities and authentication issues",
    "action_type": "security_fix",
    "limit": 10
})

actions = response.json()["actions"]
print(f"⚔️  Lt. Worf found {len(actions)} security actions from Claude:")

for action in actions:
    content = action["content"]
    print(f"\n- {content['summary']}")
    print(f"  Outcome: {content['outcome']}")
    print(f"  Confidence: {content['confidence']:.0%}")
```

### Example 3: Collaborative Architecture Decision

```python
# User asks about architecture choice
# Step 1: Claude analyzes
claude_decision_response = requests.post(
    "http://localhost:8000/claude/log_decision",
    json={
        "decision": "Use PostgreSQL instead of MongoDB",
        "reasoning": "Strong relational data model, ACID guarantees needed, team familiar with SQL",
        "alternatives": [
            "MongoDB (rejected: schema flexibility not needed)",
            "MySQL (rejected: lacks JSON support we need)"
        ],
        "context": {
            "data_model": "relational with some JSON fields",
            "team_expertise": "SQL",
            "scale": "< 1M rows expected"
        },
        "confidence": 0.9,
        "tags": ["architecture", "database", "decision"]
    }
)

# Step 2: Convene crew via MCP (in Cursor)
# Use alex_ai_observation_lounge tool with topic:
# "Should we use PostgreSQL or MongoDB for our data layer?"

# Crew will find Claude's analysis in RAG and incorporate it into their perspectives
```

### Example 4: Learning Cycle

```python
# Week 1: Claude implements feature
requests.post("http://localhost:8000/claude/log_action", json={
    "action_type": "feature_implementation",
    "summary": "Implemented rate limiting with token bucket algorithm",
    "reasoning": "Needed API protection, token bucket allows burst traffic",
    "files_affected": ["src/middleware/rateLimit.ts"],
    "outcome": "success",
    "tags": ["security", "rate_limiting", "api_protection"]
})

# Week 2: Commander Data reviews and suggests improvement
# (via alex_ai_chat or observation_lounge)
# Data: "Fascinating. Claude's token bucket implementation uses in-memory
#        storage. For distributed systems, I recommend Redis-backed tokens."

# Week 3: Claude queries crew knowledge
response = requests.post("http://localhost:8000/claude/query_history", json={
    "query": "rate limiting improvements and distributed systems"
})

# Claude finds Data's suggestion and implements Redis backing
requests.post("http://localhost:8000/claude/log_action", json={
    "action_type": "optimization",
    "summary": "Migrated rate limiter to Redis for distributed support",
    "reasoning": "Based on Commander Data's analysis, moved from in-memory to Redis to support multiple server instances",
    "files_affected": ["src/middleware/rateLimit.ts", "src/cache/redis.ts"],
    "outcome": "success",
    "tags": ["optimization", "distributed", "redis", "rate_limiting"]
})

# Both systems have learned from each other! 🎉
```

---

## Best Practices

### For Claude Code

1. **Log significant actions**: Don't log every trivial change, focus on:
   - Bug fixes with root cause analysis
   - Architecture decisions
   - Performance optimizations
   - Security fixes
   - New feature implementations

2. **Provide detailed reasoning**: The "why" is more valuable than the "what"
   ```python
   # Good
   reasoning: "Session TTL was 1h but refresh check at 2h, causing logout loops. Extended TTL to 24h to exceed refresh interval."

   # Not helpful
   reasoning: "Changed session timeout"
   ```

3. **Tag appropriately**: Use consistent tags for easier retrieval
   ```python
   tags: ["authentication", "bug_fix", "session", "security"]
   ```

4. **Query before implementing**: Check if crew/Claude solved similar problems
   ```python
   # Before implementing new feature
   past_solutions = client.queryClaudeHistory("user authentication flow")
   # Review past approaches before starting
   ```

### For Crew Members

1. **Reference Claude's solutions**: When providing recommendations
   ```
   "Based on Claude Code's implementation of caching last week (memory_id: mem_123),
    I recommend extending the pattern to include..."
   ```

2. **Build on, don't duplicate**: Add unique perspective, don't repeat what Claude did
   ```
   Picard: "Claude's technical implementation is sound. Strategically, we should
           consider how this scales when we expand to Europe in Q2..."
   ```

3. **Acknowledge uncertainties**: If no past context found
   ```
   Data: "I do not find evidence of Claude Code addressing similar concurrency
          issues in the available memories. I recommend the following approach..."
   ```

---

## Troubleshooting

### RAG API Connection Failed

```
Error: Failed to log Claude action: Connection refused
```

**Solution:**
```bash
# Start the RAG API server
cd /path/to/rag-refresh-product-factory
python -m src.rag_factory.server

# Server should start on http://localhost:8000
```

### MCP Tools Not Available

**Solution:**
```json
// Check MCP server config in Cursor settings
{
    "mcpServers": {
        "alex-ai": {
            "command": "node",
            "args": ["/path/to/mcp-server/index.mjs"],
            "env": {
                "OPENROUTER_API_KEY": "your-key",
                "RAG_API_URL": "http://localhost:8000"
            }
        }
    }
}
```

### Crew Not Finding Claude's Actions

```python
# Check if actions were logged
response = requests.get("http://localhost:8000/claude/session_summary")
print(response.json())

# Verify memory storage
response = requests.get("http://localhost:8000/memory/recent?limit=10")
memories = response.json()["memories"]

# Check for claude_code source
claude_memories = [m for m in memories if m.get("source") == "claude_code"]
print(f"Found {len(claude_memories)} Claude memories")
```

### Crew Analog Mapping Incorrect

The system automatically maps actions to crew expertise. If mapping seems wrong:

```python
# Check the mapping
from src.rag_factory.integrations.crew_mapper import CrewAnalogMapper

mapper = CrewAnalogMapper()
action = {...}  # Your action dict

crew_id = mapper.map_action_to_crew(action)
print(f"Mapped to: {crew_id}")

# Add more specific tags to improve mapping
action["tags"] = ["security", "authentication", "testing"]  # Hints at Worf
crew_id = mapper.map_action_to_crew(action)
```

---

## Performance Considerations

1. **Batch operations**: When logging multiple actions
   ```python
   actions = [...]  # List of actions

   # Log in bulk (TODO: implement bulk endpoint)
   for action in actions:
       log_claude_action(action)
   ```

2. **Async logging**: Don't block on logging
   ```typescript
   // Fire and forget
   client.logClaudeAction(action).catch(err =>
       console.error("Failed to log:", err)
   );
   ```

3. **Cache crew responses**: Frequently accessed memories
   ```python
   # Use Redis for hot memories
   cached_memories = redis.get(f"claude:history:{query_hash}")
   ```

---

## Security & Privacy

1. **No sensitive data**: Filter before logging
   ```python
   # Bad
   reasoning: "Fixed API key issue, key was: sk_live_abc123..."

   # Good
   reasoning: "Fixed API key exposure issue by moving to environment variables"
   ```

2. **Access control**: Crew members can read, not modify Claude's actions

3. **Audit trail**: All operations logged with timestamp and actor

---

## Next Steps

1. **Run the POC**: `python examples/bidirectional_integration_poc.py`
2. **Test MCP tools**: Use tools in Cursor/VSCode
3. **Integrate into workflow**: Start logging significant actions
4. **Monitor learning**: Check `/claude/session_summary` regularly
5. **Iterate**: Refine based on what works

---

## Support & Feedback

- **Issues**: https://github.com/your-repo/issues
- **Documentation**: This file + `UNIFIED_MEMORY_SCHEMA.md`
- **Examples**: `examples/bidirectional_integration_poc.py`

---

**Version**: 1.0
**Last Updated**: 2025-12-19
**Maintained By**: Alex AI Integration Team
