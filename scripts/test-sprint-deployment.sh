#!/bin/bash
# Test Sprint Visualization Deployment
# Tests all sprint endpoints and pages across environments

set -e

echo "🧪 Testing Sprint Visualization Deployment"
echo "=========================================="
echo ""

# Configuration
PROD_URL="https://rag-refresh-product-factory.vercel.app"
CUSTOM_URL="https://rag.pbradygeorgen.com"
LOCAL_URL="http://localhost:3000"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
  local url=$1
  local description=$2

  echo -n "Testing: $description... "

  if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
    echo -e "${GREEN}✅ PASS${NC}"
    return 0
  else
    echo -e "${RED}❌ FAIL${NC}"
    return 1
  fi
}

# Test JSON endpoint
test_api() {
  local url=$1
  local description=$2

  echo -n "Testing API: $description... "

  response=$(curl -s "$url")
  if echo "$response" | jq empty 2>/dev/null; then
    echo -e "${GREEN}✅ PASS${NC} (Valid JSON)"
    return 0
  else
    echo -e "${RED}❌ FAIL${NC} (Invalid JSON)"
    echo "Response: $response"
    return 1
  fi
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo -e "${YELLOW}⚠️  jq not installed. Installing via brew...${NC}"
  brew install jq
fi

echo "1. Testing Production Deployment ($PROD_URL)"
echo "=============================================="
echo ""

# Test production pages
test_endpoint "$PROD_URL/sprints" "Global Sprints Page"
test_endpoint "$PROD_URL/projects/alex-ai/sprints" "Project Sprints Page"

# Test production API endpoints
test_api "$PROD_URL/api/sprints?status=active" "Get Active Sprints"
test_api "$PROD_URL/api/sprints?include_stories=true&limit=1" "Get Sprints with Stories"
test_api "$PROD_URL/api/sprints?project_id=alex-ai" "Get Project Sprints"

echo ""
echo "2. Testing Custom Domain ($CUSTOM_URL)"
echo "======================================="
echo ""

# Check if DNS is configured
if dig +short rag.pbradygeorgen.com CNAME | grep -q "cname.vercel-dns.com"; then
  echo -e "${GREEN}✅ DNS CNAME configured correctly${NC}"

  # Test custom domain pages
  test_endpoint "$CUSTOM_URL/sprints" "Global Sprints Page"
  test_endpoint "$CUSTOM_URL/projects/alex-ai/sprints" "Project Sprints Page"

  # Test custom domain API
  test_api "$CUSTOM_URL/api/sprints?status=active" "Get Active Sprints"
else
  echo -e "${YELLOW}⏳ DNS not configured yet${NC}"
  echo "   To configure:"
  echo "   1. Add CNAME record: rag → cname.vercel-dns.com"
  echo "   2. Wait for DNS propagation (5-60 mins)"
  echo "   3. Re-run this test"
fi

echo ""
echo "3. Testing Local Development ($LOCAL_URL)"
echo "=========================================="
echo ""

# Check if local server is running
if curl -s "$LOCAL_URL" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Local server is running${NC}"

  # Test local pages
  test_endpoint "$LOCAL_URL/sprints" "Global Sprints Page"
  test_endpoint "$LOCAL_URL/projects/alex-ai/sprints" "Project Sprints Page"

  # Test local API
  test_api "$LOCAL_URL/api/sprints?status=active" "Get Active Sprints"
else
  echo -e "${YELLOW}⏳ Local server not running${NC}"
  echo "   To start: npm run dev"
fi

echo ""
echo "4. Testing Database Connection"
echo "==============================="
echo ""

# Test Supabase connection
SUPABASE_URL="https://rpkkkbufdwxmjaerbhbn.supabase.co"
echo -n "Testing Supabase connection... "

# Get anon key from .env.local if it exists
if [ -f .env.local ]; then
  ANON_KEY=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'")

  if [ -n "$ANON_KEY" ]; then
    response=$(curl -s "$SUPABASE_URL/rest/v1/sprints?select=id&limit=1" -H "apikey: $ANON_KEY")
    if echo "$response" | jq empty 2>/dev/null; then
      echo -e "${GREEN}✅ PASS${NC}"

      # Count tables
      echo ""
      echo "Checking Sprint System Tables:"
      for table in sprints stories acceptance_criteria tasks comments personas crew_workload; do
        count=$(curl -s "$SUPABASE_URL/rest/v1/$table?select=count" -H "apikey: $ANON_KEY" -H "Prefer: count=exact" | jq -r '.[0].count // 0')
        echo "  - $table: $count records"
      done
    else
      echo -e "${RED}❌ FAIL${NC}"
    fi
  else
    echo -e "${YELLOW}⏳ Anon key not found in .env.local${NC}"
  fi
else
  echo -e "${YELLOW}⏳ .env.local not found${NC}"
fi

echo ""
echo "5. Detailed API Response Test"
echo "=============================="
echo ""

echo "Fetching sample sprint data from production..."
echo ""

sprint_data=$(curl -s "$PROD_URL/api/sprints?status=active&include_stories=true&limit=1")

if echo "$sprint_data" | jq empty 2>/dev/null; then
  sprint_count=$(echo "$sprint_data" | jq '.sprints | length')
  echo "✅ Found $sprint_count active sprint(s)"

  if [ "$sprint_count" -gt 0 ]; then
    echo ""
    echo "Sample Sprint Data:"
    echo "$sprint_data" | jq '.sprints[0] | {
      id,
      name,
      project_id,
      status,
      start_date,
      end_date,
      velocity_target,
      velocity_actual,
      story_count: (.stories | length)
    }'
  else
    echo ""
    echo -e "${YELLOW}ℹ️  No active sprints found. Create one with:${NC}"
    echo ""
    echo "curl -X POST \"$PROD_URL/api/sprints\" \\"
    echo "  -H \"Content-Type: application/json\" \\"
    echo "  -d '{"
    echo "    \"project_id\": \"alex-ai\","
    echo "    \"name\": \"Sprint 1 - Foundation\","
    echo "    \"sprint_number\": 1,"
    echo "    \"start_date\": \"2025-01-01\","
    echo "    \"end_date\": \"2025-01-14\","
    echo "    \"goals\": [\"Setup\", \"Build UI\"],"
    echo "    \"velocity_target\": 34"
    echo "  }'"
  fi
