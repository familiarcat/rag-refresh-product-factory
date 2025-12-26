#!/bin/bash
#
# Alex AI VS Code Extension - Development & Testing Script
# Automatically builds, packages, installs, and launches for testing
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
EXTENSION_DIR="$PROJECT_ROOT/vscode-extension"
VSIX_FILE="$EXTENSION_DIR/alex-ai-assistant-1.0.0.vsix"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       🖖 Alex AI Extension - Dev & Test Pipeline           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Parse arguments
ACTION="${1:-full}"
OPEN_VSCODE="${2:-yes}"

show_help() {
  echo "Usage: $0 [action] [open-vscode]"
  echo ""
  echo "Actions:"
  echo "  full      - Full pipeline: clean, install deps, compile, package, install, test (default)"
  echo "  quick     - Quick rebuild: compile, package, install"
  echo "  compile   - Compile TypeScript only"
  echo "  package   - Package VSIX only"
  echo "  install   - Install to VS Code only"
  echo "  test      - Open VS Code for testing"
  echo "  clean     - Remove build artifacts"
  echo "  watch     - Start watch mode for development"
  echo ""
  echo "Options:"
  echo "  open-vscode: yes/no - Whether to open VS Code after install (default: yes)"
  echo ""
  echo "Examples:"
  echo "  $0              # Full pipeline + open VS Code"
  echo "  $0 quick no     # Quick rebuild, don't open VS Code"
  echo "  $0 watch        # Start watch mode"
}

