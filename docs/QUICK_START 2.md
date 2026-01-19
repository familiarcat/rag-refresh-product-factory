# Quick Start - Complete System Integration

## Step 1: Apply Supabase Migration (2 minutes)

### Option A: Via Supabase Dashboard (Easiest)

1. **Open SQL Editor**:
   ```bash
   open "https://supabase.com/dashboard/project/rpkkkbufdwxmjaerbhbn/sql/new"
   ```

2. **Copy Migration SQL**:
   ```bash
   cat supabase/migrations/001_simple_rbac.sql | pbcopy
   ```

3. **In Dashboard**:
   - Paste SQL (Cmd+V)
   - Click "Run"
   - Wait ~10 seconds

4. **Verify**:
   ```bash
   npm run db:verify:quick
   ```

### Option B: Via Supabase CLI

```bash
supabase link --project-ref rpkkkbufdwxmjaerbhbn
supabase db push
```

## Step 2: Test System Integration (5 minutes)

### 2.1 Test API
```bash
# Check database connection
curl http://localhost:3001/api/dev/test-auth | jq '.'

# Generate API key for dev user
curl "http://localhost:3001/api/dev/test-auth?action=create-api-key&email=dev1@example.com" | jq '.api_key'

# Save the key
export ALEX_API_KEY="alex_..."

# Test authentication
curl -H "Authorization: Bearer $ALEX_API_KEY" \
  http://localhost:3001/api/projects | jq '.'
```

### 2.2 Test Worf Security Agent
```bash
# Check security status via API
curl http://localhost:3001/api/crew/worf?action=status | jq '.'

# Get Worf's profile
curl http://localhost:3001/api/crew/worf?action=profile | jq '.'

# Test security analysis
curl -X POST http://localhost:3001/api/crew/worf \
  -H "Content-Type: application/json" \
  -d '{"operation": "analyze_security"}' | jq '.'
```

### 2.3 Test VSCode Extension

1. **Open VSCode** in this workspace
2. **Reload Extension**: Cmd+Shift+P → "Developer: Reload Window"
3. **Open Alex AI Chat**: Click Alex AI icon in sidebar
4. **Test Chat**: Send message to any crew member
5. **Test Projects**: Click "Projects" tab, verify projects load
6. **Test Sprints**: Select a project, check sprint data appears

## Step 3: Current Capabilities

### What Works Now:

#### Dashboard (localhost:3001)
- ✅ Create/Edit/Delete Projects
- ✅ View Sprint Progress
- ✅ Crew Coordination
- ✅ API Key Management (after migration)
- ✅ Security via Worf agent

#### VSCode Extension
- ✅ Chat with 8 crew members (Picard, Riker, Data, Geordi, Troi, Worf, O'Brien, Quark)
- ✅ File Operations (read/write/patch/delete)
- ✅ Code Completions (like GitHub Copilot)
- ✅ Code Review (Problems panel)
- ✅ Project/Sprint Browsing
- ✅ Observation Lounge (multi-crew discussions)
- ✅ Save Recommendations & Plans

#### Sitemap System (dist/sitemap/)
- ✅ WordPress sitemap parsing
- ✅ Interactive Mermaid visualization
- ✅ Drill-down navigation
- ✅ Multiple layouts

## Step 4: Next Features to Add

### Coming Soon (this session):

1. **Image/OCR in VSCode**
   - Paste screenshots in chat
   - OCR text extraction
   - Vision model analysis
   - Code screenshot understanding

2. **Sitemap ↔ Project Integration**
   - Import WordPress sitemap → create Alex AI project
   - Generate sitemap from Alex AI project
   - View project sitemaps in dashboard and extension
   - AI-powered structure analysis

3. **Crew Mission System**
   - Formal task assignments
   - Crew hierarchy enforcement
   - Mission progress tracking
   - Auto-assignment based on expertise

4. **UI Unification**
   - Shared design tokens
   - Consistent crew badges
   - Matching colors/fonts/spacing
   - Component mirroring

5. **Real-Time Sync**
   - WebSocket connection
   - Live mission updates
   - Collaborative editing
   - Dashboard ↔ Extension sync

## Step 5: Configuration Check

### Required Environment Variables

Check `.env.local` has:
```bash
cat .env.local | grep -E "^(SUPABASE|OPENAI)" || echo "Missing required vars"
```

Should show:
```
SUPABASE_URL="https://rpkkkbufdwxmjaerbhbn.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
OPENAI_API_KEY="sk-..."
```

### VSCode Extension Settings

Check VSCode settings (Cmd+,):
- ☑ `alexAi.openRouterApiKey` - Set to your OpenRouter key
- ☑ `alexAi.baseUrl` - Should be `http://localhost:3001`
- ☑ `alexAi.defaultCrewMember` - Default: `riker`
- ☑ `alexAi.enableInlineCompletions` - Recommended: `true`

## Troubleshooting

### Issue: "Supabase not connected"
**Fix**:
```bash
# Verify credentials
cat .env.local | grep SUPABASE

# Test connection
curl -H "apikey: $(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d'=' -f2 | tr -d '\"')" \
  "$(grep SUPABASE_URL .env.local | cut -d'=' -f2 | tr -d '\"')/rest/v1/"
```

### Issue: "VSCode extension not loading projects"
**Fix**:
```bash
# Ensure dev server running
lsof -ti:3001 || npm run dev

# Check extension logs
# In VSCode: View → Output → Select "Alex AI"
```

### Issue: "Chat not responding"
**Fix**:
- Check OpenRouter API key in VSCode settings
- Check console for errors: View → Output → Alex AI
- Verify dev server is running on localhost:3001

## Quick Commands Reference

```bash
# Development
npm run dev                 # Start Next.js dashboard
npm run worf:dev           # Setup local secrets
npm run worf:status        # Check security status

# Database
npm run db:verify:quick    # Verify Supabase schema
npm run worf:supabase      # Complete Supabase workflow

# VSCode Extension
npm run vscode:build       # Build extension
npm run vscode:install     # Install to VSCode

# Crew & Security
curl localhost:3001/api/crew/worf  # Worf security agent
curl localhost:3001/api/projects   # List projects
```

## What to Test Now

1. ✅ **Supabase Migration Applied** - Run SQL in dashboard
2. ✅ **Database Verified** - `npm run db:verify:quick`
3. ✅ **API Keys Working** - Generate and test API key
4. ✅ **Worf Agent Responding** - Test security endpoints
5. ✅ **VSCode Extension Working** - Chat with crew members
6. ✅ **Projects Loading** - View projects in extension
7. ✅ **Sprints Displaying** - Check sprint data

## Current Status

- **Dashboard**: ✅ Running on http://localhost:3001
- **Supabase**: ⏸️ Migration pending (paste SQL in dashboard)
- **RBAC**: ✅ Ready (routes created, waiting for migration)
- **Worf Agent**: ✅ Active (CLI + API + n8n)
- **VSCode Extension**: ✅ Fully functional
- **Sitemap System**: ✅ Built (needs project integration)

---

**Next**: Apply the Supabase migration, then we'll add image/OCR and sitemap integration!
