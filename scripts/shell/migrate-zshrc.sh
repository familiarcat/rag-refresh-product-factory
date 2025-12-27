#!/bin/bash
# 🖖 Alex AI Shell Migration Script
# Migrates from alex-ai-monorepo to rag-refresh-product-factory
# 
# Usage: ./migrate-zshrc.sh [--dry-run]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

ZSHRC="$HOME/.zshrc"
BACKUP="$HOME/.zshrc.backup.$(date +%Y%m%d_%H%M%S)"
DRY_RUN=false
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse arguments
if [ "$1" == "--dry-run" ]; then
    DRY_RUN=true
    echo -e "${YELLOW}🔍 DRY RUN MODE - No changes will be made${NC}"
fi

echo -e "${PURPLE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║          🖖 Alex AI Shell Migration Script                    ║"
echo "║     Migrating from monorepo to rag-refresh-product-factory    ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if zshrc exists
if [ ! -f "$ZSHRC" ]; then
    echo -e "${RED}✗ Error: $ZSHRC not found${NC}"
    exit 1
fi

echo -e "${CYAN}📋 Current monorepo references in .zshrc:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -n "monorepo\|alex-ai-universal\|alex-ai-optimized" "$ZSHRC" 2>/dev/null || echo "  (none found)"
echo ""

if [ "$DRY_RUN" == true ]; then
    echo -e "${YELLOW}Would perform the following changes:${NC}"
    echo ""
    echo "1. Backup $ZSHRC to $BACKUP"
    echo "2. Comment out old monorepo theme and plugin lines"
    echo "3. Comment out old monorepo functions and aliases"
    echo "4. Add source line for new Alex AI shell init"
    echo ""
    echo -e "${CYAN}To apply changes, run without --dry-run${NC}"
    exit 0
fi

# Create backup
echo -e "${BLUE}📦 Creating backup: $BACKUP${NC}"
cp "$ZSHRC" "$BACKUP"

# Create a temporary file for modifications
TEMP_ZSHRC=$(mktemp)
cp "$ZSHRC" "$TEMP_ZSHRC"

echo -e "${BLUE}🔧 Applying migrations...${NC}"

# 1. Comment out old theme
sed -i.bak 's/^ZSH_THEME="alex-ai-monorepo.*"/# MIGRATED: ZSH_THEME="robbyrussell" # Changed from alex-ai-monorepo/' "$TEMP_ZSHRC"

# 2. Comment out old plugin
sed -i.bak 's/^plugins=(git alex-ai-monorepo)/plugins=(git) # MIGRATED: removed alex-ai-monorepo plugin/' "$TEMP_ZSHRC"

# 3. Comment out old aliases that reference monorepo scripts
sed -i.bak "s|^alias alex='./scripts/alex-ai-universal.sh'|# MIGRATED: alias alex - see new Alex AI shell init|" "$TEMP_ZSHRC"
sed -i.bak "s|^alias status='./scripts/alex-ai-detailed-status.sh'|# MIGRATED: use alex-status instead|" "$TEMP_ZSHRC"
sed -i.bak "s|^alias detailed='./scripts/alex-ai-detailed-status.sh'|# MIGRATED: use alex-dash instead|" "$TEMP_ZSHRC"

# 4. Comment out old monorepo functions
# sed -i.bak 's/^alex_monorepo_status()/# MIGRATED: alex_monorepo_status() - replaced by alex_ai_prompt_status\nalex_monorepo_status_disabled()/' "$TEMP_ZSHRC"

# 5. Check if new init is already sourced
if ! grep -q "alex-ai-shell-init.sh" "$TEMP_ZSHRC"; then
    echo "" >> "$TEMP_ZSHRC"
    echo "# ============================================" >> "$TEMP_ZSHRC"
    echo "# 🖖 Alex AI - RAG Refresh Product Factory" >> "$TEMP_ZSHRC"
    echo "# ============================================" >> "$TEMP_ZSHRC"
    echo "if [ -f \"\$HOME/Documents/workspace/rag-refresh-product-factory/scripts/shell/alex-ai-shell-init.sh\" ]; then" >> "$TEMP_ZSHRC"
    echo "    source \"\$HOME/Documents/workspace/rag-refresh-product-factory/scripts/shell/alex-ai-shell-init.sh\"" >> "$TEMP_ZSHRC"
    echo "fi" >> "$TEMP_ZSHRC"
fi

# Move temp file to zshrc
mv "$TEMP_ZSHRC" "$ZSHRC"
rm -f "$TEMP_ZSHRC.bak"

echo -e "${GREEN}✓ Migration complete!${NC}"
echo ""
echo -e "${CYAN}Changes made:${NC}"
echo "  ✓ Backed up original to: $BACKUP"
echo "  ✓ Commented out old monorepo theme"
echo "  ✓ Commented out old monorepo plugin"
echo "  ✓ Commented out old monorepo aliases"
echo "  ✓ Added source for new Alex AI shell init"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review changes: diff $BACKUP $ZSHRC"
echo "  2. Reload shell: source ~/.zshrc"
echo "  3. Verify: alex-dash"
echo ""
echo -e "${PURPLE}🖖 Live long and prosper!${NC}"
