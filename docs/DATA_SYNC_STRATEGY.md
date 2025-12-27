# Data Synchronization Strategy

**Keeping VSCode Extension and Web Dashboard in perfect sync**

---

## Overview

Alex AI uses a **centralized data store** approach where the web dashboard acts as the source of truth, and the VSCode extension syncs via HTTP API.

```
┌────────────────────────────────────────────────────────┐
│              Centralized Data Architecture              │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐                ┌──────────────┐     │
│  │   VSCode     │    REST API    │     Web      │     │
│  │  Extension   │◄──────────────►│  Dashboard   │     │
│  │              │                │              │     │
│  │  - UI Only   │                │  - API       │     │
│  │  - Transient │                │  - Storage   │     │
│  └──────────────┘                └──────┬───────┘     │
│                                          │             │
│                                   ┌──────▼───────┐    │
│                                   │  data/*.json │    │
│                                   │              │    │
│                                   │  - projects  │    │
│                                   │  - memories  │    │
│                                   │  - logs      │    │
│                                   └──────────────┘    │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Key Principle:** Extension never writes to disk directly—all mutations go through API.

---

## Data Files

### Primary Data Files

Located in `data/` directory:

```bash
data/
├── projects.json              # Project definitions (35KB)
├── crew_memories.json         # Crew learning history (60KB)
├── collaboration_log.json     # Collaboration events (7B)
├── deploy-metrics.json        # Deployment analytics (7B)
├── events.json                # System events (6KB)
├── llm-cost-database.json     # Model pricing (10KB)
├── model-policy.json          # Model selection rules (650B)
├── user_notes.json            # User annotations (3B)
├── feedback.json              # User feedback (3B)
└── python-allowlist.json      # Python security config (1.5KB)
```

### File Ownership

| File | Owner | Access Pattern |
|------|-------|----------------|
| `projects.json` | Web Dashboard | Read: Both, Write: Both via API |
| `crew_memories.json` | Web Dashboard | Read: Both, Write: Dashboard only |
| `collaboration_log.json` | Web Dashboard | Append: Dashboard, Read: Both |
| `deploy-metrics.json` | Web Dashboard | Append: Deployment scripts |
| `events.json` | Web Dashboard | Append: Dashboard |

---

## Sync Mechanisms

### 1. Pull-Based Sync (Read Operations)

Extension fetches latest data from API on demand.

**When extension needs data:**

```typescript
// vscode-extension/src/chatView.ts

async function fetchProjects(): Promise<Project[]> {
  const baseUrl = vscode.workspace.getConfiguration('alexAi').get<string>('baseUrl');

  const response = await fetch(`${baseUrl}/api/projects`);
  if (!response.ok) throw new Error('Failed to fetch projects');

  const data = await response.json();
  return data;
}

// Triggered by:
// - Opening chat panel
// - User clicks "Refresh"
// - Auto-refresh every 5 minutes (optional)
```

**API reads from disk:**

```typescript
// app/api/projects/route.ts

export async function GET(request: NextRequest) {
  const projectsPath = path.join(process.cwd(), 'data', 'projects.json');
  const content = await fs.readFile(projectsPath, 'utf-8');
  const projects = JSON.parse(content);

  return NextResponse.json(projects);
}
```

**Advantages:**
- Simple implementation
- No cache invalidation needed
- Always fresh data
- No local storage in extension

**Trade-offs:**
- Requires network on every read
- Slightly higher latency (~50-200ms)

### 2. Push-Based Sync (Write Operations)

Extension sends mutations to API, which updates disk.

**When extension modifies data:**

```typescript
// vscode-extension/src/chatView.ts

