# Crew Drill System - Deployment Guide

## Overview

The crew drill and optimization system is ready for production deployment. This system runs weekly automated drills to optimize crew member LLM tier assignments, orchestrator logic, and RAG storage.

## Architecture

```
Weekly Vercel Cron (Monday 2 AM UTC)
    ↓
Next.js API Route (/api/crew/drill/cron)
    ↓
Python FastAPI Backend (/crew/drill/execute)
    ↓
Drill Orchestrator → Scenario Generator → Drill Executor → Picard Evaluator → System Updater
    ↓
Supabase Database + RAG Storage (with deduplication)
```

## Components Deployed

### Database Schema (Supabase)
- **drill_scenarios** - Test scenarios (synthetic, real-world, benchmark)
- **drill_runs** - Weekly/manual drill sessions
- **drill_executions** - Individual scenario executions with metrics
- **drill_evaluations** - Picard's evaluations and recommendations

### Python Services (FastAPI)
- `DrillOrchestrator` - Coordinates complete drill cycle
- `ScenarioGenerator` - Generates diverse test scenarios
- `DrillExecutor` - Executes scenarios with multiple LLM tier configurations
- `PicardEvaluator` - Evaluates results across 4 metrics (cost, quality, response, speed)
- `SystemUpdater` - Applies optimizations with backup/rollback

### Next.js API Routes
- `POST /api/crew/drill/execute` - Manual drill trigger
- `GET /api/crew/drill/status?runId=xxx` - Get drill status
- `GET /api/crew/drill/results?runId=xxx` - Get detailed results
- `GET /api/crew/drill/cron` - Weekly automated trigger (protected with CRON_SECRET)

### Configuration
- `vercel.json` - Weekly cron schedule (Monday 2 AM UTC)
- `data/drill-config.json` - Drill system configuration

## Deployment Steps

### 1. Apply Database Migration

**Option A: Supabase SQL Editor (Recommended)**
1. Open: https://supabase.com/dashboard/project/rpkkkbufdwxmjaerbhbn/sql/new
2. Copy contents of: `supabase/migrations/20251220_create_drill_system.sql`
3. Paste into SQL editor and click "Run"
4. Verify "Success" message

**Option B: Using Supabase CLI**
```bash
supabase link --project-ref rpkkkbufdwxmjaerbhbn
supabase db push
```

**Option C: Using Helper Script**
```bash
./scripts/apply-migration.sh
```

### 2. Verify Migration Applied

```bash
./scripts/apply-migration.sh
```

Should show:
```
✓ drill_scenarios: exists (count: 0)
✓ drill_runs: exists (count: 0)
✓ drill_executions: exists (count: 0)
✓ drill_evaluations: exists (count: 0)
```

### 3. Seed Initial Scenarios

```bash
# Using Supabase SQL Editor
# Copy and run: supabase/seed/drill_scenarios.sql
```

This will populate 30 baseline test scenarios covering:
- 3 critical complexity scenarios
- 10 important complexity scenarios
- 12 routine complexity scenarios
- 5 trivial complexity scenarios

### 4. Deploy to Vercel

**If GitHub integration is active:**
- Push to main branch triggers automatic deployment
- Vercel will build and deploy

**Manual deployment:**
```bash
npm install -g vercel
vercel --prod
```

### 5. Configure Environment Variables in Vercel

Required environment variables (set in Vercel Dashboard):
```bash
# Supabase
SUPABASE_URL=https://rpkkkbufdwxmjaerbhbn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# RAG API
RAG_API_URL=<your-python-api-url>

# Cron Secret (generate a random secret)
CRON_SECRET=<generate-random-secret>

# OpenRouter (for LLM calls)
OPENROUTER_API_KEY=<your-key>
```

Generate CRON_SECRET:
```bash
openssl rand -base64 32
```

### 6. Verify Deployment

**Check Vercel deployment:**
```bash
# Visit Vercel dashboard
https://vercel.com/dashboard

# Check cron jobs are configured
# Should see: /api/crew/drill/cron scheduled for "0 2 * * 1"
```

**Test manual drill execution:**
```bash
curl -X POST https://your-app.vercel.app/api/crew/drill/execute \
  -H "Content-Type: application/json" \
  -d '{"run_type": "manual", "scenario_count": 5, "dry_run": true}'
```

