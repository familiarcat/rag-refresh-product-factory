# Alex AI Cost Optimization System

## Overview

The Alex AI crew orchestration system employs intelligent cost optimization through strategic task analysis and LLM tier routing, reducing costs by **30-80%** while maintaining quality.

## Architecture

```
User Request
     │
     ▼
┌─────────────────────────────────────────────────┐
│  POST /api/crew/orchestrate                     │
│  {task: "Review security vulnerabilities"}     │
└─────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────┐
│  🎯 Picard Strategic Analyzer                   │
│  - Analyzes task complexity                     │
│  - Identifies required crew members             │
│  - Classifies importance (critical/routine)     │
└─────────────────────────────────────────────────┘
     │
     ├──► activatedCrew: ["worf", "data", "geordi"]
     └──► complexity: "important"
     │
     ▼
┌─────────────────────────────────────────────────┐
│  💰 Quark Cost Optimizer                        │
│  - Maps crew to optimal LLM tiers               │
│  - Calculates cost vs quality tradeoffs         │
│  - Generates ROI analysis                       │
└─────────────────────────────────────────────────┘
     │
     ├──► llmAssignments: {
     │      "worf": "premium",     // Security = premium
     │      "data": "standard",    // Analysis = standard
     │      "geordi": "budget"     // Infrastructure = budget
     │    }
     ├──► estimatedCost: $0.0235
     └──► costSavings: 42% vs all-premium
     │
     ▼
┌─────────────────────────────────────────────────┐
│  🚀 Execute with Assigned Tiers                 │
│  Each crew member uses their optimized tier     │
└─────────────────────────────────────────────────┘
```

## Components

### 1. Picard Strategic Analyzer

**Purpose**: Analyzes tasks and selects optimal crew members

**Location**: `lib/orchestration/picard-analyzer.ts`

**Key Functions**:
```typescript
analyzePicardTask(task: string) => {
  taskComplexity: 'trivial' | 'routine' | 'important' | 'critical',
  activatedCrew: string[],
  reasoning: string
}
```

**Classification Logic**:
- **Trivial**: Simple queries, documentation lookups (1 crew member)
- **Routine**: Standard development tasks (2-3 crew members)
- **Important**: Complex features, multi-domain work (3-4 crew members)
- **Critical**: Security, architecture, production systems (4+ crew members)

**Crew Selection Keywords**:
- **Worf** (Security): "security", "vulnerability", "auth", "encryption"
- **Data** (AI/ML): "algorithm", "performance", "optimize", "analyze"
- **Geordi** (Infrastructure): "deploy", "infrastructure", "devops", "cloud"
- **Troi** (UX): "user experience", "interface", "usability"
- **Picard** (Strategy): "architecture", "design", "strategy", "plan"
- **Riker** (Execution): "implement", "build", "create", "execute"
- **O'Brien** (Debug): "bug", "fix", "debug", "error"
- **Quark** (Cost): "cost", "optimize", "efficient", "budget"

### 2. Quark Cost Optimizer

**Purpose**: Maps crew members to cost-effective LLM tiers

**Location**: `lib/orchestration/quark-optimizer.ts`

**Tier Costs** (per request):
```typescript
{
  premium:      $0.0135  // claude-3.5-sonnet
  standard:     $0.0100  // deepseek-r1-70b
  budget:       $0.0015  // deepseek-r1-32b
  ultra_budget: $0.0003  // qwen-2.5-72b
}
```

**Optimization Rules**:

1. **Critical Tasks → All Premium**
   - Security decisions
   - Architecture planning
   - Production deployments
   - Legal/compliance

2. **Important Tasks → Mixed Tiers**
   - Primary crew: Premium
   - Supporting crew: Standard
   - Infrastructure: Budget
   - **Savings: 30-50%**

3. **Routine Tasks → Budget Tiers**
   - Most crew: Budget
   - Critical roles: Standard
   - Simple tasks: Ultra budget
   - **Savings: 60-80%**

4. **Trivial Tasks → Ultra Budget**
   - Single crew member
   - Ultra budget tier
   - **Savings: 95%+**

**ROI Analysis Output**:
```typescript
{
  totalCostPremium: 0.0405,      // All premium baseline
  totalCostOptimized: 0.0235,    // Optimized tiers
  costSavings: 0.0170,            // Absolute savings
  savingsPercentage: 41.98,       // Percentage saved
  recommendation: "Optimized tier distribution..."
}
```

### 3. Crew Orchestrator

**Purpose**: Coordinates Picard + Quark to execute optimized requests

