# VS Code Extension Development Workflow

Auto-reload development setup for the Alex AI VS Code extension with full git/milestone tracking.

## 🚀 Quick Start

### Method 1: Extension Development Host (Recommended)

Use VS Code's built-in Extension Development Host for the best development experience:

1. **Open the extension folder in VS Code:**
   ```bash
   code vscode-extension
   ```

2. **Press F5** or select "Run Extension" from the Debug panel
   - This opens a new VS Code window with your extension loaded
   - Changes to TypeScript files auto-compile
   - Press Cmd+R in the Extension Development Host to reload changes
   - Set breakpoints and debug like normal code

### Method 2: Auto-Reload Script

For testing in your actual VS Code installation:

1. **Install fswatch** (one-time setup):
   ```bash
   brew install fswatch
   ```

2. **Run the auto-reload script:**
   ```bash
   cd vscode-extension
   ./scripts/dev-auto-reload.sh
   ```

3. **Make changes** to files in `src/`
   - Script automatically detects changes
   - Recompiles TypeScript → Packages VSIX → Reinstalls extension
   - Reload VS Code window: **Cmd+Shift+P** → "Developer: Reload Window"

### Method 3: Manual Reload

Quick one-off reload after making changes:

```bash
npm run dev:reload
```

Then reload VS Code: **Cmd+Shift+P** → "Developer: Reload Window" (or restart VS Code).

## 📋 Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run compile` | Compile TypeScript once |
| `npm run compile:watch` | Watch mode - auto-compile on save |
| `npm run watch` | Alias for compile:watch |
| `npm run package` | Build .vsix package file |
| `npm run package:install` | Package + install in one command |
| `npm run dev:reload` | Full cycle: compile → package → install |
| `npm run dev:watch` | Start watch mode for development |

## 🔧 Development Modes

### Debug Mode (F5)
- **Best for:** Active development with breakpoints
- **Pros:** Live debugging, instant reload (Cmd+R), isolated test environment
- **Cons:** Runs in separate window

### Auto-Reload Script
- **Best for:** Testing in real VS Code environment
- **Pros:** Tests actual installation, works with other extensions
- **Cons:** Requires window reload, no debugging

### Manual Reload
- **Best for:** One-off changes or quick fixes
- **Pros:** Full control, no background processes
- **Cons:** Manual trigger required

## 🗂️ Project Structure

```
vscode-extension/
├── src/                    # TypeScript source files
│   ├── extension.ts       # Main extension entry point
│   └── ...
├── dist/                   # Compiled JavaScript (auto-generated)
├── .vscode/
│   ├── launch.json        # Debug configurations
│   └── tasks.json         # Build tasks
├── scripts/
│   └── dev-auto-reload.sh # Auto-reload watcher script
├── package.json           # Extension manifest + scripts
└── tsconfig.json          # TypeScript configuration
```

## 🔄 Git & Milestone Tracking

All development changes are tracked via:

1. **Git commits** - Every meaningful change committed
2. **Milestones** - Major features tracked in `/milestones`
3. **RAG History** - Claude Code logs actions for bidirectional learning

This ensures you can always:
- Roll back to any previous version
- Review the logical history of changes
- Learn from past development decisions

## 💡 Development Tips

### Hot Reload Workflow
1. Open extension folder: `code vscode-extension`
2. Press **F5** to start Extension Development Host
3. Make changes in `src/`
4. Press **Cmd+R** in the Extension Development Host window
5. Test your changes immediately

### Testing Chat Participants
```typescript
// In Extension Development Host:
// Open Command Palette (Cmd+Shift+P)
// Type: "Chat: Focus on Chat View"
// Type: @alex picard what should I do?
```

### Debugging
- Set breakpoints in `src/extension.ts`
- Press F5 to start debugging
- Breakpoints hit when extension code executes
- Use Debug Console for live evaluation

### Package for Production
```bash
npm run compile
npm run package
# Creates: alex-ai-assistant-1.0.0.vsix
```

## 🚢 Publishing (Future)

When ready for marketplace:

1. **Create publisher account** at [Visual Studio Marketplace](https://marketplace.visualstudio.com/)
2. **Generate Personal Access Token** from Azure DevOps
3. **Login to vsce:**
   ```bash
   vsce login alex-ai
   ```
4. **Publish:**
   ```bash
   vsce publish
   ```

## 🔍 Troubleshooting

### Extension not loading?
- Check VS Code output: View → Output → Extension Host
- Verify compiled: `ls dist/extension.js`
- Try clean rebuild: `rm -rf dist && npm run compile`

### Changes not appearing?
- **In Debug Mode:** Press Cmd+R to reload Extension Development Host
- **In Production:** Reinstall extension + reload window (Cmd+Shift+P → "Developer: Reload Window")
- Check TypeScript compiled without errors

### fswatch not working?
```bash
brew install fswatch
# or use Method 1 (Extension Development Host) instead
```

## 📚 Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Chat Participant API](https://code.visualstudio.com/api/extension-guides/chat)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
