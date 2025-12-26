# 🚀 Bidirectional Integration Quick Reference

## One-Page Guide to Alex AI ↔ Claude Code Integration

### 📦 What Is This?

A bidirectional learning system where:
- **Claude Code** logs actions → Alex AI crew learns
- **Crew members** query Claude's history → Claude incorporates crew wisdom
- **Result**: Compound intelligence > sum of parts

---

## ⚡ Quick Commands

### Start Services

```bash
# Terminal 1: Start RAG API
python -m src.rag_factory.server

# Terminal 2: Test API
curl http://localhost:8000/health
```

### Log Claude Action (Python)

```python
import requests

requests.post("http://localhost:8000/claude/log_action", json={
    "action_type": "bug_fix",
    "summary": "Fixed auth loop",
    "reasoning": "Session TTL mismatch",
    "files_affected": ["src/auth/session.ts"],
    "outcome": "success",
    "tags": ["auth", "bug_fix"]
})
```

### Log Claude Action (TypeScript/VSCode)

```typescript
import { AlexAiClient } from './client';

const client = new AlexAiClient();
await client.logClaudeAction({
    action_type: "optimization",
    summary: "Added Redis caching",
    reasoning: "Reduced query time from 200ms to 15ms",
    files_affected: ["src/cache/redis.ts"],
    tags: ["performance", "caching"]
});
```

### Query Claude History

```python
# Python
response = requests.post("http://localhost:8000/claude/query_history", json={
    "query": "authentication fixes",
    "limit": 5
})
actions = response.json()["actions"]
```

### Use MCP Tools (in Cursor)

```javascript
// Tool: alex_ai_learn_from_claude
{
    "action_type": "feature_implementation",
    "summary": "Added 2FA support",
    "reasoning": "Security requirement for enterprise customers"
}

// Tool: alex_ai_query_claude_history
{
    "query": "How did Claude implement authentication?",
    "limit": 5
}

// Tool: alex_ai_collaborative_solve
{
    "problem": "Architecture for new feature",
    "claude_analysis": "Recommend microservices for this use case...",
    "crew_members": ["picard", "data", "quark"]
}
```

---

## 📊 Action Types

| Type | Use When | Example |
|------|----------|---------|
| `code_modification` | Changed code | "Updated API endpoints" |
| `bug_fix` | Fixed a bug | "Resolved memory leak" |
| `decision` | Made arch/strategic choice | "Chose PostgreSQL over MongoDB" |
| `analysis` | Analyzed system/code | "Performance bottleneck analysis" |
| `optimization` | Improved performance | "Added caching layer" |
| `feature_implementation` | Built new feature | "Implemented OAuth2 login" |
| `refactoring` | Restructured code | "Extracted service layer" |
| `security_fix` | Fixed security issue | "Patched XSS vulnerability" |

---

## 🎯 Crew Analog Mapping

Actions automatically mapped to crew expertise:

| Action Keywords | Maps To | Specialty |
|----------------|---------|-----------|
| strategy, architecture, decision | Picard | Strategic leadership |
| coordination, workflow, ci-cd | Riker | Tactical execution |
| ai, ml, algorithm, analysis | Data | Technical analysis |
| infrastructure, devops, cloud | Geordi | Engineering |
| ux, ui, accessibility | Troi | User experience |
| security, auth, testing | Worf | Security |
| implementation, debugging, fix | O'Brien | Hands-on coding |
| business, cost, roi | Quark | Business value |
| performance, diagnostics | Crusher | System health |
| api, integration, docs | Uhura | Communication |

---

## 🔄 Common Workflows

### Workflow 1: Bug Fix with Learning

```bash
1. Claude fixes bug
   → POST /claude/log_bug_fix

2. Bug details stored in RAG
   → Crew can now reference this solution

3. User asks Worf about similar issue
   → Worf queries RAG, finds Claude's fix
   → Worf: "Claude resolved similar issue last week by..."
```

### Workflow 2: Collaborative Decision

```bash
1. User: "Should we use microservices?"

2. Claude analyzes
   → POST /claude/log_decision

3. Crew provides perspectives
   → alex_ai_observation_lounge

4. Synthesized recommendation
   → Combines Claude's implementation view + crew expertise
```

### Workflow 3: Continuous Learning