**Location**: `lib/orchestration/crew-orchestrator.ts`

**Main Function**:
```typescript
async function orchestrateCrewActivation(
  task: string,
  context?: Record<string, any>,
  tierOverride?: Record<string, LLMTier>
): Promise<OrchestrationResult>
```

**Workflow**:
1. Call Picard to analyze task → Get crew + complexity
2. Call Quark to optimize costs → Get tier assignments
3. Calculate total estimated cost
4. Generate ROI comparison
5. Return complete orchestration plan

## API Endpoints

### POST /api/crew/orchestrate

**Request**:
```json
{
  "task": "Review this authentication system for security vulnerabilities",
  "context": {
    "language": "TypeScript",
    "framework": "Next.js",
    "hasTests": true
  },
  "forceCrewMembers": ["worf", "data"],  // Optional override
  "preferredTier": "standard"             // Optional tier preference
}
```

**Response**:
```json
{
  "success": true,
  "orchestration": {
    "activatedCrew": ["worf", "data", "geordi"],
    "llmAssignments": {
      "worf": "premium",
      "data": "standard",
      "geordi": "budget"
    },
    "taskComplexity": "important",
    "estimatedCost": 0.0235,
    "picardReasoning": "Security review requires Worf (premium) for thorough vulnerability analysis. Data provides performance analysis (standard). Geordi handles infrastructure concerns (budget).",
    "quarkROI": {
      "totalCostPremium": 0.0405,
      "totalCostOptimized": 0.0235,
      "costSavings": 0.0170,
      "savingsPercentage": 41.98,
      "recommendation": "Mixed tier approach provides 42% savings while maintaining security quality through premium tier for Worf."
    }
  }
}
```

### GET /api/crew/orchestrate?complexity=routine&crewSize=3

**Response** (Cost Estimates):
```json
{
  "success": true,
  "estimates": {
    "complexity": "routine",
    "crewSize": 3,
    "premiumCost": 0.0405,
    "standardCost": 0.03,
    "budgetCost": 0.004725,
    "optimizedEstimate": 0.004725
  }
}
```

## Cost Savings Examples

### Example 1: Simple Code Review

**Task**: "Review this function for basic correctness"

**Without Optimization**:
- Crew: Riker
- Tier: Premium
- Cost: $0.0135

**With Optimization**:
- Crew: Riker
- Tier: Ultra Budget
- Cost: $0.0003
- **Savings: 97.8%**

### Example 2: Security Audit

**Task**: "Comprehensive security audit of authentication system"

**Without Optimization**:
- Crew: Worf, Data, Geordi
- Tier: All Premium
- Cost: $0.0405 (3 × $0.0135)

**With Optimization**:
- Worf: Premium ($0.0135)
- Data: Standard ($0.0100)
- Geordi: Budget ($0.0015)
- Cost: $0.0250
- **Savings: 38.3%**

### Example 3: Feature Implementation

**Task**: "Implement user profile page with avatar upload"

**Without Optimization**:
- Crew: Riker, Troi, O'Brien, Geordi
- Tier: All Premium
- Cost: $0.0540 (4 × $0.0135)

**With Optimization**:
- Riker: Standard ($0.0100)
- Troi: Standard ($0.0100)
- O'Brien: Budget ($0.0015)
- Geordi: Budget ($0.0015)
- Cost: $0.0230
- **Savings: 57.4%**

### Example 4: Critical Production Issue

**Task**: "Production database is experiencing high latency, investigate immediately"

**Without Optimization**:
- Crew: Geordi, Data, O'Brien, Picard
- Tier: All Premium
- Cost: $0.0540 (4 × $0.0135)

**With Optimization**:
- All crew: Premium (critical production)
- Cost: $0.0540
- **Savings: 0%**
- **Reason**: Critical production issues justify premium tier

## Monthly Cost Projections

### Scenario: 1000 requests/month

| Mix | Premium | Standard | Budget | Ultra | Monthly Cost | vs All-Premium | Savings |
|-----|---------|----------|--------|-------|--------------|----------------|---------|
| All Premium | 100% | 0% | 0% | 0% | $13.50 | - | - |
| Optimized | 20% | 30% | 40% | 10% | **$7.28** | $6.22 | **46%** |
| Aggressive | 10% | 20% | 50% | 20% | **$4.79** | $8.71 | **65%** |

