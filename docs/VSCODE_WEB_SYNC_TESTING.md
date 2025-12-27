# VSCode Extension ↔ Web Dashboard Real-Time Sync Testing Guide

**Date**: 2025-12-26
**Version**: 1.0.0
**Status**: Ready for Testing

---

## Overview

This guide shows how to reload and test real-time synchronization between the VSCode extension (developer interface) and the web dashboard (owner/admin interface). Both communicate through shared API routes and can potentially use Supabase for real-time updates.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     VSCode Extension                            │
│                    (Developer Interface)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Features:                                                 │  │
│  │ - Code editing & file operations                         │  │
│  │ - Crew chat (Commander Riker, etc.)                      │  │
│  │ - Inline completions                                     │  │
│  │ - Project tree view                                      │  │
│  │ - Diagnostics                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP API Calls
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│              Next.js Backend (Port 3001)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ API Routes:                                               │  │
│  │ - /api/projects (GET, POST)                              │  │
│  │ - /api/ask (crew chat)                                   │  │
│  │ - /api/sprints                                           │  │
│  │ - /api/tools/filesystem                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Data Layer:                                               │  │
│  │ - File system (data/projects.json)                       │  │
│  │ - Supabase (RBAC, real-time) [Phase 2+]                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP Responses
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Web Dashboard (Port 3001)                      │
│                  (Owner/Admin Interface)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Features:                                                 │  │
│  │ - Project management                                     │  │
│  │ - Team/member management (RBAC) [Phase 5]               │  │
│  │ - Observation Lounge (multi-crew chat)                  │  │
│  │ - Sprint planning                                        │  │
│  │ - Analytics & reporting                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Reload VSCode Extension

**Option A: Via Command Palette** (Recommended)

```
1. Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux)
2. Type: "Developer: Reload Window"
3. Press Enter
```

**Option B: Via Keyboard Shortcut**

```
Mac: Cmd+R
Windows/Linux: Ctrl+R
```

**Option C: Rebuild and Reload** (if you made code changes)

```bash
# Terminal 1: Rebuild extension
cd vscode-extension
npm run compile

# Then reload VSCode window (Cmd+Shift+P → "Developer: Reload Window")
```

**Verify Extension Loaded**:
- Check status bar for "🖖 Alex AI" indicator
- Open Alex AI panel (View → Alex AI or icon in sidebar)
- Check Output → Alex AI Extension for logs

### 2. Start Web Dashboard

**Option A: Standard Development Server**

```bash
# Terminal 2: Start Next.js dev server on port 3001
PORT=3001 npm run dev
```

**Option B: Using npm script** (if configured)

```bash
npm run dev:check  # Checks env vars and starts dev server
```

**Expected Output**:
```
  ▲ Next.js 16.0.10
  - Local:        http://localhost:3001
  - Ready in 2.1s
```

**Verify Web Dashboard**:
- Open browser: http://localhost:3001
- Should see Alex AI homepage
- Check Network tab for API calls

### 3. Open Both Interfaces

**Split Screen Setup** (Recommended):

```
┌──────────────────────┬──────────────────────┐
│                      │                      │
│   VSCode Editor      │   Web Browser        │
│                      │                      │
│   (Developer View)   │   (Owner/Admin View) │
│                      │                      │
│   - Code files       │   - Project list     │
│   - Alex AI panel    │   - Crew dashboard   │
│   - Terminal         │   - Lounge           │
│                      │                      │
└──────────────────────┴──────────────────────┘
```

1. **Left**: VSCode with Alex AI extension
2. **Right**: Browser at http://localhost:3001

---

## Testing Real-Time Sync

### Test 1: Project Creation Sync

**Objective**: Create project in web dashboard, verify VSCode sees it

**Steps**:

