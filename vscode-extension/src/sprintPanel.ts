/**
 * Sprint Panel for VSCode Extension
 *
 * Displays sprint timeline in VSCode webview.
 * Shares component theming and data with web dashboard.
 */

import * as vscode from 'vscode';
import * as path from 'path';

export class SprintPanel {
  public static currentPanel: SprintPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri, projectId?: string) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (SprintPanel.currentPanel) {
      SprintPanel.currentPanel._panel.reveal(column);
      if (projectId) {
        SprintPanel.currentPanel.updateProject(projectId);
      }
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      'alexAiSprints',
      projectId ? `Sprints - ${projectId}` : 'All Active Sprints',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'media'),
          vscode.Uri.joinPath(extensionUri, 'dist')
        ]
      }
    );

    SprintPanel.currentPanel = new SprintPanel(panel, extensionUri, projectId);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    private projectId?: string
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set initial HTML content
    this._update();

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from webview
    this._panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'openStory':
            this._openStory(message.storyId);
            return;
          case 'openSprint':
            this._openSprint(message.sprintId);
            return;
          case 'createSprint':
            this._createSprint();
            return;
          case 'refresh':
            this._update();
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public updateProject(projectId: string) {
    this.projectId = projectId;
    this._panel.title = `Sprints - ${projectId}`;
    this._update();
  }

  public dispose() {
    SprintPanel.currentPanel = undefined;

    // Clean up resources
    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get API URL from configuration
    const config = vscode.workspace.getConfiguration('alexAI');
    const environment = config.get<string>('environment') || 'local';
    const apiUrl = environment === 'production'
      ? 'https://rag-refresh-product-factory.vercel.app/api'
      : 'http://localhost:3000/api';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sprint Timeline</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      padding: 16px;
      margin: 0;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }

    .title {
      font-size: 20px;
      font-weight: 600;
    }

    .controls {
      display: flex;
      gap: 8px;
    }

    button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 6px 12px;
      border-radius: 2px;
      cursor: pointer;
      font-size: 13px;
    }

    button:hover {
      background: var(--vscode-button-hoverBackground);
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: var(--vscode-descriptionForeground);
    }

    .spinner {
      border: 3px solid var(--vscode-panel-border);
      border-top: 3px solid var(--vscode-button-background);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .sprint-card {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      margin-bottom: 16px;
      overflow: hidden;
    }

    .sprint-header {
      background: linear-gradient(to right, #2563eb, #1d4ed8);
      color: white;
      padding: 16px;
      cursor: pointer;
    }

    .sprint-header:hover {
      background: linear-gradient(to right, #1d4ed8, #1e40af);
    }

    .sprint-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .sprint-dates {
      font-size: 12px;
      opacity: 0.9;
    }

    .progress-bar {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 4px;
      height: 8px;
      margin-top: 12px;
      overflow: hidden;
    }

    .progress-fill {
      background: white;
      height: 100%;
      transition: width 0.3s ease;
    }

    .crew-swimlane {
      border-top: 1px solid var(--vscode-panel-border);
      padding: 12px 16px;
    }

    .crew-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .crew-name {
      font-weight: 600;
      font-size: 13px;
    }

    .story-cards {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding: 4px 0;
    }

    .story-card {
      min-width: 140px;
      max-width: 140px;
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      padding: 8px;
      cursor: pointer;
      flex-shrink: 0;
    }

    .story-card:hover {
      border-color: var(--vscode-focusBorder);
    }

    .story-status {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 2px;
      display: inline-block;
      margin-bottom: 6px;
    }

    .status-in_progress {
      background: #fef3c7;
      color: #92400e;
    }

    .status-done {
      background: #d1fae5;
      color: #065f46;
    }

    .story-title {
      font-size: 12px;
      line-height: 1.4;
      margin-bottom: 6px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .story-meta {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
      display: flex;
      justify-content: space-between;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--vscode-descriptionForeground);
    }

    .error {
      background: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      padding: 16px;
      border-radius: 4px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">🚀 ${this.projectId ? `${this.projectId} - Sprints` : 'All Active Sprints'}</div>
    <div class="controls">
      <button onclick="refresh()">↻ Refresh</button>
      <button onclick="createSprint()">+ New Sprint</button>
      <button onclick="openDashboard()">Open in Browser</button>
    </div>
  </div>

  <div id="content">
    <div class="loading">
      <div class="spinner"></div>
      Loading sprints...
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const apiUrl = '${apiUrl}';
    const projectId = ${this.projectId ? `'${this.projectId}'` : 'null'};

    async function loadSprints() {
      try {
        const params = new URLSearchParams({
          status: 'active',
          include_stories: 'true'
        });

        if (projectId) {
          params.append('project_id', projectId);
        }

        const response = await fetch(\`\${apiUrl}/sprints?\${params}\`);
        if (!response.ok) throw new Error('Failed to fetch sprints');

        const data = await response.json();
        renderSprints(data.sprints || []);
      } catch (error) {
        renderError(error.message);
      }
    }

    function renderSprints(sprints) {
      const content = document.getElementById('content');

      if (sprints.length === 0) {
        content.innerHTML = \`
          <div class="empty-state">
            <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
            <div style="font-size: 16px; margin-bottom: 8px;">No active sprints</div>
            <div style="font-size: 13px;">Create a sprint to get started</div>
          </div>
        \`;
        return;
      }

      content.innerHTML = sprints.map(sprint => renderSprint(sprint)).join('');
    }

    function renderSprint(sprint) {
      const progress = sprint.velocity_target > 0
        ? Math.round((sprint.velocity_actual / sprint.velocity_target) * 100)
        : 0;

      // Group stories by crew
      const storiesByCrew = {};
      (sprint.stories || []).forEach(story => {
        const crew = story.assigned_crew_member || 'unassigned';
        if (!storiesByCrew[crew]) storiesByCrew[crew] = [];
        storiesByCrew[crew].push(story);
      });

      const swimlanes = Object.entries(storiesByCrew).map(([crew, stories]) => \`
        <div class="crew-swimlane">
          <div class="crew-header">
            <div class="crew-name">\${crew === 'unassigned' ? '📋 Unassigned' : '👤 ' + crew}</div>
            <div style="font-size: 12px;">\${stories.reduce((sum, s) => sum + (s.story_points || 0), 0)} pts</div>
          </div>
          <div class="story-cards">
            \${stories.map(story => renderStory(story)).join('')}
          </div>
        </div>
      \`).join('');

      return \`
        <div class="sprint-card">
          <div class="sprint-header" onclick="openSprint('\${sprint.id}')">
            <div class="sprint-title">\${sprint.name}</div>
            <div class="sprint-dates">
              \${new Date(sprint.start_date).toLocaleDateString()} - \${new Date(sprint.end_date).toLocaleDateString()}
            </div>
            <div style="margin-top: 12px; font-size: 13px;">
              <span>\${sprint.velocity_actual} / \${sprint.velocity_target} points</span>
              <span style="float: right;">\${progress}% complete</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: \${progress}%"></div>
            </div>
          </div>
          \${swimlanes}
        </div>
      \`;
    }

    function renderStory(story) {
      return \`
        <div class="story-card" onclick="openStory('\${story.id}')">
          <span class="story-status status-\${story.status}">\${story.status.replace('_', ' ')}</span>
          <div class="story-title">\${story.title}</div>
          <div class="story-meta">
            <span>\${story.story_type.replace('_', ' ')}</span>
            <span>\${story.story_points || 0} pts</span>
          </div>
        </div>
      \`;
    }

    function renderError(message) {
      document.getElementById('content').innerHTML = \`
        <div class="error">
          <strong>Error loading sprints</strong><br>
          \${message}<br><br>
          <button onclick="loadSprints()">Retry</button>
        </div>
      \`;
    }

    function openStory(storyId) {
      vscode.postMessage({ command: 'openStory', storyId });
    }

    function openSprint(sprintId) {
      vscode.postMessage({ command: 'openSprint', sprintId });
    }

    function createSprint() {
      vscode.postMessage({ command: 'createSprint' });
    }

    function refresh() {
      loadSprints();
    }

    function openDashboard() {
      const url = projectId
        ? \`${environment === 'production' ? 'https://rag-refresh-product-factory.vercel.app' : 'http://localhost:3000'}/projects/\${projectId}/sprints\`
        : \`${environment === 'production' ? 'https://rag-refresh-product-factory.vercel.app' : 'http://localhost:3000'}/sprints\`;
      vscode.postMessage({ command: 'openUrl', url });
    }

    // Load sprints on page load
    loadSprints();
  </script>
</body>
</html>`;
  }

  private _openStory(storyId: string) {
    // Open story detail panel
    vscode.window.showInformationMessage(`Opening story: ${storyId}`);
    // TODO: Implement story detail view
  }

  private _openSprint(sprintId: string) {
    // Open sprint in browser
    const config = vscode.workspace.getConfiguration('alexAI');
    const environment = config.get<string>('environment') || 'local';
    const baseUrl = environment === 'production'
      ? 'https://rag-refresh-product-factory.vercel.app'
      : 'http://localhost:3000';

    vscode.env.openExternal(vscode.Uri.parse(`${baseUrl}/sprints#${sprintId}`));
  }

  private _createSprint() {
    // Open create sprint input
    vscode.window.showInformationMessage('Create sprint functionality coming soon!');
    // TODO: Implement create sprint dialog
  }
}
