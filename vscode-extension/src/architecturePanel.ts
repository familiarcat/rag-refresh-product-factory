/**
 * Architecture Panel - VSCode webview for project architecture visualization
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

export class ArchitecturePanel {
  public static currentPanel: ArchitecturePanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (ArchitecturePanel.currentPanel) {
      ArchitecturePanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      'alexArchitecture',
      'Project Architecture',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'media'),
        ],
      }
    );

    ArchitecturePanel.currentPanel = new ArchitecturePanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set initial content
    this._update();

    // Listen for panel disposal
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case 'openFile':
            this._openFile(message.path);
            break;
          case 'error':
            vscode.window.showErrorMessage(message.text);
            break;
        }
      },
      null,
      this._disposables
    );
  }

  private async _update() {
    const webview = this._panel.webview;
    this._panel.webview.html = await this._getHtmlForWebview(webview);
  }

  private async _openFile(filePath: string) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return;
    }

    const fullPath = path.join(workspaceFolders[0].uri.fsPath, filePath);
    const uri = vscode.Uri.file(fullPath);

    try {
      const document = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(document);
    } catch (error) {
      vscode.window.showErrorMessage(`Could not open file: ${filePath}`);
    }
  }

  private async _getHtmlForWebview(webview: vscode.Webview) {
    // Load project data
    const projectGraph = await this._buildWorkspaceGraph();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Architecture</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            font-family: var(--vscode-font-family);
        }
        #container {
            padding: 20px;
        }
        h1 {
            margin-top: 0;
        }
        .controls {
            margin-bottom: 20px;
            display: flex;
            gap: 10px;
        }
        select, button {
            padding: 6px 12px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            cursor: pointer;
        }
        select:hover, button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        #diagram {
            width: 100%;
            min-height: 500px;
            background: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            overflow: auto;
            padding: 20px;
        }
        .node {
            padding: 8px 16px;
            margin: 4px;
            border-radius: 4px;
            cursor: pointer;
            display: inline-block;
        }
        .node-project {
            background-color: #8b5cf6;
            color: white;
        }
        .node-domain {
            background-color: #3b82f6;
            color: white;
        }
        .node-feature {
            background-color: #10b981;
            color: white;
        }
    </style>
</head>
<body>
    <div id="container">
        <h1>Project Architecture</h1>

        <div class="controls">
            <select id="dimensionSelect">
                <option value="domains">Domains</option>
                <option value="tech-stack">Tech Stack</option>
                <option value="crew">Crew</option>
                <option value="milestones">Milestones</option>
            </select>
            <button id="refreshBtn">Refresh</button>
        </div>

        <div id="diagram">
            <div id="graphContent"></div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const graphData = ${JSON.stringify(projectGraph)};

        function renderGraph(data) {
            const content = document.getElementById('graphContent');
            content.innerHTML = '';

            if (!data || !data.nodes) {
                content.innerHTML = '<p>No project data found. Make sure you have a data/projects.json file.</p>';
                return;
            }

            // Simple hierarchical rendering
            data.nodes.forEach(node => {
                const nodeEl = document.createElement('div');
                nodeEl.className = \`node node-\${node.type}\`;
                nodeEl.textContent = node.label;
                nodeEl.onclick = () => {
                    if (node.path) {
                        vscode.postMessage({
                            command: 'openFile',
                            path: node.path
                        });
                    }
                };
                content.appendChild(nodeEl);
            });
        }

        // Initial render
        renderGraph(graphData);

        // Event listeners
        document.getElementById('refreshBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'refresh' });
        });

        document.getElementById('dimensionSelect').addEventListener('change', (e) => {
            vscode.postMessage({
                command: 'changeDimension',
                dimension: e.target.value
            });
        });
    </script>
</body>
</html>`;
  }

  private async _buildWorkspaceGraph() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return { nodes: [], edges: [] };
    }

    const workspacePath = workspaceFolders[0].uri.fsPath;
    const projectsFile = path.join(workspacePath, 'data', 'projects.json');

    try {
      const content = await fs.readFile(projectsFile, 'utf-8');
      const data = JSON.parse(content);
      const projects = data.projects || [];

      // Build simple graph structure
      const nodes: any[] = [];
      const edges: any[] = [];

      for (const project of projects) {
        // Add project node
        nodes.push({
          id: project.id,
          label: project.name,
          type: 'project',
        });

        // Add domain nodes
        if (project.domains) {
          for (const domain of project.domains) {
            const domainId = `${project.id}_${domain.slug}`;
            nodes.push({
              id: domainId,
              label: domain.name,
              type: 'domain',
            });

            edges.push({
              source: project.id,
              target: domainId,
            });

            // Add features
            if (domain.features) {
              for (let i = 0; i < domain.features.length; i++) {
                const featureId = `${domainId}_feature_${i}`;
                nodes.push({
                  id: featureId,
                  label: domain.features[i],
                  type: 'feature',
                });

                edges.push({
                  source: domainId,
                  target: featureId,
                });
              }
            }
          }
        }
      }

      return { nodes, edges };
    } catch (error) {
      console.error('Error building workspace graph:', error);
      return { nodes: [], edges: [] };
    }
  }

  public dispose() {
    ArchitecturePanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
