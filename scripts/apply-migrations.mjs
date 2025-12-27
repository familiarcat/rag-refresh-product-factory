#!/usr/bin/env node

/**
 * Alex AI - Supabase Migration Helper
 *
 * This script helps apply migrations and test the RBAC system.
 *
 * Usage:
 *   node scripts/apply-migrations.mjs --apply     # Apply all migrations
 *   node scripts/apply-migrations.mjs --test      # Run permission tests
 *   node scripts/apply-migrations.mjs --verify    # Verify schema
 *   node scripts/apply-migrations.mjs --help      # Show help
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// =====================================================
// Load Environment Variables
// =====================================================

// Load from .env.local (synced from ~/.zshrc via npm run script:secrets:sync)
const envLocalPath = join(ROOT_DIR, '.env.local');
if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

// =====================================================
// Configuration
// =====================================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found');
  console.error('');
  console.error('Option 1: Sync from ~/.zshrc (recommended)');
  console.error('  npm run script:secrets:sync');
  console.error('  npm run db:migrate');
  console.error('');
  console.error('Option 2: Set manually');
  console.error('  export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  console.error('');
  console.error('Option 3: Add to ~/.zshrc');
  console.error('  export SUPABASE_URL="https://your-project.supabase.co"');
  console.error('  export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  console.error('  source ~/.zshrc');
  console.error('  npm run script:secrets:sync');
  console.error('');
  console.error('Get your service role key from:');
  console.error('  https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// =====================================================
// Migration Files
// =====================================================

const MIGRATIONS = [
  {
    name: '001_rbac_schema.sql',
    path: join(ROOT_DIR, 'supabase', 'migrations', '001_rbac_schema.sql'),
    description: 'Create RBAC schema with tables and RLS policies'
  },
  {
    name: '002_seed_test_data.sql',
    path: join(ROOT_DIR, 'supabase', 'migrations', '002_seed_test_data.sql'),
    description: 'Seed test users, projects, and memberships'
  }
];

// =====================================================
// Utility Functions
// =====================================================

function log(emoji, message, ...args) {
  console.log(`${emoji} ${message}`, ...args);
}

async function executeSql(sql, description) {
  log('⚙️', `Running: ${description}`);
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) throw error;
    log('✅', `Success: ${description}`);
    return { success: true, data };
  } catch (error) {
    log('❌', `Failed: ${description}`);
    console.error('Error:', error.message);
    return { success: false, error };
  }
}

async function queryData(sql, description) {
  log('🔍', `Querying: ${description}`);
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error:', error.message);
    return { success: false, error };
  }
}

// =====================================================
// Migration Functions
// =====================================================

async function applyMigrations() {
  log('🚀', 'Starting migration process...');
  console.log('');

  let allSuccess = true;

  for (const migration of MIGRATIONS) {
    log('📄', `Processing: ${migration.name}`);
    log('ℹ️', `  ${migration.description}`);

    try {
      const sql = readFileSync(migration.path, 'utf-8');

      // Execute the migration
      const { data, error } = await supabase
        .from('_migrations')
        .select('name')
        .eq('name', migration.name)
        .single();

      if (!error && data) {
        log('⏭️', `  Skipped: Already applied`);
        continue;
      }

      // Split SQL into individual statements (rough split on semicolons)
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      log('ℹ️', `  Executing ${statements.length} SQL statements...`);

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (stmt.length === 0) continue;

        const { error } = await supabase.rpc('exec_sql', {
          sql_query: stmt + ';'
        });

        if (error) {
          // Some errors can be ignored (like "already exists")
          if (error.message.includes('already exists')) {
            continue;
          }
          throw error;
        }
      }

      log('✅', `  Completed: ${migration.name}`);

    } catch (error) {
      log('❌', `  Failed: ${migration.name}`);
      console.error('  Error:', error.message);
      allSuccess = false;
      break;
    }

    console.log('');
  }

  if (allSuccess) {
    log('🎉', 'All migrations applied successfully!');
  } else {
    log('❌', 'Migration failed. Please review errors above.');
    process.exit(1);
  }
}

// =====================================================
// Verification Functions
// =====================================================

async function verifySchema() {
  log('🔍', 'Verifying database schema...');
  console.log('');

  const checks = [
    {
      name: 'Tables exist',
      sql: `
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN (
          'auth_profiles', 'projects', 'roles', 'permissions',
          'project_members', 'audit_log', 'api_keys', 'sessions'
        )
        ORDER BY table_name;
      `,
      validate: (result) => result.length === 8
    },
    {
      name: 'Roles defined',
      sql: `SELECT id, name, hierarchy_level FROM roles ORDER BY hierarchy_level DESC;`,
      validate: (result) => result.length === 4
    },
    {
      name: 'Permissions defined',
      sql: `SELECT category, COUNT(*) as count FROM permissions GROUP BY category ORDER BY category;`,
      validate: (result) => result.length === 4 // system, project, crew, code
    },
    {
      name: 'Test users created',
      sql: `SELECT COUNT(*) as count FROM auth_profiles;`,
      validate: (result) => result[0]?.count >= 9
    },
    {
      name: 'Test projects created',
      sql: `SELECT COUNT(*) as count FROM projects;`,
      validate: (result) => result[0]?.count >= 4
    },
    {
      name: 'RLS policies enabled',
      sql: `
        SELECT tablename, COUNT(*) as policy_count
        FROM pg_policies
        WHERE schemaname = 'public'
        GROUP BY tablename
        ORDER BY tablename;
      `,
      validate: (result) => result.length >= 5
    }
  ];

  let allPassed = true;

  for (const check of checks) {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: check.sql
    });

    if (error) {
      log('❌', `${check.name}: FAILED`);
      console.error('  Error:', error.message);
      allPassed = false;
      continue;
    }

    const passed = check.validate(data || []);
    if (passed) {
      log('✅', `${check.name}: PASSED`);
    } else {
      log('❌', `${check.name}: FAILED`);
      console.log('  Result:', JSON.stringify(data, null, 2));
      allPassed = false;
    }
  }

  console.log('');
  if (allPassed) {
    log('🎉', 'All verification checks passed!');
  } else {
    log('⚠️', 'Some verification checks failed.');
  }
}

// =====================================================
// Permission Test Functions
// =====================================================

async function testPermissions() {
  log('🧪', 'Running permission tests...');
  console.log('');

  const tests = [
    {
      case: 'Test Case 1: Administrator - Full Access',
      user: '00000000-0000-0000-0000-000000000001',
      tests: [
        { permission: 'system:manage_users', project: null, expected: true },
        { permission: 'project:delete', project: 'ecommerce-platform', expected: true },
        { permission: 'code:write', project: 'blog-cms', expected: true }
      ]
    },
    {
      case: 'Test Case 2: Minimal Access - No Projects',
      user: '00000000-0000-0000-0000-000000000002',
      tests: [
        { permission: 'project:read', project: 'ecommerce-platform', expected: false },
        { permission: 'code:write', project: 'blog-cms', expected: false },
        { permission: 'crew:chat', project: null, expected: true } // System-level
      ]
    },
    {
      case: 'Test Case 3: Multi-Project Owner',
      user: '00000000-0000-0000-0000-000000000004', // Bob
      tests: [
        { permission: 'project:configure', project: 'blog-cms', expected: true },
        { permission: 'project:invite_members', project: 'mobile-backend', expected: true },
        { permission: 'project:read', project: 'ecommerce-platform', expected: false },
        { permission: 'system:manage_users', project: null, expected: false }
      ]
    },
    {
      case: 'Test Case 4: Single Project Developer',
      user: '00000000-0000-0000-0000-000000000005', // Charlie
      tests: [
        { permission: 'code:write', project: 'ecommerce-platform', expected: true },
        { permission: 'crew:invoke', project: 'ecommerce-platform', expected: true },
        { permission: 'project:invite_members', project: 'ecommerce-platform', expected: false },
        { permission: 'project:read', project: 'blog-cms', expected: false }
      ]
    },
    {
      case: 'Test Case 5: Multi-Project Developer',
      user: '00000000-0000-0000-0000-000000000006', // Diana
      tests: [
        { permission: 'code:write', project: 'ecommerce-platform', expected: true },
        { permission: 'code:write', project: 'blog-cms', expected: true },
        { permission: 'code:write', project: 'mobile-backend', expected: true },
        { permission: 'project:configure', project: 'blog-cms', expected: false }
      ]
    },
    {
      case: 'Test Case 6: Viewer - Read Only',
      user: '00000000-0000-0000-0000-000000000007', // Eve
      tests: [
        { permission: 'code:read', project: 'ecommerce-platform', expected: true },
        { permission: 'crew:chat', project: 'ecommerce-platform', expected: true },
        { permission: 'code:write', project: 'ecommerce-platform', expected: false },
        { permission: 'code:execute', project: 'ecommerce-platform', expected: false }
      ]
    }
  ];

  let totalTests = 0;
  let passedTests = 0;

  for (const testCase of tests) {
    log('📋', testCase.case);

    for (const test of testCase.tests) {
      totalTests++;

      const projectParam = test.project ? `'${test.project}'` : 'NULL';
      const sql = `
        SELECT check_permission(
          '${testCase.user}'::uuid,
          '${test.permission}',
          ${projectParam}
        ) as result;
      `;

      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

      if (error) {
        log('❌', `  ${test.permission} (${test.project || 'system'}): ERROR`);
        console.error('  Error:', error.message);
        continue;
      }

      const result = data?.[0]?.result;
      const passed = result === test.expected;

      if (passed) {
        passedTests++;
        log('✅', `  ${test.permission} (${test.project || 'system'}): ${result ? 'ALLOWED' : 'DENIED'} ✓`);
      } else {
        log('❌', `  ${test.permission} (${test.project || 'system'}): Expected ${test.expected}, got ${result}`);
      }
    }

    console.log('');
  }

  log('📊', `Test Results: ${passedTests}/${totalTests} passed`);

  if (passedTests === totalTests) {
    log('🎉', 'All permission tests passed!');
  } else {
    log('⚠️', `${totalTests - passedTests} test(s) failed.`);
  }
}

// =====================================================
// CLI Interface
// =====================================================

function showHelp() {
  console.log(`
Alex AI - Supabase Migration Helper

Usage:
  node scripts/apply-migrations.mjs [command]

Commands:
  --apply     Apply all pending migrations
  --test      Run permission test suite
  --verify    Verify database schema
  --help      Show this help message

Environment Variables:
  SUPABASE_URL                  Supabase project URL (default: http://localhost:54321)
  SUPABASE_SERVICE_ROLE_KEY     Supabase service role key (required)

Secrets Management (Recommended Workflow):
  1. Add credentials to ~/.zshrc:
     export SUPABASE_URL="https://your-project.supabase.co"
     export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

  2. Reload shell:
     source ~/.zshrc

  3. Sync to project:
     npm run script:secrets:sync

  4. Run migrations:
     npm run db:migrate

Examples:
  # Recommended: Sync from ~/.zshrc and apply migrations
  npm run script:secrets:sync && npm run db:migrate

  # Test permissions
  npm run db:test

  # Verify schema
  npm run db:verify

  # Manual env var (temporary)
  export SUPABASE_SERVICE_ROLE_KEY="your-key"
  node scripts/apply-migrations.mjs --apply

Get your service role key from:
  https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api

See also:
  - scripts/secrets/allowlist.env (credential whitelist)
  - scripts/ts/secrets/sync-from-shell.ts (sync script)
  - .env.local.example (credential template)
`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('');
  log('🖖', 'Alex AI - Supabase Migration Helper');
  console.log('');

  switch (command) {
    case '--apply':
      await applyMigrations();
      break;

    case '--test':
      await testPermissions();
      break;

    case '--verify':
      await verifySchema();
      break;

    case '--help':
    default:
      showHelp();
      break;
  }

  console.log('');
}

main().catch((error) => {
  console.error('');
  log('❌', 'Fatal error:', error.message);
  console.error(error);
  process.exit(1);
});
