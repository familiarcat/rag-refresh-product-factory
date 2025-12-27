# RBAC Integration Testing Guide

**Date**: 2025-12-26
**Status**: ✅ READY FOR TESTING
**Version**: 2.0.0 (Full RBAC Integration)

---

## Overview

This guide walks you through testing the complete RBAC integration between Supabase, the Next.js backend, and the VSCode extension/Claude Code.

---

## What Was Built

###  Files Created (7)

1. **`lib/supabase.ts`** (~500 lines)
   - Supabase client with typed schema
   - Helper functions for permissions and audit logging
   - Database connection checking

2. **`lib/auth/middleware.ts`** (~400 lines)
   - Authentication middleware (API key + JWT ready)
   - Permission checking helpers
   - Route protection utilities (`withAuth`, `withPermission`)

3. **`lib/auth/api-keys.ts`** (~350 lines)
   - API key generation and hashing
   - Key verification and management
   - Dev utilities for testing

4. **`app/api/projects/route.v2.ts`** (~400 lines)
   - RBAC-integrated projects API
   - Hybrid approach: Supabase + file system
   - Permission enforcement on all routes

5. **`app/api/auth/api-keys/route.ts`** (~250 lines)
   - API key management endpoints
   - Create, list, revoke, delete keys

6. **`app/api/dev/test-auth/route.ts`** (~200 lines)
   - Development testing utilities
   - Quick API key generation
   - Permission verification

7. **`docs/RBAC_INTEGRATION_TESTING.md`** (this file)

---

## Prerequisites

### 1. Database Ready

```bash
# Verify credentials synced
grep SUPABASE .env.local

# Should show:
# SUPABASE_URL='https://rpkkkbufdwxmjaerbhbn.supabase.co'
# SUPABASE_SERVICE_ROLE_KEY='eyJhbGci...'
```

### 2. Migrations Applied

```bash
# Apply database schema (if not done)
npm run db:migrate

# Verify schema
npm run db:verify

# Should show:
# ✅ Tables exist: PASSED
# ✅ Roles defined: PASSED
# ✅ Permissions defined: PASSED
# ✅ Test users created: PASSED
```

### 3. Server Running

```bash
# Server should already be running on port 3001
lsof -i :3001

# If not, start it
PORT=3001 npm run dev
```

---

## Testing Flow

### Phase 1: Verify Database Connection (5 minutes)

#### Test 1.1: Check Supabase Connection

```bash
# Call dev endpoint
curl http://localhost:3001/api/dev/test-auth

# Expected response:
{
  "supabase_connected": true,
  "database_stats": {
    "users": 9,
    "projects": 4,
    "roles": 4,
    "memberships": 11
  },
  "test_users": [
    { "email": "admin@alex-ai.dev", "system_role": "administrator" },
    { "email": "dev1@example.com", "system_role": "developer" },
    ...
  ]
}
```

**If fails**: Run `npm run script:secrets:sync && npm run db:migrate`

#### Test 1.2: Verify Test Users

```bash
# Check test users exist
npm run db:test

# Should run 24 permission tests
# Expected: 24/24 passed
```

---

### Phase 2: Generate API Keys (10 minutes)

#### Test 2.1: Generate API Key for Developer

**Via Dev Endpoint** (Quick):

```bash
# Generate key for Charlie (developer)
curl "http://localhost:3001/api/dev/test-auth?action=create-api-key&email=dev1@example.com"

# Response:
{
  "message": "API key created successfully",
  "api_key": "alex_abc123...",  # ⚠️ SAVE THIS!
  "user_email": "dev1@example.com",
  "usage": {
    "curl": "curl -H \"Authorization: Bearer alex_abc123...\" http://localhost:3001/api/projects",
    "vscode": "Store this key in VSCode Settings"
  }
}
```

**Save the API key**: You'll need it for testing!

```bash
# Set as environment variable for testing
export TEST_API_KEY="alex_abc123..."  # Replace with actual key
```

#### Test 2.2: Generate Keys for Other Roles