async function createProject(project: Partial<Project>): Promise<Project> {
  const baseUrl = vscode.workspace.getConfiguration('alexAi').get<string>('baseUrl');

  const response = await fetch(`${baseUrl}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });

  if (!response.ok) throw new Error('Failed to create project');

  const { project: created } = await response.json();
  return created;
}
```

**API writes to disk:**

```typescript
// app/api/projects/route.ts

export async function POST(request: NextRequest) {
  const projectsPath = path.join(process.cwd(), 'data', 'projects.json');

  // Read existing
  const content = await fs.readFile(projectsPath, 'utf-8');
  const projects = JSON.parse(content);

  // Create new
  const newProject = await request.json();
  newProject.id = `proj_${Date.now()}`;
  newProject.createdAt = new Date().toISOString();

  projects.push(newProject);

  // Write atomically
  await fs.writeFile(projectsPath, JSON.stringify(projects, null, 2));

  return NextResponse.json({ success: true, project: newProject });
}
```

**Advantages:**
- Centralized validation
- Atomic writes
- Audit trail in API logs
- Consistent state

**Trade-offs:**
- Requires API availability
- Network overhead on writes

### 3. Event-Driven Updates (Future Enhancement)

For real-time sync across multiple clients.

**Architecture:**

```
Extension A                  Extension B
     │                            │
     │   WebSocket                │
     └────────►┌──────────┐◄──────┘
                │ Socket.IO│
                │  Server  │
                └────┬─────┘
                     │
              ┌──────▼──────┐
              │  data/*.json│
              └─────────────┘
```

**Implementation (not yet done):**

```typescript
// Future: Real-time sync via WebSocket

// Server (app/api/socket/route.ts)
io.on('connection', (socket) => {
  socket.on('project:update', (project) => {
    // Update data file
    updateProject(project);

    // Broadcast to all clients
    socket.broadcast.emit('project:updated', project);
  });
});

// Client (extension)
const socket = io(baseUrl);
socket.on('project:updated', (project) => {
  // Update UI in real-time
  refreshProjectList(project);
});
```

---

## Conflict Resolution

### Scenario 1: Concurrent Writes

**Problem:** Two clients modify the same project simultaneously.

**Solution: Last-Write-Wins with Timestamps**

```typescript
interface Project {
  id: string;
  name: string;
  updatedAt: string;  // ISO timestamp
  version: number;    // Increment on each update
}

// API enforces versioning
export async function PUT(request: NextRequest) {
  const { id, version, ...updates } = await request.json();

  const projects = await readProjects();
  const existing = projects.find(p => p.id === id);

  // Optimistic concurrency control
  if (existing.version !== version) {
    return NextResponse.json(
      { error: 'Version conflict', latest: existing },
      { status: 409 }
    );
  }

  existing.version += 1;
  existing.updatedAt = new Date().toISOString();
  Object.assign(existing, updates);

  await writeProjects(projects);
  return NextResponse.json({ success: true, project: existing });
}
```

**Extension handling:**

```typescript
async function updateProject(project: Project): Promise<Project> {
  try {
    return await apiUpdateProject(project);
  } catch (error) {
    if (error.status === 409) {
      // Conflict: show merge UI
      const choice = await vscode.window.showWarningMessage(
        'Project was modified on server. Overwrite or reload?',
        'Overwrite', 'Reload'
      );

      if (choice === 'Overwrite') {
        // Force update (increment version)
        project.version = error.latest.version;
        return await apiUpdateProject(project);
      } else {
        // Discard local changes
        return error.latest;
      }
    }
    throw error;
  }
}
```

### Scenario 2: Network Interruption

**Problem:** Extension offline, user makes changes.

**Solution: Queue + Retry with Exponential Backoff**

```typescript
class SyncQueue {
  private queue: Array<{ operation: 'create' | 'update' | 'delete', data: any }> = [];

  async enqueue(operation: string, data: any): Promise<void> {
    this.queue.push({ operation, data });

    // Try immediate sync
    await this.processQueue();
  }

  async processQueue(): Promise<void> {
    while (this.queue.length > 0) {
      const item = this.queue[0];

      try {
        await this.syncToServer(item);
        this.queue.shift(); // Remove on success
      } catch (error) {
        // Network error: keep in queue, retry later
        console.error('Sync failed, will retry:', error);

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 2 ** this.queue.length * 1000));
        break;
      }
    }
  }

  private async syncToServer(item: any): Promise<void> {
    const baseUrl = vscode.workspace.getConfiguration('alexAi').get<string>('baseUrl');

    await fetch(`${baseUrl}/api/projects`, {
      method: item.operation === 'create' ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item.data),
    });
  }
}
```

**Show sync status in UI:**

```typescript
// Extension status bar
const syncStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
syncStatus.text = "$(sync) Alex AI";
syncStatus.tooltip = "Synced with server";

// When queued
syncStatus.text = "$(sync~spin) Alex AI (syncing)";
syncStatus.tooltip = `${queue.length} changes pending`;

// When offline
syncStatus.text = "$(cloud-offline) Alex AI (offline)";
syncStatus.tooltip = "Cannot connect to server";
```

### Scenario 3: Data Corruption

**Problem:** JSON file gets corrupted on server.

**Solution: Atomic Writes + Backup**

```typescript
import { writeFile, rename, copyFile } from 'fs/promises';

async function safeWriteProjects(projects: Project[]): Promise<void> {
  const projectsPath = path.join(process.cwd(), 'data', 'projects.json');
  const tempPath = `${projectsPath}.tmp`;
  const backupPath = `${projectsPath}.backup`;

  // 1. Backup current version
  try {
    await copyFile(projectsPath, backupPath);
  } catch (error) {
    // First write, no backup needed
  }

  // 2. Write to temp file
  await writeFile(tempPath, JSON.stringify(projects, null, 2));

  // 3. Atomic rename (replaces original)
  await rename(tempPath, projectsPath);

  // Old backup is kept (max 1 backup)
}

// Recovery endpoint
export async function POST(request: NextRequest) {
  const { file } = await request.json();

  if (file === 'projects') {
    const backupPath = path.join(process.cwd(), 'data', 'projects.json.backup');
    const projectsPath = path.join(process.cwd(), 'data', 'projects.json');

    await copyFile(backupPath, projectsPath);

    return NextResponse.json({ success: true, message: 'Restored from backup' });
  }

  return NextResponse.json({ error: 'Unknown file' }, { status: 400 });
}
```

---

## Production Best Practices

### 1. Use Docker Volumes for Data Persistence

**Problem:** Data lost when container is removed.

**Solution:**

```bash
# Create persistent volume
docker volume create alex-ai-data

# Run with volume
docker run -d \
  --name rag-app \
  -p 3000:3000 \
  -v alex-ai-data:/app/data \
  --restart always \
  <image>

# Data survives deployments
docker stop rag-app
docker rm rag-app
docker run -d --name rag-app -v alex-ai-data:/app/data <new-image>
```

**Update deployment script:**

```bash
# scripts/deploy-app.sh

# Before: Ephemeral storage
docker run -d --name rag-app -p 3000:3000 --restart always ${FULL_IMAGE}

# After: Persistent volume
docker run -d --name rag-app -p 3000:3000 \
  -v alex-ai-data:/app/data \
  --restart always ${FULL_IMAGE}
```

### 2. Implement Automated Backups

**Daily backups to S3:**

```bash
#!/bin/bash
# scripts/backup-data.sh

# Copy data from container
docker cp rag-app:/app/data ./tmp-backup-$(date +%Y%m%d)

# Upload to S3
aws s3 sync ./tmp-backup-$(date +%Y%m%d) \
  s3://alex-ai-backups/$(date +%Y%m%d)/ \
  --region us-east-2

# Clean up
rm -rf ./tmp-backup-*

echo "Backup complete: s3://alex-ai-backups/$(date +%Y%m%d)/"
```

**Schedule via cron:**

```bash
# On EC2: sudo crontab -e
0 2 * * * /home/ec2-user/scripts/backup-data.sh >> /var/log/alex-ai-backup.log 2>&1
```

### 3. Add Sync Health Monitoring

**API endpoint for sync health:**

```typescript
// app/api/sync/health/route.ts

export async function GET(request: NextRequest) {
  const checks = {
    projectsFile: await checkFileHealth('data/projects.json'),
    memoriesFile: await checkFileHealth('data/crew_memories.json'),
    lastBackup: await getLastBackupTime(),
    diskSpace: await getDiskSpace(),
  };

  const healthy = Object.values(checks).every(c => c.status === 'ok');

  return NextResponse.json({
    healthy,
    checks,
    timestamp: new Date().toISOString(),
  });
}

async function checkFileHealth(filePath: string) {
  try {
    const stats = await fs.stat(filePath);
    const content = await fs.readFile(filePath, 'utf-8');
    JSON.parse(content); // Validate JSON

    return {
      status: 'ok',
      size: stats.size,
      modified: stats.mtime,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
    };
  }
}
```

**Extension checks health on startup:**

```typescript
async function checkSyncHealth(): Promise<void> {
  const baseUrl = vscode.workspace.getConfiguration('alexAi').get<string>('baseUrl');

  try {
    const response = await fetch(`${baseUrl}/api/sync/health`);
    const { healthy, checks } = await response.json();

    if (!healthy) {
      vscode.window.showWarningMessage(
        'Alex AI data sync issues detected. Some features may not work correctly.',
        'View Details'
      ).then(action => {
        if (action === 'View Details') {
          // Show detailed error panel
        }
      });
    }
  } catch (error) {
    // API unreachable
    vscode.window.showErrorMessage(
      `Cannot connect to Alex AI server at ${baseUrl}. Check your settings.`
    );
  }
}
```

### 4. Extension Configuration Best Practices

**Default to production URL:**

```json
// vscode-extension/package.json

"configuration": {
  "properties": {
    "alexAi.baseUrl": {
      "type": "string",
      "default": "https://rag.pbradygeorgen.com",  // Production by default
      "markdownDescription": "Base URL for Alex AI API.\n\n- Production: `https://rag.pbradygeorgen.com`\n- Local dev: `http://localhost:3000`"
    }
  }
}
```

**Auto-detect environment:**

```typescript
function getApiBaseUrl(): string {
  const config = vscode.workspace.getConfiguration('alexAi');
  const configuredUrl = config.get<string>('baseUrl');

  // User explicitly configured
  if (configuredUrl && configuredUrl !== 'auto') {
    return configuredUrl;
  }

  // Auto-detect
  const isDevelopment = process.env.VSCODE_DEBUG_MODE === 'true';
  return isDevelopment
    ? 'http://localhost:3000'
    : 'https://rag.pbradygeorgen.com';
}
```

---

## Migration Guide

### From Local-Only to API-Based Sync

If you previously had extension reading local files:

**Old approach (deprecated):**

```typescript
// ❌ Don't do this
const projectsPath = path.join(vscode.workspace.rootPath, 'data', 'projects.json');
const content = fs.readFileSync(projectsPath, 'utf-8');
const projects = JSON.parse(content);
```

**New approach:**

```typescript
// ✅ Do this
const baseUrl = vscode.workspace.getConfiguration('alexAi').get<string>('baseUrl');
const response = await fetch(`${baseUrl}/api/projects`);
const projects = await response.json();
```

**Migration steps:**

1. Update extension code to use API
2. Test with local API (`http://localhost:3000`)
3. Update `alexAi.baseUrl` to production
4. Remove any file system dependencies
5. Package and reinstall extension