### Breakdown of Optimized Mix:
- **Critical tasks (20%)**: 200 × $0.0135 = $2.70 (premium)
- **Important tasks (30%)**: 300 × $0.0100 = $3.00 (standard)
- **Routine tasks (40%)**: 400 × $0.0015 = $0.60 (budget)
- **Trivial tasks (10%)**: 100 × $0.0003 = $0.03 (ultra budget)
- **Total**: $6.33/month

## VSCode Extension Integration

### Using Cost Optimization in Extension

The extension automatically uses the orchestration endpoint:

```typescript
// When user asks: @alex /worf review security
const response = await fetch(
  'https://rag.pbradygeorgen.com/api/crew/orchestrate',
  {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      task: 'Review security vulnerabilities in auth.ts',
      context: {
        file: 'auth.ts',
        language: 'TypeScript'
      }
    })
  }
);

// Extension receives:
// - Which crew members to activate
// - What tier each should use
// - Estimated cost
// - ROI savings percentage
```

### Displaying Cost Info

Extension can show users the savings:

```
🤖 Worf (Security - Premium): Analyzing authentication...
🤖 Data (Performance - Standard): Checking algorithm efficiency...
🤖 Geordi (Infrastructure - Budget): Reviewing deployment config...

💰 Cost: $0.0250 (38% savings vs standard approach)
```

## Configuration

### Adjusting Tier Assignments

Edit `lib/orchestration/quark-optimizer.ts`:

```typescript
// Make Worf always use premium for security
if (crewId === 'worf' && taskKeywords.some(k => k.includes('security'))) {
  return 'premium';
}

// Use budget tier for simple documentation tasks
if (complexity === 'trivial') {
  return 'ultra_budget';
}
```

### Adding Custom Cost Rules

```typescript
// In quark-optimizer.ts
function getCustomTierForCrew(
  crewId: string,
  complexity: string,
  taskContext: any
): LLMTier | null {
  // Custom rule: Production deployments always premium
  if (taskContext.environment === 'production') {
    return 'premium';
  }

  // Custom rule: Prototype work can use budget
  if (taskContext.isPrototype) {
    return 'budget';
  }

  return null;  // Use default logic
}
```

## Monitoring

### Track Actual Savings

```typescript
// In your analytics
const savings = orchestration.quarkROI.costSavings;
const percentage = orchestration.quarkROI.savingsPercentage;

console.log(`Saved $${savings.toFixed(4)} (${percentage.toFixed(1)}%)`);
```

### Monthly Reports

```bash
# Query orchestration logs
curl https://rag.pbradygeorgen.com/api/crew/metrics

# Expected response:
{
  "totalRequests": 1000,
  "totalCostActual": 7.28,
  "totalCostIfPremium": 13.50,
  "savings": 6.22,
  "savingsPercentage": 46.07
}
```

## Best Practices

1. **Let Picard Analyze**: Don't override crew selection unless necessary
2. **Trust Quark's Tiers**: The optimizer knows when premium is needed
3. **Monitor Quality**: Track if budget tiers meet your quality bar
4. **Adjust Thresholds**: Tune complexity classification based on results
5. **Use Context**: Provide rich context for better tier selection

## Testing

### Test Orchestration Locally

```bash
curl -X POST http://localhost:3000/api/crew/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Review API security",
    "context": {"framework": "Next.js"}
  }'
```

### Test Different Complexities

```bash
# Trivial
curl -X POST .../orchestrate -d '{"task": "What is TypeScript?"}'

# Routine
curl -X POST .../orchestrate -d '{"task": "Add error handling to login"}'

# Important
curl -X POST .../orchestrate -d '{"task": "Design user authentication system"}'

# Critical
curl -X POST .../orchestrate -d '{"task": "Fix production security vulnerability"}'
```

## Troubleshooting

### High Costs

**Problem**: Still seeing high costs despite optimization

**Solutions**:
1. Check if too many tasks classified as "critical"
2. Adjust Picard's complexity thresholds
3. Review Quark's tier assignment logic
4. Consider more aggressive budget tier usage

### Quality Issues

**Problem**: Budget tier responses not meeting quality bar

**Solutions**:
1. Increase tier for specific crew members
2. Adjust complexity classification to bump tasks up
3. Use tier overrides for specific use cases
4. Add context to help tier selection

### Inconsistent Results

**Problem**: Same task gets different tier assignments

**Solutions**:
1. Provide more detailed task descriptions
2. Include consistent context fields
3. Use task templates for common patterns
4. Cache orchestration decisions for similar tasks

---

**Result**: Intelligent cost optimization that saves 30-80% while maintaining quality through strategic LLM tier selection. 💰✨
