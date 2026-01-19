# Supabase RBAC Migration Instructions

## Quick Steps (5 minutes)

The RBAC schema needs to be applied to your Supabase database. Here's how:

### Option 1: SQL Editor (Recommended - Simplest)

1. **Open Supabase SQL Editor**:
   ```bash
   open "https://supabase.com/dashboard/project/rpkkkbufdwxmjaerbhbn/sql/new"
   ```

2. **Copy Migration SQL**:
   ```bash
   cat /tmp/combined_migration.sql | pbcopy
   ```
   (The SQL is now in your clipboard)

3. **Execute in Dashboard**:
   - Paste the SQL into the editor
   - Click "Run" button
   - Wait for completion (~10 seconds)

4. **Verify**:
   ```bash
   npm run db:verify
   ```

### Option 2: Using Supabase CLI

If you prefer command line:

1. **Get Database Password**:
   - Go to: https://supabase.com/dashboard/project/rpkkkbufdwxmjaerbhbn/settings/database
   - Copy your database password
   - Or reset it if needed

2. **Link Project**:
   ```bash
   supabase link --project-ref rpkkkbufdwxmjaerbhbn
   ```
   (Enter password when prompted)

3. **Push Migrations**:
   ```bash
   supabase db push
   ```

### Option 3: Direct PostgreSQL Connection

If you have `psql` installed:

1. **Get Connection String** from:
   https://supabase.com/dashboard/project/rpkkkbufdwxmjaerbhbn/settings/database

2. **Run Migration**:
   ```bash
   psql "YOUR_CONNECTION_STRING" -f /tmp/combined_migration.sql
   ```

## What Gets Created

The migration creates:

- **8 Tables**: auth_profiles, projects, roles, permissions, project_members, audit_log, api_keys, sessions
- **4 Roles**: Administrator (100), Owner (75), Developer (50), Viewer (25)
- **24 Permissions**: Across system, project, crew, and code categories
- **9 Test Users**: Including admin, owner, developer, and viewer roles
- **4 Test Projects**: With various ownership and membership scenarios
- **RLS Policies**: Row-level security for all tables
- **2 RPC Functions**: check_permission(), log_audit()

## After Migration

Once migrations are complete:

1. **Test Connection**:
   ```bash
   curl http://localhost:3001/api/dev/test-auth
   ```

2. **Generate API Key**:
   ```bash
   curl "http://localhost:3001/api/dev/test-auth?action=create-api-key&email=dev1@example.com"
   ```

3. **Test Authentication**:
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:3001/api/projects
   ```

## Migration File Location

The combined migration SQL is at:
```
/tmp/combined_migration.sql
```

Individual files:
```
supabase/migrations/001_rbac_schema.sql
supabase/migrations/002_seed_test_data.sql
```

## Troubleshooting

**"Table already exists" errors**: Safe to ignore - indicates partial migration was already applied

**"Permission denied" errors**: Make sure you're using the service_role key, not anon key

**"Connection refused" errors**: Check that SUPABASE_URL is correct in .env.local

## Next Steps

After successful migration:
- [ ] Verify schema: `npm run db:verify`
- [ ] Test permissions: `npm run db:test`
- [ ] Generate API keys for testing
- [ ] Update Next.js API routes to use RBAC
- [ ] Test VSCode extension with RBAC

---

**Quick Start**: Just run this command and follow the prompts:
```bash
open "https://supabase.com/dashboard/project/rpkkkbufdwxmjaerbhbn/sql/new" && cat /tmp/combined_migration.sql | pbcopy
```

Then paste (Cmd+V) and click "Run" in the SQL Editor.