```bash
# Administrator
curl "http://localhost:3001/api/dev/test-auth?action=create-api-key&email=admin@alex-ai.dev"

# Viewer
curl "http://localhost:3001/api/dev/test-auth?action=create-api-key&email=viewer1@example.com"

# Save each key for role-based testing
```

---

### Phase 3: Test Authentication (5 minutes)

#### Test 3.1: Verify API Key Works

```bash
# Test authentication with your API key
curl -X POST http://localhost:3001/api/dev/test-auth \
  -H "Content-Type: application/json" \
  -d "{\"api_key\": \"$TEST_API_KEY\"}"

# Expected response:
{
  "authenticated": true,
  "user": {
    "id": "00000000-0000-0000-0000-000000000005",
    "email": "dev1@example.com",
    "system_role": "developer"
  },
  "permissions": {
    "project:create": true,
    "project:read": true,
    "project:write": true,
    "project:delete": false,  # Developer cannot delete
    "code:read": true,
    "code:write": true,
    "code:execute": true,
    "system:manage_users": false  # Only admin
  },
  "message": "✅ Authentication successful!"
}
```

#### Test 3.2: Test Invalid API Key

```bash
# Should fail
curl -X POST http://localhost:3001/api/dev/test-auth \
  -H "Content-Type: application/json" \
  -d '{"api_key": "invalid_key"}'

# Expected:
{
  "authenticated": false,
  "error": "Invalid API key"
}
```

---

### Phase 4: Test RBAC on Projects API (15 minutes)

**Note**: The new RBAC-integrated API is at `route.v2.ts`. To activate it, we need to rename it.

#### Enable RBAC API (One-time)

```bash
# Backup old route
mv app/api/projects/route.ts app/api/projects/route.v1.ts

# Activate new RBAC route
mv app/api/projects/route.v2.ts app/api/projects/route.ts

# Server will auto-reload
```

#### Test 4.1: List Projects (Authenticated)

```bash
# With authentication
curl -H "Authorization: Bearer $TEST_API_KEY" \
  http://localhost:3001/api/projects

# Expected: Only shows projects user has access to
{
  "projects": [
    {
      "id": "ecommerce-platform",
      "name": "E-commerce Platform",
      ...
    }
  ],
  "total": 1
}
```

#### Test 4.2: List Projects (Unauthenticated)

```bash
# Without authentication
curl http://localhost:3001/api/projects

# Expected: Shows all projects (backward compatible)
{
  "projects": [...],
  "total": 10  # All projects
}
```

#### Test 4.3: Create Project (Allowed)

```bash
# Developer has project:create permission
curl -X POST http://localhost:3001/api/projects \
  -H "Authorization: Bearer $TEST_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "RBAC Test Project",
    "category": "ddd-web-architecture"
  }'

# Expected:
{
  "ok": true,
  "project": {
    "id": "proj_...",
    "name": "RBAC Test Project",
    ...
  }
}
```

#### Test 4.4: Delete Project (Denied)

```bash
# Developer CANNOT delete (requires admin)
curl -X DELETE "http://localhost:3001/api/projects?id=proj_...&permanent=true" \
  -H "Authorization: Bearer $TEST_API_KEY"

# Expected:
{
  "error": "Forbidden",
  "message": "You do not have permission: project:delete"
}
```

#### Test 4.5: Test with Viewer Role

```bash
# Generate viewer API key first
VIEWER_KEY=$(curl -s "http://localhost:3001/api/dev/test-auth?action=create-api-key&email=viewer1@example.com" | jq -r '.api_key')

# Try to create project (should fail)
curl -X POST http://localhost:3001/api/projects \
  -H "Authorization: Bearer $VIEWER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "category": "test"}'

# Expected:
{
  "error": "Forbidden",
  "message": "You do not have permission: project:create"
}
```

---

### Phase 5: Test API Key Management (10 minutes)

#### Test 5.1: List User's API Keys

```bash
curl -H "Authorization: Bearer $TEST_API_KEY" \
  http://localhost:3001/api/auth/api-keys

# Expected:
{
  "api_keys": [
    {
      "id": "...",
      "name": "Dev Test Key",
      "key_prefix": "alex_abc",
      "scopes": ["code:read", "code:write", ...],
      "created_at": "2025-12-26T...",
      "last_used_at": "2025-12-26T...",
      "expires_at": "2026-12-26T...",
      "revoked_at": null
    }
  ],
  "total": 1
}
```

