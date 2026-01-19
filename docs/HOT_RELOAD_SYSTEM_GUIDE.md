# Hot Reload System Guide

**Complete guide to the Alex AI hot reload system for seamless development and real-time synchronization**

---

## Overview

The hot reload system provides two main capabilities:

1. **Extension Development Hot Reload**: Automatically rebuild and reload the VSCode extension when source files change
2. **Web Dashboard Sync**: Real-time synchronization between the extension UI and the web dashboard

---

## Part 1: Extension Development Hot Reload

### Quick Start

```bash
cd vscode-extension
npm run dev:hot
```

This starts a file watcher that automatically:
- ✅ Detects changes to `.ts` files
- ✅ Recompiles TypeScript
- ✅ Packages the extension
- ✅ Notifies you to reload VS Code

### How It Works

```
┌─────────────┐
│  Edit .ts   │
│    file     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ File Watcher│  ← scripts/dev-hot-reload.js
│   Detects   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Debounce   │  ← Wait 500ms for more changes
│  (500ms)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Compile   │  ← tsc -p ./
│ TypeScript  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Package   │  ← vsce package
│  Extension  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Notify    │  ← Console message
│    User     │
└─────────────┘
```

### Output Example

```
[14:23:45] 🚀 Alex AI Extension - Hot Reload Dev Mode

[14:23:45] ℹ️  Compiling TypeScript...
[14:23:47] ✅ Compilation successful
[14:23:47] ℹ️  Packaging extension...
[14:23:50] ✅ Extension packaged
[14:23:50] ✅ Hot reload complete!

[14:23:50] ℹ️  To apply changes:
  1. Press Cmd+Shift+P in VS Code
  2. Type "Developer: Reload Window"
  3. Or run: npm run install-extension

[14:23:50] ℹ️  Watching /vscode-extension/src for changes...
[14:23:50] ✅ File watcher started

[14:25:12] File change: hotReload.ts
[14:25:12] 🔄 Rebuilding due to changes: hotReload.ts
...
```

### Configuration

**Debounce Delay**: 500ms (edit in `scripts/dev-hot-reload.js`)
```javascript
const DEBOUNCE_DELAY = 500; // ms
```

**Watched Directory**: `vscode-extension/src` (recursive)

**File Pattern**: `*.ts` files only

### Manual Reload

If you prefer manual control:

```bash
npm run dev:reload
```

This runs once without file watching.

---

## Part 2: Web Dashboard Synchronization

### Architecture

```
┌──────────────────────┐         ┌──────────────────────┐
│  Web Dashboard       │         │  VSCode Extension    │
│  (Next.js)           │         │                      │
│                      │         │                      │
│  ┌────────────────┐  │         │  ┌────────────────┐  │
│  │ Data Changes   │  │         │  │ Hot Reload     │  │
│  │ (projects.json)│  │         │  │ Manager        │  │
│  └────────┬───────┘  │         │  └────────┬───────┘  │
│           │          │         │           │          │
│           ▼          │         │           │          │
│  ┌────────────────┐  │◄────────┤  ┌────────────────┐  │
│  │ /api/updates   │  │  Poll   │  │ Poll Timer     │  │
│  │ (ETag caching) │  │  (5sec) │  │ (every 5s)     │  │
│  └────────────────┘  │─────────┼──┤                │  │
│                      │ Response│  └────────┬───────┘  │
│                      │         │           │          │
│                      │         │           ▼          │
│                      │         │  ┌────────────────┐  │
│                      │         │  │ Event Handlers │  │
│                      │         │  │ - Projects     │  │
│                      │         │  │ - Crew         │  │
│                      │         │  │ - Metrics      │  │
│                      │         │  └────────┬───────┘  │
│                      │         │           │          │
│                      │         │           ▼          │
│                      │         │  ┌────────────────┐  │
│                      │         │  │ Update UI      │  │
│                      │         │  │ (WebView)      │  │
│                      │         │  └────────────────┘  │
└──────────────────────┘         └──────────────────────┘
```

### Enabling Hot Reload

**Option 1: VS Code Settings UI**
1. Open VS Code Settings (`Cmd+,`)
2. Search for "Alex AI Hot Reload"
3. Check "Enable Hot Reload"

**Option 2: settings.json**
```json
{
  "alexAi.enableHotReload": true,
  "alexAi.hotReloadInterval": 5000
}
```

**Option 3: Workspace Settings**
```json
// .vscode/settings.json
{
  "alexAi.enableHotReload": true,
  "alexAi.baseUrl": "http://localhost:3000"
}
```

### How It Works

#### 1. Polling-Based Updates

The extension polls `GET /api/updates` every 5 seconds:

```typescript
// Extension side
const response = await fetch(`${baseUrl}/api/updates`, {
  headers: { 'If-None-Match': lastETag },
});

if (response.status === 304) {
  // No changes, skip update
  return;
}

const updates = await response.json();
// Process updates...
```

#### 2. ETag Caching

The API uses ETags to minimize bandwidth:

