#!/usr/bin/env node

/**
 * Apply SQL directly to Supabase using REST API
 */

import { readFileSync } from 'fs';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Load .env.local
config({ path: join(ROOT_DIR, '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sqlFile = process.argv[2] || '/tmp/combined_migration.sql';
const sql = readFileSync(sqlFile, 'utf-8');

console.log(`\n📄 Reading SQL from: ${sqlFile}`);
console.log(`📊 SQL length: ${sql.length} characters\n`);

// Split into statements (naive split on semicolons not in strings)
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\/\*/));

console.log(`📝 Found ${statements.length} SQL statements\n`);

async function executeStatement(stmt, index) {
  // Use PostgREST raw SQL endpoint if available, or create a simple query endpoint
  const url = `${SUPABASE_URL}/rest/v1/rpc/query`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ sql: stmt + ';' })
    });

    if (!response.ok) {
      const text = await response.text();
      // Ignore "already exists" errors
      if (text.includes('already exists')) {
        console.log(`⏭️  [${index + 1}/${statements.length}] Skipped (already exists)`);
        return true;
      }
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    console.log(`✅ [${index + 1}/${statements.length}] Success`);
    return true;

  } catch (error) {
    console.error(`❌ [${index + 1}/${statements.length}] Failed:`, error.message);
    console.error(`   Statement: ${stmt.substring(0, 100)}...`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting SQL execution...\n');

  for (let i = 0; i < statements.length; i++) {
    const success = await executeStatement(statements[i], i);
    if (!success) {
      console.log('\n❌ Migration failed. Stopping.\n');
      process.exit(1);
    }
  }

  console.log('\n🎉 All SQL statements executed successfully!\n');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
