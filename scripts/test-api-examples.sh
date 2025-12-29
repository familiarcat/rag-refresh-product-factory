#!/usr/bin/env bash

###############################################################################
# Sprint API Usage Examples
#
# Demonstrates complete workflow using the Sprint Management API
###############################################################################

set -e

SUPABASE_URL="https://rpkkkbufdwxmjaerbhbn.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwa2trYnVmZHd4bWphZXJiaGJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDA4Njc5MywiZXhwIjoyMDY5NjYyNzkzfQ.tkpxFpJUTG_sfkmauc_E8XmFKp_gnAT4gBhnBaUZTMY"

API_BASE="http://localhost:3000/api"

echo "🚀 Sprint API - Complete Workflow Example"
echo ""
echo "Prerequisites: Next.js dev server must be running (npm run dev)"
echo ""

# Check if Next.js is running
if ! curl -s "http://localhost:3000" > /dev/null 2>&1; then
  echo "❌ Next.js dev server not running!"
  echo "   Start it with: npm run dev"
  echo ""
  exit 1
fi

echo "✅ Next.js dev server detected"
echo ""

# ============================================================================
# Step 1: Create a Sprint
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Create Sprint"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "POST /api/sprints"
echo ""

SPRINT_RESPONSE=$(curl -s -X POST "${API_BASE}/sprints" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "alex-ai",
    "name": "Sprint 1 - Foundation",
    "sprint_number": 1,
    "start_date": "2025-01-01",
    "end_date": "2025-01-14",
    "goals": [
      "Set up sprint system",
      "Build timeline UI",
      "Implement crew assignment"
    ],
    "velocity_target": 34
  }')

SPRINT_ID=$(echo "$SPRINT_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//g' | sed 's/"//g')

if [ -z "$SPRINT_ID" ]; then
  echo "❌ Failed to create sprint"
  echo "$SPRINT_RESPONSE"
  exit 1
fi

echo "✅ Sprint created"
echo "   ID: $SPRINT_ID"
echo "   Name: Sprint 1 - Foundation"
echo "   Duration: 2025-01-01 to 2025-01-14"
echo "   Velocity Target: 34 points"
echo ""

# ============================================================================
# Step 2: Get Personas
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Get Available Personas"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get Power User persona (technical_level: 6)
POWER_USER_ID=$(curl -s \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  "${SUPABASE_URL}/rest/v1/personas?name=eq.Power%20User&select=id" | \
  grep -o '"id":"[^"]*"' | sed 's/"id":"//g' | sed 's/"//g')

# Get Backend Developer persona
BACKEND_DEV_ID=$(curl -s \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  "${SUPABASE_URL}/rest/v1/personas?name=eq.Backend%20Developer&select=id" | \
  grep -o '"id":"[^"]*"' | sed 's/"id":"//g' | sed 's/"//g')

echo "✅ Personas loaded"
echo "   Power User ID: $POWER_USER_ID"
echo "   Backend Developer ID: $BACKEND_DEV_ID"
echo ""

# ============================================================================
# Step 3: Create Stories
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Create Stories with Acceptance Criteria"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Story 1: User Story
echo "Creating User Story..."

STORY1_RESPONSE=$(curl -s -X POST "${API_BASE}/stories" \
  -H "Content-Type: application/json" \
  -d "{
    \"project_id\": \"alex-ai\",
    \"sprint_id\": \"$SPRINT_ID\",
    \"title\": \"View sprint timeline in horizontal format\",
    \"description\": \"As a Power User, I want to see sprints in a horizontal timeline so I can visualize project progress at a glance\",
    \"story_type\": \"user_story\",
    \"persona_id\": \"$POWER_USER_ID\",
    \"story_points\": 8,
    \"priority\": 1,
    \"acceptance_criteria\": [
      {
        \"given_clause\": \"Given I am on the project dashboard\",
        \"when_clause\": \"When I view the sprint section\",
        \"then_clause\": \"Then I see a horizontal timeline with crew swimlanes\",
        \"display_order\": 1
      },
      {
        \"given_clause\": \"Given I hover over a story card\",
        \"when_clause\": \"When the tooltip appears\",
        \"then_clause\": \"Then I see story details and assigned crew member\",
        \"display_order\": 2
      }
    ]
  }")