```typescript
// Server side
const currentETag = md5(projectsContent + crewContent + metricsContent);

if (ifNoneMatch === currentETag) {
  return 304; // Not Modified
}

return {
  changes: [...],
  etag: currentETag,
};
```

#### 3. Event Distribution

Updates are distributed to listeners:

```typescript
hotReload.on('projects_updated', (data) => {
  // Refresh projects list in webview
  panel.webview.postMessage({
    type: 'projects_updated',
    projects: data.projects,
  });
});
```

### Monitored Data Sources

| File | Update Type | Triggered When |
|------|-------------|----------------|
| `data/projects.json` | `projects_updated` | Project added/modified |
| `data/crew_memories.json` | `crew_updated` | Crew memory added |
| `data/deploy-metrics.json` | `metrics_updated` | Deployment occurs |
| `data/collaboration_log.json` | `data_updated` | Crew collaborates |

### Manual Refresh

Trigger an immediate refresh:

```typescript
// Command palette: "Alex AI: Refresh from Dashboard"
await hotReload.refreshNow();
```

### Connection Status

Check hot reload status:

```typescript
const status = hotReload.getStatus();
// {
//   enabled: true,
//   connected: true,
//   method: 'polling',
//   reconnectAttempts: 0
// }
```

---

## Part 3: API Reference

### Extension API

#### `HotReloadManager`

**Constructor**
```typescript
const hotReload = new HotReloadManager(context);
```

**Methods**

```typescript
// Enable hot reload
hotReload.enable();

// Disable hot reload
hotReload.disable();

// Subscribe to update type
const disposable = hotReload.on('projects_updated', (data) => {
  console.log('Projects updated:', data);
});

// Unsubscribe
disposable.dispose();

// Manual refresh
await hotReload.refreshNow();

// Get status
const status = hotReload.getStatus();
```

**Events**

| Event Type | Data | Description |
|------------|------|-------------|
| `projects_updated` | `{ projects: [], count: number }` | Projects changed |
| `crew_updated` | `{ memories: [], count: number }` | Crew memories changed |
| `metrics_updated` | `{ ... }` | Deployment metrics changed |
| `*` | `{ type: string, data: any }` | All events (wildcard) |

### Web API

#### `GET /api/updates`

**Request**
```http
GET /api/updates HTTP/1.1
Host: rag.pbradygeorgen.com
If-None-Match: "abc123def456"
```

**Response (200 OK)**
```json
{
  "changes": [
    {
      "type": "projects_updated",
      "data": {
        "projects": [...],
        "count": 8
      },
      "timestamp": 1735420800000
    }
  ],
  "timestamp": 1735420800000,
  "etag": "xyz789abc123"
}
```

**Response (304 Not Modified)**
```http
HTTP/1.1 304 Not Modified
ETag: "abc123def456"
Cache-Control: no-cache
```

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `force` | boolean | Force update even if ETag matches |

**Headers**

| Header | Direction | Description |
|--------|-----------|-------------|
| `If-None-Match` | Request | ETag from previous response |
| `ETag` | Response | Current content hash |
| `Cache-Control` | Response | `no-cache, must-revalidate` |

---

## Part 4: Development Workflow

### Recommended Setup

**Terminal 1: Web Dashboard**
```bash
cd rag-refresh-product-factory
npm run dev
# Running on http://localhost:3000
```

**Terminal 2: Extension Hot Reload**
```bash
cd vscode-extension
npm run dev:hot
# Watching for file changes...
```

**VS Code**
- Enable hot reload in settings
- Edit extension source files
- Auto-reload when prompted
- See updates from web dashboard in real-time

### Example Workflow

1. **Start development servers**
   ```bash
   # Terminal 1
   npm run dev

   # Terminal 2
   cd vscode-extension && npm run dev:hot
   ```

2. **Enable hot reload in VS Code**
   ```json
   {
     "alexAi.enableHotReload": true,
     "alexAi.baseUrl": "http://localhost:3000"
   }
   ```

3. **Make changes**
   - Edit `vscode-extension/src/chatView.ts`
   - File watcher detects change
   - Auto-recompiles and packages

4. **Reload extension**
   - Press `Cmd+Shift+P`
   - Type "Developer: Reload Window"
   - Extension reloads with your changes

5. **See live updates**
   - Add a project in web dashboard
   - Extension UI updates automatically (within 5s)
   - No manual refresh needed!

### Troubleshooting

#### Extension not reloading

**Check compilation**:
```bash
cd vscode-extension
npm run compile
```

Look for TypeScript errors.

**Reinstall extension**:
```bash
npm run dev:reload
```

**Check VS Code output**:
- Open "Output" panel
- Select "Alex AI" channel
- Look for errors

#### Hot reload not connecting

**Check base URL**:
```json
{
  "alexAi.baseUrl": "http://localhost:3000" // ← Must match dev server
}
```

**Verify API endpoint**:
```bash
curl http://localhost:3000/api/updates
```

Should return JSON with `changes` array.

**Check CORS**:
The API includes CORS headers:
```typescript
'Access-Control-Allow-Origin': '*'
```

If still issues, check browser console in webview.

#### Polling too frequent

**Adjust interval**:
```json
{
  "alexAi.hotReloadInterval": 10000 // 10 seconds
}
```