#### Test 5.2: Create New API Key

```bash
curl -X POST http://localhost:3001/api/auth/api-keys \
  -H "Authorization: Bearer $TEST_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "VSCode Extension Key",
    "scopes": ["code:read", "code:write", "project:read"],
    "expiresInDays": 365
  }'

# Expected:
{
  "api_key": "alex_xyz789...",  # ⚠️ SAVE THIS!
  "record": {
    "id": "...",
    "name": "VSCode Extension Key",
    "key_prefix": "alex_xyz",
    "scopes": ["code:read", "code:write", "project:read"],
    ...
  },
  "message": "⚠️ Save this API key securely - it will not be shown again!"
}
```

#### Test 5.3: Revoke API Key

```bash
# Get key ID from list
KEY_ID=$(curl -s -H "Authorization: Bearer $TEST_API_KEY" \
  http://localhost:3001/api/auth/api-keys | jq -r '.api_keys[0].id')

# Revoke it
curl -X DELETE "http://localhost:3001/api/auth/api-keys?id=$KEY_ID" \
  -H "Authorization: Bearer $TEST_API_KEY"

# Expected:
{
  "ok": true,
  "action": "revoked"
}

# Verify it's revoked
curl -X POST http://localhost:3001/api/dev/test-auth \
  -H "Content-Type: application/json" \
  -d "{\"api_key\": \"$TEST_API_KEY\"}"

# Expected:
{
  "authenticated": false,
  "error": "API key has been revoked"
}
```

---

### Phase 6: Test Audit Logging (5 minutes)

#### Test 6.1: Check Audit Logs

```bash
# View recent audit logs (requires Supabase dashboard or SQL)
# Via Supabase dashboard:
# 1. Go to https://supabase.com/dashboard/project/rpkkkbufdwxmjaerbhbn/editor
# 2. Run query:

SELECT
  ap.email,
  al.action,
  al.resource_type,
  al.resource_id,
  al.permission_checked,
  al.allowed,
  al.timestamp
FROM audit_log al
LEFT JOIN auth_profiles ap ON al.user_id = ap.id
ORDER BY al.timestamp DESC
LIMIT 20;

# Expected: See all your test actions logged
```

#### Test 6.2: Verify Permission Denials Logged

```bash
# Try an action that will be denied
curl -X DELETE "http://localhost:3001/api/projects?id=test&permanent=true" \
  -H "Authorization: Bearer $NEW_TEST_KEY"

# Check audit log shows denial:
# action: delete_project
# allowed: false
# permission_checked: project:delete
```

---

### Phase 7: VSCode Extension Integration (10 minutes)

#### Test 7.1: Store API Key in VSCode

1. **Open VSCode Settings**: `Cmd+,`
2. **Search**: "Alex AI"
3. **Find**: "Alex AI: API Key" setting
4. **Set**: Your test API key (`alex_abc123...`)

#### Test 7.2: Update Extension to Use API Key

**File**: `vscode-extension/src/alexAiService.ts`

```typescript
// Add at top of chat() method in AlexAiClient class
async chat(crewMember: string, message: string, fileContext?: string): Promise<string> {
  const config = this.getConfig();

  // Get API key from config
  const apiKey = config.get<string>("apiKey") || process.env.ALEX_AI_API_KEY;

  // Add Authorization header to API calls
  const headers = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  // Rest of existing code...
}
```

#### Test 7.3: Test Extension with RBAC

1. **Reload VSCode**: `Cmd+Shift+P` → "Developer: Reload Window"
2. **Open Alex AI Chat**
3. **Message Commander Riker**: "Create a new test project"
4. **Expected**: API call includes Authorization header, permission checked

---

## Migration Guide: v1 → v2

### For Users (Web Dashboard)

**No changes required** - Backward compatible!
- Existing functionality works without authentication
- Optional: Create API keys for enhanced security

### For Developers (VSCode Extension)

**Action required** (to enable RBAC):