1. **In Web Dashboard** (http://localhost:3001):
   ```
   - Navigate to /projects
   - Click "New Project"
   - Fill in details:
     Name: "Test Sync Project"
     Category: "ddd-web-architecture"
   - Click "Create"
   ```

2. **In VSCode**:
   ```
   - Open Alex AI panel
   - Click "Refresh Projects" (if available)
   - OR: Reload window (Cmd+Shift+P → "Developer: Reload Window")
   ```

3. **Verify**:
   ```
   - Check data/projects.json file updated
   - VSCode project tree shows new project
   - Web dashboard shows project in list
   ```

**Expected**: ✅ Project appears in both interfaces

### Test 2: Crew Chat Sync

**Objective**: Chat with crew in VSCode, check if visible in web

**Steps**:

1. **In VSCode**:
   ```
   - Open Alex AI Chat panel
   - Select "Commander Riker"
   - Send message: "What projects do we have?"
   - Wait for response
   ```

2. **In Web Dashboard**:
   ```
   - Navigate to /crew/riker
   - Check recent chat history
   ```

3. **Verify**:
   ```
   - Check if conversation appears in web interface
   - Check data/memories/ folder for saved interactions
   ```

**Expected**: ✅ Chat history synced (if memory persistence implemented)

### Test 3: File Operation Sync

**Objective**: Edit file in VSCode, trigger API call

**Steps**:

1. **In VSCode**:
   ```
   - Open any project file
   - Make an edit
   - Save file (Cmd+S / Ctrl+S)
   ```

2. **Watch Network Tab in Browser**:
   ```
   - Open DevTools (F12)
   - Go to Network tab
   - Check for API calls to /api/tools/filesystem
   ```

3. **Verify**:
   ```
   - API call shows file operation
   - Audit log (future: Supabase) records change
   ```

**Expected**: ✅ File operations tracked via API

### Test 4: Sprint Status Sync

**Objective**: Update sprint in web, check VSCode

**Steps**:

1. **In Web Dashboard**:
   ```
   - Navigate to /observation-lounge
   - Create new sprint discussion
   - Add tasks/stories
   ```

2. **In VSCode**:
   ```
   - Open Command Palette (Cmd+Shift+P)
   - Run "Alex AI: View Sprint Status"
   - Check sprint details
   ```

3. **Verify**:
   ```
   - Sprint data visible in both interfaces
   - Task counts match
   ```

**Expected**: ✅ Sprint state synchronized

### Test 5: Configuration Sync

**Objective**: Update VSCode settings, verify API base URL

**Steps**:

1. **In VSCode**:
   ```
   - Open Settings (Cmd+,)
   - Search "Alex AI"
   - Verify "Base URL" = "http://localhost:3001"
   ```

2. **Test API Connection**:
   ```
   - In VSCode Chat, invoke Commander Riker
   - Message should trigger API call to localhost:3001
   ```

3. **Verify in Browser DevTools**:
   ```
   - F12 → Network tab
   - Look for requests to /api/ask or /api/projects
   ```

**Expected**: ✅ VSCode successfully calls web API

---

## Real-Time Sync Mechanisms

### Current Implementation (File-Based)

**Mechanism**: Shared file system
- Both VSCode and Web read/write `data/projects.json`
- Manual refresh required (reload window or API call)

**Pros**:
- ✅ Simple, no external dependencies
- ✅ Works offline
- ✅ Git-trackable

**Cons**:
- ❌ Not truly "real-time"
- ❌ Requires manual refresh
- ❌ Potential race conditions

### Future Implementation (Supabase Real-Time)

**Mechanism**: Supabase Realtime subscriptions (Phase 6)

```typescript
// VSCode Extension (future)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

supabase
  .channel('projects')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'projects' },
    (payload) => {
      console.log('Project changed:', payload);
      refreshProjectTree(); // Auto-refresh VSCode tree
    }
  )
  .subscribe();
```

```typescript
// Web Dashboard (future)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

supabase
  .channel('projects')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'projects' },
    (payload) => {
      console.log('Project changed:', payload);
      // Auto-update React state
      setProjects(prev => [...prev, payload.new]);
    }
  )
  .subscribe();
```

**Pros**:
- ✅ True real-time (sub-second updates)
- ✅ No polling required
- ✅ Scales to multiple users
- ✅ Automatic conflict resolution

**Cons**:
- ❌ Requires internet connection
- ❌ More complex setup
- ❌ Additional infrastructure (Supabase)

---

## Debugging Sync Issues

### Issue: VSCode Can't Connect to Web API

**Symptom**: "Connection refused" or timeout errors

**Solution**:

1. **Verify web server running**:
   ```bash
   lsof -i :3001
   # Should show node process
   ```

2. **Check VSCode settings**:
   ```
   Settings → Alex AI → Base URL
   Should be: http://localhost:3001
   ```

3. **Check logs**:
   ```
   VSCode: Output → Alex AI Extension
   Web: Terminal running npm run dev
   ```

4. **Restart both**:
   ```bash
   # Terminal: Ctrl+C, then restart
   PORT=3001 npm run dev

   # VSCode: Cmd+Shift+P → "Developer: Reload Window"
   ```

### Issue: Projects Not Syncing

**Symptom**: Create project in web, doesn't appear in VSCode

**Solution**:

1. **Check data/projects.json**:
   ```bash
   cat data/projects.json | jq '.projects[] | .name'
   ```

2. **Verify API working**:
   ```bash
   curl http://localhost:3001/api/projects
   ```

3. **Force reload VSCode**:
   ```
   Cmd+Shift+P → "Developer: Reload Window"
   ```

4. **Check file permissions**:
   ```bash
   ls -la data/projects.json
   # Should be writable
   ```

### Issue: Crew Chat Not Working

**Symptom**: Chat messages don't send or receive responses

**Solution**:

1. **Check OpenRouter API key**:
   ```
   VSCode Settings → Alex AI → Open Router Api Key
   Must be set
   ```

2. **Verify API endpoint**:
   ```bash
   curl -X POST http://localhost:3001/api/ask \
     -H "Content-Type: application/json" \
     -d '{"crewMember": "riker", "message": "test"}'
   ```

3. **Check logs**:
   ```
   VSCode: Output → Alex AI Extension
   Look for API errors
   ```

### Issue: Web Dashboard Shows Stale Data

**Symptom**: Web doesn't reflect VSCode changes

**Solution**:

1. **Hard refresh browser**:
   ```
   Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   ```

2. **Check API caching**:
   ```
   Browser DevTools → Network → Disable cache
   ```

3. **Verify file updated**:
   ```bash
   tail -20 data/projects.json
   ```

---

## API Endpoints Reference

### Projects API

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/api/projects` | List all projects | Both |
| GET | `/api/projects?id=xxx` | Get project details | Both |
| POST | `/api/projects` | Create project | Web (Owner+) |
| PUT | `/api/projects/[id]` | Update project | Web (Owner+) |
| DELETE | `/api/projects/[id]` | Delete project | Web (Admin) |

### Crew/Chat API

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| POST | `/api/ask` | Send message to crew | Both |
| GET | `/api/crew/[id]/memories` | Get crew memories | Both |

### Sprint API

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| GET | `/api/sprints` | Get sprint status | Both |
| POST | `/api/sprints/plan` | Create sprint plan | Web |
| POST | `/api/sprints/auto-execute` | Auto-execute sprint | Web |

### Filesystem API

| Method | Endpoint | Description | Used By |
|--------|----------|-------------|---------|
| POST | `/api/tools/filesystem` | File operations | VSCode |

---

## Demo Workflow: Complete Sync Test

### Setup (5 minutes)

```bash
# Terminal 1: Start web dashboard
cd /Users/bradygeorgen/Documents/workspace/rag-refresh-product-factory
PORT=3001 npm run dev

# VSCode: Reload extension
# Cmd+Shift+P → "Developer: Reload Window"

# Browser: Open dashboard
open http://localhost:3001
```

### Test Sequence (10 minutes)

**Step 1: Create Project in Web** (2 min)
```
1. Browser → http://localhost:3001/projects/new
2. Name: "Real-Time Sync Test"
3. Category: "ddd-web-architecture"
4. Click "Create"
5. Note the project ID from URL
```

**Step 2: Verify in VSCode** (1 min)
```
1. VSCode → Alex AI panel
2. Reload window (Cmd+Shift+P → Reload)
3. Check project tree for "Real-Time Sync Test"
4. ✅ Should appear
```

**Step 3: Chat in VSCode** (2 min)
```
1. VSCode → Alex AI Chat panel
2. Select "Commander Riker"
3. Message: "What is the latest project we created?"
4. Wait for response
5. ✅ Should mention "Real-Time Sync Test"
```

**Step 4: Check Web Dashboard** (1 min)
```
1. Browser → http://localhost:3001/crew/riker
2. Check recent interactions
3. ✅ May or may not show (depending on memory persistence)
```

**Step 5: Edit File in VSCode** (2 min)
```
1. VSCode → Create new file: data/test-sync.txt
2. Add content: "Testing VSCode-Web sync"
3. Save (Cmd+S)
4. Browser DevTools → Network tab
5. ✅ Check for API calls (if file watcher implemented)
```

**Step 6: View in Web** (2 min)
```
1. Browser → http://localhost:3001/diagnostics
2. Check file system section
3. ✅ Should show data/test-sync.txt (if implemented)
```

---

## Future Enhancements (Phase 6+)

### Real-Time Updates via Supabase

**Implementation**:

1. **Shared State in Supabase**:
   ```sql
   -- Real-time table
   CREATE TABLE project_events (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     project_id TEXT NOT NULL,
     event_type TEXT NOT NULL,
     user_id UUID NOT NULL,
     data JSONB,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **VSCode Extension Subscription**:
   ```typescript
   const channel = supabase
     .channel('project-events')
     .on('postgres_changes',
       { event: 'INSERT', schema: 'public', table: 'project_events' },
       (payload) => {
         vscode.window.showInformationMessage(
           `Project ${payload.new.project_id} updated!`
         );
       }
     )
     .subscribe();
   ```

3. **Web Dashboard Subscription**:
   ```typescript
   useEffect(() => {
     const channel = supabase
       .channel('project-events')
       .on('postgres_changes',
         { event: 'INSERT', schema: 'public', table: 'project_events' },
         (payload) => {
           toast.info(`Project ${payload.new.project_id} updated!`);
           refetchProjects();
         }
       )
       .subscribe();

     return () => { channel.unsubscribe(); };
   }, []);
   ```

### Conflict Resolution

**Strategy**: Last-write-wins with version tracking

```typescript
// Example: Optimistic updates with conflict detection
const updateProject = async (id: string, data: Partial<Project>) => {
  const { data: current, error } = await supabase
    .from('projects')
    .select('version')
    .eq('id', id)
    .single();

  if (current.version !== localVersion) {
    // Conflict detected
    const resolved = await resolveConflict(current, data);
    return resolved;
  }

  // No conflict, proceed
  await supabase
    .from('projects')
    .update({ ...data, version: current.version + 1 })
    .eq('id', id);
};
```

---

## Monitoring & Observability

### Metrics to Track

1. **Sync Latency**:
   - Time from web update to VSCode notification
   - Target: <1 second

2. **API Response Time**:
   - `/api/projects` GET: <100ms
   - `/api/ask` POST: <2s (depends on LLM)

3. **Error Rate**:
   - Failed API calls
   - Sync conflicts
   - Target: <1% error rate

### Logging

**VSCode Extension**:
```typescript
console.log('[Alex AI] Project synced:', projectId);
console.error('[Alex AI] Sync failed:', error);
```

**Web Dashboard**:
```typescript
console.log('[Dashboard] API call:', endpoint, response);
console.error('[Dashboard] Error:', error);
```

**Audit Log (Supabase)**:
```sql
INSERT INTO audit_log (user_id, action, resource_type, resource_id)
VALUES (user_id, 'project_update', 'project', project_id);
```

---

## Summary

### Current Capabilities ✅

- [x] VSCode extension connects to web API
- [x] Web dashboard serves API routes
- [x] Both share `data/projects.json`
- [x] Manual refresh syncs state
- [x] API-based crew chat works

### In Progress 🔄

- [ ] Supabase RBAC integration (Phase 1 complete, Phase 2-6 pending)
- [ ] Authentication abstraction layer
- [ ] API key management for VSCode

### Future (Phase 6+) 🔮

- [ ] Real-time Supabase subscriptions
- [ ] Automatic sync without refresh
- [ ] Conflict resolution
- [ ] Multi-user collaborative editing
- [ ] Audit logging for all operations

---

## Next Steps

1. **Test Current Sync** (today):
   ```bash
   PORT=3001 npm run dev
   # Reload VSCode extension
   # Follow "Demo Workflow" above
   ```

2. **Implement Phase 2** (next):
   - Authentication abstraction layer
   - API key generation for VSCode
   - Permission middleware

3. **Build Real-Time Sync** (later):
   - Supabase Realtime subscriptions
   - VSCode event listeners
   - Web dashboard live updates

---

## References

### Internal Documentation
- [RBAC Architecture](./RBAC_ARCHITECTURE.md)
- [RBAC Phase 1 Complete](./RBAC_PHASE1_COMPLETE.md)
- [Secrets Management](./SECRETS_MANAGEMENT.md)

### Code Files
- VSCode Extension: `vscode-extension/src/`
- Web API Routes: `app/api/`
- Projects API: `app/api/projects/route.ts`

### External Resources
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [VSCode Extension API](https://code.visualstudio.com/api)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**Version**: 1.0.0
**Last Updated**: 2025-12-26
**Maintained by**: Alex AI Crew
