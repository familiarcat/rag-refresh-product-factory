# Testing Web <-> IDE Extension Integration with Cost-Optimized Alex AI

## Overview

This guide explains how to test the bidirectional integration between the Alex AI VSCode extension and the deployed web application, with emphasis on the cost-optimization features.

## Architecture

```
VSCode Extension (Local)          Web API (Production)          Alex AI Backend
       │                                  │                            │
       │  POST /api/crew/orchestrate      │                            │
       ├─────────────────────────────────►│                            │
       │                                   │  Picard analyzes task      │
       │                                   ├───────────────────────────►│
       │                                   │  Returns crew selection    │
       │                                   │◄───────────────────────────┤
       │                                   │                            │
       │                                   │  Quark optimizes cost      │
       │                                   ├───────────────────────────►│
       │                                   │  Returns LLM tier mapping  │
       │                                   │◄───────────────────────────┤
       │◄─────────────────────────────────┤                            │
       │  {crew, cost, savings}            │                            │
```

## Deployment Status

### Web Application
- **URL**: https://rag.pbradygeorgen.com
- **Orchestration Endpoint**: POST /api/crew/orchestrate
- **Cost Features**:
  - Picard strategic task analysis
  - Quark cost optimization
  - Selective crew activation
  - LLM tier routing (premium/standard/budget)

### VSCode Extension
- **Version**: 1.0.0
- **Installed**: ✅ (via `.vsix` package)
- **Configuration**: Uses production URL by default

## Configuration

### Step 1: Verify Extension Settings

Open VSCode settings (Cmd+,) and verify:

```json
{
  "alexAi.baseUrl": "https://rag.pbradygeorgen.com",
  "alexAi.openRouterApiKey": "sk-or-v1-...",
  "alexAi.defaultCrewMember": "riker"
}
```

### Step 2: Test Connection

1. Open VSCode
2. Press `Cmd+Option+A` to open Alex AI chat
3. Panel should load without errors
4. Check the browser console (Cmd+Option+I) for connection logs

## Testing the Cost-Optimized System

### Test 1: Simple Task (Budget Tier)

**Purpose**: Verify that simple tasks use the cheapest LLM tier.

```javascript
// In VSCode, open the chat and ask:
@alex analyze this simple variable name
```

