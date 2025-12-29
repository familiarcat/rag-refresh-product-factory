#!/usr/bin/env bash

###############################################################################
# Manual Migration Helper Script
#
# This script prepares a migration for manual application via Supabase SQL Editor.
# It copies the SQL to clipboard and provides clear instructions.
#
# Usage: ./scripts/apply-migration-manual.sh [migration-file]
###############################################################################

set -e

MIGRATION_FILE="${1:-supabase/migrations/20251228_create_sprint_system.sql}"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📋 Preparing migration for manual application..."
echo ""

# Copy to clipboard
cat "$MIGRATION_FILE" | pbcopy

# Get file stats
MIGRATION_SIZE=$(stat -f%z "$MIGRATION_FILE" 2>/dev/null || stat -c%s "$MIGRATION_FILE" 2>/dev/null)
MIGRATION_SIZE_KB=$(echo "scale=2; $MIGRATION_SIZE / 1024" | bc)
STATEMENT_COUNT=$(grep -c ";" "$MIGRATION_FILE" || echo "0")

echo "✅ Migration SQL copied to clipboard!"
echo ""
echo "📊 Migration Stats:"
echo "   • File: $MIGRATION_FILE"
echo "   • Size: ${MIGRATION_SIZE_KB} KB"
echo "   • SQL Statements: ~${STATEMENT_COUNT}"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "   1. Open Supabase SQL Editor:"
echo "      https://rpkkkbufdwxmjaerbhbn.supabase.co/project/_/sql"
echo ""
echo "   2. Click 'New query' button"
echo ""
echo "   3. Paste the migration SQL (⌘+V or Ctrl+V)"
echo ""
echo "   4. Click 'Run' button to execute"
echo ""
echo "   5. Verify success message appears"
echo ""
echo "✨ After migration applied, run verification:"
echo "   node scripts/alex-ai/auto-migrate.mjs --verify-only"
echo ""

# Open SQL Editor
open "https://rpkkkbufdwxmjaerbhbn.supabase.co/project/_/sql"

echo "🌐 Supabase SQL Editor opened in browser"
echo ""
echo "⏳ Waiting for you to apply the migration..."
echo "   Press ENTER when done to verify tables were created"

read -r

echo ""
echo "🔍 Verifying migration..."
echo ""

# Verify tables exist
SUPABASE_URL="https://rpkkkbufdwxmjaerbhbn.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwa2trYnVmZHd4bWphZXJiaGJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDA4Njc5MywiZXhwIjoyMDY5NjYyNzkzfQ.tkpxFpJUTG_sfkmauc_E8XmFKp_gnAT4gBhnBaUZTMY"

TABLES=("sprints" "stories" "acceptance_criteria" "tasks" "comments" "personas" "crew_workload")
FOUND_COUNT=0

for table in "${TABLES[@]}"; do
    response=$(curl -s \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Prefer: count=exact" \
        "${SUPABASE_URL}/rest/v1/${table}?select=id&limit=0" 2>&1)

    if echo "$response" | grep -q "does not exist"; then
        echo "   ✗ $table: not found"
    elif echo "$response" | grep -q "\["; then
        echo "   ✓ $table: exists"
        ((FOUND_COUNT++))
    else
        echo "   ⚠️  $table: status unclear"
    fi
done

echo ""

if [ $FOUND_COUNT -eq ${#TABLES[@]} ]; then
    echo "✅ Success! All ${#TABLES[@]} tables created"
    echo ""
    echo "📊 Database Schema:"
    echo "   ✓ sprints table (sprint planning)"
    echo "   ✓ stories table (user/developer stories)"
    echo "   ✓ acceptance_criteria table (Given/When/Then)"
    echo "   ✓ tasks table (story tasks)"
    echo "   ✓ comments table (story comments)"
    echo "   ✓ personas table (13 personas)"
    echo "   ✓ crew_workload table (capacity tracking)"
    echo ""
    echo "🎉 Sprint System ready for use!"
    exit 0
else
    echo "⚠️  Warning: Only ${FOUND_COUNT}/${#TABLES[@]} tables found"
    echo ""
    echo "Possible issues:"
    echo "   • Migration SQL may have had errors"
    echo "   • Some CREATE TABLE statements may have failed"
    echo "   • Check Supabase SQL Editor for error messages"
    echo ""
    echo "Try again:"
    echo "   cat $MIGRATION_FILE | pbcopy"
    echo "   # Then paste and run in SQL Editor"
    exit 1
fi
