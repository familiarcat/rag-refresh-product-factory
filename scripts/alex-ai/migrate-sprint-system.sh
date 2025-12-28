#!/usr/bin/env bash

#############################################################################
# Alex AI Sprint System Migration Automation
#
# One-command migration deployment with multiple fallback methods:
#   1. Supabase CLI (if installed)
#   2. Copy to clipboard for manual paste
#   3. Direct URL to SQL Editor
#   4. Verification of applied migration
#
# Usage:
#   ./scripts/alex-ai/migrate-sprint-system.sh
#
# This script will automatically detect the best method and guide you through.
#############################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MIGRATION_FILE="$PROJECT_ROOT/supabase/migrations/20251228_create_sprint_system.sql"

echo -e "${BOLD}${BLUE}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║  🤖 Alex AI Sprint System Migration                           ║
║  Automated Database Schema Deployment                         ║
╚════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

# Source credentials from ~/.zshrc
echo -e "${BLUE}[1/5]${NC} Loading Supabase credentials from ~/.zshrc..."
if [ -f ~/.zshrc ]; then
    source ~/.zshrc

    if [ -z "${SUPABASE_URL:-}" ]; then
        echo -e "${RED}✗${NC} SUPABASE_URL not found in ~/.zshrc"
        exit 1
    fi

    echo -e "${GREEN}✓${NC} Loaded SUPABASE_URL: $SUPABASE_URL"
else
    echo -e "${RED}✗${NC} ~/.zshrc not found"
    exit 1
fi

# Extract project reference
PROJECT_REF=$(echo "$SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co|\1|')
echo -e "${BLUE}  Project Reference: ${PROJECT_REF}${NC}\n"

# Check if migration file exists
echo -e "${BLUE}[2/5]${NC} Checking migration file..."
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}✗${NC} Migration file not found: $MIGRATION_FILE"
    exit 1
fi

MIGRATION_SIZE=$(stat -f%z "$MIGRATION_FILE" 2>/dev/null || stat -c%s "$MIGRATION_FILE" 2>/dev/null)
MIGRATION_SIZE_KB=$(echo "scale=2; $MIGRATION_SIZE / 1024" | bc)

echo -e "${GREEN}✓${NC} Found migration file (${MIGRATION_SIZE_KB} KB)"
echo -e "${BLUE}  Statements: $(grep -c ";" "$MIGRATION_FILE")${NC}\n"

# Determine migration method
echo -e "${BLUE}[3/5]${NC} Determining best migration method...\n"

# Method 1: Check if Supabase CLI is installed
if command -v supabase &> /dev/null; then
    echo -e "${GREEN}✓${NC} Supabase CLI detected"
    echo -e "${BOLD}Using Method 1: Supabase CLI${NC}\n"

    # Check if project is linked
    if supabase projects list 2>&1 | grep -q "$PROJECT_REF"; then
        echo -e "${GREEN}✓${NC} Project is linked"
    else
        echo -e "${YELLOW}⚠${NC}  Linking project..."
        supabase link --project-ref "$PROJECT_REF"
    fi

    echo -e "\n${BLUE}Applying migration via Supabase CLI...${NC}\n"

    # Apply migration
    if supabase db push; then
        echo -e "\n${GREEN}${BOLD}✓ Migration applied successfully via Supabase CLI!${NC}\n"
        MIGRATION_APPLIED=true
    else
        echo -e "\n${YELLOW}⚠${NC}  Supabase CLI failed, falling back to manual method...\n"
        MIGRATION_APPLIED=false
    fi
else
    echo -e "${YELLOW}⚠${NC}  Supabase CLI not installed"
    echo -e "${BLUE}  Install with: brew install supabase/tap/supabase${NC}\n"
    MIGRATION_APPLIED=false
fi

# Method 2: Copy to clipboard (macOS)
if [ "$MIGRATION_APPLIED" != "true" ] && command -v pbcopy &> /dev/null; then
    echo -e "${BOLD}Using Method 2: Copy to Clipboard${NC}\n"

    cat "$MIGRATION_FILE" | pbcopy

    echo -e "${GREEN}✓${NC} Migration SQL copied to clipboard!\n"
    echo -e "${BOLD}${YELLOW}Manual Step Required:${NC}"
    echo -e "${BLUE}1.${NC} Open Supabase SQL Editor:"
    echo -e "   ${BLUE}${SUPABASE_URL}/project/_/sql${NC}"
    echo -e "${BLUE}2.${NC} Click ${BOLD}'New query'${NC}"
    echo -e "${BLUE}3.${NC} Paste (${BOLD}Cmd+V${NC}) the migration SQL"
    echo -e "${BLUE}4.${NC} Click ${BOLD}'Run'${NC} button"
    echo -e "\n${YELLOW}Press ENTER after applying the migration...${NC}"
    read -r

    MIGRATION_APPLIED="manual"
