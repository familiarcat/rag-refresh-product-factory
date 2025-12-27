# Alex AI Supabase RBAC Database

Complete Role-Based Access Control (RBAC) system for Alex AI with hierarchical permissions, authentication abstraction, and VSCode-Web synchronization.

## Overview

This database schema implements a comprehensive RBAC system with:

- **4-tier role hierarchy**: Administrator → Project Owner → Developer → Viewer
- **18+ granular permissions** across system, project, crew, and code categories
- **Multi-project access** with different roles per project
- **Row Level Security (RLS)** for data isolation
- **Audit logging** for all permission checks and actions
- **API key authentication** for VSCode extension
- **Session management** for web dashboard
- **Mock test data** with 6 control cases for validation

## Quick Start

### Prerequisites

1. **Supabase Account**: Create account at https://supabase.com
2. **Supabase CLI** (optional but recommended):
   ```bash
   npm install -g supabase
   ```
3. **Project Setup**: Create new Supabase project or use existing

### Option 1: Apply Migrations via Supabase Dashboard

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy contents of `migrations/001_rbac_schema.sql`
4. Paste and run in SQL Editor
5. Copy contents of `migrations/002_seed_test_data.sql`
6. Paste and run in SQL Editor
7. Verify tables created:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

### Option 2: Apply Migrations via Supabase CLI

1. **Initialize Supabase locally** (if not done):
   ```bash
   cd /Users/bradygeorgen/Documents/workspace/rag-refresh-product-factory
   supabase init
   ```

2. **Link to remote project**:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. **Apply migrations**:
   ```bash
   supabase db push
   ```

4. **Verify migrations**:
   ```bash
   supabase db diff
   ```

### Option 3: Apply via npm script

```bash
cd /Users/bradygeorgen/Documents/workspace/rag-refresh-product-factory
npm run db:migrate
npm run db:seed
```

## Database Schema

### Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `auth_profiles` | Extended user profiles | System-wide role assignment |
| `projects` | Project metadata | Owner reference, category |
| `roles` | Role definitions | Hierarchy level, capabilities JSON |
| `permissions` | Permission catalog | Categorized by system/project/crew/code |
| `project_members` | User-project associations | Project-specific roles |
| `audit_log` | Action tracking | Permission check results |
| `api_keys` | VSCode extension auth | Scoped API keys with expiration |
| `sessions` | Web dashboard auth | Cookie-based sessions |

### Role Hierarchy

```
Administrator (Level 100)
├─ System: Manage users, roles, audit logs, configuration
├─ Projects: Create, delete, configure, read, write
├─ Crew: Chat, invoke
└─ Code: Read, write, execute

Project Owner (Level 75)
├─ Projects: Create, configure, read, write, invite/manage members
├─ Crew: Chat, invoke
└─ Code: Read, write, execute

Developer (Level 50)
├─ Projects: Read, write
├─ Crew: Chat, invoke
└─ Code: Read, write, execute

Viewer (Level 25)
├─ Projects: Read
├─ Crew: Chat
└─ Code: Read
```

### Permission Categories

**System** (Administrator only):
- `system:manage_users` - Create, edit, delete users
- `system:manage_roles` - Modify role definitions
- `system:view_audit_logs` - View all audit logs
- `system:configure` - System-wide settings

**Project**:
- `project:create` - Create new projects
- `project:delete` - Delete projects (Admin only)
- `project:configure` - Modify project settings
- `project:read` - View project data
- `project:write` - Edit project data
- `project:invite_members` - Invite users (Owner+)
- `project:manage_members` - Manage member roles (Owner+)

**Crew**:
- `crew:chat` - Chat with AI crew members
- `crew:invoke` - Invoke crew actions

**Code**:
- `code:read` - Read files
- `code:write` - Edit files
- `code:execute` - Execute commands

## Test Data

### Test Users

