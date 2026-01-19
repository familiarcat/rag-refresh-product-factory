# RBAC Integration - Complete Setup Workflow

This guide walks you through setting up and testing the complete RBAC integration from scratch.

## Current Status

✅ Secrets synced from ~/.zshrc
✅ RBAC integration code written
✅ Migration SQL prepared
✅ Dev server running on port 3001
⏳ **Next**: Apply database migrations

## Step-by-Step Workflow

### Step 1: Apply Database Migrations (5 minutes)

The migration SQL is ready and copied to your clipboard. The Supabase SQL Editor should be open.

**Quick Method**:
1. SQL Editor is open in browser at: https://supabase.com/dashboard/project/rpkkkbufdwxmjaerbhbn/sql/new
2. Paste (Cmd+V) the migration SQL
3. Click "Run" button
4. Wait ~10 seconds

**Alternative - Command Line**:
```bash
# If you prefer CLI (requires database password)
supabase link --project-ref rpkkkbufdwxmjaerbhbn
supabase db push
```

### Step 2: Verify Database Schema (1 minute)

After migration completes:

```bash
npm run db:verify:quick
```

**Expected Output**:
```
✅ auth_profiles table
✅ projects table
✅ roles table
✅ permissions table
✅ api_keys table
✅ check_permission() function
✅ Test users exist

📊 Results: 7/7 checks passed
🎉 Database schema is ready!
```

### Step 3: Test Supabase Connection (30 seconds)

```bash
curl http://localhost:3001/api/dev/test-auth | jq '.'
```

**Expected Response**:
```json
{
  "supabase_connected": true,
  "database_stats": {
    "users": 9,
    "projects": 4,
    "roles": 4,
    "permissions": 24
  },
  "test_users": [...]
}
```

### Step 4: Generate API Keys (1 minute)

Generate API keys for testing each role:

**Administrator**:
```bash
curl "http://localhost:3001/api/dev/test-auth?action=create-api-key&email=admin@alex-ai.dev" | jq '.api_key'
```

**Developer**:
```bash
curl "http://localhost:3001/api/dev/test-auth?action=create-api-key&email=dev1@example.com" | jq '.api_key'
```

**Viewer**:
```bash
curl "http://localhost:3001/api/dev/test-auth?action=create-api-key&email=viewer1@example.com" | jq '.api_key'
```

**⚠️ IMPORTANT**: Save these API keys! They won't be shown again.

Example keys (yours will be different):
```bash
export ADMIN_KEY="alex_abc123..."
export DEV_KEY="alex_def456..."
export VIEWER_KEY="alex_ghi789..."
```

### Step 5: Test Authentication (2 minutes)

**Test Developer Authentication**:
```bash
curl -X POST http://localhost:3001/api/dev/test-auth \
  -H "Content-Type: application/json" \
  -d "{\"api_key\": \"$DEV_KEY\"}" | jq '.'
```

**Expected Response**:
```json
{
  "authenticated": true,
  "user": {
    "email": "dev1@example.com",
    "system_role": "developer"
  },
  "permissions": {
    "project:create": false,
    "project:read": true,
    "project:write": true,
    "code:execute": true,
    "system:manage_users": false
  }
}
```

### Step 6: Test API Routes with RBAC (3 minutes)

**Test 1: List Projects (Developer - Should Work)**:
```bash
curl -H "Authorization: Bearer $DEV_KEY" \
  http://localhost:3001/api/projects | jq '.'
```

**Test 2: Create Project (Developer - Should Fail)**:
```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Authorization: Bearer $DEV_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Project"}' | jq '.'
```
Expected: `403 Forbidden`

**Test 3: Create Project (Admin - Should Work)**:
```bash
curl -X POST http://localhost:3001/api/projects \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Project", "category": "test"}' | jq '.'
```
Expected: `200 OK` with project data

**Test 4: List API Keys (Developer)**:
```bash
curl -H "Authorization: Bearer $DEV_KEY" \
  http://localhost:3001/api/auth/api-keys | jq '.'
```

### Step 7: Enable RBAC API in Production (1 minute)

Once testing is successful, switch to the RBAC-enabled API:

```bash
# Backup old route
mv app/api/projects/route.ts app/api/projects/route.v1.backup.ts

# Enable new RBAC route
mv app/api/projects/route.v2.ts app/api/projects/route.ts

# Restart dev server (if needed)
# The server should auto-reload
```

### Step 8: Run Full Permission Tests (2 minutes)

```bash
npm run db:test
```

This runs the complete test suite:
- Test Case 1: Administrator - Full Access
- Test Case 2: Minimal Access - No Projects
- Test Case 3: Multi-Project Owner
- Test Case 4: Single Project Developer
- Test Case 5: Multi-Project Developer
- Test Case 6: Viewer - Read Only

**Expected**: All tests should pass ✅

## Verification Checklist

After completing all steps:

- [ ] Database migrations applied successfully
- [ ] 7/7 schema verification checks pass
- [ ] API endpoint returns `supabase_connected: true`
- [ ] API keys generated for admin, developer, viewer
- [ ] Authentication test returns user profile and permissions
- [ ] Developer can list projects but cannot create
- [ ] Admin can create projects
- [ ] Full permission test suite passes
- [ ] RBAC API route enabled in production

## Troubleshooting

### Migration Fails

**Error**: "Table already exists"
- **Solution**: Safe to ignore, indicates partial migration was applied
- **Action**: Continue with verification

**Error**: "Permission denied"
- **Solution**: Check you're using SERVICE_ROLE_KEY, not ANON_KEY
- **Action**: Verify .env.local has correct key

### Connection Fails

**Error**: "Supabase not connected"
- **Solution**: Check credentials in .env.local
- **Action**: Run `npm run script:secrets:sync` again

### API Key Generation Fails

**Error**: "User not found"
- **Solution**: Migration didn't create test users
- **Action**: Re-run migration or check 002_seed_test_data.sql

## Next Steps

After RBAC is working:

1. **Update VSCode Extension**
   - Add API key storage
   - Update alexAiService.ts to send Authorization headers
   - Test extension authentication

2. **Add UI for API Key Management**
   - Create dashboard page at /settings/api-keys
   - Allow users to create/revoke keys
   - Show key scopes and expiration

3. **Enable Claude Code RBAC**
   - Configure Claude Code to use API keys
   - Test permission-aware operations
   - Enable audit logging

## Quick Reference

**Project URL**: https://rpkkkbufdwxmjaerbhbn.supabase.co
**Dashboard**: https://supabase.com/dashboard/project/rpkkkbufdwxmjaerbhbn
**SQL Editor**: https://supabase.com/dashboard/project/rpkkkbufdwxmjaerbhbn/sql/new

**Dev Endpoint**: http://localhost:3001/api/dev/test-auth
**Projects API**: http://localhost:3001/api/projects
**API Keys API**: http://localhost:3001/api/auth/api-keys

**Documentation**:
- RBAC_INTEGRATION_TESTING.md - Complete testing guide
- MIGRATION_INSTRUCTIONS.md - Migration help
- docs/RBAC_*.md - Architecture and design docs

---

**Status**: Ready for Step 1 - Apply Database Migrations

Once you paste and run the SQL in the Supabase dashboard, continue with Step 2!