elif [ "$MIGRATION_APPLIED" != "true" ]; then
    # Method 3: Show manual instructions
    echo -e "${BOLD}Using Method 3: Manual Application${NC}\n"
    echo -e "${BOLD}${YELLOW}Manual Step Required:${NC}\n"
    echo -e "${BLUE}1.${NC} Open Supabase SQL Editor:"
    echo -e "   ${BLUE}${SUPABASE_URL}/project/_/sql${NC}\n"
    echo -e "${BLUE}2.${NC} Copy migration file contents:"
    echo -e "   ${BLUE}cat $MIGRATION_FILE${NC}\n"
    echo -e "${BLUE}3.${NC} Paste into SQL Editor and click ${BOLD}'Run'${NC}\n"
    echo -e "${YELLOW}Press ENTER after applying the migration...${NC}"
    read -r

    MIGRATION_APPLIED="manual"
fi

# Verify migration
echo -e "\n${BLUE}[4/5]${NC} Verifying migration...\n"

# Check if tables exist via REST API
verify_table() {
    local table=$1
    local response=$(curl -s \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Prefer: count=exact" \
        "${SUPABASE_URL}/rest/v1/${table}?select=id&limit=0" 2>&1)

    if echo "$response" | grep -q "does not exist"; then
        return 1
    else
        return 0
    fi
}

TABLES=("sprints" "stories" "acceptance_criteria" "tasks" "comments" "personas" "crew_workload")
FOUND_COUNT=0

for table in "${TABLES[@]}"; do
    if verify_table "$table"; then
        echo -e "${GREEN}✓${NC} Table '${table}' exists"
        ((FOUND_COUNT++))
    else
        echo -e "${RED}✗${NC} Table '${table}' not found"
    fi
done

echo ""

if [ $FOUND_COUNT -eq ${#TABLES[@]} ]; then
    echo -e "${GREEN}${BOLD}✓ Migration verified: All ${#TABLES[@]} tables created successfully!${NC}\n"
    VERIFIED=true
elif [ $FOUND_COUNT -gt 0 ]; then
    echo -e "${YELLOW}⚠${NC}  Partial migration: ${FOUND_COUNT}/${#TABLES[@]} tables found"
    echo -e "${BLUE}  Some tables may not have been created. Check the SQL Editor for errors.${NC}\n"
    VERIFIED=false
else
    echo -e "${RED}✗${NC} Migration not applied: No sprint system tables found"
    echo -e "${BLUE}  Please apply the migration manually using the instructions above.${NC}\n"
    VERIFIED=false
fi

# Verify personas seeded
if [ "$VERIFIED" = "true" ]; then
    echo -e "${BLUE}[5/5]${NC} Checking seeded data...\n"

    PERSONA_COUNT=$(curl -s \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Prefer: count=exact" \
        "${SUPABASE_URL}/rest/v1/personas?select=id" 2>&1 | \
        grep -o '"count":[0-9]*' | grep -o '[0-9]*')

    if [ -n "$PERSONA_COUNT" ] && [ "$PERSONA_COUNT" -ge 13 ]; then
        echo -e "${GREEN}✓${NC} Personas seeded: ${PERSONA_COUNT} personas found"
        echo -e "${BLUE}  Expected: 13 personas (7 user + 6 developer)${NC}\n"
    else
        echo -e "${YELLOW}⚠${NC}  Personas not seeded (found: ${PERSONA_COUNT:-0})"
        echo -e "${BLUE}  Re-run the migration to seed personas${NC}\n"
    fi
fi

# Summary
echo -e "${BOLD}${BLUE}${'━' * 60}${NC}"
echo -e "${BOLD}Migration Summary${NC}"
echo -e "${BOLD}${BLUE}${'━' * 60}${NC}\n"

if [ "$VERIFIED" = "true" ]; then
    echo -e "${GREEN}${BOLD}✨ Sprint System Database Schema Deployed Successfully!${NC}\n"

    echo -e "${BOLD}What's Next:${NC}"
    echo -e "${BLUE}1.${NC} Implement API endpoints:"
    echo -e "   ${BLUE}app/api/sprints/route.ts${NC}"
    echo -e "${BLUE}2.${NC} Create TypeScript interfaces:"
    echo -e "   ${BLUE}types/sprint.ts${NC}"
    echo -e "${BLUE}3.${NC} Build SprintTimeline component:"
    echo -e "   ${BLUE}components/SprintTimeline.tsx${NC}\n"

    echo -e "${BOLD}View Data:${NC}"
    echo -e "${BLUE}Personas:${NC} ${SUPABASE_URL}/project/_/editor/28765 (personas table)"
    echo -e "${BLUE}API Test:${NC} curl ${SUPABASE_URL}/rest/v1/personas \\"
    echo -e "  -H \"apikey: \${SUPABASE_SERVICE_ROLE_KEY}\"\n"

    exit 0
else
    echo -e "${YELLOW}⚠  Migration incomplete${NC}\n"
    echo -e "Please verify the migration was applied correctly and re-run this script.\n"
    exit 1
fi
