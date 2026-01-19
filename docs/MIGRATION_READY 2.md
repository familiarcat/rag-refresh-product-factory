# 🚀 Supabase Migration Ready - Complete Ownership Tracking

## ✅ What's Ready

1. **Migration SQL**: 636 lines, copied to clipboard
2. **Supabase Dashboard**: Opening in browser
3. **Verification Script**: `scripts/verify-schema.sh` ready
4. **Dev Server**: Running on port 3001 (PID 62230)

## 📋 Migration Steps (2 minutes)

### Step 1: Paste & Run in Supabase Dashboard

The Supabase SQL Editor should now be open in your browser at:
`https://supabase.com/dashboard/project/rpkkkbufdwxmjaerbhbn/sql/new`

**Actions**:
1. Paste the SQL (already in clipboard - Cmd+V)
2. Click "Run" button
3. Wait ~15-20 seconds for completion
4. Look for "Success" message

### Step 2: Verify Schema

```bash
# Quick verification
curl http://localhost:3001/api/dev/test-auth | jq '.'

# Should return database info with tables list
```

### Step 3: Generate Test API Key

```bash
# Create API key for testing
curl "http://localhost:3001/api/dev/test-auth?action=create-api-key&email=dev1@example.com" | jq '.'

# Save the returned API key
export ALEX_API_KEY="alex_..."
```

### Step 4: Test RBAC System

```bash
# Test projects API with authentication
curl -H "Authorization: Bearer $ALEX_API_KEY" \
  http://localhost:3001/api/projects | jq '.'

# Should return projects list (may be empty initially)
```

## 🎯 What This Migration Provides

### Complete Ownership Tracking

Every piece of data has proper ownership attribution:

| Table | Ownership Columns | Purpose |
|-------|------------------|---------|
| `projects` | `owner_id`, `created_by` | Who owns and created the project |
| `files` | `owner_id`, `project_id` | File ownership and project association |
| `crew_missions` | `created_by`, `project_id` | Mission creator and project context |
| `sitemaps` | `created_by`, `project_id` | Sitemap ownership and association |
| `recommendations` | `created_by`, `project_id`, `crew_member` | Who created, context, and which crew member |
| `api_keys` | `user_id` | API key ownership |
| `sessions` | `user_id` | Session ownership |
| `audit_log` | `user_id` | Every action tracked to user |
| `project_members` | `invited_by` | Team invitation tracking |

### 15 Tables Total

1. **Auth & Users**
   - `auth_profiles` - User accounts
   - `sessions` - Active sessions
   - `api_keys` - API authentication

2. **Permissions**
   - `roles` - System roles (Administrator, Owner, Developer, Viewer)
   - `permissions` - Granular permissions
   - `role_permissions` - Role-permission mapping

3. **Projects & Teams**
   - `projects` - Project data with ownership
   - `project_members` - Team membership with invitation tracking

4. **Crew System**
   - `crew_members` - Crew member profiles (Picard, Riker, Data, etc.)
   - `crew_missions` - Task assignments with ownership

5. **Data & Content**
   - `files` - File tracking with ownership
   - `sitemaps` - Sitemap structures with ownership
   - `sitemap_nodes` - Individual sitemap nodes
   - `recommendations` - AI recommendations with attribution

6. **Auditing**
   - `audit_log` - Complete action history

### Hierarchical Permissions

```
Administrator (All permissions)
  └─ projects:*, data:*, crew:manage, settings:manage, users:manage

Owner (Project management)
  └─ projects:*, data:*, crew:manage

Developer (Build & modify)
  └─ projects:read, projects:update, data:*, crew:manage

Viewer (Read-only)
  └─ projects:read, data:read
```

### Foreign Key Relationships

All ownership columns have proper foreign key constraints:

```sql
-- Projects owned by users
owner_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE

-- Files owned by users and belong to projects
owner_id UUID NOT NULL REFERENCES auth_profiles(id) ON DELETE CASCADE
project_id TEXT REFERENCES projects(id) ON DELETE CASCADE

-- Missions created by users, assigned to crew, part of projects
created_by UUID NOT NULL REFERENCES auth_profiles(id)
assigned_to TEXT NOT NULL REFERENCES crew_members(crew_id)
project_id TEXT REFERENCES projects(id) ON DELETE CASCADE
```

### Audit Trail

Every action is tracked:
- **Who**: `user_id` references `auth_profiles(id)`
- **What**: `operation` (check_permission, create_project, etc.)
- **Where**: `entity_type` and `entity_id`
- **Context**: `metadata` JSONB with details
- **Result**: `result` (success/failure)

## 🔍 Verification Commands