| Email | System Role | Projects | Purpose |
|-------|-------------|----------|---------|
| `admin@alex-ai.dev` | Administrator | All | **Control Case 1**: Absolute access |
| `minimal@example.com` | Viewer | None | **Control Case 2**: Absolute minimal access |
| `owner1@example.com` (Alice) | Owner | ecommerce, internal-tools | **Control Case 3**: Multi-project owner |
| `owner2@example.com` (Bob) | Owner | blog-cms, mobile-backend | **Control Case 3**: Multi-project owner |
| `dev1@example.com` (Charlie) | Developer | ecommerce (dev) | **Control Case 4**: Single project developer |
| `superdev@example.com` (Diana) | Developer | 3 projects (dev) | **Control Case 5**: Multi-project developer |
| `viewer1@example.com` (Eve) | Viewer | ecommerce (viewer) | **Control Case 6**: Read-only access |

### Test Projects

1. **ecommerce-platform** (Owner: Alice)
   - Members: Charlie (dev), Diana (dev), Eve (viewer)
   - Category: DDD Web Architecture

2. **blog-cms** (Owner: Bob)
   - Members: Diana (dev), Frank (dev), Grace (viewer)
   - Category: DDD Web Architecture

3. **mobile-backend** (Owner: Bob)
   - Members: Diana (dev)
   - Category: Enterprise RAG Platform

4. **internal-tools** (Owner: Alice)
   - Members: Frank (dev)
   - Category: AI Platform Engineering

## Verification Queries

### 1. View all users and roles
```sql
SELECT id, email, display_name, system_role
FROM auth_profiles
ORDER BY system_role, email;
```

### 2. View project memberships
```sql
SELECT
  p.name as project,
  ap.email as user,
  pm.role_id as role,
  ap2.email as invited_by
FROM project_members pm
JOIN projects p ON pm.project_id = p.id
JOIN auth_profiles ap ON pm.user_id = ap.id
LEFT JOIN auth_profiles ap2 ON pm.invited_by = ap2.id
ORDER BY p.name, pm.role_id;
```

### 3. Test permission checks

**Should return TRUE** (Admin has all permissions):
```sql
SELECT check_permission(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'system:manage_users',
  NULL
);
```

**Should return TRUE** (Charlie can write code in ecommerce):
```sql
SELECT check_permission(
  '00000000-0000-0000-0000-000000000005'::uuid,
  'code:write',
  'ecommerce-platform'
);
```

**Should return FALSE** (Eve cannot write code):
```sql
SELECT check_permission(
  '00000000-0000-0000-0000-000000000007'::uuid,
  'code:write',
  'ecommerce-platform'
);
```

