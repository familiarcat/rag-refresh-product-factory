#!/bin/bash
#
# Alex AI VS Code Extension Installer
# Automatically installs and configures the Alex AI extension for VS Code
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
EXTENSION_DIR="$PROJECT_ROOT/vscode-extension"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       🖖 Alex AI VS Code Extension Installer               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check for VS Code
check_vscode() {
  if command -v code &> /dev/null; then
    echo "✅ VS Code found"
    return 0
  else
    echo "❌ VS Code CLI not found"
    echo "   Install VS Code and run 'Shell Command: Install code command in PATH'"
    return 1
  fi
}

# Extract OpenRouter API key from shell config
extract_api_key() {
  local api_key=""
  
  # Try different sources
  for file in ~/.zshrc ~/.zshenv ~/.bashrc ~/.bash_profile; do
    if [ -f "$file" ]; then
      # Extract OPENROUTER_API_KEY
      local key=$(grep -E "^export OPENROUTER_API_KEY=" "$file" 2>/dev/null | head -1 | sed 's/export OPENROUTER_API_KEY=//' | tr -d '"' | tr -d "'")
      if [ -n "$key" ]; then
        api_key="$key"
        echo "✅ Found OpenRouter API key in $file"
        break
      fi
    fi
  done
  
  # Check environment variable
  if [ -z "$api_key" ] && [ -n "$OPENROUTER_API_KEY" ]; then
    api_key="$OPENROUTER_API_KEY"
    echo "✅ Using OPENROUTER_API_KEY from environment"
  fi
  
  if [ -z "$api_key" ]; then
    echo "⚠️  No OpenRouter API key found"
    echo ""
    echo "To get an API key:"
    echo "1. Go to https://openrouter.ai"
    echo "2. Sign up and get your API key"
    echo "3. Add to ~/.zshrc: export OPENROUTER_API_KEY=\"sk-or-v1-your-key\""
    echo ""
    read -p "Enter your OpenRouter API key (or press Enter to skip): " api_key
  fi
  
  echo "$api_key"
}

# Build the extension
build_extension() {
  echo ""
  echo "📦 Building extension..."
  cd "$EXTENSION_DIR"
  
  # Install dependencies
  if [ ! -d "node_modules" ]; then
    npm install
  fi
  
  # Compile TypeScript
  npm run compile
  
  # Package extension
  npm run package
  
  echo "✅ Extension built"
}

# Install the extension
install_extension() {
  echo ""
  echo "🔧 Installing extension..."
  
  local vsix_file="$EXTENSION_DIR/alex-ai-assistant-1.0.0.vsix"
  
  if [ ! -f "$vsix_file" ]; then
    echo "❌ Extension package not found. Building first..."
    build_extension
  fi
  
  code --install-extension "$vsix_file" --force
  echo "✅ Extension installed"
}

# Configure the extension
configure_extension() {
  local api_key="$1"
  
  if [ -z "$api_key" ]; then
    echo "⚠️  Skipping configuration (no API key)"
    return
  fi
  
  echo ""
  echo "⚙️  Configuring extension..."
  
  # VS Code settings path
  local settings_dir="$HOME/Library/Application Support/Code/User"
  local settings_file="$settings_dir/settings.json"
  
  # Create settings dir if needed
  mkdir -p "$settings_dir"
  
  # Create or update settings
  if [ -f "$settings_file" ]; then
    # Check if we can use jq
    if command -v jq &> /dev/null; then
      # Use jq to merge settings
      local temp_file=$(mktemp)
      jq --arg key "$api_key" '. + {"alexAi.openRouterApiKey": $key}' "$settings_file" > "$temp_file"
      mv "$temp_file" "$settings_file"
    else
      echo "⚠️  jq not found - please manually add API key to VS Code settings"
      echo "   Settings > Extensions > Alex AI > OpenRouter API Key"
    fi
  else
    # Create new settings file
    echo "{
  \"alexAi.openRouterApiKey\": \"$api_key\",
  \"alexAi.baseUrl\": \"http://localhost:3001\",
  \"alexAi.defaultCrewMember\": \"data\",
  \"alexAi.autoLoadContext\": true
}" > "$settings_file"
  fi
  
  echo "✅ Configuration complete"
}

# Also install Continue.dev as backup
install_continue() {
  echo ""
  read -p "Also install Continue.dev extension? (recommended) [Y/n]: " install_continue
  install_continue=${install_continue:-Y}
  
  if [[ "$install_continue" =~ ^[Yy]$ ]]; then
    echo "📦 Installing Continue.dev..."
    code --install-extension Continue.continue --force
    echo "✅ Continue.dev installed"
  fi
}

# Main installation flow
main() {
  check_vscode || exit 1
  
  local api_key=$(extract_api_key)
  
  build_extension
  install_extension
  configure_extension "$api_key"
  install_continue
  
  echo ""
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║       🖖 Installation Complete!                            ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo ""
  echo "To use Alex AI in VS Code:"
  echo "  1. Open VS Code"
  echo "  2. Press Cmd+Shift+A to open Alex AI chat"
  echo "  3. Select code and right-click for crew actions"
  echo ""
  echo "Features:"
  echo "  • 🤖 Chat with crew members (Data, Picard, Worf, etc.)"
  echo "  • 📋 View sprint status"
  echo "  • 🚀 Right-click code for AI analysis"
  echo "  • ⚙️  Convene Observation Lounge meetings"
  echo ""
  echo "Make sure the Alex AI server is running:"
  echo "  cd $PROJECT_ROOT && npm run dev"
  echo ""
  echo "🖖 Live long and prosper!"
}

main "$@"


