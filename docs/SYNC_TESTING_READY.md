# ✅ VSCode ↔ Web Dashboard Sync Testing - READY

**Date**: 2025-12-26
**Status**: Ready for Testing
**Next.js Server**: Starting (process running)

---

## What's Ready

### ✅ Documentation Created

1. **[docs/VSCODE_WEB_SYNC_TESTING.md](./VSCODE_WEB_SYNC_TESTING.md)** (~400 lines)
   - Complete testing guide
   - Architecture diagram
   - 5 test scenarios
   - Debugging guide
   - Future real-time sync plans (Supabase)

2. **[QUICK_START_SYNC_TESTING.md](../QUICK_START_SYNC_TESTING.md)** (~100 lines)
   - 2-minute setup guide
   - Quick test procedures
   - Troubleshooting
   - Reference table

3. **[scripts/start-dev-with-vscode.sh](../scripts/start-dev-with-vscode.sh)**
   - Automated startup script
   - Checks for port conflicts
   - Displays reload instructions
   - Starts web server on port 3001

### ✅ Development Server

**Status**: ✅ Process running (PID: 61565)
**Command**: `PORT=3001 npm run dev`
**Expected URL**: http://localhost:3001

**Note**: First-time compilation may take 30-60 seconds

**Verify Server Ready**:
```bash
# Check if server responding
curl -I http://localhost:3001

# Check server logs
# (Server is running in background task b505fdc)

# Check what port is active
lsof -i :3001
```

### ✅ VSCode Extension

**Status**: Ready (compiled)
**Location**: `vscode-extension/dist/`

**To Reload**:
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type: `Developer: Reload Window`
3. Press Enter

**Verify Loaded**:
- Status bar shows "🖖 Alex AI"
- Alex AI panel visible in sidebar
- Output → Alex AI Extension shows logs

---

## How to Test (Right Now)

### Step 1: Verify Web Server (30 seconds)

```bash
# Wait for compilation (if needed)
sleep 30

# Check server status
curl http://localhost:3001

# Should return HTML with "Alex AI" in title
```

**If server not responding**:
```bash
# Check logs
cat /tmp/claude/-Users-bradygeorgen-Documents-workspace-stldnb/tasks/b505fdc.output

# Or restart manually
killall node
PORT=3001 npm run dev
```

### Step 2: Reload VSCode Extension (10 seconds)

**In VSCode**:
```
1. Cmd+Shift+P (or Ctrl+Shift+P)
2. Type: "reload"
3. Select: "Developer: Reload Window"
```

**Verify**:
- Look for "🖖 Alex AI" in status bar
- Alex AI icon in sidebar

### Step 3: Open Split Screen (5 seconds)

**Layout**:
```
┌──────────────────┬──────────────────┐
│                  │                  │
│   VSCode         │   Browser        │
│                  │                  │
│   Left half      │   Right half     │
│                  │                  │
└──────────────────┴──────────────────┘
```

1. **Left**: Your VSCode window
2. **Right**: Browser → http://localhost:3001

### Step 4: Test Basic Sync (2 minutes)

**Create Project in Web**:
```
1. Browser → http://localhost:3001/projects/new
2. Name: "Test Sync"
3. Click "Create"
```

**Verify in VSCode**:
```
1. Cmd+Shift+P → "reload"
2. Alex AI panel → Check projects
3. ✅ Should see "Test Sync"
```

**Chat Test**:
```
1. VSCode → Alex AI Chat
2. Select "Commander Riker"
3. Message: "What projects exist?"
4. ✅ Should get response
```

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│                   VSCode Extension                         │
│              (Developer Interface)                         │
│  • Code editing                                            │
│  • File operations                                         │
│  • Crew chat                                               │
│  • Project tree                                            │
└─────────────────┬──────────────────────────────────────────┘
                  │
                  │ HTTP API (localhost:3001/api)
                  ↓
┌────────────────────────────────────────────────────────────┐
│              Next.js Backend (Port 3001)                   │
│  API Routes:                                               │
│  • GET  /api/projects                                      │
│  • POST /api/projects                                      │
│  • POST /api/ask (crew chat)                               │
│  • GET  /api/sprints                                       │
│                                                            │
│  Data:                                                     │
│  • data/projects.json (shared file)                        │
│  • Supabase (Phase 2+) [RBAC + Real-time]                 │
└─────────────────┬──────────────────────────────────────────┘
                  │
                  │ HTTP Responses / SSR
                  ↓
┌────────────────────────────────────────────────────────────┐
│                Web Dashboard (localhost:3001)               │
│             (Owner/Admin Interface)                         │
│  • Project management                                      │
│  • User management (Phase 5)                               │
│  • Observation Lounge                                      │
│  • Sprint planning                                         │
└────────────────────────────────────────────────────────────┘
```

---

## Current Sync Mechanism

**Type**: File-based (manual refresh)

**How it Works**:
1. Both VSCode and Web read/write `data/projects.json`
2. Changes reflected when file is read again
3. VSCode: Requires window reload
4. Web: Requires page refresh or API call

**Limitations**:
- ❌ Not real-time (requires manual action)
- ❌ Potential race conditions
- ✅ Simple, no dependencies
- ✅ Works offline

---

## Future Sync (Phase 6)

**Type**: Real-time via Supabase

**How it Will Work**:
1. Both subscribe to Supabase Realtime channels
2. Changes published as events
3. Both receive instant notifications
4. UI updates automatically (no refresh)

**Benefits**:
- ✅ True real-time (<1 second latency)
- ✅ Multi-user support
- ✅ Conflict resolution
- ✅ Audit logging

**Implementation**:
```typescript
// VSCode Extension (future)
supabase
  .channel('projects')
  .on('postgres_changes', { event: '*', table: 'projects' },
    payload => refreshProjects()
  )
  .subscribe();

