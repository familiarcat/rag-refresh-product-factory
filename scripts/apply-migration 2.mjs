#!/usr/bin/env node

/**
 * Apply drill system migration to production Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables from .env.local
const envContent = readFileSync(join(__dirname, '../.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=# ]+)=["']?([^"'\n]*)["']?$/);
  if (match) {
    env[match[1]] = match[2];
  }
});

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase...');
console.log(`📍 URL: ${SUPABASE_URL}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Read migration SQL
const migrationPath = join(__dirname, '../supabase/migrations/20251220_create_drill_system.sql');
console.log(`\n📖 Reading migration: ${migrationPath}`);
const migrationSQL = readFileSync(migrationPath, 'utf-8');

console.log(`📊 Migration size: ${migrationSQL.length} characters`);

// Split SQL into executable statements
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

// Execute migration using Supabase SQL function
console.log('🚀 Applying migration to production database...\n');

try {
  // For Supabase, we need to use their SQL execution method
  // Unfortunately, there's no direct way to execute raw SQL via the JS client
  // We'll need to use the REST API directly

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ query: migrationSQL })
  });

  if (!response.ok) {
    // exec_sql RPC doesn't exist, we need a different approach
    console.log('⚠️  Direct SQL execution not available via REST API');
    console.log('📋 Using alternative approach: Manual table creation\n');

    // Alternative: Provide instructions for manual application
    console.log('='.repeat(60));
    console.log('MIGRATION APPLICATION REQUIRED');
    console.log('='.repeat(60));
    console.log('\nThe drill system migration needs to be applied manually.');
    console.log('\nOption 1: Supabase SQL Editor (Recommended)');
    console.log('1. Open: https://supabase.com/dashboard/project/rpkkkbufdwxmjaerbhbn/sql/new');
    console.log('2. Copy and paste the contents of:');
    console.log('   supabase/migrations/20251220_create_drill_system.sql');
    console.log('3. Click "Run" to execute the migration');

    console.log('\nOption 2: Using Supabase CLI');
    console.log('1. Run: supabase link --project-ref rpkkkbufdwxmjaerbhbn');
    console.log('2. Enter your database password');
    console.log('3. Run: supabase db push');

    console.log('\n' + '='.repeat(60) + '\n');

    // Verify current state
    console.log('🔍 Verifying current database state...\n');

    const tables = ['drill_scenarios', 'drill_runs', 'drill_executions', 'drill_evaluations'];
    let existingCount = 0;

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('id', { count: 'exact', head: true });

        if (!error) {
          console.log(`✓ ${table}: exists (count: ${count || 0})`);
          existingCount++;
        }
      } catch (e) {
        console.log(`✗ ${table}: does not exist`);
      }
    }

    console.log(`\n📊 Status: ${existingCount}/4 drill tables exist`);

    if (existingCount === 0) {
      console.log('\n❗ No drill tables found. Migration needs to be applied.');
      console.log('   Please use one of the options above to apply the migration.\n');
      process.exit(1);
    } else if (existingCount === 4) {
      console.log('\n✅ All drill tables exist! Migration already applied.\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  Partial migration detected. Please complete the migration.\n');
      process.exit(1);
    }
  }

  const result = await response.json();
  console.log('✅ Migration applied successfully!');
  console.log(result);

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
