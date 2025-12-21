#!/bin/bash
# 🖖 Alex AI Shell Initialization
# For rag-refresh-product-factory repository
# Source this file in your .zshrc or .bashrc

# ============================================
# CONFIGURATION
# ============================================
export ALEX_AI_HOME="${ALEX_AI_HOME:-$HOME/Documents/workspace/rag-refresh-product-factory}"
export ALEX_AI_PROJECT="rag-refresh-product-factory"

# ============================================
# COLORS
# ============================================
ALEX_RED='\033[0;31m'
ALEX_GREEN='\033[0;32m'
ALEX_YELLOW='\033[0;33m'
ALEX_BLUE='\033[0;34m'
ALEX_PURPLE='\033[0;35m'
ALEX_CYAN='\033[0;36m'
ALEX_GOLD='\033[0;33m'
ALEX_NC='\033[0m' # No Color

# ============================================
# STATUS FUNCTIONS
# ============================================
alex_ai_status() {
    echo -e "${ALEX_PURPLE}🖖 Alex AI Status${ALEX_NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ -d "$ALEX_AI_HOME" ]; then
        echo -e "${ALEX_GREEN}✓${ALEX_NC} Project: $ALEX_AI_PROJECT"
        echo -e "${ALEX_GREEN}✓${ALEX_NC} Path: $ALEX_AI_HOME"
        
        # Check git status
        if [ -d "$ALEX_AI_HOME/.git" ]; then
            local branch=$(cd "$ALEX_AI_HOME" && git branch --show-current 2>/dev/null)
            local status=$(cd "$ALEX_AI_HOME" && git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
            echo -e "${ALEX_CYAN}⎇${ALEX_NC} Branch: $branch"
            if [ "$status" -gt 0 ]; then
                echo -e "${ALEX_YELLOW}!${ALEX_NC} Uncommitted changes: $status files"
            else
                echo -e "${ALEX_GREEN}✓${ALEX_NC} Working tree clean"
            fi
        fi
        
        # Check if dev server is running
        if pgrep -f "next dev" > /dev/null; then
            echo -e "${ALEX_GREEN}●${ALEX_NC} Dev server: Running"
        else
            echo -e "${ALEX_YELLOW}○${ALEX_NC} Dev server: Stopped"
        fi
    else
        echo -e "${ALEX_RED}✗${ALEX_NC} Project not found at $ALEX_AI_HOME"
    fi
}

alex_ai_workspace() {
    echo -e "${ALEX_PURPLE}🖖 Alex AI Workspace${ALEX_NC}"
    cd "$ALEX_AI_HOME" || return 1
    echo "Changed to: $(pwd)"
}

alex_ai_dev() {
    echo -e "${ALEX_PURPLE}🚀 Starting Alex AI Dev Server${ALEX_NC}"
    cd "$ALEX_AI_HOME" || return 1
    npm run dev
}

alex_ai_milestone() {
    if [ -z "$1" ]; then
        echo -e "${ALEX_YELLOW}Usage: alex-milestone \"Milestone description\"${ALEX_NC}"
        return 1
    fi
    echo -e "${ALEX_PURPLE}📌 Creating Milestone: $1${ALEX_NC}"
    cd "$ALEX_AI_HOME" || return 1
    npm run milestone "$1"
}

alex_ai_crew() {
    echo -e "${ALEX_PURPLE}👥 Alex AI Crew Members${ALEX_NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${ALEX_RED}🔴 Command Division${ALEX_NC}"
    echo "   👨‍✈️ Captain Picard - Commanding Officer"
    echo "   🎺 Commander Riker - First Officer"
    echo ""
    echo -e "${ALEX_GOLD}🟡 Operations Division${ALEX_NC}"
    echo "   🤖 Commander Data - Second Officer"
    echo "   🔧 Lt. Cmdr. La Forge - Chief Engineer"
    echo "   ⚔️ Lt. Worf - Chief Security"
    echo "   📡 Lt. Uhura - Communications"
    echo "   🛠️ Chief O'Brien - Operations"
    echo ""
    echo -e "${ALEX_BLUE}🔵 Sciences Division${ALEX_NC}"
    echo "   👩‍⚕️ Dr. Crusher - Chief Medical"
    echo "   💜 Counselor Troi - Ship's Counselor"
    echo ""
    echo -e "${ALEX_YELLOW}🟤 Civilian${ALEX_NC}"
    echo "   💰 Quark - Business Consultant"
}

alex_ai_git() {
    cd "$ALEX_AI_HOME" || return 1
    echo -e "${ALEX_PURPLE}📊 Git Status${ALEX_NC}"
    git status -s
    echo ""
    echo -e "${ALEX_CYAN}Recent commits:${ALEX_NC}"
    git log --oneline -5
}

alex_ai_dashboard() {
    clear
    echo -e "${ALEX_PURPLE}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                    🖖 ALEX AI DASHBOARD                       ║"
    echo "║                 RAG Refresh Product Factory                   ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${ALEX_NC}"
    alex_ai_status
    echo ""
    echo -e "${ALEX_CYAN}Quick Commands:${ALEX_NC}"
    echo "  alex-status    - Show system status"
    echo "  alex-workspace - Go to project directory"
    echo "  alex-dev       - Start dev server"
    echo "  alex-milestone - Create milestone"
    echo "  alex-crew      - Show crew roster"
    echo "  alex-git       - Show git status"
}

# ============================================
# PROMPT FUNCTION
# ============================================
alex_ai_prompt_status() {
    local workspace=""
    if [[ "$PWD" == *"rag-refresh-product-factory"* ]]; then
        workspace=$(echo "$PWD" | sed "s|.*/rag-refresh-product-factory/||" | sed "s|.*/rag-refresh-product-factory||")
        if [ -z "$workspace" ]; then
            workspace="/"
        fi
        echo -e "${ALEX_PURPLE}🖖${ALEX_NC} ${ALEX_CYAN}$workspace${ALEX_NC}"
    fi
}

# ============================================
# ALIASES
# ============================================
alias alex-status='alex_ai_status'
alias alex-workspace='alex_ai_workspace'
alias alex-dev='alex_ai_dev'
alias alex-milestone='alex_ai_milestone'
alias alex-crew='alex_ai_crew'
alias alex-git='alex_ai_git'
alias alex-dash='alex_ai_dashboard'
alias alex-home='cd $ALEX_AI_HOME'

# Short aliases
alias as='alex_ai_status'
alias aw='alex_ai_workspace'
alias ad='alex_ai_dashboard'
alias am='alex_ai_milestone'
alias ac='alex_ai_crew'
alias ag='alex_ai_git'

# ============================================
# AUTO-LOAD MESSAGE
# ============================================
if [ -n "$ALEX_AI_SHELL_INIT_LOADED" ]; then
    : # Already loaded
else
    export ALEX_AI_SHELL_INIT_LOADED=1
    echo -e "${ALEX_PURPLE}🖖 Alex AI Shell Initialized${ALEX_NC} - Type 'alex-dash' for dashboard"
fi
