import * as vscode from "vscode";
import { CrewChatViewProvider } from "./chatView";
import { AlexAiService } from "./alexAiService";
import { registerChatParticipant } from "./chatParticipant";
import { registerInlineCompletionProvider } from "./inlineCompletion";
import { registerCodeActionProvider } from "./codeActions";
import { registerHoverProvider } from "./hoverProvider";
import { registerDiagnosticProvider } from "./diagnosticProvider";
import { registerAlexPanel } from "./alexPanel";
import { registerExecutionCommands } from "./executionCommands";
import { AlexFileSystemService } from "./alexFileSystem";
import { ArchitecturePanel } from "./architecturePanel";
import { join } from "path";
import { exec } from "child_process";

async function isWorkspaceWritable(): Promise<boolean> {
  try {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) return false;
    const testUri = vscode.Uri.joinPath(folder.uri, ".alexai-write-test");
    await vscode.workspace.fs.writeFile(testUri, Buffer.from("ok", "utf8"));
    await vscode.workspace.fs.delete(testUri, { useTrash: false });
    return true;
  } catch {
    return false;
  }
}

// ❌ REMOVED: import Error from "next/error";

let alexAiService: AlexAiService;

// File System Setup Function
async function setupFileSystem(
  context: vscode.ExtensionContext
): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) return;

  const workspaceRoot = workspaceFolders[0].uri.fsPath;
  const configFile = join(workspaceRoot, ".alex-ai-config");

  try {
    await vscode.workspace.fs.stat(vscode.Uri.file(configFile));
  } catch {
    const setupScript = join(
      workspaceRoot,
      "scripts",
      "setup-alex-fs-integration.sh"
    );

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Setting up Alex AI File System Integration",
        cancellable: false,
      },
      async () => {
        const writable = await isWorkspaceWritable();
        if (!writable) {
          vscode.window.showErrorMessage(
            "Setup failed: workspace is read-only or VS Code lacks permission to write files. On macOS, grant VS Code Full Disk Access (Privacy & Security) and reopen the folder from a writable location."
          );
          return;
        }
        try {
          await new Promise<void>((resolve, reject) => {
            exec(`bash "${setupScript}"`, (error) => {
              if (error) reject(error);
              else resolve();
            });
          });
          await vscode.workspace.fs.writeFile(
            vscode.Uri.file(configFile),
            Buffer.from(JSON.stringify({ setupComplete: true }), "utf8")
          );
          vscode.window.showInformationMessage(
            "Alex AI File System Integration setup complete!"
          );
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          vscode.window.showErrorMessage(`Setup failed: ${errorMessage}. If this mentions read-only file system, grant VS Code permission (macOS Full Disk Access) or move the repo to a writable folder.`);
        }
      }
    );
  }
}

export async function activate(context: vscode.ExtensionContext) {
  console.log("🖖 Alex AI Extension activated");

  // Initialize services
  alexAiService = new AlexAiService();
  await setupFileSystem(context);

  // Initialize file system service if workspace exists
  if (vscode.workspace.workspaceFolders) {
    alexAiService.fileSystem = new AlexFileSystemService(
      vscode.workspace.workspaceFolders[0].uri.fsPath
    );
  }

  // Register comprehensive sidebar webview
  const chatViewProvider = new CrewChatViewProvider(context, alexAiService);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "alexAi.chatView",
      chatViewProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // Add new File System related commands
  context.subscriptions.push(
    vscode.commands.registerCommand("alexAi.refreshFileSystem", async () => {
      try {
        await setupFileSystem(context);
        vscode.window.showInformationMessage(
          "File system integration refreshed successfully!"
        );
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        vscode.window.showErrorMessage(
          `Failed to refresh file system: ${errorMessage}`
        );
      }
    })
  );

  // Register architecture visualization panel
  context.subscriptions.push(
    vscode.commands.registerCommand("alexAi.showArchitecture", () => {
      ArchitecturePanel.createOrShow(context.extensionUri);
    })
  );

  // Auto-detect text selection and send to sidebar
  let selectionDebounce: NodeJS.Timeout | undefined;
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection((e) => {
      const config = vscode.workspace.getConfiguration("alexAi");
      if (!config.get("autoDetectSelection", true)) return;

      if (selectionDebounce) clearTimeout(selectionDebounce);
      selectionDebounce = setTimeout(() => {
        const editor = e.textEditor;
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);

        if (
          selectedText &&
          selectedText.length > 10 &&
          selectedText.length < 5000
        ) {
          chatViewProvider.setSelectionContext({
            text: selectedText,
            language: editor.document.languageId,
            file: vscode.workspace.asRelativePath(editor.document.uri),
            startLine: selection.start.line + 1,
            endLine: selection.end.line + 1,
          });
        } else if (!selectedText) {
          chatViewProvider.clearSelectionContext();
        }
      }, 300);
    })
  );

  // Register all providers and commands
  registerChatParticipant(context, alexAiService);
  registerInlineCompletionProvider(context, alexAiService);
  registerCodeActionProvider(context);
  registerHoverProvider(context, alexAiService);
  registerDiagnosticProvider(context, alexAiService);
  registerAlexPanel(context, alexAiService);
  registerExecutionCommands(context, alexAiService);

  // Status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = "$(comment-discussion) Alex AI";
  statusBarItem.tooltip =
    "Open Alex AI Chat (Cmd+Option+A) or use @alex in Chat";
  statusBarItem.command = "alexAi.openChat";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Check for API key and show welcome message
  const config = vscode.workspace.getConfiguration("alexAi");
  const apiKey = config.get("openRouterApiKey") as string;
  const hasShownWelcome = context.globalState.get("alexAi.welcomeShown");
  const needsSetup = !apiKey || apiKey.trim() === "";

  if (!hasShownWelcome || needsSetup) {
    const message = needsSetup
      ? "🖖 Welcome to Alex AI! Configure your API key to get started."
      : "🖖 Alex AI activated! Press Cmd+Option+A to open chat.";

    const buttons = needsSetup
      ? ["Configure API Key", "Get API Key"]
      : ["Open Chat", "Configure"];

    vscode.window
      .showInformationMessage(message, ...buttons)
      .then((selection) => {
        if (selection === "Open Chat") {
          vscode.commands.executeCommand("alexAi.chatView.focus");
        } else if (
          selection === "Configure" ||
          selection === "Configure API Key"
        ) {
          vscode.commands.executeCommand("alexAi.configure");
        } else if (selection === "Get API Key") {
          vscode.env.openExternal(
            vscode.Uri.parse("https://openrouter.ai/keys")
          );
        }
      });

    if (!hasShownWelcome) {
      context.globalState.update("alexAi.welcomeShown", true);
    }
  }
}

export function deactivate() {
  console.log("Alex AI Extension deactivated");
}