# Step functions
step_clean() {
  echo -e "${YELLOW}🧹 Cleaning build artifacts...${NC}"
  cd "$EXTENSION_DIR"
  rm -rf dist node_modules/*.cache *.vsix
  echo -e "${GREEN}   ✓ Clean complete${NC}"
}

step_install_deps() {
  echo -e "${YELLOW}📦 Installing dependencies...${NC}"
  cd "$EXTENSION_DIR"
  if [ ! -d "node_modules" ] || [ "$1" == "force" ]; then
    npm install --silent
  else
    echo -e "${GREEN}   ✓ Dependencies already installed${NC}"
    return
  fi
  echo -e "${GREEN}   ✓ Dependencies installed${NC}"
}

step_compile() {
  echo -e "${YELLOW}🔨 Compiling TypeScript...${NC}"
  cd "$EXTENSION_DIR"
  npm run compile 2>&1 | while read line; do
    if [[ "$line" == *"error"* ]]; then
      echo -e "${RED}   ✗ $line${NC}"
    else
      echo "   $line"
    fi
  done
  
  # Check if compilation succeeded
  if [ ! -d "$EXTENSION_DIR/dist" ]; then
    echo -e "${RED}   ✗ Compilation failed - dist folder not created${NC}"
    exit 1
  fi
  echo -e "${GREEN}   ✓ Compilation successful${NC}"
}

step_lint() {
  echo -e "${YELLOW}🔍 Checking for issues...${NC}"
  cd "$EXTENSION_DIR"
  
  # Check for common issues
  local issues=0
  
  # Check if main entry exists
  if [ ! -f "dist/extension.js" ]; then
    echo -e "${RED}   ✗ Missing dist/extension.js${NC}"
    issues=$((issues + 1))
  fi
  
  # Check package.json validity
  if ! node -e "require('./package.json')" 2>/dev/null; then
    echo -e "${RED}   ✗ Invalid package.json${NC}"
    issues=$((issues + 1))
  fi
  
  # Check icon exists
  if [ ! -f "media/icon.png" ]; then
    echo -e "${YELLOW}   ⚠ Missing media/icon.png (optional for local testing)${NC}"
  fi
  
  if [ $issues -eq 0 ]; then
    echo -e "${GREEN}   ✓ No issues found${NC}"
  else
    echo -e "${RED}   ✗ Found $issues issue(s)${NC}"
    exit 1
  fi
}

step_package() {
  echo -e "${YELLOW}📦 Packaging extension...${NC}"
  cd "$EXTENSION_DIR"
  
  # Remove old package
  rm -f *.vsix
  
  # Package
  npm run package 2>&1 | grep -E "(DONE|ERROR|WARNING|INFO)" | while read line; do
    if [[ "$line" == *"ERROR"* ]]; then
      echo -e "${RED}   $line${NC}"
    elif [[ "$line" == *"WARNING"* ]]; then
      echo -e "${YELLOW}   $line${NC}"
    else
      echo -e "${GREEN}   $line${NC}"
    fi
  done
  
  if [ -f "$VSIX_FILE" ]; then
    local size=$(du -h "$VSIX_FILE" | cut -f1)
    echo -e "${GREEN}   ✓ Package created: alex-ai-assistant-1.0.0.vsix ($size)${NC}"
  else
    echo -e "${RED}   ✗ Package creation failed${NC}"
    exit 1
  fi
}

step_uninstall() {
  echo -e "${YELLOW}🗑️  Uninstalling previous version...${NC}"
  code --uninstall-extension alex-ai.alex-ai-assistant 2>/dev/null || true
  echo -e "${GREEN}   ✓ Previous version removed (if existed)${NC}"
}

step_install() {
  echo -e "${YELLOW}⬇️  Installing extension to VS Code...${NC}"
  
  if [ ! -f "$VSIX_FILE" ]; then
    echo -e "${RED}   ✗ VSIX file not found. Run package first.${NC}"
    exit 1
  fi
  
  code --install-extension "$VSIX_FILE" --force 2>&1 | while read line; do
    echo "   $line"
  done
  
  echo -e "${GREEN}   ✓ Extension installed${NC}"
}

step_configure() {
  echo -e "${YELLOW}⚙️  Checking configuration...${NC}"
  
  # Check for OpenRouter API key
  local api_key=""
  
  # Try to get from zshrc
  if [ -f ~/.zshrc ]; then
    api_key=$(grep -E "^export OPENROUTER_API_KEY=" ~/.zshrc 2>/dev/null | head -1 | sed 's/export OPENROUTER_API_KEY=//' | tr -d '"' | tr -d "'" || true)
  fi
  
  if [ -n "$api_key" ]; then
    echo -e "${GREEN}   ✓ OpenRouter API key found in ~/.zshrc${NC}"
    
    # Check if already in VS Code settings
    local settings_file="$HOME/Library/Application Support/Code/User/settings.json"
    if [ -f "$settings_file" ]; then
      if grep -q "alexAi.openRouterApiKey" "$settings_file" 2>/dev/null; then
        echo -e "${GREEN}   ✓ API key already in VS Code settings${NC}"
      else
        echo -e "${YELLOW}   ⚠ API key not in VS Code settings - add manually or run:${NC}"
        echo -e "      npm run vscode:install"
      fi
    fi
  else
    echo -e "${YELLOW}   ⚠ No OpenRouter API key found${NC}"
    echo -e "      Get one at: https://openrouter.ai"
    echo -e "      Then add to VS Code Settings > Extensions > Alex AI"
  fi
}

step_test() {
  echo -e "${YELLOW}🧪 Opening VS Code for testing...${NC}"
  
  # Create a test workspace if it doesn't exist
  local test_dir="$EXTENSION_DIR/.test-workspace"
  mkdir -p "$test_dir"
  
  # Create a sample file to test with
  cat > "$test_dir/sample.ts" << 'SAMPLE'
// Test file for Alex AI Extension
// Select this code and use Cmd+Shift+Q to ask the crew

interface User {
  id: string;
  name: string;
  email: string;
}

async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  return response.json();
}

// Try: Select the function above and:
// 1. Cmd+Shift+A - Open Alex AI Chat
// 2. Cmd+Shift+Q - Ask Crew About Selection
// 3. Right-click > Alex AI: Explain Code
// 4. Right-click > Alex AI: Review Code (Worf)
SAMPLE

  echo -e "${GREEN}   ✓ Test workspace created${NC}"
  
  if [ "$OPEN_VSCODE" == "yes" ]; then
    echo -e "${BLUE}   Opening VS Code...${NC}"
    code "$test_dir" --new-window
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}   🖖 Extension loaded! Test it:${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "   1. Look for the Starfleet icon in the Activity Bar (left)"
    echo "   2. Press Cmd+Option+A to open chat"
    echo "   3. Select code and press Cmd+Option+Q"
    echo "   4. Press Cmd+Option+K to configure API key"
    echo "   5. Open Command Palette (Cmd+Shift+P) and type 'Alex AI'"
    echo ""
  fi
}

step_watch() {
  echo -e "${YELLOW}👀 Starting watch mode...${NC}"
  echo -e "${BLUE}   Press Ctrl+C to stop${NC}"
  echo ""
  cd "$EXTENSION_DIR"
  npm run watch
}

# Main logic
case "$ACTION" in
  help|--help|-h)
    show_help
    ;;
  full)
    step_clean
    step_install_deps
    step_compile
    step_lint
    step_package
    step_uninstall
    step_install
    step_configure
    step_test
    ;;
  quick)
    step_compile
    step_lint
    step_package
    step_install
    step_test
    ;;
  compile)
    step_compile
    ;;
  package)
    step_package
    ;;
  install)
    step_install
    step_configure
    ;;
  test)
    step_test
    ;;
  clean)
    step_clean
    ;;
  watch)
    step_watch
    ;;
  *)
    echo -e "${RED}Unknown action: $ACTION${NC}"
    show_help
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}🖖 Done!${NC}"


