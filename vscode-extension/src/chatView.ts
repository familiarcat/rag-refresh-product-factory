import * as vscode from "vscode";
import { AlexAiService, ObservationLoungeResult } from "./alexAiService";

export class CrewChatViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private context: vscode.ExtensionContext;
  private alexAiService: AlexAiService;
  private currentCrew: string = "data";

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
          await this.handleUserMessage(message.text, message.crew);
          break;
        case "selectCrew":
          this.currentCrew = message.crew;
          this.updateCrewIndicator();
          break;
        case "clearHistory":
          this.alexAiService.clearHistory();
          this.clearChat();
          break;
      }
    });
  }

  private async handleUserMessage(text: string, crew: string) {
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

    // Get response
    const response = await this.alexAiService.chat(crew, text);

    // Hide typing and show response
    this._view.webview.postMessage({
      type: "hideTyping",
    });

    const crewInfo = this.alexAiService.getCrewInfo(crew);
    this._view.webview.postMessage({
      type: "addMessage",
      role: "assistant",
      content: response,
      crew: crewInfo.name,
      emoji: crewInfo.emoji,
    });
  }

  async askCrewAboutCode(
    crew: string,
    code: string,
    language: string,
    action?: string
  ) {
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
        prompt = `Suggest refactoring improvements for this ${language} code. Focus on readability, maintainability, and clean code principles:\n\n\`\`\`${language}\n${code}\n\`\`\``;
        break;
      case "fix":
        prompt = `Help fix issues in this ${language} code. Provide working solutions:\n\n\`\`\`${language}\n${code}\n\`\`\``;
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

  private updateCrewIndicator() {
    if (!this._view) return;
    const crewInfo = this.alexAiService.getCrewInfo(this.currentCrew);
    this._view.webview.postMessage({
      type: "updateCrew",
      crew: this.currentCrew,
      name: crewInfo.name,
      emoji: crewInfo.emoji,
    });
  }

  private clearChat() {
    if (!this._view) return;
    this._view.webview.postMessage({ type: "clearChat" });
  }

  private getHtmlContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      padding: 8px 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header-title {
      flex: 1;
      font-weight: 600;
    }
    .crew-selector {
      padding: 4px 8px;
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      color: var(--vscode-input-foreground);
      border-radius: 4px;
      font-size: 11px;
    }
    .clear-btn {
      padding: 4px 8px;
      background: transparent;
      border: 1px solid var(--vscode-button-secondaryBackground);
      color: var(--vscode-foreground);
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
    }
    .clear-btn:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .message {
      padding: 10px 12px;
      border-radius: 8px;
      max-width: 90%;
      line-height: 1.5;
    }
    .message.user {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      align-self: flex-end;
    }
    .message.assistant {
      background: var(--vscode-editor-inactiveSelectionBackground);
      align-self: flex-start;
    }
    .message-header {
      font-weight: 600;
      margin-bottom: 6px;
      font-size: 12px;
      opacity: 0.8;
    }
    .message pre {
      background: var(--vscode-textCodeBlock-background);
      padding: 8px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 8px 0;
      font-family: var(--vscode-editor-font-family);
      font-size: 12px;
    }
    .message code {
      background: var(--vscode-textCodeBlock-background);
      padding: 2px 4px;
      border-radius: 2px;
      font-family: var(--vscode-editor-font-family);
    }
    .typing {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: var(--vscode-editor-inactiveSelectionBackground);
      border-radius: 8px;
      align-self: flex-start;
      font-size: 12px;
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
    .input-area {
      padding: 12px;
      border-top: 1px solid var(--vscode-panel-border);
    }
    .input-wrapper {
      display: flex;
      gap: 8px;
    }
    #messageInput {
      flex: 1;
      padding: 8px 12px;
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      color: var(--vscode-input-foreground);
      border-radius: 6px;
      font-family: inherit;
      font-size: inherit;
      resize: none;
      min-height: 36px;
      max-height: 120px;
    }
    #messageInput:focus {
      outline: none;
      border-color: var(--vscode-focusBorder);
    }
    #sendBtn {
      padding: 8px 16px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }
    #sendBtn:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .observation-lounge {
      background: linear-gradient(135deg, var(--vscode-editor-background) 0%, var(--vscode-sideBar-background) 100%);
      border: 1px solid var(--vscode-focusBorder);
      border-radius: 8px;
      padding: 16px;
      margin: 8px 0;
    }
    .observation-lounge h3 {
      margin-bottom: 12px;
      font-size: 14px;
    }
    .lounge-response {
      padding: 10px;
      background: var(--vscode-editor-inactiveSelectionBackground);
      border-radius: 6px;
      margin-bottom: 8px;
    }
    .lounge-response-header {
      font-weight: 600;
      margin-bottom: 4px;
    }
    .welcome {
      text-align: center;
      padding: 32px 16px;
      color: var(--vscode-descriptionForeground);
    }
    .welcome h2 {
      margin-bottom: 8px;
      color: var(--vscode-foreground);
    }
    .welcome p {
      font-size: 12px;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="header-title">🖖 Alex AI</span>
    <select class="crew-selector" id="crewSelect">
      <option value="data">🤖 Data</option>
      <option value="picard">🎖️ Picard</option>
      <option value="riker">⚡ Riker</option>
      <option value="geordi">🔧 Geordi</option>
      <option value="troi">💭 Troi</option>
      <option value="worf">⚔️ Worf</option>
      <option value="obrien">🛠️ O'Brien</option>
      <option value="quark">💰 Quark</option>
    </select>
    <button class="clear-btn" id="clearBtn">Clear</button>
  </div>
  
  <div class="messages" id="messages">
    <div class="welcome">
      <h2>🖖 Welcome, Captain</h2>
      <p>Select a crew member and ask anything about your code.</p>
      <p><strong>Tip:</strong> Select code in the editor and right-click for quick actions.</p>
    </div>
  </div>
  
  <div class="input-area">
    <div class="input-wrapper">
      <textarea id="messageInput" placeholder="Ask the crew..." rows="1"></textarea>
      <button id="sendBtn">Send</button>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const messagesEl = document.getElementById('messages');
    const inputEl = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const crewSelect = document.getElementById('crewSelect');
    const clearBtn = document.getElementById('clearBtn');
    
    let hasMessages = false;

    function addMessage(role, content, crew, emoji) {
      if (!hasMessages) {
        messagesEl.innerHTML = '';
        hasMessages = true;
      }
      
      const div = document.createElement('div');
      div.className = 'message ' + role;
      
      if (role === 'assistant' && crew) {
        div.innerHTML = '<div class="message-header">' + emoji + ' ' + crew + '</div>' + formatContent(content);
      } else {
        div.innerHTML = formatContent(content);
      }
      
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function formatContent(content) {
      // Basic markdown-like formatting
      return content
        .replace(/\`\`\`(\\w*)?\\n([\\s\\S]*?)\`\`\`/g, '<pre><code>$2</code></pre>')
        .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
        .replace(/\\n/g, '<br>');
    }

    function showTyping(crew) {
      const div = document.createElement('div');
      div.className = 'typing';
      div.id = 'typing-indicator';
      div.innerHTML = crew + ' is thinking <span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>';
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function hideTyping() {
      const typing = document.getElementById('typing-indicator');
      if (typing) typing.remove();
    }

    function showObservationLounge(topic, responses) {
      if (!hasMessages) {
        messagesEl.innerHTML = '';
        hasMessages = true;
      }
      
      const div = document.createElement('div');
      div.className = 'observation-lounge';
      div.innerHTML = '<h3>🚀 Observation Lounge: ' + topic + '</h3>' +
        responses.map(r => 
          '<div class="lounge-response">' +
          '<div class="lounge-response-header">' + r.emoji + ' ' + r.name + '</div>' +
          '<div>' + r.response + '</div></div>'
        ).join('');
      
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function sendMessage() {
      const text = inputEl.value.trim();
      if (!text) return;
      
      vscode.postMessage({
        type: 'sendMessage',
        text: text,
        crew: crewSelect.value,
      });
      
      inputEl.value = '';
      inputEl.style.height = 'auto';
    }

    sendBtn.addEventListener('click', sendMessage);
    
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    inputEl.addEventListener('input', () => {
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
    });

    crewSelect.addEventListener('change', () => {
      vscode.postMessage({ type: 'selectCrew', crew: crewSelect.value });
    });

    clearBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'clearHistory' });
    });

    window.addEventListener('message', (event) => {
      const message = event.data;
      switch (message.type) {
        case 'addMessage':
          addMessage(message.role, message.content, message.crew, message.emoji);
          break;
        case 'showTyping':
          showTyping(message.crew);
          break;
        case 'hideTyping':
          hideTyping();
          break;
        case 'clearChat':
          messagesEl.innerHTML = '<div class="welcome"><h2>🖖 Chat Cleared</h2><p>Ready for a new conversation.</p></div>';
          hasMessages = false;
          break;
        case 'observationLounge':
          showObservationLounge(message.topic, message.responses);
          break;
        case 'updateCrew':
          // Could update UI if needed
          break;
      }
    });
  </script>
</body>
</html>`;
  }
}
