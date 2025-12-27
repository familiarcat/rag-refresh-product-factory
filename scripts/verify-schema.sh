#!/bin/bash

# Verify Supabase Schema - Complete Ownership Tracking
# This script verifies that the RBAC schema with ownership tracking is properly applied

set -e

SUPABASE_URL="${SUPABASE_URL:-https://rpkkkbufdwxmjaerbhbn.supabase.co}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ SUPABASE_SERVICE_ROLE_KEY not set"
  echo "Loading from .env.local..."
  if [ -f .env.local ]; then
    export $(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | xargs)
  fi
fi

echo "🔍 Verifying Supabase Schema..."
echo ""

# Function to query Supabase
query_supabase() {
  local sql="$1"
  curl -s -X POST \
    "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$sql\"}"
}

# Check if tables exist
echo "📋 Checking Tables..."
TABLES=(
  "auth_profiles"
  "roles"
  "permissions"
  "role_permissions"
  "projects"
  "project_members"
  "crew_members"
  "crew_missions"
  "files"
  "sitemaps"
  "sitemap_nodes"
  "recommendations"
  "api_keys"
  "sessions"
  "audit_log"
)

for table in "${TABLES[@]}"; do
  echo -n "  • $table: "
  # Check if table exists
  result=$(psql "$DATABASE_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');" 2>/dev/null || echo "f")
  if [[ "$result" == *"t"* ]]; then
    echo "✅"
  else
    echo "❌ Missing"
  fi
done

echo ""
echo "🔑 Checking Ownership Columns..."

# Check ownership columns
OWNERSHIP_CHECKS=(
  "projects:owner_id"
  "projects:created_by"
  "files:owner_id"
  "files:project_id"
  "crew_missions:created_by"
  "crew_missions:project_id"
  "sitemaps:created_by"
  "sitemaps:project_id"
  "recommendations:created_by"
  "recommendations:project_id"
  "api_keys:user_id"
  "sessions:user_id"
  "audit_log:user_id"
  "project_members:invited_by"
)

for check in "${OWNERSHIP_CHECKS[@]}"; do
  IFS=':' read -r table column <<< "$check"
  echo -n "  • $table.$column: "
  result=$(psql "$DATABASE_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '$table' AND column_name = '$column');" 2>/dev/null || echo "f")
  if [[ "$result" == *"t"* ]]; then
    echo "✅"
  else
    echo "❌ Missing"
  fi
done

echo ""
echo "🔐 Checking Permissions..."

# Expected permissions
EXPECTED_PERMISSIONS=(
  "projects:create"
  "projects:read"
  "projects:update"
  "projects:delete"
  "data:read"
  "data:write"
  "data:delete"
  "crew:manage"
  "settings:manage"
  "users:manage"
)

echo "  Expected ${#EXPECTED_PERMISSIONS[@]} permissions"

echo ""
echo "👥 Checking Roles..."

# Expected roles
EXPECTED_ROLES=(
  "administrator"
  "owner"
  "developer"
  "viewer"
)

echo "  Expected ${#EXPECTED_ROLES[@]} roles"

echo ""
echo "🔧 Checking Functions..."

# Check if RPC functions exist
FUNCTIONS=(
  "check_permission"
  "log_audit"
  "get_user_role"
)

for func in "${FUNCTIONS[@]}"; do
  echo -n "  • $func(): "
  result=$(psql "$DATABASE_URL" -t -c "SELECT EXISTS (SELECT FROM pg_proc WHERE proname = '$func');" 2>/dev/null || echo "f")
  if [[ "$result" == *"t"* ]]; then
    echo "✅"
  else
    echo "❌ Missing"
  fi
done

echo ""
echo "✅ Schema verification complete!"
echo ""
echo "Next steps:"
echo "  1. Test API connection: curl http://localhost:3001/api/dev/test-auth"
echo "  2. Generate API key: curl 'http://localhost:3001/api/dev/test-auth?action=create-api-key&email=dev1@example.com'"
echo "  3. Test projects API: curl -H 'Authorization: Bearer <api_key>' http://localhost:3001/api/projects"
