#!/usr/bin/env node

/**
 * Direct Supabase Migration Script
 *
 * Applies migrations by reading SQL files and executing them directly
 * via Supabase Management API instead of relying on custom RPC functions.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Load environment variables
const envLocalPath = join(ROOT_DIR, '.env.local');
if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nRun: npm run script:secrets:sync');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('❌ Could not extract project ref from SUPABASE_URL');
  process.exit(1);
}

const MIGRATIONS = [
  {
    name: '001_rbac_schema.sql',
    path: join(ROOT_DIR, 'supabase', 'migrations', '001_rbac_schema.sql'),
  },
  {
    name: '002_seed_test_data.sql',
    path: join(ROOT_DIR, 'supabase', 'migrations', '002_seed_test_data.sql'),
  }
];

async function executeSqlQuery(sql) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return await response.json();
}

async function applyMigration(migration) {
  console.log(`\n📄 Applying: ${migration.name}`);

  try {
    const sql = readFileSync(migration.path, 'utf-8');

    // Use Supabase SQL API directly
    const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql })
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      throw new Error(result.error?.message || result.message || 'Unknown error');
    }

    console.log(`✅ Success: ${migration.name}`);
    return true;

  } catch (error) {
    console.error(`❌ Failed: ${migration.name}`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n🖖 Alex AI - Direct Migration Script\n');
  console.log(`📍 Project: ${projectRef}`);
  console.log(`🔗 URL: ${SUPABASE_URL}\n`);

  let allSuccess = true;

  for (const migration of MIGRATIONS) {
    const success = await applyMigration(migration);
    if (!success) {
      allSuccess = false;
      break;
    }
  }

  if (allSuccess) {
    console.log('\n🎉 All migrations completed successfully!\n');
  } else {
    console.log('\n❌ Migration failed. See errors above.\n');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error.message);
  console.error(error);
  process.exit(1);
});