---

## Testing Sync

### Test Checklist

**Setup:**
- [ ] Web dashboard deployed to production
- [ ] Extension installed and configured with `baseUrl`
- [ ] OpenRouter API key configured in both

**Read Operations:**
- [ ] Fetch projects: Extension displays project list from API
- [ ] Fetch memories: Crew chat shows previous conversations
- [ ] Fetch collaboration logs: History view shows past work

**Write Operations:**
- [ ] Create project: New project appears in both extension and web UI
- [ ] Update project: Changes in extension reflect in web UI
- [ ] Delete project: Removal in web UI removes from extension

**Error Handling:**
- [ ] Offline mode: Extension shows helpful error
- [ ] Version conflict: Extension prompts for resolution
- [ ] Corrupted data: API returns backup or error

**Performance:**
- [ ] Project load time: <500ms
- [ ] Create/update latency: <1s
- [ ] Large dataset (100+ projects): No UI freezing

### Automated Tests

```typescript
// test/sync.test.ts

describe('Data Synchronization', () => {
  it('should fetch projects from API', async () => {
    const projects = await fetchProjects();
    expect(projects).toBeInstanceOf(Array);
    expect(projects.length).toBeGreaterThan(0);
  });

  it('should create project via API', async () => {
    const newProject = {
      name: 'Test Project',
      description: 'Sync test',
      domains: [],
    };

    const created = await createProject(newProject);
    expect(created.id).toBeDefined();
    expect(created.name).toBe('Test Project');
  });

  it('should handle version conflicts', async () => {
    const project = await fetchProject('proj_123');

    // Simulate concurrent update on server
    await updateProjectOnServer(project.id, { name: 'Changed' });

    // Try to update with stale version
    project.name = 'My Change';

    await expect(updateProject(project)).rejects.toThrow('Version conflict');
  });
});
```

