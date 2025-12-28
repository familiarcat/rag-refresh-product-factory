import * as vscode from "vscode";
import { AlexAiService } from "./alexAiService";

/**
 * Alex AI Comprehensive Panel
 * Full-featured webview with chat, projects, codebase introspection
 * Styled to match rag.pbradygeorgen.com
 */
export class AlexAiPanel {
  public static currentPanel: AlexAiPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private readonly _alexAiService: AlexAiService;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(
    extensionUri: vscode.Uri,
    alexAiService: AlexAiService
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If panel exists, show it
    if (AlexAiPanel.currentPanel) {
      AlexAiPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Create new panel
    const panel = vscode.window.createWebviewPanel(
      "alexAiPanel",
      "🖖 Alex AI",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri],
      }
    );

    AlexAiPanel.currentPanel = new AlexAiPanel(
      panel,
      extensionUri,
      alexAiService
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    alexAiService: AlexAiService
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._alexAiService = alexAiService;

    // Set initial HTML
    this._update();

    // Handle messages from webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case "chat":
            await this._handleChat(message.crew, message.text, message.context);
            break;
          case "getWorkspaceFiles":
            await this._sendWorkspaceFiles();
            break;
          case "getFileContent":
            await this._sendFileContent(message.path);
            break;
          case "getCurrentFile":
            await this._sendCurrentFile();
            break;
          case "getProjects":
            await this._sendProjects();
            break;
          case "getSprints":
            await this._sendSprints(message.projectId);
            break;
          case "observationLounge":
            await this._handleObservationLounge(message.topic, message.crew);
            break;
        }
      },
      null,
      this._disposables
    );

    // Listen for active editor changes
    vscode.window.onDidChangeActiveTextEditor(
      () => {
        this._sendCurrentFile();
      },
      null,
      this._disposables
    );

    // Handle disposal
    this._panel.onDidDispose(
      () => {
        AlexAiPanel.currentPanel = undefined;
        this._disposables.forEach((d) => d.dispose());
      },
      null,
      this._disposables
    );
  }

  private async _handleChat(crew: string, text: string, context?: string) {
    this._panel.webview.postMessage({ type: "chatLoading", crew });

    const response = await this._alexAiService.chat(crew, text);

    this._panel.webview.postMessage({
      type: "chatResponse",
      crew,
      response,
    });
  }

  private async _sendWorkspaceFiles() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      this._panel.webview.postMessage({ type: "workspaceFiles", files: [] });
      return;
    }

    const files = await vscode.workspace.findFiles(
      "**/*.{ts,tsx,js,jsx,py,java,go,rs,rb,php,css,html,json,md}",
      "**/node_modules/**",
      100
    );

    const fileTree = files.map((f) => ({
      path: f.fsPath,
      name: f.path.split("/").pop(),
      relativePath: vscode.workspace.asRelativePath(f),
    }));

    this._panel.webview.postMessage({
      type: "workspaceFiles",
      files: fileTree,
    });
  }

  private async _sendFileContent(path: string) {
    try {
      const doc = await vscode.workspace.openTextDocument(path);
      this._panel.webview.postMessage({
        type: "fileContent",
        path,
        content: doc.getText(),
        language: doc.languageId,
      });
    } catch (error) {
      this._panel.webview.postMessage({
        type: "fileContent",
        path,
        error: "Could not read file",
      });
    }
  }

  private async _sendCurrentFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      this._panel.webview.postMessage({ type: "currentFile", file: null });
      return;
    }

    const doc = editor.document;
    const selection = editor.selection;
    const selectedText = doc.getText(selection);

    this._panel.webview.postMessage({
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

  private async _sendProjects() {
    const config = vscode.workspace.getConfiguration("alexAi");
    const baseUrl = config.get<string>("baseUrl") || "http://localhost:3001";

    try {
      const response = await fetch(`${baseUrl}/api/projects`);
      const data = (await response.json()) as { projects?: unknown[] };
      this._panel.webview.postMessage({
        type: "projects",
        projects: data.projects || [],
      });
    } catch {
      this._panel.webview.postMessage({ type: "projects", projects: [] });
    }
  }

  private async _sendSprints(projectId: string) {
    const config = vscode.workspace.getConfiguration("alexAi");
    const baseUrl = config.get<string>("baseUrl") || "http://localhost:3001";

    try {
      const response = await fetch(
        `${baseUrl}/api/sprints?projectId=${projectId}`
      );
      const data = (await response.json()) as { sprints?: unknown[] };
      this._panel.webview.postMessage({
        type: "sprints",
        sprints: data.sprints || [],
      });
    } catch {
      this._panel.webview.postMessage({ type: "sprints", sprints: [] });
    }
  }

  private async _handleObservationLounge(topic: string, crew: string[]) {
    this._panel.webview.postMessage({ type: "loungeLoading" });

    const result = await this._alexAiService.conveneObservationLounge(topic);

    this._panel.webview.postMessage({
      type: "loungeResponse",
      result,
    });
  }

  private _update() {
    this._panel.webview.html = this._getHtmlContent();
  }

  private _getHtmlContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alex AI</title>
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
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      background-image: 
        radial-gradient(1200px 700px at 18% 0%, rgba(124,92,255,.35) 0%, transparent 56%),
        radial-gradient(900px 520px at 85% 20%, rgba(0,194,255,.15) 0%, transparent 55%),
        radial-gradient(900px 520px at 78% 78%, rgba(255,92,147,.10) 0%, transparent 55%);
    }
    
    .app {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      padding-bottom: 70px; /* Space for bottom nav */
    }

    /* Mobile-First Bottom Navigation */
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: linear-gradient(180deg, rgba(13,16,34,.97), rgba(11,15,29,.95));
      border-top: 1px solid var(--line);
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: 0 16px;
      z-index: 100;
      backdrop-filter: blur(10px);
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      transition: all 0.2s;
      padding: 8px 16px;
      border-radius: 12px;
      flex: 1;
      max-width: 100px;
    }

    .nav-item:hover {
      background: rgba(255,255,255,.05);
    }

    .nav-item.active {
      background: rgba(124,92,255,.15);
      color: var(--accent1);
    }

    .nav-icon {
      font-size: 24px;
      transition: transform 0.2s;
    }

    .nav-item.active .nav-icon {
      transform: scale(1.15);
    }

    .nav-label {
      font-size: 10px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Crew Modal (replaces fixed sidebar crew) */
    .crew-modal {
      position: fixed;
      bottom: 70px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(180deg, rgba(13,16,34,.98), rgba(11,15,29,.95));
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 16px;
      display: none;
      z-index: 99;
      box-shadow: 0 -4px 20px rgba(0,0,0,.3);
      backdrop-filter: blur(10px);
    }

    .crew-modal.show {
      display: block;
    }

    .crew-modal-header {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--muted);
      margin-bottom: 12px;
      font-weight: 600;
      text-align: center;
    }

    .crew-avatars {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }

    .crew-avatar {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(124,92,255,.2);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      cursor: pointer;
      transition: all 0.2s;
      border: 2px solid transparent;
    }

    .crew-avatar:hover {
      border-color: var(--accent1);
      transform: scale(1.05);
    }

    .crew-avatar.selected {
      border-color: var(--good);
      background: rgba(90,230,255,.2);
    }

    .crew-name {
      font-size: 8px;
      margin-top: 4px;
      text-align: center;
    }

    /* Main Content */
    .main {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
    }

    /* Top Header (replaces brand in sidebar) */
    .top-header {
      position: sticky;
      top: 0;
      background: rgba(7,8,18,.95);
      border-bottom: 1px solid var(--line);
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      z-index: 10;
      backdrop-filter: blur(10px);
    }

    .brand-icon { font-size: 24px; }
    .brand-text h1 {
      font-size: 16px;
      font-weight: 700;
      margin: 0;
      background: linear-gradient(135deg, var(--accent1), var(--accent2));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-text p { font-size: 10px; color: var(--muted); margin: 2px 0 0; }
    
    .page { display: none; }
    .page.active { display: block; }
    
    /* Cards */
    .card {
      background: rgba(255,255,255,.04);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 16px;
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .card-title {
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .card-title-icon { font-size: 18px; }
    
    /* Chat */
    .chat-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 140px);
    }
    
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .message {
      padding: 12px 14px;
      border-radius: 12px;
      max-width: 85%;
      line-height: 1.5;
      font-size: 13px;
    }
    
    .message.user {
      background: rgba(124,92,255,.25);
      border: 1px solid rgba(124,92,255,.4);
      align-self: flex-end;
    }
    
    .message.assistant {
      background: rgba(255,255,255,.05);
      border: 1px solid var(--line);
      align-self: flex-start;
    }
    
    .message-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-weight: 600;
      font-size: 12px;
      color: var(--good);
    }
    
    .message pre {
      background: rgba(0,0,0,.3);
      padding: 10px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 8px 0;
      font-size: 12px;
      font-family: 'Monaco', 'Menlo', monospace;
    }
    
    .message code {
      background: rgba(0,0,0,.3);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 12px;
    }
    
    .chat-input-area {
      padding: 12px;
      border-top: 1px solid var(--line);
      background: rgba(13,16,34,.8);
    }
    
    .context-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      padding: 8px 10px;
      background: rgba(90,230,255,.1);
      border: 1px solid rgba(90,230,255,.2);
      border-radius: 8px;
      font-size: 11px;
    }
    
    .context-bar.hidden { display: none; }
    
    .context-file {
      color: var(--good);
      font-weight: 500;
    }
    
    .context-clear {
      margin-left: auto;
      cursor: pointer;
      color: var(--muted);
    }
    
    .context-clear:hover { color: var(--risk); }
    
    .input-row {
      display: flex;
      gap: 10px;
    }
    
    .crew-select {
      padding: 10px 12px;
      background: rgba(255,255,255,.05);
      border: 1px solid var(--line);
      border-radius: 10px;
      color: var(--text);
      font-size: 12px;
      min-width: 140px;
    }
    
    .chat-input {
      flex: 1;
      padding: 10px 14px;
      background: rgba(255,255,255,.05);
      border: 1px solid var(--line);
      border-radius: 10px;
      color: var(--text);
      font-size: 13px;
      resize: none;
    }
    
    .chat-input:focus {
      outline: none;
      border-color: var(--accent1);
    }
    
    .send-btn {
      padding: 10px 20px;
      background: var(--accent1);
      border: none;
      border-radius: 10px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .send-btn:hover { filter: brightness(1.1); }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    
    /* File Explorer */
    .file-tree {
      max-height: 300px;
      overflow-y: auto;
    }
    
    .file-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.15s;
    }
    
    .file-item:hover {
      background: rgba(255,255,255,.05);
    }
    
    .file-item.active {
      background: rgba(90,230,255,.1);
      color: var(--good);
    }
    
    .file-icon { opacity: 0.6; }
    
    /* Projects Grid */
    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 14px;
    }
    
    .project-card {
      background: rgba(255,255,255,.04);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .project-card:hover {
      border-color: var(--accent1);
      background: rgba(255,255,255,.06);
    }
    
    .project-name {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
    }
    
    .project-tagline {
      font-size: 12px;
      color: var(--muted);
      margin-bottom: 10px;
    }
    
    .project-domains {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    
    .domain-badge {
      padding: 4px 8px;
      background: rgba(124,92,255,.15);
      border: 1px solid rgba(124,92,255,.3);
      border-radius: 6px;
      font-size: 10px;
      color: var(--accent1);
    }
    
    /* Sprint Board */
    .sprint-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .sprint-title {
      font-size: 16px;
      font-weight: 600;
    }
    
    .sprint-progress {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .progress-bar {
      width: 120px;
      height: 8px;
      background: rgba(255,255,255,.1);
      border-radius: 4px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: var(--good);
      border-radius: 4px;
      transition: width 0.3s;
    }
    
    .progress-text {
      font-size: 12px;
      color: var(--muted);
    }
    
    .kanban {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 12px;
    }
    
    .kanban-column {
      background: rgba(255,255,255,.02);
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 10px;
      min-height: 200px;
    }
    
    .column-header {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .story-card {
      background: rgba(255,255,255,.04);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 8px;
      font-size: 12px;
    }
    
    .story-title {
      font-weight: 500;
      margin-bottom: 6px;
    }
    
    .story-points {
      display: inline-block;
      padding: 2px 6px;
      background: rgba(90,230,255,.15);
      border-radius: 4px;
      font-size: 10px;
      color: var(--good);
    }
    
    /* Observation Lounge */
    .lounge-topic-input {
      width: 100%;
      padding: 14px;
      background: rgba(255,255,255,.05);
      border: 1px solid var(--line);
      border-radius: 10px;
      color: var(--text);
      font-size: 14px;
      margin-bottom: 12px;
    }
    
    .lounge-topic-input:focus {
      outline: none;
      border-color: var(--accent1);
    }
    
    .lounge-responses {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 16px;
    }
    
    .lounge-response {
      background: rgba(255,255,255,.03);
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 12px;
    }
    
    .lounge-response-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-weight: 600;
      font-size: 13px;
    }
    
    .lounge-response-text {
      font-size: 13px;
      color: var(--muted);
      line-height: 1.5;
    }
    
    /* Typing indicator */
    .typing {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: rgba(255,255,255,.03);
      border-radius: 10px;
      font-size: 12px;
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
    
    /* Badges */
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 500;
    }
    .badge.good { background: rgba(90,230,255,.15); color: var(--good); border: 1px solid rgba(90,230,255,.3); }
    .badge.warn { background: rgba(255,209,102,.15); color: var(--warn); border: 1px solid rgba(255,209,102,.3); }
    .badge.risk { background: rgba(255,92,147,.15); color: var(--risk); border: 1px solid rgba(255,92,147,.3); }
    
    /* Empty states */
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--muted);
    }
    
    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 12px;
      opacity: 0.5;
    }
    
    /* Loading */
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }
    
    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--line);
      border-top-color: var(--accent1);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="app">
    <!-- Top Header -->
    <div class="top-header">
      <div class="brand-icon">🖖</div>
      <div class="brand-text">
        <h1>Alex AI</h1>
        <p>Crew Code Assistant</p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main">
      <!-- Chat Page -->
      <div class="page active" id="page-chat">
        <div class="chat-container">
          <div class="chat-messages" id="chatMessages">
            <div class="message assistant">
              <div class="message-header">
                <span>⚡</span>
                <span>Commander Riker</span>
              </div>
              Welcome aboard! I'm coordinating the crew to assist you. Ask me anything about your code, and I'll route your question to the best specialist.
              <br><br>
              Select a file or code, and I'll include it as context for more relevant answers.
            </div>
          </div>
          
          <div class="chat-input-area">
            <div class="context-bar hidden" id="contextBar">
              <span>📄</span>
              <span>Context: </span>
              <span class="context-file" id="contextFile"></span>
              <span class="context-clear" id="clearContext">✕</span>
            </div>
            
            <div class="input-row">
              <select class="crew-select" id="crewSelect">
                <option value="riker">⚡ Riker (Coord)</option>
                <option value="picard">🎖️ Picard</option>
                <option value="data">🤖 Data</option>
                <option value="worf">⚔️ Worf</option>
                <option value="geordi">🔧 Geordi</option>
                <option value="troi">💭 Troi</option>
                <option value="obrien">🛠️ O'Brien</option>
                <option value="quark">💰 Quark</option>
              </select>
              <textarea class="chat-input" id="chatInput" placeholder="Ask the crew..." rows="1"></textarea>
              <button class="send-btn" id="sendBtn">Send</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Codebase Page -->
      <div class="page" id="page-codebase">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span class="card-title-icon">📁</span>
              Workspace Files
            </div>
            <button class="send-btn" id="refreshFiles" style="padding: 6px 12px; font-size: 12px;">Refresh</button>
          </div>
          <div class="file-tree" id="fileTree">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span class="card-title-icon">📝</span>
              Current File
            </div>
          </div>
          <div id="currentFileInfo">
            <div class="empty-state">
              <div class="empty-state-icon">📄</div>
              <p>Open a file in the editor to see it here</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Projects Page -->
      <div class="page" id="page-projects">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span class="card-title-icon">📦</span>
              Active Projects
            </div>
          </div>
          <div class="projects-grid" id="projectsGrid">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
        
        <div class="card" id="sprintCard" style="display: none;">
          <div class="sprint-header">
            <div class="sprint-title" id="sprintTitle">Sprint</div>
            <div class="sprint-progress">
              <div class="progress-bar">
                <div class="progress-fill" id="sprintProgress" style="width: 0%"></div>
              </div>
              <span class="progress-text" id="sprintProgressText">0%</span>
            </div>
          </div>
          <div class="kanban" id="kanbanBoard"></div>
        </div>
      </div>
      
      <!-- Observation Lounge Page -->
      <div class="page" id="page-lounge">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span class="card-title-icon">🚀</span>
              Observation Lounge
            </div>
          </div>
          <p style="color: var(--muted); font-size: 13px; margin-bottom: 14px;">
            Convene the senior staff to discuss a topic. Each crew member will provide their perspective.
          </p>
          <input type="text" class="lounge-topic-input" id="loungeTopic" placeholder="Enter a topic for discussion...">
          <button class="send-btn" id="conveneBtn" style="width: 100%;">🖖 Convene Senior Staff</button>
          
          <div class="lounge-responses" id="loungeResponses"></div>
        </div>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <div class="bottom-nav">
      <div class="nav-item active" data-page="chat">
        <span class="nav-icon">💬</span>
        <span class="nav-label">Chat</span>
      </div>
      <div class="nav-item" data-page="projects">
        <span class="nav-icon">📦</span>
        <span class="nav-label">Projects</span>
      </div>
      <div class="nav-item" data-page="codebase">
        <span class="nav-icon">📁</span>
        <span class="nav-label">Files</span>
      </div>
      <div class="nav-item" id="crew-toggle">
        <span class="nav-icon">👥</span>
        <span class="nav-label">Crew</span>
      </div>
    </div>

    <!-- Crew Modal -->
    <div class="crew-modal" id="crewModal">
      <div class="crew-modal-header">Select Crew Member</div>
      <div class="crew-avatars">
        <div class="crew-avatar selected" data-crew="riker" title="Commander Riker">
          <span>⚡</span>
          <div class="crew-name">Riker</div>
        </div>
        <div class="crew-avatar" data-crew="picard" title="Captain Picard">
          <span>🎖️</span>
          <div class="crew-name">Picard</div>
        </div>
        <div class="crew-avatar" data-crew="data" title="Commander Data">
          <span>🤖</span>
          <div class="crew-name">Data</div>
        </div>
        <div class="crew-avatar" data-crew="worf" title="Lt. Worf">
          <span>⚔️</span>
          <div class="crew-name">Worf</div>
        </div>
        <div class="crew-avatar" data-crew="geordi" title="Lt. Cmdr. La Forge">
          <span>🔧</span>
          <div class="crew-name">Geordi</div>
        </div>
        <div class="crew-avatar" data-crew="troi" title="Counselor Troi">
          <span>💭</span>
          <div class="crew-name">Troi</div>
        </div>
        <div class="crew-avatar" data-crew="obrien" title="Chief O'Brien">
          <span>🛠️</span>
          <div class="crew-name">O'Brien</div>
        </div>
        <div class="crew-avatar" data-crew="quark" title="Quark">
          <span>💰</span>
          <div class="crew-name">Quark</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    
    // State
    let currentPage = 'chat';
    let currentCrew = 'riker';
    let currentContext = null;
    let messages = [];
    let projects = [];
    
    // DOM Elements
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const crewSelect = document.getElementById('crewSelect');
    const contextBar = document.getElementById('contextBar');
    const contextFile = document.getElementById('contextFile');
    const clearContext = document.getElementById('clearContext');
    const fileTree = document.getElementById('fileTree');
    const projectsGrid = document.getElementById('projectsGrid');
    const loungeResponses = document.getElementById('loungeResponses');
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        item.classList.add('active');
        const page = item.dataset.page;
        document.getElementById('page-' + page).classList.add('active');
        currentPage = page;
        
        // Load data for page
        if (page === 'codebase') {
          vscode.postMessage({ type: 'getWorkspaceFiles' });
          vscode.postMessage({ type: 'getCurrentFile' });
        } else if (page === 'projects') {
          vscode.postMessage({ type: 'getProjects' });
        }
      });
    });
    
    // Crew Modal Toggle
    const crewToggle = document.getElementById('crew-toggle');
    const crewModal = document.getElementById('crewModal');

    crewToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      crewModal.classList.toggle('show');
    });

    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
      if (!crewModal.contains(e.target) && !crewToggle.contains(e.target)) {
        crewModal.classList.remove('show');
      }
    });

    // Crew selection
    document.querySelectorAll('.crew-avatar').forEach(avatar => {
      avatar.addEventListener('click', () => {
        document.querySelectorAll('.crew-avatar').forEach(a => a.classList.remove('selected'));
        avatar.classList.add('selected');
        currentCrew = avatar.dataset.crew;
        crewSelect.value = currentCrew;
        // Close modal after selection
        crewModal.classList.remove('show');
      });
    });

    crewSelect.addEventListener('change', () => {
      currentCrew = crewSelect.value;
      document.querySelectorAll('.crew-avatar').forEach(a => {
        a.classList.toggle('selected', a.dataset.crew === currentCrew);
      });
    });
    
    // Chat
    function sendMessage() {
      const text = chatInput.value.trim();
      if (!text) return;
      
      // Add user message
      addMessage('user', text);
      chatInput.value = '';
      
      // Send to extension
      vscode.postMessage({
        type: 'chat',
        crew: currentCrew,
        text: text,
        context: currentContext
      });
    }
    
    function addMessage(role, content, crew) {
      const div = document.createElement('div');
      div.className = 'message ' + role;
      
      if (role === 'assistant' && crew) {
        const crewEmojis = {
          riker: '⚡', picard: '🎖️', data: '🤖', worf: '⚔️',
          geordi: '🔧', troi: '💭', obrien: '🛠️', quark: '💰'
        };
        const crewNames = {
          riker: 'Commander Riker', picard: 'Captain Picard', data: 'Commander Data',
          worf: 'Lt. Worf', geordi: 'Lt. Cmdr. La Forge', troi: 'Counselor Troi',
          obrien: "Chief O'Brien", quark: 'Quark'
        };
        div.innerHTML = '<div class="message-header"><span>' + (crewEmojis[crew] || '🖖') + '</span><span>' + (crewNames[crew] || crew) + '</span></div>' + formatContent(content);
      } else {
        div.innerHTML = formatContent(content);
      }
      
      chatMessages.appendChild(div);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function formatContent(content) {
      return content
        .replace(/\`\`\`(\\w*)?([\\s\\S]*?)\`\`\`/g, '<pre><code>$2</code></pre>')
        .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
        .replace(/\\n/g, '<br>');
    }
    
    function showTyping(crew) {
      const div = document.createElement('div');
      div.className = 'typing';
      div.id = 'typing-indicator';
      const crewEmojis = { riker: '⚡', picard: '🎖️', data: '🤖', worf: '⚔️', geordi: '🔧', troi: '💭', obrien: '🛠️', quark: '💰' };
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
    
    // Context
    clearContext.addEventListener('click', () => {
      currentContext = null;
      contextBar.classList.add('hidden');
    });
    
    // Refresh files
    document.getElementById('refreshFiles').addEventListener('click', () => {
      vscode.postMessage({ type: 'getWorkspaceFiles' });
    });
    
    // Observation Lounge
    document.getElementById('conveneBtn').addEventListener('click', () => {
      const topic = document.getElementById('loungeTopic').value.trim();
      if (!topic) return;
      
      loungeResponses.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
      vscode.postMessage({
        type: 'observationLounge',
        topic: topic,
        crew: ['picard', 'riker', 'data', 'worf', 'troi', 'geordi']
      });
    });
    
    // Handle messages from extension
    window.addEventListener('message', (event) => {
      const message = event.data;
      
      switch (message.type) {
        case 'chatLoading':
          showTyping(message.crew);
          break;
          
        case 'chatResponse':
          hideTyping();
          addMessage('assistant', message.response, message.crew);
          break;
          
        case 'workspaceFiles':
          renderFileTree(message.files);
          break;
          
        case 'currentFile':
          renderCurrentFile(message.file);
          break;
          
        case 'projects':
          renderProjects(message.projects);
          break;
          
        case 'sprints':
          renderSprints(message.sprints);
          break;
          
        case 'loungeLoading':
          // Already handled above
          break;
          
        case 'loungeResponse':
          renderLoungeResponse(message.result);
          break;
      }
    });
    
    function renderFileTree(files) {
      if (!files || files.length === 0) {
        fileTree.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📂</div><p>No files found in workspace</p></div>';
        return;
      }
      
      fileTree.innerHTML = files.map(f => 
        '<div class="file-item" data-path="' + f.path + '">' +
        '<span class="file-icon">📄</span>' +
        '<span>' + f.relativePath + '</span>' +
        '</div>'
      ).join('');
      
      fileTree.querySelectorAll('.file-item').forEach(item => {
        item.addEventListener('click', () => {
          currentContext = item.dataset.path;
          contextFile.textContent = item.querySelector('span:last-child').textContent;
          contextBar.classList.remove('hidden');
          
          fileTree.querySelectorAll('.file-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
        });
      });
    }
    
    function renderCurrentFile(file) {
      const container = document.getElementById('currentFileInfo');
      if (!file) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📄</div><p>Open a file in the editor to see it here</p></div>';
        return;
      }
      
      container.innerHTML = 
        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">' +
        '<div><strong>' + file.name + '</strong><br><span style="font-size: 11px; color: var(--muted);">' + file.relativePath + '</span></div>' +
        '<span class="badge good">' + file.language + '</span>' +
        '</div>' +
        '<div style="font-size: 12px; color: var(--muted);">' +
        file.lineCount + ' lines' +
        (file.selectedText ? ' • <span style="color: var(--good);">Selection active</span>' : '') +
        '</div>' +
        '<button class="send-btn" style="margin-top: 10px; width: 100%; padding: 8px; font-size: 12px;" onclick="useAsContext()">Use as Context</button>';
        
      window.useAsContext = () => {
        currentContext = file.content;
        contextFile.textContent = file.relativePath + (file.selectedText ? ' (selection)' : '');
        contextBar.classList.remove('hidden');
        
        // Switch to chat
        document.querySelector('.nav-item[data-page="chat"]').click();
      };
    }
    
    function renderProjects(projectList) {
      projects = projectList;
      if (!projectList || projectList.length === 0) {
        projectsGrid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📦</div><p>No projects found</p></div>';
        return;
      }
      
      projectsGrid.innerHTML = projectList.map(p => 
        '<div class="project-card" data-id="' + p.id + '">' +
        '<div class="project-name">' + (p.emoji || '📦') + ' ' + p.name + '</div>' +
        '<div class="project-tagline">' + (p.tagline || '') + '</div>' +
        '<div class="project-domains">' +
        (p.domains || []).slice(0, 3).map(d => '<span class="domain-badge">' + d.name + '</span>').join('') +
        '</div></div>'
      ).join('');
      
      projectsGrid.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', () => {
          vscode.postMessage({ type: 'getSprints', projectId: card.dataset.id });
        });
      });
    }
    
    function renderSprints(sprintList) {
      const sprintCard = document.getElementById('sprintCard');
      if (!sprintList || sprintList.length === 0) {
        sprintCard.style.display = 'none';
        return;
      }
      
      const sprint = sprintList[0];
      sprintCard.style.display = 'block';
      document.getElementById('sprintTitle').textContent = sprint.name || 'Sprint';
      
      const progress = sprint.committedPoints > 0 
        ? Math.round((sprint.completedPoints / sprint.committedPoints) * 100) 
        : 0;
      document.getElementById('sprintProgress').style.width = progress + '%';
      document.getElementById('sprintProgressText').textContent = progress + '%';
      
      const kanban = document.getElementById('kanbanBoard');
      const statuses = ['backlog', 'todo', 'in_progress', 'review', 'done'];
      const statusLabels = { backlog: '📋 Backlog', todo: '📝 To Do', in_progress: '🚀 In Progress', review: '👀 Review', done: '✅ Done' };
      
      kanban.innerHTML = statuses.map(status => {
        const stories = (sprint.stories || []).filter(s => s.status === status);
        return '<div class="kanban-column">' +
          '<div class="column-header">' + statusLabels[status] + ' <span style="opacity: 0.6;">(' + stories.length + ')</span></div>' +
          stories.map(s => 
            '<div class="story-card"><div class="story-title">' + s.title + '</div><span class="story-points">' + s.points + ' pts</span></div>'
          ).join('') +
          '</div>';
      }).join('');
    }
    
    function renderLoungeResponse(result) {
      if (!result || !result.responses) {
        loungeResponses.innerHTML = '<div class="empty-state">No responses received</div>';
        return;
      }
      
      loungeResponses.innerHTML = 
        '<h4 style="margin: 0 0 12px;">Topic: ' + result.topic + '</h4>' +
        result.responses.map(r => 
          '<div class="lounge-response">' +
          '<div class="lounge-response-header">' + r.emoji + ' ' + r.name + '</div>' +
          '<div class="lounge-response-text">' + r.response + '</div>' +
          '</div>'
        ).join('');
    }
    
    // Initial load
    vscode.postMessage({ type: 'getCurrentFile' });
  </script>
</body>
</html>`;
  }
}

export function registerAlexPanel(
  context: vscode.ExtensionContext,
  alexAiService: AlexAiService
) {
  context.subscriptions.push(
    vscode.commands.registerCommand("alexAi.openPanel", () => {
      AlexAiPanel.createOrShow(context.extensionUri, alexAiService);
    })
  );

  console.log("🖖 Alex AI Panel registered (full webview)");
}