```bash
Week 1: Claude implements feature X
Week 2: Data reviews, suggests optimization
Week 3: Claude queries crew knowledge
Week 4: Claude implements Data's suggestion
Week 5: Both systems smarter about feature X
```

---

## 📋 Best Practices Checklist

**Logging:**
- [ ] Log significant actions (not trivial changes)
- [ ] Provide detailed reasoning (the "why")
- [ ] Use consistent, descriptive tags
- [ ] Include affected files
- [ ] Mark outcome accurately

**Querying:**
- [ ] Query before implementing similar features
- [ ] Use specific queries ("auth bug fixes" not "bugs")
- [ ] Review multiple results for patterns
- [ ] Consider confidence levels

**Collaboration:**
- [ ] Reference past solutions when relevant
- [ ] Build on existing knowledge, don't duplicate
- [ ] Acknowledge when no past context exists
- [ ] Synthesize crew + Claude insights

---

## 🔧 Endpoints Cheat Sheet

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/claude/log_action` | POST | Log any action |
| `/claude/log_code_modification` | POST | Log code change |
| `/claude/log_decision` | POST | Log decision |
| `/claude/log_bug_fix` | POST | Log bug fix |
| `/claude/query_history` | POST | Query past actions |
| `/claude/session_summary` | GET | Session stats |
| `/health` | GET | API health check |

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| API connection failed | `python -m src.rag_factory.server` |
| MCP tools missing | Check Cursor MCP config |
| Crew not finding actions | Verify with `/claude/session_summary` |
| Wrong crew mapping | Add more specific tags |

---

## 📚 Full Documentation

- **Complete Guide**: `BIDIRECTIONAL_INTEGRATION_GUIDE.md`
- **Database Schema**: `UNIFIED_MEMORY_SCHEMA.md`
- **Proof of Concept**: `../examples/bidirectional_integration_poc.py`
- **API Docs**: http://localhost:8000/docs (when server running)

---

## 🎓 Learning Resources

### Run POC
```bash
python examples/bidirectional_integration_poc.py
```

### Test Endpoints
```bash
# Log action
curl -X POST http://localhost:8000/claude/log_action \
  -H "Content-Type: application/json" \
  -d '{"action_type":"analysis","summary":"Test","reasoning":"Testing",...}'

# Query history
curl -X POST http://localhost:8000/claude/query_history \
  -H "Content-Type: application/json" \
  -d '{"query":"authentication","limit":5}'

# Session summary
curl http://localhost:8000/claude/session_summary
```

---

## 💡 Example: Complete Integration

```python
# Step 1: Claude implements feature
import requests

response = requests.post("http://localhost:8000/claude/log_action", json={
    "action_type": "feature_implementation",
    "summary": "Implemented real-time notifications with WebSockets",
    "reasoning": "Users requested instant updates without polling",
    "files_affected": ["src/websocket/server.ts", "src/notifications/handler.ts"],
    "outcome": "success",
    "confidence": 0.9,
    "tags": ["websockets", "real-time", "notifications", "feature"]
})

memory_id = response.json()["memory_id"]
crew_analog = response.json()["crew_analog"]

print(f"✅ Logged to RAG (ID: {memory_id})")
print(f"📊 Mapped to: {crew_analog}")

# Step 2: Later, user asks Geordi about real-time features
# Geordi queries RAG: "real-time websocket implementations"
# Geordi finds Claude's implementation
# Geordi: "Claude implemented WebSockets for notifications. Building on that
#          pattern, for your real-time dashboard, I recommend..."

# Step 3: Continuous improvement
# Data analyzes Claude's WebSocket implementation
# Data: "Connection pooling could improve scalability by 3.2x"

# Step 4: Claude implements Data's suggestion
requests.post("http://localhost:8000/claude/log_action", json={
    "action_type": "optimization",
    "summary": "Added connection pooling to WebSocket server",
    "reasoning": "Based on Commander Data's analysis, implemented pooling to improve scalability",
    "files_affected": ["src/websocket/pool.ts"],
    "outcome": "success",
    "tags": ["websockets", "optimization", "scalability"]
})

# Both systems are now smarter about WebSocket implementations! 🚀
```

---

**Quick Reference v1.0** | Updated: 2025-12-19 | Alex AI Integration
