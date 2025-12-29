#!/usr/bin/env node

/**
 * Apply estimated_completion column migration
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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Check if column already exists
console.log('\n🔍 Checking if estimated_completion column exists...');

try {
  // Try to select the column - if it fails, it doesn't exist
  const { data, error } = await supabase
    .from('stories')
    .select('id, estimated_completion')
    .limit(1);

  if (error) {
    if (error.message.includes('estimated_completion')) {
      console.log('❌ Column does not exist. Needs manual migration.');
      console.log('\n' + '='.repeat(60));
      console.log('MIGRATION REQUIRED');
      console.log('='.repeat(60));
      console.log('\nPlease apply the migration manually:');
      console.log('\n1. Open Supabase SQL Editor:');
      console.log('   https://supabase.com/dashboard/project/rpkkkbufdwxmjaerbhbn/sql/new');
      console.log('\n2. Copy and paste the following SQL:');
      console.log('\n' + '-'.repeat(60));
      const migrationSQL = readFileSync(
        join(__dirname, '../supabase/migrations/20251229_add_estimated_completion_to_stories.sql'),
        'utf-8'
      );
      console.log(migrationSQL);
      console.log('-'.repeat(60));
      console.log('\n3. Click "Run" to execute the migration\n');
      process.exit(1);
    } else {
      throw error;
    }
  }

  console.log('✅ Column already exists! Migration already applied.');
  console.log(`   Found ${data?.length || 0} stories in database.`);
  process.exit(0);

} catch (error) {
  console.error('❌ Error checking column:', error.message);
  process.exit(1);
}
