import * as vscode from "vscode";
import { AlexAiService, ObservationLoungeResult } from "./alexAiService";

/**
 * Alex AI Comprehensive Sidebar View
 * Full-featured webview styled like rag.pbradygeorgen.com
 * Replaces default VS Code chat visual structure
 */
export class CrewChatViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private context: vscode.ExtensionContext;
  private alexAiService: AlexAiService;
  private currentCrew: string = "riker";

  constructor(context: vscode.ExtensionContext, alexAiService: AlexAiService) {
    this.context = context;
    this.alexAiService = alexAiService;
  }

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    webviewView.webview.html = this.getHtmlContent();

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "sendMessage":
          await this.handleUserMessage(message.text, message.crew, message.context);
          break;
        case "selectCrew":
          this.currentCrew = message.crew;
          break;
        case "clearHistory":
          this.alexAiService.clearHistory();
          this.clearChat();
          break;
        case "getWorkspaceFiles":
          await this.sendWorkspaceFiles();
          break;
        case "getFileContent":
          await this.sendFileContent(message.path);
          break;
        case "getCurrentFile":
          await this.sendCurrentFile();
          break;
        case "getProjects":
          await this.sendProjects();
          break;
        case "getSprints":
          await this.sendSprints(message.projectId);
          break;
        case "observationLounge":
          await this.handleObservationLounge(message.topic);
          break;
      }
    });

    // Listen for active editor changes
    vscode.window.onDidChangeActiveTextEditor(() => {
      this.sendCurrentFile();
    });
  }

  private async handleUserMessage(text: string, crew: string, fileContext?: string) {
    if (!this._view) return;

    // Show user message
    this._view.webview.postMessage({
      type: "addMessage",
      role: "user",
      content: text,
    });

    // Show typing indicator
    this._view.webview.postMessage({
      type: "showTyping",
      crew,
    });

    // Build context prompt
    let prompt = text;
    if (fileContext) {
      prompt = `Context:\n\`\`\`\n${fileContext}\n\`\`\`\n\nQuestion: ${text}`;
    }

    // Get response
    const response = await this.alexAiService.chat(crew, prompt);

    // Hide typing and show response
    this._view.webview.postMessage({ type: "hideTyping" });

    const crewInfo = this.alexAiService.getCrewInfo(crew);
    this._view.webview.postMessage({
      type: "addMessage",
      role: "assistant",
      content: response,
      crew: crewInfo.name,
      emoji: crewInfo.emoji,
      crewId: crew,
    });
  }

  private async sendWorkspaceFiles() {
    if (!this._view) return;

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      this._view.webview.postMessage({ type: "workspaceFiles", files: [] });
      return;
    }

    const files = await vscode.workspace.findFiles(
      "**/*.{ts,tsx,js,jsx,py,java,go,rs,rb,php,css,html,json,md,yml,yaml}",
      "**/node_modules/**",
      150
    );

    // Group by folder
    const fileTree = files.map((f) => ({
      path: f.fsPath,
      name: f.path.split("/").pop(),
      relativePath: vscode.workspace.asRelativePath(f),
      folder: vscode.workspace.asRelativePath(f).split("/").slice(0, -1).join("/") || "root",
    }));

    this._view.webview.postMessage({ type: "workspaceFiles", files: fileTree });
  }

  private async sendFileContent(path: string) {
    if (!this._view) return;

    try {
      const doc = await vscode.workspace.openTextDocument(path);
      this._view.webview.postMessage({
        type: "fileContent",
        path,
        content: doc.getText(),
        language: doc.languageId,
      });
    } catch {
      this._view.webview.postMessage({
        type: "fileContent",
        path,
        error: "Could not read file",
      });
    }
  }

  private async sendCurrentFile() {
    if (!this._view) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      this._view.webview.postMessage({ type: "currentFile", file: null });
      return;
    }

    const doc = editor.document;
    const selection = editor.selection;
    const selectedText = doc.getText(selection);

    this._view.webview.postMessage({
      type: "currentFile",
      file: {
        path: doc.uri.fsPath,
        relativePath: vscode.workspace.asRelativePath(doc.uri),
        name: doc.uri.path.split("/").pop(),
        language: doc.languageId,
        content: doc.getText(),
        selectedText: selectedText || null,
        lineCount: doc.lineCount,
      },
    });
  }

  private async sendProjects() {
    if (!this._view) return;

    const config = vscode.workspace.getConfiguration("alexAi");
    const baseUrl = config.get<string>("baseUrl") || "http://localhost:3001";

    try {
      const response = await fetch(`${baseUrl}/api/projects`);
      const data = (await response.json()) as { projects?: unknown[] };
      this._view.webview.postMessage({
        type: "projects",
        projects: data.projects || [],
      });
    } catch {
      this._view.webview.postMessage({ type: "projects", projects: [] });
    }
  }

  private async sendSprints(projectId: string) {
    if (!this._view) return;

    const config = vscode.workspace.getConfiguration("alexAi");
    const baseUrl = config.get<string>("baseUrl") || "http://localhost:3001";

    try {
      const response = await fetch(`${baseUrl}/api/sprints?projectId=${projectId}`);
      const data = (await response.json()) as { sprints?: unknown[] };
      this._view.webview.postMessage({
        type: "sprints",
        sprints: data.sprints || [],
      });
    } catch {
      this._view.webview.postMessage({ type: "sprints", sprints: [] });
    }
  }

  private async handleObservationLounge(topic: string) {
    if (!this._view) return;

    this._view.webview.postMessage({ type: "loungeLoading" });

    const result = await this.alexAiService.conveneObservationLounge(topic);

    this._view.webview.postMessage({
      type: "loungeResponse",
      result,
    });
  }

  async askCrewAboutCode(crew: string, code: string, language: string, action?: string) {
    if (!this._view) {
      await vscode.commands.executeCommand("alexAi.chatView.focus");
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    let prompt: string;
    switch (action) {
      case "explain":
        prompt = `Explain this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
        break;
      case "review":
        prompt = `Review this ${language} code for security issues, bugs, and best practices:\n\n\`\`\`${language}\n${code}\n\`\`\``;
        break;
      case "optimize":
        prompt = `Analyze and suggest optimizations for this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
        break;
      case "refactor":
        prompt = `Suggest refactoring improvements for this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
        break;
      case "fix":
        prompt = `Help fix issues in this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
        break;
      default:
        prompt = `Analyze this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
    }

    await this.handleUserMessage(prompt, crew);
  }

  showObservationLoungeResult(result: ObservationLoungeResult) {
    if (!this._view) return;

    this._view.webview.postMessage({
      type: "observationLounge",
      topic: result.topic,
      responses: result.responses,
    });
  }

  private clearChat() {
    if (!this._view) return;
    this._view.webview.postMessage({ type: "clearChat" });
  }

  /**
   * Set selection context from editor (auto-detected)
   */
  setSelectionContext(selection: {
    text: string;
    language: string;
    file: string;
    startLine: number;
    endLine: number;
  }) {
    if (!this._view) return;
    this._view.webview.postMessage({
      type: "setSelectionContext",
      selection,
    });
  }

  /**
   * Clear selection context
   */
  clearSelectionContext() {
    if (!this._view) return;
    this._view.webview.postMessage({ type: "clearSelectionContext" });
  }

  private getHtmlContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root {
      --bg: #070812;
      --panel: #0d1022;
      --panel2: #0b0f1d;
      --text: #eef1ff;
      --muted: #b9c0e5;
      --line: rgba(255,255,255,.13);
      --ok: #28d99a;
      --good: #5ae6ff;
      --warn: #ffd166;
      --risk: #ff5c93;
      --accent1: #7c5cff;
      --accent2: #00c2ff;
      --accent3: #ffb703;
      --accent4: #ff4d6d;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      color: var(--text);
      background: var(--bg);
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    /* Header with nav tabs */
    .header {
      padding: 10px 12px 0;
      background: linear-gradient(180deg, rgba(124,92,255,.15) 0%, transparent 100%);
      border-bottom: 1px solid var(--line);
    }
    
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }
    
    .brand-icon { font-size: 20px; }
    .brand-text { font-weight: 700; font-size: 14px; }
    .brand-sub { font-size: 10px; color: var(--muted); margin-left: auto; }
    
    .nav-tabs {
      display: flex;
      gap: 2px;
    }
    
    .nav-tab {
      padding: 8px 12px;
      background: transparent;
      border: none;
      color: var(--muted);
      cursor: pointer;
      font-size: 11px;
      font-weight: 500;
      border-radius: 8px 8px 0 0;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .nav-tab:hover {
      color: var(--text);
      background: rgba(255,255,255,.05);
    }
    
    .nav-tab.active {
      color: var(--accent1);
      background: var(--panel);
      border: 1px solid var(--line);
      border-bottom-color: var(--panel);
      margin-bottom: -1px;
    }
    
    /* Content Area */
    .content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: var(--panel);
    }
    
    .page { 
      display: none;
      flex: 1;
      flex-direction: column;
      overflow: hidden;
    }
    .page.active { display: flex; }
    
    /* Crew Bar */
    .crew-bar {
      display: flex;
      gap: 4px;
      padding: 8px 10px;
      background: rgba(0,0,0,.2);
      border-bottom: 1px solid var(--line);
      overflow-x: auto;
    }
    
    .crew-btn {
      padding: 4px 8px;
      background: rgba(255,255,255,.05);
      border: 1px solid transparent;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.15s;
      flex-shrink: 0;
    }
    
    .crew-btn:hover {
      background: rgba(124,92,255,.2);
      border-color: var(--accent1);
      transform: scale(1.1);
    }
    
    .crew-btn.selected {
      background: rgba(90,230,255,.2);
      border-color: var(--good);
    }
    
    /* Chat */
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .message {
      padding: 10px 12px;
      border-radius: 10px;
      max-width: 95%;
      line-height: 1.5;
      animation: fadeIn 0.2s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .message.user {
      background: linear-gradient(135deg, rgba(124,92,255,.35) 0%, rgba(124,92,255,.2) 100%);
      border: 1px solid rgba(124,92,255,.4);
      align-self: flex-end;
      border-radius: 10px 10px 2px 10px;
    }
    
    .message.assistant {
      background: rgba(255,255,255,.04);
      border: 1px solid var(--line);
      align-self: flex-start;
      border-radius: 10px 10px 10px 2px;
    }
    
    .message-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
      font-weight: 600;
      font-size: 11px;
    }
    
    .crew-badge {
      padding: 2px 6px;
      background: rgba(90,230,255,.15);
      border: 1px solid rgba(90,230,255,.3);
      border-radius: 4px;
      color: var(--good);
    }
    
    .message pre {
      background: rgba(0,0,0,.4);
      padding: 8px;
      border-radius: 6px;
      overflow-x: auto;
      margin: 8px 0;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 11px;
      border: 1px solid rgba(255,255,255,.1);
    }
    
    .message code {
      background: rgba(0,0,0,.3);
      padding: 2px 5px;
      border-radius: 3px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 11px;
    }
    
    .typing {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: rgba(255,255,255,.03);
      border: 1px solid var(--line);
      border-radius: 10px;
      align-self: flex-start;
      font-size: 11px;
      color: var(--muted);
    }
    
    .typing-dots span {
      animation: typing 1s infinite;
      opacity: 0.4;
    }
    .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
    .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
    
    @keyframes typing {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
    
    /* Context Bar */
    .context-bar {
      display: none;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      background: rgba(90,230,255,.1);
      border: 1px solid rgba(90,230,255,.2);
      border-radius: 6px;
      margin: 0 10px 8px;
      font-size: 10px;
    }
    
    .context-bar.visible { display: flex; }
    
    .context-file {
      color: var(--good);
      font-weight: 500;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .context-clear {
      cursor: pointer;
      color: var(--muted);
      padding: 2px 4px;
    }
    .context-clear:hover { color: var(--risk); }
    
    /* Input Area */
    .input-area {
      padding: 10px;
      border-top: 1px solid var(--line);
      background: rgba(0,0,0,.2);
    }
    
    .input-row {
      display: flex;
      gap: 6px;
    }
    
    .chat-input {
      flex: 1;
      padding: 8px 10px;
      background: rgba(255,255,255,.05);
      border: 1px solid var(--line);
      border-radius: 8px;
      color: var(--text);
      font-family: inherit;
      font-size: 12px;
      resize: none;
      min-height: 34px;
      max-height: 100px;
    }
    
    .chat-input:focus {
      outline: none;
      border-color: var(--accent1);
    }
    
    .send-btn {
      padding: 8px 14px;
      background: var(--accent1);
      border: none;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      font-size: 11px;
      transition: all 0.2s;
    }
    
    .send-btn:hover { filter: brightness(1.15); }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    
    /* File Explorer */
    .file-section {
      padding: 10px;
      overflow-y: auto;
      flex: 1;
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--line);
    }
    
    .section-title {
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
    }
    
    .refresh-btn {
      padding: 4px 8px;
      background: rgba(255,255,255,.05);
      border: 1px solid var(--line);
      border-radius: 4px;
      color: var(--muted);
      cursor: pointer;
      font-size: 10px;
    }
    .refresh-btn:hover { background: rgba(255,255,255,.1); }
    
    .file-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      transition: all 0.15s;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .file-item:hover { background: rgba(255,255,255,.05); }
    .file-item.active { background: rgba(90,230,255,.15); color: var(--good); }
    
    .file-icon { opacity: 0.6; font-size: 12px; }
    
    .current-file {
      padding: 10px;
      background: rgba(255,255,255,.03);
      border: 1px solid var(--line);
      border-radius: 8px;
      margin-bottom: 12px;
    }
    
    .current-file-name {
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .current-file-path {
      font-size: 10px;
      color: var(--muted);
      margin-bottom: 8px;
    }
    
    .use-context-btn {
      width: 100%;
      padding: 6px;
      background: rgba(90,230,255,.15);
      border: 1px solid rgba(90,230,255,.3);
      border-radius: 6px;
      color: var(--good);
      cursor: pointer;
      font-size: 11px;
    }
    .use-context-btn:hover { background: rgba(90,230,255,.25); }
    
    /* Projects */
    .projects-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 10px;
      overflow-y: auto;
      flex: 1;
    }
    
    .project-card {
      background: rgba(255,255,255,.03);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .project-card:hover {
      border-color: var(--accent1);
      background: rgba(124,92,255,.1);
    }
    
    .project-name {
      font-weight: 600;
      font-size: 12px;
      margin-bottom: 4px;
    }
    
    .project-tagline {
      font-size: 10px;
      color: var(--muted);
      margin-bottom: 8px;
    }
    
    .domain-badges {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    
    .domain-badge {
      padding: 2px 6px;
      background: rgba(124,92,255,.15);
      border: 1px solid rgba(124,92,255,.3);
      border-radius: 4px;
      font-size: 9px;
      color: var(--accent1);
    }
    
    /* Sprint Board */
    .sprint-section {
      padding: 10px;
      border-top: 1px solid var(--line);
      display: none;
    }
    
    .sprint-section.visible { display: block; }
    
    .sprint-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .sprint-title {
      font-weight: 600;
      font-size: 12px;
    }
    
    .progress-bar {
      width: 80px;
      height: 6px;
      background: rgba(255,255,255,.1);
      border-radius: 3px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: var(--good);
      transition: width 0.3s;
    }
    
    .kanban {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 8px;
    }
    
    .kanban-col {
      min-width: 100px;
      background: rgba(0,0,0,.2);
      border-radius: 6px;
      padding: 6px;
    }
    
    .kanban-header {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .story-card {
      background: rgba(255,255,255,.04);
      border: 1px solid var(--line);
      border-radius: 4px;
      padding: 6px;
      margin-bottom: 4px;
      font-size: 10px;
    }
    
    .story-points {
      display: inline-block;
      padding: 1px 4px;
      background: rgba(90,230,255,.15);
      border-radius: 3px;
      font-size: 9px;
      color: var(--good);
      margin-top: 4px;
    }
    
    /* Observation Lounge */
    .lounge-section {
      padding: 10px;
      overflow-y: auto;
      flex: 1;
    }
    
    .lounge-input {
      width: 100%;
      padding: 10px;
      background: rgba(255,255,255,.05);
      border: 1px solid var(--line);
      border-radius: 8px;
      color: var(--text);
      font-size: 12px;
      margin-bottom: 8px;
    }
    
    .lounge-input:focus {
      outline: none;
      border-color: var(--accent1);
    }
    
    .convene-btn {
      width: 100%;
      padding: 10px;
      background: linear-gradient(135deg, var(--accent1) 0%, var(--accent2) 100%);
      border: none;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      font-size: 12px;
      margin-bottom: 12px;
    }
    
    .convene-btn:hover { filter: brightness(1.1); }
    .convene-btn:disabled { opacity: 0.5; }
    
    .lounge-responses {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .lounge-response {
      background: rgba(255,255,255,.03);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px;
    }
    
    .lounge-response-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      font-size: 11px;
      margin-bottom: 6px;
    }
    
    .lounge-response-text {
      font-size: 11px;
      color: var(--muted);
      line-height: 1.5;
    }
    
    /* Welcome / Empty States */
    .welcome {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 20px;
      color: var(--muted);
    }
    
    .welcome-icon {
      font-size: 40px;
      margin-bottom: 12px;
      opacity: 0.6;
    }
    
    .welcome h3 {
      color: var(--text);
      margin-bottom: 8px;
      font-size: 14px;
    }
    
    .welcome p {
      font-size: 11px;
      max-width: 200px;
    }
    
    /* Loading */
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 30px;
    }
    
    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid var(--line);
      border-top-color: var(--accent1);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    
    /* Badge */
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 9px;
      font-weight: 500;
    }
    .badge.good { background: rgba(90,230,255,.15); color: var(--good); }
    .badge.warn { background: rgba(255,209,102,.15); color: var(--warn); }
    .badge.ok { background: rgba(40,217,154,.15); color: var(--ok); }
  </style>
</head>
<body>
  <!-- Header with Nav Tabs -->
  <div class="header">
    <div class="brand">
      <span class="brand-icon">🖖</span>
      <span class="brand-text">Alex AI</span>
      <span class="brand-sub">Crew Assistant</span>
    </div>
    <div class="nav-tabs">
      <button class="nav-tab active" data-page="chat">💬 Chat</button>
      <button class="nav-tab" data-page="files">📁 Files</button>
      <button class="nav-tab" data-page="projects">📦 Projects</button>
      <button class="nav-tab" data-page="lounge">🚀 Lounge</button>
    </div>
  </div>
  
  <div class="content">
    <!-- CHAT PAGE -->
    <div class="page active" id="page-chat">
      <div class="crew-bar">
        <button class="crew-btn selected" data-crew="riker" title="Commander Riker - Coordinator">⚡</button>
        <button class="crew-btn" data-crew="picard" title="Captain Picard">🎖️</button>
        <button class="crew-btn" data-crew="data" title="Commander Data">🤖</button>
        <button class="crew-btn" data-crew="worf" title="Lt. Worf">⚔️</button>
        <button class="crew-btn" data-crew="geordi" title="Lt. Cmdr. La Forge">🔧</button>
        <button class="crew-btn" data-crew="troi" title="Counselor Troi">💭</button>
        <button class="crew-btn" data-crew="obrien" title="Chief O'Brien">🛠️</button>
        <button class="crew-btn" data-crew="quark" title="Quark">💰</button>
      </div>
      
      <div class="chat-messages" id="chatMessages">
        <div class="welcome">
          <div class="welcome-icon">🖖</div>
          <h3>Welcome, Captain</h3>
          <p>Select a crew member and ask anything about your code. Use the Files tab to add context.</p>
        </div>
      </div>
      
      <div class="context-bar" id="contextBar">
        <span>📄</span>
        <span class="context-file" id="contextFile"></span>
        <span class="context-clear" id="clearContext">✕</span>
      </div>
      
      <div id="selectionIndicator" style="display: none; padding: 6px 10px; margin: 0 10px 8px; background: rgba(124,92,255,.15); border: 1px solid rgba(124,92,255,.3); border-radius: 6px; font-size: 10px; animation: pulse 2s infinite;">
        📋 Code selected - ask the crew about it!
      </div>
      
      <div class="input-area">
        <div class="input-row">
          <textarea class="chat-input" id="chatInput" placeholder="Ask the crew..." rows="1"></textarea>
          <button class="send-btn" id="sendBtn">Send</button>
        </div>
      </div>
    </div>
    
    <!-- FILES PAGE -->
    <div class="page" id="page-files">
      <div class="file-section">
        <div class="current-file" id="currentFileSection" style="display: none;">
          <div class="section-header" style="border: none; margin: 0; padding: 0;">
            <span class="section-title">Current Editor</span>
          </div>
          <div class="current-file-name" id="currentFileName"></div>
          <div class="current-file-path" id="currentFilePath"></div>
          <button class="use-context-btn" id="useContextBtn">📎 Use as Chat Context</button>
        </div>
        
        <div class="section-header">
          <span class="section-title">Workspace Files</span>
          <button class="refresh-btn" id="refreshFiles">↻ Refresh</button>
        </div>
        <div id="fileTree">
          <div class="loading"><div class="spinner"></div></div>
        </div>
      </div>
    </div>
    
    <!-- PROJECTS PAGE -->
    <div class="page" id="page-projects">
      <div class="projects-grid" id="projectsGrid">
        <div class="loading"><div class="spinner"></div></div>
      </div>
      <div class="sprint-section" id="sprintSection">
        <div class="sprint-header">
          <span class="sprint-title" id="sprintTitle">Sprint</span>
          <div class="progress-bar">
            <div class="progress-fill" id="sprintProgress" style="width: 0%"></div>
          </div>
        </div>
        <div class="kanban" id="kanbanBoard"></div>
      </div>
    </div>
    
    <!-- LOUNGE PAGE -->
    <div class="page" id="page-lounge">
      <div class="lounge-section">
        <p style="color: var(--muted); font-size: 11px; margin-bottom: 10px;">
          Convene the senior staff to discuss a topic. Each crew member contributes their expertise.
        </p>
        <input type="text" class="lounge-input" id="loungeTopic" placeholder="Enter topic for discussion...">
        <button class="convene-btn" id="conveneBtn">🖖 Convene Senior Staff</button>
        <div class="lounge-responses" id="loungeResponses"></div>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    
    // State
    let currentPage = 'chat';
    let currentCrew = 'riker';
    let currentContext = null;
    let currentFile = null;
    let hasMessages = false;
    
    // DOM
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const contextBar = document.getElementById('contextBar');
    const contextFile = document.getElementById('contextFile');
    
    // Navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        tab.classList.add('active');
        const page = tab.dataset.page;
        document.getElementById('page-' + page).classList.add('active');
        currentPage = page;
        
        // Load data
        if (page === 'files') {
          vscode.postMessage({ type: 'getWorkspaceFiles' });
          vscode.postMessage({ type: 'getCurrentFile' });
        } else if (page === 'projects') {
          vscode.postMessage({ type: 'getProjects' });
        }
      });
    });
    
    // Crew selection
    document.querySelectorAll('.crew-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.crew-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        currentCrew = btn.dataset.crew;
      });
    });
    
    // Chat
    function sendMessage() {
      const text = chatInput.value.trim();
      if (!text) return;
      
      vscode.postMessage({
        type: 'sendMessage',
        text: text,
        crew: currentCrew,
        context: currentContext
      });
      
      chatInput.value = '';
      chatInput.style.height = 'auto';
    }
    
    function addMessage(role, content, crew, emoji, crewId) {
      if (!hasMessages) {
        chatMessages.innerHTML = '';
        hasMessages = true;
      }
      
      const div = document.createElement('div');
      div.className = 'message ' + role;
      
      if (role === 'assistant' && crew) {
        const crewColors = {
          riker: 'var(--good)', picard: 'var(--warn)', data: 'var(--accent2)',
          worf: 'var(--risk)', geordi: 'var(--accent3)', troi: 'var(--accent1)',
          obrien: 'var(--ok)', quark: 'var(--accent3)'
        };
        div.innerHTML = '<div class="message-header">' +
          '<span>' + emoji + '</span>' +
          '<span class="crew-badge" style="border-color:' + (crewColors[crewId] || 'var(--good)') + '50; background:' + (crewColors[crewId] || 'var(--good)') + '15; color:' + (crewColors[crewId] || 'var(--good)') + '">' + crew + '</span>' +
          '</div>' + formatContent(content);
      } else {
        div.innerHTML = formatContent(content);
      }
      
      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function formatContent(content) {
      return content
        .replace(/\`\`\`(\\w*)?\\n?([\\s\\S]*?)\`\`\`/g, '<pre><code>$2</code></pre>')
        .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
        .replace(/\\n/g, '<br>');
    }
    
    function showTyping(crew) {
      const crewEmojis = {
        riker: '⚡', picard: '🎖️', data: '🤖', worf: '⚔️',
        geordi: '🔧', troi: '💭', obrien: '🛠️', quark: '💰'
      };
      const div = document.createElement('div');
      div.className = 'typing';
      div.id = 'typing-indicator';
      div.innerHTML = (crewEmojis[crew] || '🖖') + ' thinking <span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>';
      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function hideTyping() {
      const typing = document.getElementById('typing-indicator');
      if (typing) typing.remove();
    }
    
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    chatInput.addEventListener('input', () => {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
    });
    
    // Context
    document.getElementById('clearContext').addEventListener('click', () => {
      currentContext = null;
      contextBar.classList.remove('visible');
    });
    
    // Files
    document.getElementById('refreshFiles').addEventListener('click', () => {
      vscode.postMessage({ type: 'getWorkspaceFiles' });
    });
    
    document.getElementById('useContextBtn').addEventListener('click', () => {
      if (currentFile) {
        currentContext = currentFile.selectedText || currentFile.content;
        contextFile.textContent = currentFile.relativePath + (currentFile.selectedText ? ' (selection)' : '');
        contextBar.classList.add('visible');
        document.querySelector('.nav-tab[data-page="chat"]').click();
      }
    });
    
    // Lounge
    document.getElementById('conveneBtn').addEventListener('click', () => {
      const topic = document.getElementById('loungeTopic').value.trim();
      if (!topic) return;
      
      document.getElementById('loungeResponses').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
      vscode.postMessage({ type: 'observationLounge', topic });
    });
    
    // Message handler
    window.addEventListener('message', (event) => {
      const msg = event.data;
      
      switch (msg.type) {
        case 'addMessage':
          addMessage(msg.role, msg.content, msg.crew, msg.emoji, msg.crewId);
          break;
        case 'showTyping':
          showTyping(msg.crew);
          break;
        case 'hideTyping':
          hideTyping();
          break;
        case 'clearChat':
          chatMessages.innerHTML = '<div class="welcome"><div class="welcome-icon">🖖</div><h3>Chat Cleared</h3><p>Ready for a new conversation.</p></div>';
          hasMessages = false;
          break;
        case 'workspaceFiles':
          renderFileTree(msg.files);
          break;
        case 'currentFile':
          renderCurrentFile(msg.file);
          break;
        case 'projects':
          renderProjects(msg.projects);
          break;
        case 'sprints':
          renderSprints(msg.sprints);
          break;
        case 'loungeResponse':
          renderLoungeResponse(msg.result);
          break;
        case 'observationLounge':
          showObservationLounge(msg.topic, msg.responses);
          break;
        case 'setSelectionContext':
          setSelectionContext(msg.selection);
          break;
        case 'clearSelectionContext':
          clearSelectionContext();
          break;
      }
    });
    
    // Selection context handling
    let selectionData = null;
    
    function setSelectionContext(selection) {
      selectionData = selection;
      currentContext = selection.text;
      
      // Update context bar
      const contextBar = document.getElementById('contextBar');
      const contextFile = document.getElementById('contextFile');
      contextFile.textContent = selection.file + ' (L' + selection.startLine + '-' + selection.endLine + ')';
      contextBar.classList.add('visible');
      
      // Show selection indicator
      const indicator = document.getElementById('selectionIndicator');
      if (indicator) {
        indicator.innerHTML = '<span style="color: var(--good);">📋 ' + selection.language + ' code selected (' + (selection.endLine - selection.startLine + 1) + ' lines)</span>';
        indicator.style.display = 'block';
      }
      
      // Switch to chat tab if not already there
      if (currentPage !== 'chat') {
        document.querySelector('.nav-tab[data-page="chat"]').click();
      }
    }
    
    function clearSelectionContext() {
      selectionData = null;
      const indicator = document.getElementById('selectionIndicator');
      if (indicator) indicator.style.display = 'none';
    }
    
    function renderFileTree(files) {
      const container = document.getElementById('fileTree');
      if (!files || files.length === 0) {
        container.innerHTML = '<div class="welcome"><div class="welcome-icon">📂</div><p>No files found</p></div>';
        return;
      }
      
      // Group by folder
      const grouped = {};
      files.forEach(f => {
        const folder = f.folder || 'root';
        if (!grouped[folder]) grouped[folder] = [];
        grouped[folder].push(f);
      });
      
      let html = '';
      Object.keys(grouped).sort().slice(0, 10).forEach(folder => {
        html += '<div style="margin-bottom: 8px;"><div style="font-size: 10px; color: var(--muted); margin-bottom: 4px;">📁 ' + folder + '</div>';
        grouped[folder].slice(0, 5).forEach(f => {
          html += '<div class="file-item" data-path="' + f.path + '"><span class="file-icon">📄</span>' + f.name + '</div>';
        });
        if (grouped[folder].length > 5) {
          html += '<div style="font-size: 9px; color: var(--muted); padding: 4px 8px;">+' + (grouped[folder].length - 5) + ' more</div>';
        }
        html += '</div>';
      });
      
      container.innerHTML = html;
      
      container.querySelectorAll('.file-item').forEach(item => {
        item.addEventListener('click', () => {
          vscode.postMessage({ type: 'getFileContent', path: item.dataset.path });
          container.querySelectorAll('.file-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          
          // Set as context
          currentContext = null; // Will be set when file loads
          contextFile.textContent = item.textContent;
          contextBar.classList.add('visible');
        });
      });
    }
    
    function renderCurrentFile(file) {
      currentFile = file;
      const section = document.getElementById('currentFileSection');
      
      if (!file) {
        section.style.display = 'none';
        return;
      }
      
      section.style.display = 'block';
      document.getElementById('currentFileName').textContent = file.name;
      document.getElementById('currentFilePath').textContent = file.relativePath + ' • ' + file.lineCount + ' lines' + (file.selectedText ? ' • Selection' : '');
    }
    
    function renderProjects(projects) {
      const container = document.getElementById('projectsGrid');
      if (!projects || projects.length === 0) {
        container.innerHTML = '<div class="welcome"><div class="welcome-icon">📦</div><p>No projects found</p></div>';
        return;
      }
      
      container.innerHTML = projects.map(p => 
        '<div class="project-card" data-id="' + p.id + '">' +
        '<div class="project-name">' + (p.emoji || '📦') + ' ' + p.name + '</div>' +
        '<div class="project-tagline">' + (p.tagline || '') + '</div>' +
        '<div class="domain-badges">' +
        (p.domains || []).slice(0, 3).map(d => '<span class="domain-badge">' + d.name + '</span>').join('') +
        '</div></div>'
      ).join('');
      
      container.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', () => {
          vscode.postMessage({ type: 'getSprints', projectId: card.dataset.id });
        });
      });
    }
    
    function renderSprints(sprints) {
      const section = document.getElementById('sprintSection');
      if (!sprints || sprints.length === 0) {
        section.classList.remove('visible');
        return;
      }
      
      const sprint = sprints[0];
      section.classList.add('visible');
      document.getElementById('sprintTitle').textContent = sprint.name || 'Sprint';
      
      const progress = sprint.committedPoints > 0 ? Math.round((sprint.completedPoints / sprint.committedPoints) * 100) : 0;
      document.getElementById('sprintProgress').style.width = progress + '%';
      
      const kanban = document.getElementById('kanbanBoard');
      const statuses = ['backlog', 'todo', 'in_progress', 'review', 'done'];
      const statusLabels = { backlog: '📋', todo: '📝', in_progress: '🚀', review: '👀', done: '✅' };
      
      kanban.innerHTML = statuses.map(status => {
        const stories = (sprint.stories || []).filter(s => s.status === status);
        return '<div class="kanban-col">' +
          '<div class="kanban-header">' + statusLabels[status] + ' ' + status.replace('_', ' ') + '</div>' +
          stories.map(s => '<div class="story-card">' + s.title + '<div class="story-points">' + s.points + ' pts</div></div>').join('') +
          '</div>';
      }).join('');
    }
    
    function renderLoungeResponse(result) {
      const container = document.getElementById('loungeResponses');
      if (!result || !result.responses) {
        container.innerHTML = '<div class="welcome"><p>No responses</p></div>';
        return;
      }
      
      container.innerHTML = 
        '<div style="font-weight: 600; margin-bottom: 8px; font-size: 11px;">Topic: ' + result.topic + '</div>' +
        result.responses.map(r => 
          '<div class="lounge-response">' +
          '<div class="lounge-response-header">' + r.emoji + ' ' + r.name + '</div>' +
          '<div class="lounge-response-text">' + r.response + '</div>' +
          '</div>'
        ).join('');
    }
    
    function showObservationLounge(topic, responses) {
      if (!hasMessages) {
        chatMessages.innerHTML = '';
        hasMessages = true;
      }
      
      const div = document.createElement('div');
      div.className = 'message assistant';
      div.style.maxWidth = '100%';
      div.innerHTML = '<div class="message-header">🚀 Observation Lounge: ' + topic + '</div>' +
        responses.map(r => '<div style="margin: 8px 0; padding: 8px; background: rgba(0,0,0,.2); border-radius: 6px;">' +
          '<div style="font-weight: 600; font-size: 11px; margin-bottom: 4px;">' + r.emoji + ' ' + r.name + '</div>' +
          '<div style="font-size: 11px; color: var(--muted);">' + r.response + '</div></div>').join('');
      
      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Initial load
    vscode.postMessage({ type: 'getCurrentFile' });
  </script>
</body>
</html>`;
  }
}