```bash
# Check all tables exist
psql $DATABASE_URL -c "\dt"

# Check ownership columns
psql $DATABASE_URL -c "
  SELECT table_name, column_name, data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name IN ('owner_id', 'created_by', 'user_id', 'invited_by')
  ORDER BY table_name, column_name;
"

# Check foreign keys
psql $DATABASE_URL -c "
  SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    a.attname AS column_name,
    confrelid::regclass AS referenced_table
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
  WHERE contype = 'f'
  ORDER BY table_name, column_name;
"

# Check permissions
psql $DATABASE_URL -c "SELECT permission FROM permissions ORDER BY permission;"

# Check roles
psql $DATABASE_URL -c "SELECT role_name, description FROM roles ORDER BY role_name;"
```

## 📊 Database Schema Overview

```
auth_profiles (users)
  ├─→ projects (owner_id, created_by)
  │     ├─→ project_members (invited_by)
  │     ├─→ crew_missions (created_by)
  │     ├─→ files (owner_id)
  │     ├─→ sitemaps (created_by)
  │     │     └─→ sitemap_nodes
  │     └─→ recommendations (created_by)
  ├─→ api_keys (user_id)
  ├─→ sessions (user_id)
  └─→ audit_log (user_id)

crew_members
  └─→ crew_missions (assigned_to)
  └─→ recommendations (crew_member)

roles
  └─→ role_permissions
        └─→ permissions
```

## 🎮 What You Can Do After Migration

1. **Create Projects** with proper ownership
   ```bash
   curl -X POST http://localhost:3001/api/projects \
     -H "Authorization: Bearer $ALEX_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"name": "My Project", "description": "Test project"}'
   ```

2. **Assign Crew Missions** with creator tracking
   ```sql
   INSERT INTO crew_missions (project_id, created_by, assigned_to, title)
   VALUES ('project-123', 'user-uuid', 'data', 'Analyze codebase');
   ```

3. **Track Files** with ownership
   ```sql
   INSERT INTO files (owner_id, project_id, path, name)
   VALUES ('user-uuid', 'project-123', '/src/app.ts', 'app.ts');
   ```

4. **Import Sitemaps** with attribution
   ```sql
   INSERT INTO sitemaps (project_id, created_by, name, structure)
   VALUES ('project-123', 'user-uuid', 'WordPress Site', '{"nodes": [...]}');
   ```

5. **Query with Ownership Filters**
   ```sql
   -- Get all projects owned by user
   SELECT * FROM projects WHERE owner_id = 'user-uuid';

   -- Get all files in user's projects
   SELECT f.* FROM files f
   JOIN projects p ON f.project_id = p.id
   WHERE p.owner_id = 'user-uuid';

   -- Get all missions assigned to Data
   SELECT * FROM crew_missions WHERE assigned_to = 'data';
   ```

6. **Audit Everything**
   ```sql
   -- See all actions by user
   SELECT * FROM audit_log WHERE user_id = 'user-uuid' ORDER BY created_at DESC;

   -- See all permission checks
   SELECT * FROM audit_log WHERE operation LIKE 'check_%';
   ```

## 🔐 Security Features

1. **No RLS Policies**: Authorization handled in application middleware (more flexible)
2. **Hashed API Keys**: SHA-256 hashing, never store plaintext
3. **Cascade Deletes**: Automatic cleanup when users or projects are deleted
4. **Audit Logging**: Every permission check and action tracked
5. **Foreign Key Constraints**: Data integrity enforced at database level

## 🚦 Next Steps After Migration

1. ✅ **Migration Applied** - Verify with test-auth endpoint
2. ✅ **API Keys Working** - Generate and test authentication
3. 🔄 **Integrate Vision Client** - Add image/OCR to chat
4. 🔄 **Sitemap Integration** - Connect sitemap system to projects
5. 🔄 **Crew Missions UI** - Build mission assignment interface
6. 🔄 **UI Unification** - Sync VSCode extension with dashboard

## 🐛 Troubleshooting

### Migration Fails

**Symptom**: Error when running SQL in dashboard

**Fix**:
1. Check error message - usually indicates which table/column failed
2. Drop existing tables if schema changed:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```
3. Re-run migration

### Database Connection Fails

**Symptom**: `curl http://localhost:3001/api/dev/test-auth` returns error

**Fix**:
1. Verify environment variables:
   ```bash
   cat .env.local | grep SUPABASE
   ```
2. Test direct connection:
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

### API Keys Not Working

**Symptom**: 401 Unauthorized when using API key

**Fix**:
1. Regenerate key:
   ```bash
   curl "http://localhost:3001/api/dev/test-auth?action=create-api-key&email=test@example.com"
   ```
2. Ensure using correct header:
   ```bash
   curl -H "Authorization: Bearer alex_..." http://localhost:3001/api/projects
   ```

---

**Status**: ⏸️ Ready to paste SQL in Supabase dashboard and run!