---

## Monitoring

### Metrics to Track

```typescript
// Track sync performance
interface SyncMetrics {
  operation: 'read' | 'write';
  endpoint: string;
  duration: number;
  success: boolean;
  error?: string;
  timestamp: string;
}

// Example
{
  operation: 'read',
  endpoint: '/api/projects',
  duration: 127,  // ms
  success: true,
  timestamp: '2025-12-27T12:00:00Z'
}
```

**Dashboard:**

```typescript
// app/api/sync/metrics/route.ts

export async function GET(request: NextRequest) {
  const metrics = await getSyncMetrics();

  return NextResponse.json({
    totalRequests: metrics.length,
    successRate: metrics.filter(m => m.success).length / metrics.length,
    avgDuration: average(metrics.map(m => m.duration)),
    errorRate: metrics.filter(m => !m.success).length / metrics.length,
    byOperation: groupBy(metrics, 'operation'),
  });
}
```

---

## Future Enhancements

### 1. Offline Mode with Local Cache

```typescript
// Extension caches data locally
const cache = vscode.workspace.getConfiguration('alexAi').get('cache');

// On fetch
const projects = await fetchProjects();
cache.set('projects', projects, { ttl: 300000 }); // 5 min

// On offline
if (isOffline) {
  const cached = cache.get('projects');
  if (cached) return cached;
  throw new Error('Offline and no cache available');
}
```

### 2. Real-Time WebSocket Sync

```typescript
// Server broadcasts changes
io.emit('project:updated', project);

// Extension listens and updates UI
socket.on('project:updated', (project) => {
  updateProjectInUI(project);
});
```

### 3. Conflict-Free Replicated Data Types (CRDTs)

For eventual consistency without conflicts:

```typescript
import { Automerge } from 'automerge';

// Each client has own replica
let doc = Automerge.init();

// Make changes locally
doc = Automerge.change(doc, doc => {
  doc.projects.push(newProject);
});

// Merge with server
const serverDoc = await fetchServerDoc();
doc = Automerge.merge(doc, serverDoc);

// No conflicts!
```

---

**Data sync complete! Extension and web dashboard are now perfectly synchronized.** 🔄
