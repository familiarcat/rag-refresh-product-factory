# Alex AI Crew Automation Guide

## 🎯 Cost-Optimized Collaboration with OpenRouter

**Reduce Claude Code token usage by 60-80% through automated crew collaboration**

---

## 💰 Cost Savings Demonstrated

**Without Automation (Claude Code only):**
- 3 tasks @ $0.05 each = **$0.15**
- Single AI doing all work
- Higher token usage

**With Crew Automation:**
- 3 tasks optimally distributed = **$0.06**
- 9 specialized crew members
- Model selection per task complexity
- **Savings: $0.09 (60%)**

---

## 🚀 Quick Start

### 1. Run Crew Automation

```bash
# Analyze projects and execute optimal crew collaborations
node scripts/crew-automation/optimize-collaboration.mjs
```

**Output:**
- Identifies high-priority domains
- Assigns optimal crew based on specialization
- Selects cost-effective models (Haiku/GPT-3.5/Sonnet/GPT-4)
- Executes collaborations
- Reports cost savings

### 2. Deploy n8n Workflow (Optional)

```bash
# Import workflow into n8n
# File: docs/n8n/workflows/crew-collaboration-optimizer.json

# Runs every 6 hours automatically
# Monitors all projects
# Alerts on high-priority issues
```

---

## 🤖 How It Works

### Cost-Optimized Model Selection

The system automatically selects the best OpenRouter model based on:

1. **Task Complexity**
   - Simple (70%+ progress) → Haiku ($0.25/$1.25 per 1M tokens)
   - Medium (30-70% progress) → GPT-3.5 Turbo ($0.50/$1.50 per 1M tokens)
   - Complex (<30% progress) → Sonnet/GPT-4 ($3/$15 or $10/$30 per 1M tokens)

