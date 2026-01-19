# 🚀 Quick Start: VSCode ↔ Web Dashboard Sync Testing

**2-Minute Setup Guide**

---

## 1. Start Development Environment

```bash
# Option A: Use the startup script (recommended)
bash scripts/start-dev-with-vscode.sh

# Option B: Manual start
PORT=3001 npm run dev
```

This starts the web dashboard on **http://localhost:3001**

---

## 2. Reload VSCode Extension

**Quick Method** (30 seconds):

```
1. Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux)
2. Type: "reload"
3. Select: "Developer: Reload Window"
4. Press Enter
```

**Verify Extension Loaded**:
- Look for "🖖 Alex AI" in the status bar
- Alex AI panel should appear in sidebar

---

## 3. Open Split Screen

**Recommended Layout**:

```
┌─────────────────────┬─────────────────────┐
│                     │                     │
│   VSCode            │   Browser           │
│                     │                     │
│   - Alex AI panel   │   localhost:3001    │
│   - Project tree    │   - Project list    │
│   - Chat            │   - Crew dashboard  │
│                     │                     │
└─────────────────────┴─────────────────────┘
```

1. **Left**: VSCode with your project open
2. **Right**: Browser at http://localhost:3001

---

## 4. Test Sync (5 Minutes)

### Test 1: Create Project in Web → See in VSCode

**Web Dashboard**:
```
1. Go to http://localhost:3001/projects/new
2. Name: "Sync Test"
3. Category: "ddd-web-architecture"
4. Click "Create"
```

**VSCode**:
```
1. Reload window (Cmd+Shift+P → "reload")
2. Open Alex AI panel
3. ✅ Should see "Sync Test" project
```

### Test 2: Chat in VSCode → Verify API

**VSCode**:
```
1. Open Alex AI Chat panel
2. Select "Commander Riker"
3. Message: "List our current projects"
4. Wait for response
```

**Browser**:
```
1. Open DevTools (F12)
2. Network tab
3. ✅ Should see POST to /api/ask
```

### Test 3: View Same Data

**Both Interfaces**:
```
VSCode: Open data/projects.json
Web: Navigate to /projects

✅ Should show same projects
```

---

## 5. Verify Communication

### Check VSCode → Web API

**VSCode Output Panel**:
```
View → Output → Select "Alex AI Extension"
Look for: "Calling API: http://localhost:3001/api/..."
```

### Check Web → Data

**Browser DevTools**:
```
F12 → Network tab
Look for:
- GET /api/projects
- POST /api/ask
- etc.
```

---

## Troubleshooting

### ❌ "Connection Refused"

**Fix**:
```bash
# Verify server running
lsof -i :3001

# If not, start it
PORT=3001 npm run dev
```

### ❌ "Projects Not Syncing"

**Fix**:
```
1. Reload VSCode window (Cmd+Shift+P → "reload")
2. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
3. Check data/projects.json exists
```

### ❌ "Extension Not Loading"

**Fix**:
```bash
# Rebuild extension
cd vscode-extension
npm run compile

# Then reload VSCode window
```

---

## What to Look For

### ✅ Working Sync

- VSCode extension shows "🖖 Alex AI" in status bar
- Web dashboard loads at localhost:3001
- Creating project in web appears in VSCode (after reload)
- Chat in VSCode triggers API calls
- Both interfaces read same data/projects.json

### ❌ Not Working

- Port 3001 not accessible
- VSCode shows "API connection failed"
- Projects don't match between interfaces
- No API calls in browser Network tab

---

## Next Steps

Once basic sync is working:

1. **Test All Features** - Follow full guide in [docs/VSCODE_WEB_SYNC_TESTING.md](docs/VSCODE_WEB_SYNC_TESTING.md)
2. **Implement Real-Time** - Add Supabase Realtime subscriptions (Phase 6)
3. **Add RBAC** - Integrate authentication and permissions (Phase 2-5)

---

## Complete Documentation

- **Full Testing Guide**: [docs/VSCODE_WEB_SYNC_TESTING.md](docs/VSCODE_WEB_SYNC_TESTING.md)
- **RBAC Architecture**: [docs/RBAC_ARCHITECTURE.md](docs/RBAC_ARCHITECTURE.md)
- **Secrets Management**: [docs/SECRETS_MANAGEMENT.md](docs/SECRETS_MANAGEMENT.md)

---

**Quick Reference**:

| Action | Command |
|--------|---------|
| Start web | `PORT=3001 npm run dev` |
| Reload VSCode | `Cmd+Shift+P` → "reload" |
| Rebuild extension | `cd vscode-extension && npm run compile` |
| Check API | Browser F12 → Network tab |
| View projects | `cat data/projects.json \| jq '.projects'` |

---

**Time**: ~7 minutes total
**Difficulty**: Easy
**Prerequisites**: Node.js, npm, VSCode installed