**Verify cron endpoint is protected:**
```bash
# Without secret (should fail)
curl https://your-app.vercel.app/api/crew/drill/cron

# With secret (should succeed)
curl https://your-app.vercel.app/api/crew/drill/cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Features

### Automated Weekly Drills
- Runs every Monday at 2 AM UTC
- Tests 25 scenarios with multiple LLM tier configurations
- Evaluates across 4 metrics: cost efficiency, quality/accuracy, response quality, speed/latency
- Automatically updates crew configs and orchestrator logic
- Stores insights in RAG with deduplication

### Manual Drill Trigger
- Execute on-demand via API
- Customize scenario count and complexity filter
- Dry-run mode for testing without applying updates

### Evaluation Metrics

**1. Cost Efficiency (30% weight)**
- ROI score vs baseline
- Savings percentage
- Cost per successful execution

**2. Quality/Accuracy (30% weight)**
- Task success rate
- Crew selection accuracy
- Response correctness

**3. Response Quality (25% weight)**
- Relevance score
- Completeness
- Usefulness rating

**4. Speed/Latency (15% weight)**
- Average execution time
- P95 latency
- Timeout rate

### Safety Mechanisms
- Backup before updates (stored in `backups/YYYY-MM-DD-HHmmss/`)
- Atomic file updates with validation
- Rollback capability on failure
- Dry-run mode for testing

### RAG Deduplication
- Semantic hashing prevents duplicate vectors
- Content fingerprinting for intention-based deduplication
- Updates existing insights instead of creating duplicates

## Monitoring

### Check Drill Status
```bash
# Get latest drill run
curl https://your-app.vercel.app/api/crew/drill/status?runId=<run-id>

# Get detailed results
curl https://your-app.vercel.app/api/crew/drill/results?runId=<run-id>
```

### Vercel Logs
```bash
vercel logs --prod
```

### Supabase Logs
Check in Supabase Dashboard:
- Database → Logs
- API → Logs

## Troubleshooting

### Migration Failed
- Check Supabase SQL Editor for error messages
- Verify uuid-ossp extension is enabled
- Check if tables already exist (may need to drop first)

### Cron Not Triggering
- Verify CRON_SECRET is set in Vercel environment variables
- Check Vercel cron configuration in dashboard
- Review Vercel function logs

### Drill Execution Fails
- Verify RAG_API_URL is accessible from Vercel
- Check Python FastAPI service is running
- Review drill execution logs in Supabase drill_runs table

### RAG Deduplication Not Working
- Verify semantic_hash column exists in crew_memories
- Check intention field is set to 'drill_optimization'
- Review SystemUpdater logs

## File Structure

```
├── supabase/
│   ├── migrations/
│   │   └── 20251220_create_drill_system.sql    # Database schema
│   └── seed/
│       └── drill_scenarios.sql                  # Initial scenarios
├── src/rag_factory/drills/
│   ├── models.py                                # Data models
│   ├── scenario_generator.py                   # Scenario generation
│   ├── drill_executor.py                       # Drill execution
│   ├── picard_evaluator.py                     # Evaluation logic
│   ├── system_updater.py                       # Update mechanism
│   └── drill_orchestrator.py                   # Main orchestrator
├── app/api/crew/drill/
│   ├── execute/route.ts                        # Manual trigger
│   ├── status/route.ts                         # Status endpoint
│   ├── results/route.ts                        # Results endpoint
│   └── cron/route.ts                           # Automated trigger
├── scripts/
│   ├── apply-migration.sh                      # Migration helper
│   └── apply-migration.mjs                     # Node migration script
├── data/
│   └── drill-config.json                       # Configuration
├── vercel.json                                 # Cron schedule
└── DEPLOYMENT.md                               # This file
```

## Success Criteria

- ✅ All 4 drill tables exist in production Supabase
- ✅ 30 baseline scenarios seeded
- ✅ Weekly cron job configured and protected
- ✅ Manual drill execution works via API
- ✅ Picard evaluation generates recommendations
- ✅ System updates apply without errors
- ✅ RAG deduplication prevents duplicate vectors
- ✅ Backup/rollback mechanism functional

## Expected Outcomes

After 1 month of weekly drills (4 runs):
- 10-15% reduction in LLM API costs
- Improved crew selection accuracy
- Optimized tier assignments for each crew member
- Refined orchestrator keyword mappings
- Rich historical performance data in RAG

## Support

For issues or questions:
1. Check Vercel deployment logs
2. Review Supabase database logs
3. Check Python FastAPI service logs
4. Review drill_runs table for error_log field

## Next Steps After Deployment

1. Monitor first weekly automated drill
2. Review Picard's evaluation and recommendations
3. Validate system updates are applied correctly
4. Adjust drill configuration based on results
5. Expand scenario library with real-world use cases
