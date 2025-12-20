#!/bin/bash

# Auto-reload VS Code Extension on file changes
# This script watches for changes in src/ and automatically recompiles, packages, and reinstalls

echo "🚀 Starting VS Code Extension auto-reload development mode..."
echo "👀 Watching for changes in src/ directory..."
echo "Press Ctrl+C to stop"
echo ""

# Initial build and install
echo "📦 Initial build and install..."
npm run compile && npm run package && npm run install-extension
echo ""
echo "✅ Initial setup complete!"
echo "💡 Edit files in src/ and they'll auto-reload"
echo "🔄 After changes, reload window: Cmd+Shift+P → 'Developer: Reload Window'"
echo ""

# Watch for changes using fswatch (macOS)
if command -v fswatch &> /dev/null; then
    fswatch -o src/ | while read f; do
        echo ""
        echo "🔄 Changes detected! Rebuilding..."
        npm run compile && npm run package && npm run install-extension
        echo "✅ Extension updated! Reload window: Cmd+Shift+P → 'Developer: Reload Window'"
        echo ""
    done
else
    echo "⚠️  fswatch not found. Install with: brew install fswatch"
    echo "Falling back to manual mode..."
    echo "Run 'npm run dev:reload' manually after making changes"
fi