**Should return FALSE** (Charlie cannot access projects he's not a member of):
```sql
SELECT check_permission(
  '00000000-0000-0000-0000-000000000005'::uuid,
  'project:read',
  'blog-cms'
);
```

### 4. View audit log summary
```sql
SELECT
  ap.email,
  al.action,
  al.permission_checked,
  al.allowed,
  COUNT(*) as count
FROM audit_log al
LEFT JOIN auth_profiles ap ON al.user_id = ap.id
GROUP BY ap.email, al.action, al.permission_checked, al.allowed
ORDER BY ap.email, al.allowed DESC;
```

### 5. Test RLS policies

**As Charlie (should see only ecommerce-platform)**:
```sql
SET request.jwt.claims.sub = '00000000-0000-0000-0000-000000000005';
SELECT id, name FROM projects;
```

**As Admin (should see all projects)**:
```sql
SET request.jwt.claims.sub = '00000000-0000-0000-0000-000000000001';
SELECT id, name FROM projects;
```

## Test Cases

### Test Case 1: Absolute Access (Administrator)
```sql
-- User: admin@alex-ai.dev
-- Expected: ✅ All permissions

SELECT check_permission('00000000-0000-0000-0000-000000000001'::uuid, 'system:manage_users', NULL); -- TRUE
SELECT check_permission('00000000-0000-0000-0000-000000000001'::uuid, 'project:delete', 'ecommerce-platform'); -- TRUE
SELECT check_permission('00000000-0000-0000-0000-000000000001'::uuid, 'code:write', 'blog-cms'); -- TRUE
```

### Test Case 2: Absolute Minimal Access
```sql
-- User: minimal@example.com
-- Expected: ❌ Cannot access any projects

SELECT check_permission('00000000-0000-0000-0000-000000000002'::uuid, 'project:read', 'ecommerce-platform'); -- FALSE
SELECT check_permission('00000000-0000-0000-0000-000000000002'::uuid, 'code:write', 'blog-cms'); -- FALSE
SELECT check_permission('00000000-0000-0000-0000-000000000002'::uuid, 'crew:chat', NULL); -- TRUE (system-level)
```

### Test Case 3: Multi-Project Owner
```sql
-- User: owner2@example.com (Bob)
-- Expected: ✅ Full access to blog-cms, mobile-backend | ❌ Cannot access ecommerce

SELECT check_permission('00000000-0000-0000-0000-000000000004'::uuid, 'project:configure', 'blog-cms'); -- TRUE
SELECT check_permission('00000000-0000-0000-0000-000000000004'::uuid, 'project:invite_members', 'mobile-backend'); -- TRUE
SELECT check_permission('00000000-0000-0000-0000-000000000004'::uuid, 'project:read', 'ecommerce-platform'); -- FALSE
SELECT check_permission('00000000-0000-0000-0000-000000000004'::uuid, 'system:manage_users', NULL); -- FALSE
```

### Test Case 4: Single Project Developer
```sql
-- User: dev1@example.com (Charlie)
-- Expected: ✅ Code access in ecommerce | ❌ Cannot invite, cannot access other projects

SELECT check_permission('00000000-0000-0000-0000-000000000005'::uuid, 'code:write', 'ecommerce-platform'); -- TRUE
SELECT check_permission('00000000-0000-0000-0000-000000000005'::uuid, 'crew:invoke', 'ecommerce-platform'); -- TRUE
SELECT check_permission('00000000-0000-0000-0000-000000000005'::uuid, 'project:invite_members', 'ecommerce-platform'); -- FALSE
SELECT check_permission('00000000-0000-0000-0000-000000000005'::uuid, 'project:read', 'blog-cms'); -- FALSE
```

### Test Case 5: Multi-Project Developer
```sql
-- User: superdev@example.com (Diana)
-- Expected: ✅ Code access in 3 projects | ❌ Cannot manage settings

SELECT check_permission('00000000-0000-0000-0000-000000000006'::uuid, 'code:write', 'ecommerce-platform'); -- TRUE
SELECT check_permission('00000000-0000-0000-0000-000000000006'::uuid, 'code:write', 'blog-cms'); -- TRUE
SELECT check_permission('00000000-0000-0000-0000-000000000006'::uuid, 'code:write', 'mobile-backend'); -- TRUE
SELECT check_permission('00000000-0000-0000-0000-000000000006'::uuid, 'project:configure', 'blog-cms'); -- FALSE
```

### Test Case 6: Viewer (Read-Only)
```sql
-- User: viewer1@example.com (Eve)
-- Expected: ✅ Read code | ❌ Cannot write/execute

SELECT check_permission('00000000-0000-0000-0000-000000000007'::uuid, 'code:read', 'ecommerce-platform'); -- TRUE
SELECT check_permission('00000000-0000-0000-0000-000000000007'::uuid, 'crew:chat', 'ecommerce-platform'); -- TRUE
SELECT check_permission('00000000-0000-0000-0000-000000000007'::uuid, 'code:write', 'ecommerce-platform'); -- FALSE
SELECT check_permission('00000000-0000-0000-0000-000000000007'::uuid, 'code:execute', 'ecommerce-platform'); -- FALSE
```

## Integration with Alex AI

### VSCode Extension

The VSCode extension uses **API key authentication**:

1. User generates API key in web dashboard
2. Extension stores key in VSCode secrets
3. All API requests include `Authorization: Bearer <api_key>` header
4. Backend validates key and checks permissions before operations

**Example API key flow**:
```typescript
// VSCode extension
const apiKey = await context.secrets.get('alex-ai-api-key');
const response = await fetch('https://api.alex-ai.dev/projects', {
  headers: { 'Authorization': `Bearer ${apiKey}` }
});
```

### Web Dashboard

The web dashboard uses **session-based authentication**:

1. User signs in via Supabase Auth UI
2. Session token stored in HTTP-only cookie
3. Row Level Security enforces data access
4. API routes check permissions via `check_permission()` function

**Example web dashboard permission check**:
```typescript
// Next.js API route
const user = await getUser(req);
const hasPermission = await checkPermission(user.id, 'project:write', projectId);
if (!hasPermission) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

## API Functions

### check_permission()

Check if user has permission for action:

```sql
check_permission(
  p_user_id UUID,
  p_permission TEXT,
  p_project_id TEXT DEFAULT NULL
) RETURNS BOOLEAN
```

**Examples**:
```sql
-- Check system permission
SELECT check_permission(user_id, 'system:manage_users', NULL);

-- Check project permission
SELECT check_permission(user_id, 'code:write', 'ecommerce-platform');
```

### log_audit()

Log permission check or action:

```sql
log_audit(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT,
  p_permission_checked TEXT,
  p_allowed BOOLEAN,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
```

**Example**:
```sql
SELECT log_audit(
  user_id,
  'write_file',
  'file',
  'src/domain/User.ts',
  'code:write',
  TRUE,
  '{"project_id": "ecommerce-platform"}'::jsonb
);
```

## Security Considerations

### Row Level Security (RLS)

All tables have RLS enabled with policies enforcing:
- Users can only view their own data
- Project members can only see projects they belong to
- Administrators have elevated access
- Audit logs are append-only for regular users

### API Key Security

- Keys are hashed (bcrypt/argon2) before storage
- Keys include expiration dates
- Keys can be revoked by users
- Scopes limit key capabilities
- Last used timestamp for monitoring

### Audit Logging

All permission checks are logged with:
- User ID and action
- Resource accessed
- Permission checked
- Result (allowed/denied)
- Metadata (IP, user agent, etc.)

## Migration Management

### Create new migration

```bash
# Via Supabase CLI
supabase migration new <migration_name>

# Manually
touch supabase/migrations/003_<migration_name>.sql
```

### Reset database (⚠️ DESTRUCTIVE)

```bash
# Local only
supabase db reset

# Remote (use with extreme caution)
# Manually drop tables via SQL Editor
```

### Rollback migration

Manually write inverse SQL and apply via SQL Editor or CLI.

## Troubleshooting

### Issue: RLS policies blocking access

**Symptom**: Queries return empty results even though data exists

**Solution**: Check if `auth.uid()` returns correct user ID
```sql
SELECT auth.uid(); -- Should match user's UUID
```

### Issue: Permission checks always return FALSE

**Symptom**: `check_permission()` denies valid permissions

**Solution**: Verify role has capability in JSONB array
```sql
SELECT capabilities FROM roles WHERE id = 'developer';
-- Should include: ["code:write", ...]
```

### Issue: Cannot insert test users

**Symptom**: Foreign key constraint violation on `auth.users`

**Solution**: Create users in Supabase Auth first, then insert profiles
```sql
-- Users must exist in auth.users before auth_profiles
```

## Next Steps

1. **Apply migrations** to Supabase project
2. **Run test queries** to validate schema
3. **Implement authentication abstraction** layer (Phase 2)
4. **Update VSCode extension** with API key auth (Phase 4)
5. **Build web dashboard** with session auth (Phase 5)
6. **Implement sync mechanism** (Phase 6)
7. **End-to-end testing** with all control cases (Phase 7)

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [RBAC Architecture Document](../docs/RBAC_ARCHITECTURE.md)

---

**Version**: 1.0.0
**Last Updated**: 2025-12-26
**Maintained by**: Alex AI Crew
