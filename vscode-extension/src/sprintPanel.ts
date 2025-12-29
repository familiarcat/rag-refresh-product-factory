/**
 * Sprint Panel for VSCode Extension
 *
 * Displays sprint timeline using bundled React component in webview.
 * Handles message passing between extension and React app.
 */

import * as vscode from 'vscode';

export class SprintPanel {
  public static currentPanel: SprintPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _currentFilters: any = {};
  private _refreshInterval?: NodeJS.Timeout;
  private readonly _defaultRefreshInterval = 30000; // 30 seconds

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
          vscode.Uri.joinPath(extensionUri, 'dist', 'webview')
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
      async (message) => {
        switch (message.command) {
          case 'fetchSprints':
            await this._fetchSprints(message.filters);
            return;

          case 'updateStory':
            await this._updateStory(message.storyId, message.updates);
            return;

          case 'openStory':
            this._openStory(message.storyId);
            return;

          case 'openSprint':
            this._openSprint(message.sprintId);
            return;

          case 'createSprint':
            this._createSprint();
            return;

          case 'openUrl':
            if (message.url) {
              vscode.env.openExternal(vscode.Uri.parse(message.url));
            }
            return;
        }
      },
      null,
      this._disposables
    );

    // Start auto-refresh
    this._startAutoRefresh();
  }

  public updateProject(projectId: string) {
    this.projectId = projectId;
    this._panel.title = `Sprints - ${projectId}`;
    this._update();
  }

  public dispose() {
    SprintPanel.currentPanel = undefined;

    // Stop auto-refresh
    this._stopAutoRefresh();

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

  private _getApiUrl(): string {
    const config = vscode.workspace.getConfiguration('alexAi');
    return config.get<string>('baseUrl') || 'http://localhost:3000';
  }

  private async _fetchSprints(filters: any, isAutoRefresh = false) {
    try {
      this._currentFilters = filters;
      const apiUrl = this._getApiUrl();

      const params = new URLSearchParams({
        include_stories: 'true',
        ...(filters || {})
      });

      const url = `${apiUrl}/api/sprints?${params}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Send data back to webview
      this._panel.webview.postMessage({
        command: 'sprintsData',
        sprints: data.sprints || [],
        isAutoRefresh
      });
    } catch (error: any) {
      console.error('Error fetching sprints:', error);
      this._panel.webview.postMessage({
        command: 'error',
        error: error.message || 'Failed to fetch sprints'
      });
    }
  }

  private async _updateStory(storyId: string, updates: any) {
    try {
      const apiUrl = this._getApiUrl();
      const url = `${apiUrl}/api/stories/${storyId}`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Refresh sprint data after update
      await this._fetchSprints(this._currentFilters);

      vscode.window.showInformationMessage('Story updated successfully');
    } catch (error: any) {
      console.error('Error updating story:', error);
      vscode.window.showErrorMessage(`Failed to update story: ${error.message}`);
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get URIs for bundled files
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'sprintTimeline.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview', 'sprintTimeline.css')
    );

    // Get API URL
    const apiBaseUrl = this._getApiUrl();

    // Use nonce for security
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src ${apiBaseUrl};">
  <title>Sprint Timeline</title>
  <link rel="stylesheet" href="${styleUri}">
</head>
<body>
  <div id="root"></div>
  <script id="initial-state" type="application/json" nonce="${nonce}">
    ${JSON.stringify({
      projectId: this.projectId,
      apiBaseUrl: apiBaseUrl
    })}
  </script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private _openStory(storyId: string) {
    // Open story detail in browser
    const apiUrl = this._getApiUrl();
    const baseUrl = apiUrl.replace('/api', '');

    if (this.projectId) {
      vscode.env.openExternal(
        vscode.Uri.parse(`${baseUrl}/projects/${this.projectId}/sprints#story-${storyId}`)
      );
    } else {
      vscode.env.openExternal(
        vscode.Uri.parse(`${baseUrl}/sprints#story-${storyId}`)
      );
    }
  }

  private _openSprint(sprintId: string) {
    // Open sprint in browser
    const apiUrl = this._getApiUrl();
    const baseUrl = apiUrl.replace('/api', '');

    vscode.env.openExternal(
      vscode.Uri.parse(`${baseUrl}/sprints#sprint-${sprintId}`)
    );
  }

  private _createSprint() {
    // Open create sprint dialog
    vscode.window.showInformationMessage('Create sprint functionality coming soon!');
    // TODO: Implement create sprint dialog
  }

  private _startAutoRefresh() {
    const config = vscode.workspace.getConfiguration('alexAi');
    const enabled = config.get<boolean>('enableSprintAutoRefresh', true);

    if (!enabled) {
      return;
    }

    const interval = config.get<number>('sprintRefreshInterval', this._defaultRefreshInterval);

    this._refreshInterval = setInterval(async () => {
      try {
        await this._fetchSprints(this._currentFilters, true);
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, interval);
  }

  private _stopAutoRefresh() {
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
      this._refreshInterval = undefined;
    }
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
