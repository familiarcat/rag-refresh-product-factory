#!/usr/bin/env node

/**
 * Quick Database Verification Script
 * Checks if Supabase RBAC schema is properly set up
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

config({ path: join(ROOT_DIR, '.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
  console.log('\n🔍 Verifying Supabase RBAC Schema...\n');

  const checks = [
    {
      name: 'auth_profiles table',
      test: async () => {
        const { data, error } = await supabase
          .from('auth_profiles')
          .select('id, email, system_role')
          .limit(1);
        return !error;
      }
    },
    {
      name: 'projects table',
      test: async () => {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .limit(1);
        return !error;
      }
    },
    {
      name: 'roles table',
      test: async () => {
        const { count, error } = await supabase
          .from('roles')
          .select('*', { count: 'exact', head: true });
        return !error && count >= 4;
      }
    },
    {
      name: 'permissions table',
      test: async () => {
        const { count, error } = await supabase
          .from('permissions')
          .select('*', { count: 'exact', head: true });
        return !error && count >= 20;
      }
    },
    {
      name: 'api_keys table',
      test: async () => {
        const { data, error } = await supabase
          .from('api_keys')
          .select('id')
          .limit(1);
        return !error;
      }
    },
    {
      name: 'check_permission() function',
      test: async () => {
        const { data, error } = await supabase
          .rpc('check_permission', {
            p_user_id: '00000000-0000-0000-0000-000000000001',
            p_permission: 'project:read',
            p_project_id: null
          });
        return !error;
      }
    },
    {
      name: 'Test users exist',
      test: async () => {
        const { count, error } = await supabase
          .from('auth_profiles')
          .select('*', { count: 'exact', head: true });
        return !error && count >= 9;
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    try {
      const result = await check.test();
      if (result) {
        console.log(`✅ ${check.name}`);
        passed++;
      } else {
        console.log(`❌ ${check.name}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${check.name}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed}/${checks.length} checks passed\n`);

  if (failed === 0) {
    console.log('🎉 Database schema is ready!\n');
    console.log('Next steps:');
    console.log('  1. Test API endpoint: curl http://localhost:3001/api/dev/test-auth');
    console.log('  2. Generate API key: See RBAC_INTEGRATION_TESTING.md\n');
  } else {
    console.log('⚠️  Some checks failed. Migration may not be complete.\n');
    console.log('To apply migrations:');
    console.log('  - See MIGRATION_INSTRUCTIONS.md');
    console.log('  - Or open: https://supabase.com/dashboard/project/rpkkkbufdwxmjaerbhbn/sql/new\n');
  }
}

verify().catch(error => {
  console.error('\n❌ Verification failed:', error.message);
  console.error('\nMake sure migrations are applied first.\n');
  process.exit(1);
});
