import * as vscode from 'vscode';
import { URLSearchParams } from 'url';

/**
 * Handles deep links from the Alex AI Web Dashboard.
 * Protocol: vscode://<publisher>.<extension>/<path>?<query>
 * Example: vscode://alex-ai.product-factory/open-project?projectId=123&workspace=/path/to/code
 */
export class AlexUriHandler implements vscode.UriHandler {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async handleUri(uri: vscode.Uri): Promise<void> {
        const query = new URLSearchParams(uri.query);
        const path = uri.path;

        switch (path) {
            case '/open-project':
                await this.handleOpenProject(query);
                break;
            default:
                vscode.window.showWarningMessage(`Alex AI: Unknown link path: ${path}`);
        }
    }

    private async handleOpenProject(query: URLSearchParams) {
        const projectId = query.get('projectId');
        const workspacePath = query.get('workspace');

        if (!projectId) {
            vscode.window.showErrorMessage('Alex AI: Missing projectId in link.');
            return;
        }

        // 1. Open the folder if provided
        if (workspacePath) {
            const uri = vscode.Uri.file(workspacePath);
            await vscode.commands.executeCommand('vscode.openFolder', uri, { forceNewWindow: false });
        }

        // 2. Set the Alex AI Context
        await this.context.globalState.update('alex-ai.activeProjectId', projectId);
        
        // 3. Trigger the Agent
        vscode.commands.executeCommand('alex-ai.activateCrew', { projectId });
        
        vscode.window.showInformationMessage(`Alex AI: Connected to Project ID ${projectId}`);
    }
}
```

### **2. Image Reading System (Drag & Drop in VSCode)**

To enable dragging images into the chat, we need a React hook for the Webview side of the extension. This will capture `drop` and `paste` events, convert files to Base64, and send them to the extension host (which then forwards them to the Gemini/Crew agent).

I will create a hook that you can use in your Chat Component.

```diff