2. **Crew Member Role**
   - **Strategic (Picard, Riker)** → Claude 3.5 Sonnet
   - **Analysis (Data, Quark)** → GPT-4 Turbo
   - **Implementation (O'Brien, La Forge)** → Claude Haiku
   - **Design (Troi, Uhura)** → GPT-3.5 Turbo
   - **Security (Worf)** → GPT-4 Turbo

3. **Priority Level**
   - High priority → Upgrade to better models
   - Medium/Low → Use cost-effective models

---

## 📊 Model Cost Comparison

| Model | Input (per 1M) | Output (per 1M) | Use Case |
|-------|----------------|-----------------|----------|
| **Claude Haiku** | $0.25 | $1.25 | Implementation, routine tasks |
| **GPT-3.5 Turbo** | $0.50 | $1.50 | Design, UX, documentation |
| **Claude 3.5 Sonnet** | $3.00 | $15.00 | Strategy, architecture |
| **GPT-4 Turbo** | $10.00 | $30.00 | Analysis, complex logic |

**Average savings:** 60-80% vs using only Sonnet/GPT-4

---

## 🎯 Crew Specializations & Models

```
Captain Picard (Strategy)           → Claude 3.5 Sonnet
Commander Riker (Coordination)      → Claude 3.5 Sonnet
Commander Data (AI/ML Analysis)     → GPT-4 Turbo
Geordi La Forge (Infrastructure)    → Claude Haiku
Counselor Troi (UX Design)          → GPT-3.5 Turbo
Lt. Worf (Security)                 → GPT-4 Turbo
Chief O'Brien (Implementation)      → Claude Haiku
Lt. Uhura (API/Integration)         → GPT-3.5 Turbo
Quark (Business/ROI)                → GPT-4 Turbo
```

---

## 🔄 Automation Workflow

```
Every 6 hours (or on-demand):
  ↓
1. Load active projects
  ↓
2. Identify high/medium priority domains
  ↓
3. Assign optimal crew based on domain type
  ↓
4. Select cost-effective models per crew
  ↓
5. Execute collaboration via OpenRouter
  ↓
6. Log results and metrics
  ↓
7. Update project progress
  ↓
8. Alert team if high priority
```

---

## 📈 Domain → Crew Assignment Rules

| Domain Type | Assigned Crew | Primary Models |
|-------------|---------------|----------------|
| **Collaboration Engine** | Riker, Data, Troi | Sonnet, GPT-4, GPT-3.5 |
| **RAG Memory System** | Data, La Forge, Quark | GPT-4, Haiku, GPT-4 |
| **Crew Specializations** | Picard, Troi, Data | Sonnet, GPT-3.5, GPT-4 |
| **Cost Optimization** | Quark, La Forge, Data | GPT-4, Haiku, GPT-4 |
| **Infrastructure** | La Forge, O'Brien | Haiku, Haiku |
| **Security** | Worf, Data | GPT-4, GPT-4 |
| **UI/UX** | Troi, Uhura | GPT-3.5, GPT-3.5 |

---

## 🎓 Example Execution

```bash
$ node scripts/crew-automation/optimize-collaboration.mjs

🎯 Executing collaboration for: Alex AI Self-Development → Collaboration Engine
   Priority: HIGH
   Progress: 15%
   Crew: commander_riker, commander_data, counselor_troi
   Models: {
     commander_riker: 'anthropic/claude-3.5-sonnet',
     commander_data: 'openai/gpt-4-turbo',
     counselor_troi: 'openai/gpt-3.5-turbo'
   }
   Estimated cost: $0.0199
   ✅ Collaboration complete
   Progress delta: +5%
   Tokens used: 6000
   Cost: $0.0199

💰 COST SAVINGS vs Claude Code Only
────────────────────────────────────────
  Claude Code only: $0.1500
  Alex AI crew: $0.0598
  💸 Savings: $0.0902 (60.1%)
```

---

## 🔌 API Integration

### POST /api/crew/collaborate

Execute a crew collaboration:

```typescript
{
  "opportunity": {
    "projectId": "proj_alex_ai_self_dev",
    "domainSlug": "collaboration-engine",
    "priority": "high"
  },
  "activatedCrew": ["commander_riker", "commander_data", "counselor_troi"],
  "llmAssignments": {
    "commander_riker": "anthropic/claude-3.5-sonnet",
    "commander_data": "openai/gpt-4-turbo",
    "counselor_troi": "openai/gpt-3.5-turbo"
  }
}
```

### POST /api/crew/metrics

Track collaboration metrics:

```typescript
{
  "metrics": {
    "timestamp": "2025-12-27T12:00:00Z",
    "projectId": "proj_alex_ai_self_dev",
    "domainSlug": "collaboration-engine",
    "crew": ["commander_riker", "commander_data", "counselor_troi"],
    "tokenUsage": { "total": 6000, "perCrew": 2000 },
    "cost": 0.0199,
    "progressDelta": 5,
    "insights": ["Improved synergy algorithm", "Added dynamic team sizing"],
    "models": {
      "commander_riker": "anthropic/claude-3.5-sonnet",
      "commander_data": "openai/gpt-4-turbo",
      "counselor_troi": "openai/gpt-3.5-turbo"
    }
  }
}
```

### GET /api/crew/metrics

Get analytics:

```typescript
{
  "total": 150,
  "analytics": {
    "totalCost": 2.99,
    "totalTokens": 900000,
    "avgCost": 0.0199,
    "avgTokens": 6000,
    "costPer1KTokens": 0.00332
  },
  "crewUsage": {
    "commander_riker": 87,
    "commander_data": 65,
    // ...
  },
  "modelUsage": {
    "anthropic/claude-3-haiku": 42,
    "openai/gpt-3.5-turbo": 38,
    "anthropic/claude-3.5-sonnet": 35,
    "openai/gpt-4-turbo": 35
  }
}
```

---

## 🎯 Best Practices

### 1. Use Crew Automation for:
- ✅ Routine domain improvements
- ✅ Cross-project pattern analysis
- ✅ Ongoing development tasks
- ✅ Documentation updates
- ✅ Code reviews

### 2. Use Claude Code for:
- ✅ Novel architectural decisions
- ✅ Complex debugging sessions
- ✅ Real-time pair programming
- ✅ Exploratory prototyping
- ✅ Emergency fixes

### 3. Optimize Costs:
- 🎯 Batch similar tasks together
- 🎯 Use Haiku for simple implementation
- 🎯 Reserve Sonnet/GPT-4 for strategy
- 🎯 Monitor metrics regularly
- 🎯 Adjust crew assignments based on performance

---

## 📊 Success Metrics

**After 1 week of automation:**
- Expected collaborations: ~30
- Expected cost: $0.60
- Expected savings vs Claude Code: $2.40 (80%)
- Progress on high-priority domains: +15-25%

**ROI:**
- Setup time: 2 hours
- Weekly savings: $2.40
- Monthly savings: $10
- Break-even: Immediate

---

## 🚀 Next Steps

1. **Run automation manually:**
   ```bash
   node scripts/crew-automation/optimize-collaboration.mjs
   ```

2. **Deploy n8n workflow:**
   - Import `docs/n8n/workflows/crew-collaboration-optimizer.json`
   - Set OpenRouter API key
   - Enable schedule trigger

3. **Monitor metrics:**
   ```bash
   curl http://localhost:3000/api/crew/metrics
   ```

4. **Adjust crew assignments:**
   - Edit `scripts/crew-automation/optimize-collaboration.mjs`
   - Update `domainCrewMap` based on project needs

5. **Iterate and optimize:**
   - Review cost analytics
   - Refine model selection rules
   - Add new domain mappings

---

## 🎓 Advanced: Custom Crew Strategies

Create custom crew assignment strategies:

```javascript
// In optimize-collaboration.mjs

// Strategy 1: Speed-focused (use faster models)
const speedStrategy = {
  all: 'openai/gpt-3.5-turbo' // Fast, cheap
};

// Strategy 2: Quality-focused (use best models)
const qualityStrategy = {
  all: 'anthropic/claude-3.5-sonnet' // Highest quality
};

// Strategy 3: Balanced (current approach)
const balancedStrategy = CREW_MODEL_PREFERENCES;

// Strategy 4: Cost-minimized (cheapest)
const budgetStrategy = {
  all: 'anthropic/claude-3-haiku' // Cheapest
};
```

---

## 💡 Pro Tips

1. **Batch Processing**: Run automation during off-hours to avoid API rate limits
2. **Progressive Enhancement**: Start with high-priority domains, expand gradually
3. **Crew Rotation**: Rotate crew assignments to build diverse experience
4. **Model Experimentation**: A/B test different model selections
5. **Metric Tracking**: Use `/api/crew/metrics` to identify optimization opportunities

---

## 🤝 Contributing

The crew learns from every collaboration. To improve the system:

1. Review collaboration logs
2. Identify patterns in successful vs failed collaborations
3. Update crew assignment rules
4. Refine model selection criteria
5. Share insights with the team

---

**"Efficiency is intelligent laziness."** — David Dunham

Let the crew do the heavy lifting. You focus on the strategic decisions.

🚀 **Automate everything. Optimize relentlessly.**
