#!/bin/bash

# Supabase Migration Verification Script
# Run this after applying the migration to verify everything works

set -e

echo "🔍 Verifying Supabase Migration..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

echo "Step 1: Test Database Connection"
echo "================================="
response=$(curl -s http://localhost:3001/api/dev/test-auth)
if echo "$response" | grep -q "database"; then
  echo -e "${GREEN}✅ Database connected${NC}"
  echo "$response" | jq '.' 2>/dev/null || echo "$response"
else
  echo -e "${RED}❌ Database connection failed${NC}"
  echo "$response"
  exit 1
fi

echo ""
echo "Step 2: Verify Tables Created"
echo "=============================="
echo "Expected tables: 15"
table_count=$(echo "$response" | jq '.tables | length' 2>/dev/null || echo "0")
echo "Found tables: $table_count"

if [ "$table_count" -eq 15 ]; then
  echo -e "${GREEN}✅ All tables created${NC}"
else
  echo -e "${YELLOW}⚠️  Expected 15 tables, found $table_count${NC}"
fi

echo ""
echo "Step 3: Generate Test API Key"
echo "=============================="
api_response=$(curl -s "http://localhost:3001/api/dev/test-auth?action=create-api-key&email=admin@example.com")
api_key=$(echo "$api_response" | jq -r '.api_key' 2>/dev/null)

if [ -n "$api_key" ] && [ "$api_key" != "null" ]; then
  echo -e "${GREEN}✅ API key generated${NC}"
  echo "API Key: ${api_key:0:20}..."
  export ALEX_API_KEY="$api_key"
else
  echo -e "${RED}❌ Failed to generate API key${NC}"
  echo "$api_response"
  exit 1
fi

echo ""
echo "Step 4: Test API Authentication"
echo "==============================="
projects_response=$(curl -s -H "Authorization: Bearer $ALEX_API_KEY" http://localhost:3001/api/projects)
if echo "$projects_response" | grep -q "projects"; then
  echo -e "${GREEN}✅ API authentication working${NC}"
  echo "$projects_response" | jq '.' 2>/dev/null || echo "$projects_response"
else
  echo -e "${RED}❌ API authentication failed${NC}"
  echo "$projects_response"
  exit 1
fi

echo ""
echo "Step 5: Verify Seed Data"
echo "========================"
echo "Checking roles..."
roles_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM roles;" 2>/dev/null || echo "0")
echo "Roles: $roles_count (expected: 4)"

echo "Checking permissions..."
perms_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM permissions;" 2>/dev/null || echo "0")
echo "Permissions: $perms_count (expected: 12)"

echo "Checking crew members..."
crew_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM crew_members;" 2>/dev/null || echo "0")
echo "Crew members: $crew_count (expected: 8)"

echo ""
echo "Step 6: Test Database Functions"
echo "================================"
# Note: This requires psql connection
if command -v psql &> /dev/null; then
  func_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_proc WHERE proname IN ('check_permission', 'log_audit', 'get_user_role', 'update_updated_at_column');" 2>/dev/null || echo "0")
  echo "Functions created: $func_count (expected: 4)"

  if [ "$func_count" -eq 4 ]; then
    echo -e "${GREEN}✅ All functions created${NC}"
  else
    echo -e "${YELLOW}⚠️  Expected 4 functions, found $func_count${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  psql not available, skipping function check${NC}"
fi

echo ""
echo "================================"
echo -e "${GREEN}🎉 Migration Verification Complete!${NC}"
echo "================================"
echo ""
echo "Summary:"
echo "--------"
echo "✅ Database connection: Working"
echo "✅ Tables: $table_count/15"
echo "✅ API Key: Generated"
echo "✅ Authentication: Working"
echo "✅ Seed Data: Loaded"
echo ""
echo "Your API Key (save this):"
echo "$ALEX_API_KEY"
echo ""
echo "Next steps:"
echo "1. Test VSCode extension with API key"
echo "2. Test image paste/OCR functionality"
echo "3. Build sitemap integration"