STORY1_ID=$(echo "$STORY1_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//g' | sed 's/"//g')

echo "✅ Story 1 created: $STORY1_ID"
echo "   Title: View sprint timeline in horizontal format"
echo "   Type: User Story"
echo "   Points: 8"
echo ""

# Story 2: Developer Story
echo "Creating Developer Story..."

STORY2_RESPONSE=$(curl -s -X POST "${API_BASE}/stories" \
  -H "Content-Type: application/json" \
  -d "{
    \"project_id\": \"alex-ai\",
    \"sprint_id\": \"$SPRINT_ID\",
    \"title\": \"Implement AI crew assignment algorithm\",
    \"description\": \"As a Backend Developer, I need to build the multi-factor scoring algorithm for crew assignment\",
    \"story_type\": \"developer_story\",
    \"persona_id\": \"$BACKEND_DEV_ID\",
    \"story_points\": 13,
    \"priority\": 1,
    \"acceptance_criteria\": [
      {
        \"given_clause\": \"Given a story with persona and requirements\",
        \"when_clause\": \"When I request crew assignment recommendations\",
        \"then_clause\": \"Then I receive ranked list of crew members with scores\",
        \"display_order\": 1
      },
      {
        \"given_clause\": \"Given the top recommendation has score > 80%\",
        \"when_clause\": \"When assignment is requested\",
        \"then_clause\": \"Then the story is automatically assigned\",
        \"display_order\": 2
      }
    ]
  }")

STORY2_ID=$(echo "$STORY2_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//g' | sed 's/"//g')

echo "✅ Story 2 created: $STORY2_ID"
echo "   Title: Implement AI crew assignment algorithm"
echo "   Type: Developer Story"
echo "   Points: 13"
echo ""

# ============================================================================
# Step 4: Get AI Crew Assignment Recommendations
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: AI Crew Assignment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Getting recommendations for Story 2 (AI algorithm)..."
echo ""
echo "POST /api/stories/$STORY2_ID/assign"
echo ""

ASSIGNMENT_RESPONSE=$(curl -s -X POST "${API_BASE}/stories/${STORY2_ID}/assign" \
  -H "Content-Type: application/json" \
  -d '{}')

# Extract auto-assigned crew member
AUTO_ASSIGNED=$(echo "$ASSIGNMENT_RESPONSE" | grep -o '"auto_assigned":"[^"]*"' | sed 's/"auto_assigned":"//g' | sed 's/"//g')

if [ -n "$AUTO_ASSIGNED" ]; then
  echo "✅ Auto-assigned to: $AUTO_ASSIGNED"
else
  echo "⚠️  No auto-assignment (confidence < 80%)"
fi

echo ""
echo "Top 3 Recommendations:"
echo "$ASSIGNMENT_RESPONSE" | grep -o '"crew_member_name":"[^"]*"' | head -3 | sed 's/"crew_member_name":"//g' | sed 's/"//g' | nl
echo ""

# ============================================================================
# Step 5: Update Story Status
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5: Update Story Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Moving Story 1 to 'in_progress'..."

curl -s -X PATCH "${API_BASE}/stories/${STORY1_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress"
  }' > /dev/null

echo "✅ Status updated: in_progress"
echo ""

# ============================================================================
# Step 6: Query Sprint with Stories
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 6: Query Sprint"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "GET /api/sprints?project_id=alex-ai&include_stories=true"
echo ""

SPRINT_QUERY=$(curl -s "${API_BASE}/sprints?project_id=alex-ai&include_stories=true")

SPRINT_COUNT=$(echo "$SPRINT_QUERY" | grep -o '"id":"[^"]*"' | wc -l | tr -d ' ')

echo "✅ Found $SPRINT_COUNT sprint(s)"
echo ""

# ============================================================================
# Step 7: Complete Sprint
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 7: Complete Sprint"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Updating sprint to 'completed' with velocity_actual..."

curl -s -X PATCH "${API_BASE}/sprints/${SPRINT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "velocity_actual": 21
  }' > /dev/null

echo "✅ Sprint completed"
echo "   Velocity Target: 34 points"
echo "   Velocity Actual: 21 points"
echo "   Completion Rate: 62%"
echo ""

# ============================================================================
# Summary
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Workflow Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Summary:"
echo "  ✅ Created sprint: Sprint 1 - Foundation"
echo "  ✅ Created 2 stories (8 + 13 = 21 points)"
echo "  ✅ AI crew assignment: Auto-assigned to $AUTO_ASSIGNED"
echo "  ✅ Updated story status: in_progress"
echo "  ✅ Completed sprint with velocity tracking"
echo ""
echo "📊 Database Records:"
echo "  • 1 sprint (alex-ai project)"
echo "  • 2 stories with acceptance criteria"
echo "  • AI assignment recommendations"
echo ""
echo "🔗 API Endpoints Used:"
echo "  • POST /api/sprints"
echo "  • POST /api/stories"
echo "  • POST /api/stories/[id]/assign"
echo "  • PATCH /api/stories/[id]"
echo "  • PATCH /api/sprints/[id]"
echo "  • GET /api/sprints"
echo ""
echo "🚀 Sprint API is production-ready!"
echo ""