else
  echo -e "${RED}❌ Failed to fetch sprint data${NC}"
fi

echo ""
echo "6. Browser Test Links"
echo "====================="
echo ""

echo "Open these URLs in your browser to visually test:"
echo ""
echo "Production:"
echo "  - Global View:  $PROD_URL/sprints"
echo "  - Project View: $PROD_URL/projects/alex-ai/sprints"
echo "  - API Data:     $PROD_URL/api/sprints?status=active&include_stories=true"
echo ""

if dig +short rag.pbradygeorgen.com CNAME | grep -q "cname.vercel-dns.com"; then
  echo "Custom Domain:"
  echo "  - Global View:  $CUSTOM_URL/sprints"
  echo "  - Project View: $CUSTOM_URL/projects/alex-ai/sprints"
  echo "  - API Data:     $CUSTOM_URL/api/sprints?status=active&include_stories=true"
  echo ""
fi

if curl -s "$LOCAL_URL" > /dev/null 2>&1; then
  echo "Local:"
  echo "  - Global View:  $LOCAL_URL/sprints"
  echo "  - Project View: $LOCAL_URL/projects/alex-ai/sprints"
  echo "  - API Data:     $LOCAL_URL/api/sprints?status=active&include_stories=true"
  echo ""
fi

echo ""
echo "7. Next Steps"
echo "============="
echo ""

# Check what needs to be done
needs_dns=false
needs_local=false
needs_extension=false

if ! dig +short rag.pbradygeorgen.com CNAME | grep -q "cname.vercel-dns.com"; then
  needs_dns=true
fi

if ! curl -s "$LOCAL_URL" > /dev/null 2>&1; then
  needs_local=true
fi

if [ ! -f "vscode-extension/package.json" ] || ! grep -q "alexAI.viewSprints" vscode-extension/package.json 2>/dev/null; then
  needs_extension=true
fi

if [ "$needs_dns" = true ]; then
  echo "⏳ Configure custom domain DNS:"
  echo "   1. Add CNAME record: rag → cname.vercel-dns.com"
  echo "   2. Wait for propagation (check: dig rag.pbradygeorgen.com CNAME)"
  echo ""
fi

if [ "$needs_local" = true ]; then
  echo "⏳ Start local development server:"
  echo "   npm run dev"
  echo ""
fi

if [ "$needs_extension" = true ]; then
  echo "⏳ Integrate VSCode extension:"
  echo "   1. Add commands to vscode-extension/package.json"
  echo "   2. Import SprintPanel in extension.ts"
  echo "   3. Run: cd vscode-extension && npm run compile"
  echo ""
fi

if [ "$needs_dns" = false ] && [ "$needs_local" = false ] && [ "$needs_extension" = false ]; then
  echo -e "${GREEN}✅ All systems operational!${NC}"
  echo ""
  echo "Sprint Visualization is fully deployed and ready to use."
fi

echo ""
echo "📚 Documentation:"
echo "   - Complete Guide: docs/SPRINT_VISUALIZATION_GUIDE.md"
echo "   - API Reference: docs/SPRINT_API.md"
echo "   - Deployment Status: SPRINT_DEPLOYMENT_STATUS.md"
echo ""

echo "=========================================="
echo "✅ Deployment test complete!"
echo "=========================================="
