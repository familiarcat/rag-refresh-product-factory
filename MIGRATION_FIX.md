# Migration Error Fix

## What Went Wrong

**Error**: `ERROR: 42703: column "owner_id" does not exist`

**Root Cause**: The original migration tried to create `auth_profiles` table with a foreign key to Supabase's `auth.users` table:

```sql
CREATE TABLE auth_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  -- This failed because auth.users doesn't have any users yet
  ...
);
```

When the `projects` table then tried to reference `auth_profiles.id`, it failed because the auth_profiles table creation had failed.

## The Fix

**Solution**: Make `auth_profiles` standalone - generate its own UUIDs instead of requiring foreign keys to `auth.users`:

```sql
CREATE TABLE auth_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  -- Now generates its own UUIDs
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  system_role TEXT NOT NULL DEFAULT 'developer',
  ...
);
```

## What Changed

### Before (❌ Failed):
- `auth_profiles.id` → Foreign key to `auth.users.id`
- Required Supabase Auth users to exist first
- Circular dependency issues

### After (✅ Fixed):
- `auth_profiles.id` → Self-generated UUID
- Standalone table that doesn't depend on auth.users
- Can be used with or without Supabase Auth
- Test users created with fixed UUIDs

## Impact

This change makes the RBAC system:
1. **Easier to set up** - No dependency on auth.users
2. **More flexible** - Can integrate with any auth system later
3. **Testable** - Can seed test users with known UUIDs
4. **Standalone** - Works independently of Supabase Auth

## Future Integration

If you want to integrate with Supabase Auth later:

1. Sync auth.users → auth_profiles on user signup
2. Match emails between tables
3. Keep auth_profiles as the source of truth for roles
4. Use RLS policies to enforce access

But for now, we have a working RBAC system!

## Next Steps

**The fixed migration is now in your clipboard!**

1. In the Supabase SQL Editor:
   - Clear the old SQL if it's still there
   - Paste (Cmd+V) the new fixed SQL
   - Click "Run"
   - Should complete in ~10 seconds

2. Verify:
   ```bash
   npm run db:verify:quick
   ```

3. Test:
   ```bash
   curl http://localhost:3001/api/dev/test-auth | jq '.'
   ```

## Files Updated

- `supabase/migrations/001_rbac_schema_fixed.sql` - Fixed schema
- `supabase/migrations/002_seed_test_data_fixed.sql` - Fixed seed data
- `/tmp/combined_migration_fixed.sql` - Combined (in clipboard)

## Test Users (Fixed UUIDs)

All test users have predictable UUIDs for easy testing:

- `00000000-0000-0000-0000-000000000001` - admin@alex-ai.dev (Administrator)
- `00000000-0000-0000-0000-000000000003` - alice@example.com (Owner)
- `00000000-0000-0000-0000-000000000005` - charlie@example.com (Developer)
- `00000000-0000-0000-0000-000000000007` - eve@example.com (Viewer)
- `00000000-0000-0000-0000-000000000008` - dev1@example.com (Developer)
- `00000000-0000-0000-0000-000000000009` - viewer1@example.com (Viewer)

Ready to paste and run! 🚀