// Web Dashboard (future)
supabase
  .channel('projects')
  .on('postgres_changes', { event: '*', table: 'projects' },
    payload => setProjects(prev => [...prev, payload.new])
  )
  .subscribe();
```

---

## Test Scenarios

### 1. Project Creation Flow

**Web → VSCode**:
1. Create project in web dashboard
2. Reload VSCode window
3. ✅ Project appears in VSCode

**VSCode → Web**:
1. Edit `data/projects.json` in VSCode
2. Refresh web browser
3. ✅ Changes appear in web

### 2. Crew Chat

**VSCode Initiated**:
1. Chat with Commander Riker in VSCode
2. Check browser DevTools → Network
3. ✅ POST to `/api/ask`

**Web Initiated**:
1. Use Observation Lounge in web
2. Check VSCode Output → Alex AI Extension
3. ✅ API responses logged

### 3. Concurrent Edits

**Test Conflict**:
1. Open `data/projects.json` in VSCode
2. Create project in web (writes to same file)
3. Save in VSCode
4. ⚠️ Last write wins (file-based sync limitation)

**Future (Supabase)**:
1. Edit project A in VSCode
2. Edit project A in web simultaneously
3. ✅ Conflict detected
4. ✅ Automatic resolution or user prompt

---

## Monitoring & Debugging

### Check Server Status

```bash
# Is server running?
lsof -i :3001

# What port?
lsof -i | grep node

# Process info
ps aux | grep "next dev"

# Server logs
cat /tmp/claude/-Users-bradygeorgen-Documents-workspace-stldnb/tasks/b505fdc.output
```

### Check VSCode Extension

**Output Panel**:
```
View → Output → Select "Alex AI Extension"
```

**Extension Logs**:
- API calls
- Errors
- Crew interactions
- File operations

### Check Web Dashboard

**Browser DevTools**:
```
F12 → Network tab
Look for:
- GET /api/projects
- POST /api/ask
- Response codes (200 = success)
```

**Console Logs**:
```
F12 → Console tab
Look for React errors or warnings
```

---

## Common Issues & Fixes

### Issue: Server Not Starting

**Symptoms**:
- `curl http://localhost:3001` fails
- Port 3001 not in `lsof` output

**Fix**:
```bash
# Kill any existing process
killall node

# Restart
PORT=3001 npm run dev

# Or use the startup script
bash scripts/start-dev-with-vscode.sh
```

### Issue: VSCode Extension Not Loading

**Symptoms**:
- No "🖖 Alex AI" in status bar
- No Alex AI panel

**Fix**:
```bash
# Rebuild extension
cd vscode-extension
npm install
npm run compile

# Reload VSCode window
# Cmd+Shift+P → "Developer: Reload Window"
```

### Issue: Projects Not Syncing

**Symptoms**:
- Create in web, doesn't appear in VSCode
- Or vice versa

**Fix**:
```bash
# Check file exists
cat data/projects.json

# Force reload both
# VSCode: Cmd+Shift+P → "reload"
# Browser: Cmd+Shift+R (hard refresh)
```

### Issue: API Calls Failing

**Symptoms**:
- Chat doesn't work
- "Connection refused" errors

**Fix**:
```bash
# Verify base URL in VSCode settings
# Settings → Alex AI → Base URL
# Should be: http://localhost:3001

# Check server is running
lsof -i :3001

# Check API key (if using OpenRouter)
# Settings → Alex AI → Open Router Api Key
```

---

## Quick Reference

| Action | Command/Shortcut |
|--------|-----------------|
| Start web server | `PORT=3001 npm run dev` |
| Start with script | `bash scripts/start-dev-with-vscode.sh` |
| Reload VSCode | `Cmd+Shift+P` → "reload" |
| Rebuild extension | `cd vscode-extension && npm run compile` |
| Check server | `lsof -i :3001` |
| View projects | `cat data/projects.json \| jq` |
| Open web | http://localhost:3001 |
| Browser DevTools | `F12` |
| VSCode Output | `View → Output → Alex AI Extension` |

---

## Next Steps

### Immediate (Today)

1. **Verify server started**:
   ```bash
   curl -I http://localhost:3001
   ```

2. **Reload VSCode**:
   ```
   Cmd+Shift+P → "Developer: Reload Window"
   ```

3. **Open browser**:
   ```
   http://localhost:3001
   ```

4. **Test basic sync**:
   - Follow "Test Scenarios" above

### Short-term (This Week)

- Complete RBAC Phase 2 (Authentication Abstraction)
- Implement API key generation for VSCode
- Add permission middleware to API routes
- Test with multiple users/roles

### Long-term (Next Month)

- Implement Supabase Realtime (Phase 6)
- Add conflict resolution
- Multi-user collaborative editing
- Audit logging for all operations

---

## Documentation Links

- **[Complete Testing Guide](./VSCODE_WEB_SYNC_TESTING.md)** - Full details
- **[Quick Start](../QUICK_START_SYNC_TESTING.md)** - 2-minute setup
- **[RBAC Architecture](./RBAC_ARCHITECTURE.md)** - Security design
- **[Secrets Management](./SECRETS_MANAGEMENT.md)** - Credential sync

---

**Status**: ✅ Ready for Testing
**Server**: Running (first compile in progress)
**VSCode Extension**: Ready (requires reload)
**Documentation**: Complete

**Start Testing**: Reload VSCode + Open Browser!

---

**Version**: 1.0.0
**Last Updated**: 2025-12-26
**Maintained by**: Alex AI Crew
