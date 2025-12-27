#!/bin/bash

# Apply drill system migration to production Supabase
# Reads .env.local for credentials

set -e

echo "🔧 Drill System Migration Application Script"
echo ""

# Read .env.local
if [ ! -f ".env.local" ]; then
  echo "❌ Error: .env.local not found"
  exit 1
fi

# Extract Supabase credentials
SUPABASE_URL=$(grep "^SUPABASE_URL=" .env.local | cut -d'=' -f2 | tr -d '"')
SUPABASE_KEY=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" .env.local | cut -d'=' -f2 | tr -d '"')
PROJECT_REF=$(echo "$SUPABASE_URL" | sed 's|https://||' | cut -d'.' -f1)

echo "🔗 Supabase Project: $PROJECT_REF"
echo "📍 URL: $SUPABASE_URL"
echo ""

# Check if tables already exist
echo "🔍 Checking if drill tables already exist..."
echo ""

tables_exist=0

for table in drill_scenarios drill_runs drill_executions drill_evaluations; do
  response=$(curl -s "${SUPABASE_URL}/rest/v1/${table}?select=id&limit=0" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    -H "Prefer: count=exact" 2>&1)

  if echo "$response" | grep -q "does not exist"; then
    echo "✗ $table: does not exist"
  elif echo "$response" | grep -q "\["; then
    echo "✓ $table: exists"
    tables_exist=$((tables_exist + 1))
  else
    echo "⚠️  $table: unable to verify"
  fi
done

echo ""

if [ $tables_exist -eq 4 ]; then
  echo "✅ All 4 drill tables already exist!"
  echo "   No migration needed."
  echo ""
  exit 0
elif [ $tables_exist -gt 0 ]; then
  echo "⚠️  Partial migration detected ($tables_exist/4 tables exist)"
  echo "   Manual intervention may be required."
  echo ""
fi

echo "================================================================"
echo "MANUAL MIGRATION REQUIRED"
echo "================================================================"
echo ""
echo "The drill system tables need to be created in your Supabase database."
echo ""
echo "📋 Option 1: Supabase SQL Editor (Recommended)"
echo "────────────────────────────────────────────────────────────────"
echo ""
echo "1. Open the Supabase SQL Editor:"
echo "   https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
echo ""
echo "2. Copy the migration SQL file contents:"
echo "   File: supabase/migrations/20251220_create_drill_system.sql"
echo ""
echo "3. Paste into the SQL editor and click 'Run'"
echo ""
echo "================================================================"
echo "📋 Option 2: Using Supabase CLI"
echo "────────────────────────────────────────────────────────────────"
echo ""
echo "1. Link your project:"
echo "   $ supabase link --project-ref $PROJECT_REF"
echo ""
echo "2. Apply migrations:"
echo "   $ supabase db push"
echo ""
echo "================================================================"
echo ""
echo "After applying the migration, run this script again to verify."
echo ""

exit 1