**Expected Behavior**:
- Crew: Riker only (simple task doesn't need full crew)
- LLM Tier: `budget` (ultra_budget model)
- Cost: ~$0.0003 per request
- ROI Analysis: Should show 90%+ cost savings vs. premium

**Verification**:
1. Check the response includes crew members used
2. Look for cost breakdown in response
3. Verify Quark's ROI recommendation

### Test 2: Complex Task (Mixed Tier)

**Purpose**: Verify intelligent tier distribution for complex tasks.

```javascript
// In VSCode chat:
@alex review this code for security vulnerabilities and performance issues
```

**Expected Behavior**:
- Crew: Worf (security) + Data (performance) + possibly others
- LLM Tiers:
  - Worf: `premium` (security requires high accuracy)
  - Data: `standard` (performance analysis)
- Cost: ~$0.0235 (mixed tier)
- ROI: Should show 30-50% savings vs. all-premium

**Verification**:
1. Response should mention multiple crew members
2. Each crew member should have appropriate analysis depth
3. Cost should be between budget and premium extremes

### Test 3: Critical Task (Premium Tier)

**Purpose**: Verify that critical tasks use premium LLM for accuracy.

```javascript
// In VSCode chat:
@alex /picard design the architecture for a production authentication system
```

**Expected Behavior**:
- Crew: Picard (strategy) + Worf (security) + Geordi (infrastructure)
- LLM Tiers: All `premium` (critical security decision)
- Cost: ~$0.0405 (3 crew × $0.0135)
- ROI: Should acknowledge this is a critical task worth the cost

**Verification**:
1. Response should be highly detailed and strategic
2. Multiple perspectives (security, infrastructure, strategy)
3. Cost justification should mention criticality

## Cost Comparison

| Task Type | Old System (All Premium) | Optimized System | Savings |
|-----------|--------------------------|------------------|---------|
| Simple    | $0.0135                  | $0.0003          | **97%** |
| Routine   | $0.0405 (3 crew)         | $0.00945         | **76%** |
| Important | $0.0405 (3 crew)         | $0.0235          | **42%** |
| Critical  | $0.0405 (3 crew)         | $0.0405          | **0%**  |

## Testing Bidirectional Data Sync

### Test 4: Extension → Web Dashboard

1. **In VSCode Extension**: Ask a question that triggers crew collaboration
   ```
   @alex /data analyze the performance of this algorithm
   ```

2. **In Web Dashboard**: Open https://rag.pbradygeorgen.com/crew/metrics
   - Should see the new collaboration logged
   - Cost breakdown should match what extension reported
   - Crew members involved should be listed

3. **Verification**:
   - Timestamp matches
   - Crew members match
   - Cost calculation matches
   - Task complexity classification matches

### Test 5: Web Dashboard → Extension

1. **In Web Dashboard**: Navigate to https://rag.pbradygeorgen.com/crew
   - View recent collaborations
   - Note the crew member personalities and specializations

2. **In VSCode Extension**: Use crew-specific commands
   ```
   @alex /worf review security
   @alex /quark analyze costs
   ```

3. **Verification**:
   - Extension should use the same crew member definitions
   - Personalities should match web dashboard
   - Specializations should be consistent

## API Testing (Direct)

### Test 6: Orchestration Endpoint

```bash
curl -X POST https://rag.pbradygeorgen.com/api/crew/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Review code for security vulnerabilities",
    "context": {
      "language": "JavaScript",
      "framework": "Next.js"
    }
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "orchestration": {
    "activatedCrew": ["worf", "data"],
    "llmAssignments": {
      "worf": "premium",
      "data": "standard"
    },
    "taskComplexity": "important",
    "estimatedCost": 0.0235,
    "picardReasoning": "Security review requires Worf with premium accuracy...",
    "quarkROI": {
      "totalCostPremium": 0.027,
      "totalCostOptimized": 0.0235,
      "costSavings": 0.0035,
      "savingsPercentage": 12.96,
      "recommendation": "Optimized tier distribution provides sufficient quality..."
    }
  }
}
```

### Test 7: Cost Estimation Endpoint

```bash
curl https://rag.pbradygeorgen.com/api/crew/orchestrate?complexity=routine&crewSize=3
```

**Expected Response**:
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

## Verifying Cost Optimization

### Check 1: Quark Integration

1. Ask the extension to analyze costs:
   ```
   @alex /quark what's the most cost-effective way to handle this task?
   ```

2. Expected behavior:
   - Quark should analyze the task
   - Provide ROI calculation
   - Recommend optimal crew + tier configuration
   - Show estimated savings

### Check 2: Picard Strategic Analysis

1. Ask for strategic guidance:
   ```
   @alex /picard what crew should handle this complex refactoring?
   ```

2. Expected behavior:
   - Picard analyzes task complexity
   - Recommends crew members based on skills
   - Explains reasoning for each selection
   - Delegates to Quark for cost optimization

## Monitoring & Debugging

### Extension Logs

1. Open VSCode Developer Tools: `Cmd+Option+I`
2. Check Console tab for:
   - API requests to production URL
   - WebSocket connections (if applicable)
   - Error messages
   - Cost calculations

### Web Dashboard Logs

SSH to EC2 instance and check Docker logs:
```bash
ssh ec2-user@<ec2-ip>
docker logs rag-app --tail 100 --follow
```

Look for:
- `/api/crew/orchestrate` requests
- Picard analysis logs
- Quark optimization logs
- Cost calculations

### Common Issues

**Issue**: Extension can't connect to API
- **Fix**: Check `alexAi.baseUrl` is set to `https://rag.pbradygeorgen.com`
- **Verify**: `curl https://rag.pbradygeorgen.com/api/health`

**Issue**: Cost calculations seem wrong
- **Fix**: Check that Quark optimizer is enabled in deployment
- **Verify**: Check Docker logs for Quark initialization

**Issue**: All tasks using premium tier
- **Fix**: Verify Picard analyzer is correctly classifying task complexity
- **Debug**: Add logging to `lib/orchestration/picard-analyzer.ts`

## Success Criteria

✅ **Integration is working when:**
1. Extension can make requests to production API
2. Orchestration endpoint returns crew + tier assignments
3. Cost savings are 30-80% vs. all-premium baseline
4. Simple tasks use budget tier ($0.0003)
5. Critical tasks use premium tier ($0.0135/crew)
6. Quark ROI analysis is included in responses
7. Web dashboard logs show requests from extension
8. Metrics match between extension and dashboard

## Next Steps

After verifying the integration:

1. **Monitor Production Costs**:
   - Track actual spending on OpenRouter
   - Compare to projected savings
   - Adjust tier thresholds if needed

2. **Tune Complexity Classification**:
   - Review Picard's task analysis accuracy
   - Adjust complexity keywords in `picard-analyzer.ts`
   - Add more sophisticated NLP if needed

3. **Expand Crew Members**:
   - Add more specialized crew for niche tasks
   - Define tier preferences per crew member
   - Update cost models

4. **Batch Optimization**:
   - Implement batching for multiple related requests
   - Further cost reduction through request coalescing
   - Cache common responses

---

**Testing complete!** You should now have a fully functional web <-> IDE integration with intelligent cost optimization that saves 30-80% on LLM costs while maintaining quality.
