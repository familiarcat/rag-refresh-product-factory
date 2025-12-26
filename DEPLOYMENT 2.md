# Intelligent Crew Orchestration - Deployment Guide

This guide covers deploying the complete intelligent crew orchestration system to AWS and syncing with the VS Code extension.

## 🚀 Quick Deploy

### Option 1: Natural Language CLI (Recommended)

```bash
npm run deploy:orchestration
```

Or with natural language:

```bash
node scripts/cli/deploy-orchestration.mjs deploy orchestration to AWS
node scripts/cli/deploy-orchestration.mjs ship it
node scripts/cli/deploy-orchestration.mjs check status
```

### Option 2: Direct Script

```bash
./scripts/deploy-with-orchestration.sh
```

### Option 3: From Chat

```
@alex deploy orchestration to AWS
@alex check deployment status
```

---

## 📋 What Gets Deployed

**Backend (rag.pbradygeorgen.com):**
- Picard strategic analysis
- Quark cost optimization  
- Selective crew activation
- LLM call batching (30-80% savings)
- POST /api/crew/orchestrate
- POST /api/crew/execute

**VS Code Extension:**
- Chat with `@alex` in Copilot Chat
- Connects to rag.pbradygeorgen.com
- Natural language crew commands

---

## ✅ Simple 3-Step Process

### 1. Deploy to AWS

```bash
npm run deploy:orchestration
```

### 2. Update VS Code Settings

```json
{
  "alexAi.baseUrl": "https://rag.pbradygeorgen.com"
}
```

### 3. Rebuild Extension

```bash
npm run vscode:build && npm run vscode:install
```

**Done!** Reload VS Code and test with `@alex /picard hello`

---

## 🔍 Check Status

```bash
node scripts/cli/deploy-orchestration.mjs check status
```

## 📚 Full Documentation

See inline comments in `scripts/deploy-with-orchestration.sh` for detailed deployment process.