**Disable when not needed**:
```json
{
  "alexAi.enableHotReload": false
}
```

---

## Part 5: Best Practices

### Development

✅ **DO**:
- Enable hot reload only during development
- Use `http://localhost:3000` as base URL in dev
- Keep polling interval reasonable (5-10 seconds)
- Watch console for hot reload status messages
- Commit generated `.vsix` files to test across machines

❌ **DON'T**:
- Enable hot reload in production deployments
- Set polling interval below 1 second
- Ignore TypeScript compilation errors
- Edit files while compilation is running

### Production

✅ **DO**:
- Disable hot reload in production settings
- Use production URL (`https://rag.pbradygeorgen.com`)
- Package extension with `npm run package`
- Test extension before distributing

❌ **DON'T**:
- Ship extension with hot reload enabled by default
- Hardcode development URLs
- Skip version increments in `package.json`

### Performance

**Polling Interval Guidelines**:
- **Development**: 5 seconds (responsive, low overhead)
- **Staging**: 10 seconds (balanced)
- **Production**: Disabled (use manual refresh)

**Network Usage**:
- ETag caching reduces bandwidth significantly
- 304 responses are ~100 bytes
- 200 responses are ~1-5 KB
- At 5s interval: ~12-60 KB/minute worst case

---

## Part 6: Advanced Usage

### Custom Event Handlers

```typescript
// In extension code
import { HotReloadManager } from './hotReload';

const hotReload = new HotReloadManager(context);

// Listen for specific updates
hotReload.on('projects_updated', async (data) => {
  // Refresh project list in UI
  await refreshProjectsList(data.projects);

  // Show notification
  vscode.window.showInformationMessage(
    `Projects updated: ${data.count} total`
  );
});

// Listen for all updates
hotReload.on('*', ({ type, data }) => {
  console.log(`Update received: ${type}`, data);

  // Update status bar
  statusBarItem.text = `$(sync~spin) Syncing...`;
  setTimeout(() => {
    statusBarItem.text = `$(check) Synced`;
  }, 1000);
});
```

### Conditional Hot Reload

```typescript
// Only enable in specific workspaces
const isDevWorkspace = vscode.workspace.workspaceFolders?.some(
  folder => folder.name === 'rag-refresh-product-factory'
);

if (isDevWorkspace) {
  hotReload.enable();
}
```

### Manual Polling Control

```typescript
// Pause polling temporarily
hotReload.disable();

// Perform expensive operation
await performHeavyTask();

// Resume polling
hotReload.enable();
```

---

## Part 7: Integration Examples

### Example 1: Project Panel Auto-Update

```typescript
// vscode-extension/src/alexPanel.ts

private hotReload: HotReloadManager;

constructor(context: vscode.ExtensionContext) {
  this.hotReload = new HotReloadManager(context);

  // Subscribe to project updates
  context.subscriptions.push(
    this.hotReload.on('projects_updated', (data) => {
      // Update webview
      this._panel.webview.postMessage({
        type: 'projects',
        projects: data.projects,
      });
    })
  );

  this.hotReload.enable();
}
```

### Example 2: Status Bar Indicator

```typescript
// Show connection status in status bar
const statusBar = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Right,
  100
);

function updateStatusBar() {
  const status = hotReload.getStatus();

  if (status.enabled && status.connected) {
    statusBar.text = '$(radio-tower) Alex AI: Connected';
    statusBar.tooltip = `Polling ${status.method} every 5s`;
    statusBar.backgroundColor = undefined;
  } else if (status.enabled) {
    statusBar.text = '$(warning) Alex AI: Reconnecting...';
    statusBar.tooltip = `Attempt ${status.reconnectAttempts}`;
    statusBar.backgroundColor = new vscode.ThemeColor(
      'statusBarItem.warningBackground'
    );
  } else {
    statusBar.text = '$(circle-slash) Alex AI: Offline';
    statusBar.tooltip = 'Hot reload disabled';
    statusBar.backgroundColor = undefined;
  }

  statusBar.show();
}

// Update every second
setInterval(updateStatusBar, 1000);
```

### Example 3: Notification on Changes

```typescript
hotReload.on('*', ({ type, data }) => {
  // Show notification for important changes
  if (type === 'projects_updated' && data.count > 0) {
    vscode.window.showInformationMessage(
      `${data.count} project(s) updated`,
      'View Projects'
    ).then(action => {
      if (action === 'View Projects') {
        vscode.commands.executeCommand('alexAi.openPanel');
      }
    });
  }
});
```

---

## Conclusion

The hot reload system provides a seamless development experience with:

✅ **Automatic extension rebuilding** - No manual compilation needed
✅ **Real-time web sync** - Extension UI updates with web changes
✅ **Efficient polling** - ETag caching minimizes bandwidth
✅ **Configurable** - Adjust intervals and enable/disable as needed
✅ **Production-safe** - Disabled by default, dev-only feature

**Start developing**:
```bash
npm run dev:hot
```

**Enable sync**:
```json
{ "alexAi.enableHotReload": true }
```

Happy coding! 🚀
