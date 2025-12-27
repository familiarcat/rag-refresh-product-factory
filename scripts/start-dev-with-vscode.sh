#!/bin/bash

# =====================================================
# Alex AI - Start Development Environment
# =====================================================
# Starts both web dashboard and provides instructions
# for reloading VSCode extension
# =====================================================

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}🖖 Alex AI - Development Environment Startup${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
  echo -e "${YELLOW}⚠️  .env.local not found. Syncing from ~/.zshrc...${NC}"
  npm run script:secrets:sync
  echo ""
fi

# Check if web server already running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
  echo -e "${YELLOW}⚠️  Port 3001 already in use!${NC}"
  echo -e "${YELLOW}   Kill existing process? (y/n)${NC}"
  read -r response
  if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    lsof -ti:3001 | xargs kill -9
    echo -e "${GREEN}✅ Killed process on port 3001${NC}"
  else
    echo -e "${RED}❌ Cannot start - port 3001 in use${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}✅ Starting web dashboard on port 3001...${NC}"
echo ""

# Display instructions for VSCode
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}📝 VSCode Extension Reload Instructions:${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}Option 1: Quick Reload (Recommended)${NC}"
echo -e "  1. Press ${GREEN}Cmd+Shift+P${NC} (Mac) or ${GREEN}Ctrl+Shift+P${NC} (Windows/Linux)"
echo -e "  2. Type: ${GREEN}Developer: Reload Window${NC}"
echo -e "  3. Press Enter"
echo ""
echo -e "${CYAN}Option 2: Rebuild Extension (if you made code changes)${NC}"
echo -e "  ${GREEN}cd vscode-extension && npm run compile${NC}"
echo -e "  Then reload window (Option 1)"
echo ""
echo -e "${CYAN}Option 3: Keyboard Shortcut${NC}"
echo -e "  Mac: ${GREEN}Cmd+R${NC}"
echo -e "  Windows/Linux: ${GREEN}Ctrl+R${NC}"
echo ""
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}🌐 Web Dashboard will be available at:${NC}"
echo -e "   ${GREEN}http://localhost:3001${NC}"
echo ""
echo -e "${CYAN}📡 VSCode Extension will connect to:${NC}"
echo -e "   ${GREEN}http://localhost:3001/api${NC}"
echo ""
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}💡 Testing Sync (after reloading VSCode):${NC}"
echo ""
echo -e "${CYAN}1. Create Project in Web:${NC}"
echo -e "   Open ${GREEN}http://localhost:3001/projects/new${NC}"
echo -e "   Create a test project"
echo ""
echo -e "${CYAN}2. Verify in VSCode:${NC}"
echo -e "   Open Alex AI panel → Refresh projects"
echo -e "   New project should appear"
echo ""
echo -e "${CYAN}3. Chat in VSCode:${NC}"
echo -e "   Alex AI Chat → Select Commander Riker"
echo -e "   Ask: \"What projects do we have?\""
echo ""
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}Starting server...${NC}"
echo ""

# Start the dev server on port 3001
PORT=3001 npm run dev