1. **Generate API Key**:
   ```bash
   curl "http://localhost:3001/api/dev/test-auth?action=create-api-key&email=YOUR_EMAIL"
   ```

2. **Store in VSCode**:
   - Settings → Alex AI → API Key
   - Paste your key

3. **Update Extension Code** (future PR):
   - Add Authorization header to all API calls
   - Handle 401/403 responses gracefully

### For Administrators

**Enable RBAC API**:

```bash
# Backup old route
mv app/api/projects/route.ts app/api/projects/route.v1.ts

# Activate RBAC route
mv app/api/projects/route.v2.ts app/api/projects/route.ts

# Commit changes
git add app/api/projects/
git commit -m "Enable RBAC integration for projects API"
```

---

## Rollback Plan

If issues arise, rollback is simple:

```bash
# Restore old route
mv app/api/projects/route.ts app/api/projects/route.v2.ts
mv app/api/projects/route.v1.ts app/api/projects/route.ts

# Server auto-reloads
```

RBAC database remains intact, no data loss.

---

## Troubleshooting

### Issue: "Supabase not connected"

**Solution**:
```bash
npm run script:secrets:sync
npm run db:migrate
npm run db:verify
```

### Issue: "Invalid API key"

**Check**:
```bash
# Verify key format
echo $TEST_API_KEY | grep "^alex_"

# Verify key exists in database
# Supabase dashboard → api_keys table
```

### Issue: Permission denied unexpectedly

**Debug**:
```bash
# Check user's permissions
curl -X POST http://localhost:3001/api/dev/test-auth \
  -H "Content-Type: application/json" \
  -d "{\"api_key\": \"$TEST_API_KEY\"}"

# Verify role has capability
npm run db:test
```

### Issue: Server errors

**Check logs**:
```bash
# Server output
tail -50 /tmp/claude/-Users-bradygeorgen-Documents-workspace-stldnb/tasks/b505fdc.output

# Look for:
# [Supabase] Connection failed
# [Auth] Authentication error
```

---

## Success Criteria

### ✅ Phase 1: Database
- [x] Supabase connection working
- [x] Test users exist
- [x] Permissions tests pass

### ✅ Phase 2: Authentication
- [x] API keys generate successfully
- [x] Authentication works
- [x] Invalid keys rejected

### ✅ Phase 3: Authorization
- [ ] Permissions checked on API routes
- [ ] Allowed actions succeed
- [ ] Denied actions blocked

### ✅ Phase 4: Audit
- [ ] Actions logged to audit_log
- [ ] Permission checks tracked
- [ ] User attribution correct

### ✅ Phase 5: Integration
- [ ] VSCode extension authenticates
- [ ] Claude Code can use API
- [ ] Web dashboard uses RBAC

---

## Next Steps

1. **Complete Testing**: Run all test scenarios above
2. **Enable RBAC API**: Rename route.v2.ts to route.ts
3. **Update VSCode Extension**: Add Authorization headers
4. **Test End-to-End**: Create project in VSCode, verify in web
5. **Document for Users**: Create user-facing API key guide

---

## Reference

### Quick Commands

```bash
# Generate API key
curl "http://localhost:3001/api/dev/test-auth?action=create-api-key&email=dev1@example.com"

# Test auth
curl -X POST http://localhost:3001/api/dev/test-auth \
  -H "Content-Type: application/json" \
  -d "{\"api_key\": \"YOUR_KEY\"}"

# List projects (auth required)
curl -H "Authorization: Bearer YOUR_KEY" \
  http://localhost:3001/api/projects

# Create project
curl -X POST http://localhost:3001/api/projects \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "category": "test"}'

# List API keys
curl -H "Authorization: Bearer YOUR_KEY" \
  http://localhost:3001/api/auth/api-keys
```

### Test Users

| Email | Role | Password | Permissions |
|-------|------|----------|-------------|
| `admin@alex-ai.dev` | Administrator | N/A | All permissions |
| `dev1@example.com` | Developer | N/A | Code R/W/X, Project R/W |
| `viewer1@example.com` | Viewer | N/A | Code R, Project R |

---

**Version**: 2.0.0
**Last Updated**: 2025-12-26
**Status**: ✅ READY FOR TESTING
