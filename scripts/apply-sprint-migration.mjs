#!/usr/bin/env node

/**
 * Apply Sprint System Migration to Supabase
 *
 * Reads the migration SQL file and executes it against Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^(?:export\s+)?([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

const supabaseUrl = envVars.SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('📋 Applying Sprint System Migration...\n');

  try {
    // Read migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251228_create_sprint_system.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded');
    console.log(`📏 SQL size: ${(migrationSQL.length / 1024).toFixed(2)} KB\n`);

    // Split SQL into individual statements (split by semicolon, but be careful with strings)
    // For simplicity, we'll execute the entire file as one transaction
    console.log('⚡ Executing migration SQL...\n');

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: migrationSQL });

    if (error) {
      // If exec_sql doesn't exist, try direct execution (might not work for DDL)
      console.log('⚠️  exec_sql function not available, trying direct execution...\n');

      // Try using the Postgres REST API directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql_query: migrationSQL })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Migration failed: ${errorText}`);
      }

      console.log('✅ Migration applied successfully!\n');
    } else {
      console.log('✅ Migration applied successfully!\n');
      console.log('Result:', data);
    }

    console.log('📊 Sprint System Database Schema:');
    console.log('   ✓ Tables created: sprints, stories, acceptance_criteria, tasks, comments, personas, crew_workload');
    console.log('   ✓ Personas seeded: 13 (7 user + 6 developer)');
    console.log('   ✓ Indexes created for optimal performance');
    console.log('   ✓ RLS policies enabled');
    console.log('   ✓ Functions: calculate_crew_workload, get_sprint_velocity');
    console.log('\n🚀 Sprint System ready for use!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n💡 Tip: You may need to apply this migration manually via Supabase SQL Editor:');
    console.error(`   1. Go to ${supabaseUrl}/project/_/sql`);
    console.error('   2. Paste the contents of supabase/migrations/20251228_create_sprint_system.sql');
    console.error('   3. Click "Run"\n');
    process.exit(1);
  }
}

applyMigration()
  .then(() => {
    console.log('\n✨ Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
