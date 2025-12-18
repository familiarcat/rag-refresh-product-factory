# Alex AI VS Code Extension

🖖 AI-powered code assistant with Star Trek crew personas.

## Features

- **Crew Chat**: Chat with Picard, Data, Worf, and other crew members for code assistance
- **Code Analysis**: Right-click code to get explanations, reviews, and optimizations
- **Sprint Status**: View current sprint progress from the sidebar
- **Observation Lounge**: Convene senior staff meetings for architectural decisions

## Installation

### Automated (Recommended)

```bash
cd /path/to/rag-refresh-product-factory
bash scripts/install-vscode-extension.sh
```

This will:

1. Extract your OpenRouter API key from `~/.zshrc`
2. Build and install the extension
3. Configure VS Code settings

### Manual

```bash
cd vscode-extension
npm install
npm run compile
npm run package
code --install-extension alex-ai-assistant-1.0.0.vsix
```

Then configure in VS Code Settings:

- `alexAi.openRouterApiKey`: Your OpenRouter API key
- `alexAi.baseUrl`: Alex AI server URL (default: http://localhost:3001)

## Usage

### Keyboard Shortcuts

| Shortcut      | Action                       |
| ------------- | ---------------------------- |
| `Cmd+Shift+A` | Open Alex AI Chat            |
| `Cmd+Shift+Q` | Ask crew about selected code |

### Context Menu

Select code in the editor and right-click:

- **Ask Crew About Selection** - Choose a crew member to analyze
- **Alex AI: Explain Code** - Data explains the code
- **Alex AI: Review Code** - Worf reviews for security

### Sidebar

Click the Starfleet icon in the activity bar to see:

- **Crew Chat** - Interactive chat with AI crew
- **Crew Members** - List of available crew
- **Sprint Status** - Current sprint progress

### Commands

Press `Cmd+Shift+P` and search for:

- `Alex AI: Open Chat`
- `Alex AI: Sprint Status`
- `Alex AI: Convene Observation Lounge`

## Crew Members

| Crew                  | Specialty      | Best For                     |
| --------------------- | -------------- | ---------------------------- |
| 🎖️ Captain Picard     | Strategy       | Architecture decisions       |
| ⚡ Commander Riker    | Coordination   | Project planning             |
| 🤖 Commander Data     | Technical      | Code analysis, algorithms    |
| 🔧 Lt. Cmdr. La Forge | Engineering    | Infrastructure, DevOps       |
| 💭 Counselor Troi     | UX             | User experience, readability |
| ⚔️ Lt. Worf           | Security       | Security reviews, testing    |
| 🛠️ Chief O'Brien      | Implementation | Debugging, practical fixes   |
| 💰 Quark              | Business       | Cost analysis, optimization  |

## Requirements

- VS Code 1.85.0 or higher
- OpenRouter API key ([get one here](https://openrouter.ai))
- Alex AI server running (`npm run dev` in project root)

## Configuration

| Setting                    | Description                    | Default               |
| -------------------------- | ------------------------------ | --------------------- |
| `alexAi.openRouterApiKey`  | OpenRouter API key             | (required)            |
| `alexAi.baseUrl`           | Alex AI server URL             | http://localhost:3001 |
| `alexAi.defaultCrewMember` | Default crew for quick actions | data                  |
| `alexAi.autoLoadContext`   | Load workspace context         | true                  |

## Development

```bash
cd vscode-extension
npm install
npm run watch  # Auto-recompile on changes
```

Press F5 in VS Code to launch Extension Development Host.

## Cost

Uses OpenRouter for AI responses. Typical costs:

- Claude 3.5 Sonnet: ~$0.003/1K input, $0.015/1K output
- GPT-4 Turbo: ~$0.01/1K input, $0.03/1K output

Average conversation: $0.01-0.05

---

🖖 "The crew is ready to serve." — Commander Data
