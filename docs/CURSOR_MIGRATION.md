# Migrating from Cursor AI to Alex AI

This guide outlines the steps to transition from Cursor AI to using Alex AI as your primary code assistant in VS Code.

## Overview

| Feature | Cursor AI | Alex AI (VS Code Extension) |
|---------|-----------|----------------------------|
| Chat Interface | Native (forked VS Code) | @alex in Chat + Sidebar |
| Inline Completions | Built-in | ✅ Enabled |
| Code Actions (Lightbulb) | Built-in | ✅ Enabled |
| Hover Explanations | Built-in | ✅ Optional |
| Code Review/Diagnostics | Built-in | ✅ Optional |
| Custom AI Models | Limited | ✅ OpenRouter (100+ models) |
| Cost | $20/month subscription | Pay-per-use (~$5-15/month) |
| Data Privacy | Cursor servers | Your OpenRouter account |
| Crew Personas | ❌ | ✅ 8 specialized AI personas |

## Migration Steps

### Phase 1: Install & Configure Alex AI (Day 1)

1. **Get OpenRouter API Key**
   ```
   Visit: https://openrouter.ai/keys
   Add $10-20 credit (lasts ~1-2 months)
   ```

2. **Install Alex AI Extension in VS Code**
   ```bash
   cd /path/to/rag-refresh-product-factory
   npm run vscode:install
   ```

3. **Configure API Key**
   - Press `Cmd+Option+K` or
   - Run command: "Alex AI: Configure API Key"
   - Enter your OpenRouter key

4. **Enable Features**
   Open Settings (Cmd+,) → Search "Alex AI":
   - ✅ Enable Inline Completions (Copilot-like)
   - ✅ Enable Hover Explanations (optional)
   - ✅ Enable Code Review (optional)
   - ✅ Open Chat on Startup

### Phase 2: Learn Alex AI Workflow (Week 1)

#### Chat Commands
```
@alex explain this function
@alex /worf review for security issues
@alex /picard what's the best architecture here?
@alex /data analyze time complexity
@alex /obrien help fix this bug
```

#### Keyboard Shortcuts
| Action | Cursor | Alex AI |
|--------|--------|---------|
| Open Chat | Cmd+L | Cmd+Option+A or Cmd+Option+C |
| Ask about Selection | Cmd+K | Cmd+Option+Q |
| Configure | Settings | Cmd+Option+K |

#### Lightbulb Menu (Code Actions)
Select code → Click 💡 or Cmd+. :
- 🤖 Alex AI: Explain this code
- ⚔️ Alex AI: Security review (Worf)
- 🔧 Alex AI: Optimize this code
- 💭 Alex AI: Suggest refactoring (Troi)
- 🛠️ Alex AI: Help fix this issue (O'Brien)

### Phase 3: Parallel Usage (Week 2-3)

Run both Cursor and VS Code with Alex AI side-by-side:

1. Use **Alex AI** for:
   - Code explanations and reviews
   - Architecture discussions (Picard)
   - Security audits (Worf)
   - Cost-conscious AI usage

2. Note when **Cursor** is faster/better:
   - Complex multi-file refactors
   - Agent mode tasks
   - Specific edge cases

3. Document gaps to improve Alex AI

### Phase 4: Full Transition (Week 4+)

1. **Uninstall Cursor** (or cancel subscription)

2. **Set Alex AI as Default**
   ```json
   // settings.json
   {
     "alexAi.openChatOnStartup": true,
     "alexAi.enableInlineCompletions": true,
     "alexAi.enableCodeReview": true
   }
   ```

3. **Disable Competing Extensions**
   - GitHub Copilot (if not needed)
   - Other AI assistants

## Feature Comparison

### Inline Completions

**Cursor:** Automatic, fast, trained on your codebase
**Alex AI:** Uses OpenRouter models, slightly slower but customizable

Enable:
```json
{ "alexAi.enableInlineCompletions": true }
```

### Code Review

**Cursor:** Integrated into editor
**Alex AI:** Shows in Problems panel after save

Enable:
```json
{ "alexAi.enableCodeReview": true }
```

Or manually: `Cmd+Shift+P` → "Alex AI: Review Current File"

### Multi-file Operations

**Cursor:** Agent mode can edit multiple files
**Alex AI:** Currently single-file focused

Workaround: Use @alex in Chat with file references:
```
@alex #file:src/auth.ts #file:src/user.ts 
refactor these to share authentication logic
```

## Cost Comparison

### Cursor AI
- $20/month flat fee
- Unlimited usage (within limits)
- No visibility into actual costs

### Alex AI + OpenRouter
- Pay per token used
- Typical usage: $0.01-0.10 per conversation
- Monthly cost: $5-15 for active development
- Full cost visibility

### Cost Optimization Tips
1. Use Claude Haiku for simple tasks (~10x cheaper)
2. Enable caching in OpenRouter
3. Disable auto-features when not needed

## Limitations & Workarounds

### What Alex AI Can't Do (Yet)

| Feature | Cursor | Alex AI | Workaround |
|---------|--------|---------|------------|
| Multi-file agent | ✅ | ❌ | Use chat with #file references |
| Codebase indexing | ✅ | ❌ | RAG memories + context |
| Terminal integration | ✅ | Limited | Use CLI tools |
| Apply changes directly | ✅ | ❌ | Copy/paste suggestions |

### Planned Improvements

- [ ] Multi-file refactoring support
- [ ] Codebase indexing/search
- [ ] Direct code application
- [ ] Terminal command execution
- [ ] Custom model fine-tuning

## Troubleshooting

### "No completions showing"
1. Check API key is configured
2. Verify OpenRouter has credits
3. Enable: `alexAi.enableInlineCompletions`

### "Chat not responding"
1. Check internet connection
2. Verify API key in settings
3. Check OpenRouter status: status.openrouter.ai

### "Slow responses"
1. Try faster model (Claude Haiku)
2. Reduce context length
3. Disable unused features

## Getting Help

- **Command Palette:** Cmd+Shift+P → "Alex AI"
- **Documentation:** `/docs/VSCODE_SETUP.md`
- **Crew Lounge:** `npm run crew:lounge "your question"`

---

## Quick Reference Card

```
╔════════════════════════════════════════════════════════════╗
║                    ALEX AI QUICK REFERENCE                 ║
╠════════════════════════════════════════════════════════════╣
║ CHAT                                                       ║
║   @alex [question]        Ask the crew (Data default)      ║
║   @alex /worf [question]  Security review                  ║
║   @alex /picard [q]       Strategic advice                 ║
║   Cmd+Option+C            Open VS Code Chat with @alex     ║
║   Cmd+Option+A            Open Alex AI Sidebar             ║
║                                                            ║
║ CODE ACTIONS (select code, then Cmd+.)                     ║
║   🤖 Explain   ⚔️ Security   🔧 Optimize   💭 Refactor     ║
║                                                            ║
║ COMMANDS                                                   ║
║   Cmd+Option+K            Configure API Key                ║
║   Cmd+Option+Q            Ask crew about selection         ║
║                                                            ║
║ SETTINGS (Cmd+,)                                           ║
║   alexAi.enableInlineCompletions    AI autocomplete        ║
║   alexAi.enableCodeReview           Auto code review       ║
║   alexAi.openChatOnStartup          Auto-open @alex        ║
╚════════════════════════════════════════════════════════════╝
```

---

🖖 *"The transition to Alex AI is complete, Captain. All systems operational."*
