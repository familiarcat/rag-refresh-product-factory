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

let alexAiService: AlexAiService;

export function activate(context: vscode.ExtensionContext) {
  console.log("🖖 Alex AI Extension activated");

  // Initialize service
  alexAiService = new AlexAiService(context);

  // Register comprehensive sidebar webview (Chat, Files, Projects, Lounge all-in-one)
  const chatViewProvider = new CrewChatViewProvider(context, alexAiService);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "alexAi.chatView",
      chatViewProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // Auto-detect text selection and send to sidebar
  let selectionDebounce: NodeJS.Timeout | undefined;
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection((e) => {
      const config = vscode.workspace.getConfiguration("alexAi");
      if (!config.get<boolean>("autoDetectSelection", true)) return;

      // Debounce to avoid too many updates
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
          // Send selection to sidebar
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

  // Register as VS Code Chat Participant (@alex in Chat panel)
  registerChatParticipant(context, alexAiService);

  // Register AI-powered providers (Copilot-like features)
  registerInlineCompletionProvider(context, alexAiService);
  registerCodeActionProvider(context);
  registerHoverProvider(context, alexAiService);
  registerDiagnosticProvider(context, alexAiService);

  // Register comprehensive Alex AI Panel
  registerAlexPanel(context, alexAiService);

  // Register file system and execution commands (for saving plans and recommendations)
  registerExecutionCommands(context, alexAiService);

  // Register Commands
  context.subscriptions.push(
    vscode.commands.registerCommand("alexAi.openChat", () => {
      vscode.commands.executeCommand("alexAi.chatView.focus");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("alexAi.askCrew", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage("No active editor");
        return;
      }

      const selection = editor.document.getText(editor.selection);
      if (!selection) {
        vscode.window.showWarningMessage("No text selected");
        return;
      }

      const crewMember = await vscode.window.showQuickPick(
        [
          {
            label: "🎖️ Captain Picard",
            value: "picard",
            description: "Strategic advice",
          },
          {
            label: "⚡ Commander Riker",
            value: "riker",
            description: "Tactical assessment",
          },
          {
            label: "🤖 Commander Data",
            value: "data",
            description: "Technical analysis",
          },
          {
            label: "🔧 Lt. Cmdr. La Forge",
            value: "geordi",
            description: "Engineering",
          },
          {
            label: "💭 Counselor Troi",
            value: "troi",
            description: "UX perspective",
          },
          {
            label: "⚔️ Lt. Worf",
            value: "worf",
            description: "Security review",
          },
          {
            label: "🛠️ Chief O'Brien",
            value: "obrien",
            description: "Implementation",
          },
          {
            label: "💰 Quark",
            value: "quark",
            description: "Business analysis",
          },
        ],
        { placeHolder: "Select a crew member to ask" }
      );

      if (crewMember) {
        chatViewProvider.askCrewAboutCode(
          crewMember.value,
          selection,
          editor.document.languageId
        );
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("alexAi.explainCode", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const selection = editor.document.getText(editor.selection);
      if (!selection) {
        vscode.window.showWarningMessage("No text selected");
        return;
      }

      chatViewProvider.askCrewAboutCode(
        "data",
        selection,
        editor.document.languageId,
        "explain"
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("alexAi.reviewCode", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const selection = editor.document.getText(editor.selection);
      if (!selection) {
        vscode.window.showWarningMessage("No text selected");
        return;
      }

      chatViewProvider.askCrewAboutCode(
        "worf",
        selection,
        editor.document.languageId,
        "review"
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("alexAi.optimizeCode", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const selection = editor.document.getText(editor.selection);
      if (!selection) {
        vscode.window.showWarningMessage("No text selected");
        return;
      }

      chatViewProvider.askCrewAboutCode(
        "data",
        selection,
        editor.document.languageId,
        "optimize"
      );
    })
  );

  // Refactor Code command (Troi - UX/readability focused)
  context.subscriptions.push(
    vscode.commands.registerCommand("alexAi.refactorCode", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const selection = editor.document.getText(editor.selection);
      if (!selection) {
        vscode.window.showWarningMessage("No text selected");
        return;
      }

      chatViewProvider.askCrewAboutCode(
        "troi",
        selection,
        editor.document.languageId,
        "refactor"
      );
    })
  );

  // Fix Code command (O'Brien - practical fixes)
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "alexAi.fixCode",
      async (diagnostics?: vscode.Diagnostic[]) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const selection = editor.document.getText(editor.selection);
        let prompt = selection || editor.document.getText();

        // Include diagnostic info if available
        if (diagnostics && diagnostics.length > 0) {
          const issues = diagnostics
            .map((d) => `- Line ${d.range.start.line + 1}: ${d.message}`)
            .join("\n");
          prompt = `Fix these issues:\n${issues}\n\nCode:\n${prompt}`;
        }

        chatViewProvider.askCrewAboutCode(
          "obrien",
          prompt,
          editor.document.languageId,
          "fix"
        );
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("alexAi.sprintStatus", async () => {
      const status = await alexAiService.getSprintStatus();
      if (status) {
        vscode.window.showInformationMessage(
          `${status.name}: ${status.completedPoints}/${status.committedPoints} pts (${status.status})`
        );
      }
      // Sprint status is now shown in the sidebar webview
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("alexAi.observationLounge", async () => {
      const topic = await vscode.window.showInputBox({
        prompt: "Enter a topic for the senior staff meeting",
        placeHolder: "e.g., Should we refactor the authentication system?",
      });

      if (topic) {
        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "🖖 Convening Observation Lounge...",
            cancellable: false,
          },
          async () => {
            const result = await alexAiService.conveneObservationLounge(topic);
            if (result) {
              chatViewProvider.showObservationLoungeResult(result);
            }
          }
        );
      }
    })
  );

  // Configure API Key command - for marketplace users
  context.subscriptions.push(
    vscode.commands.registerCommand("alexAi.configure", async () => {
      const config = vscode.workspace.getConfiguration("alexAi");
      const existingKey = config.get<string>("openRouterApiKey");

      const action = await vscode.window.showQuickPick(
        [
          {
            label: "$(key) Enter API Key",
            description: "Enter your OpenRouter API key",
            value: "enter",
          },
          {
            label: "$(link-external) Get API Key",
            description: "Open OpenRouter website to get a key",
            value: "get",
          },
          {
            label: "$(gear) Open Settings",
            description: "Open Alex AI settings",
            value: "settings",
          },
          ...(existingKey
            ? [
                {
                  label: "$(check) Test Current Key",
                  description: "Verify your API key works",
                  value: "test",
                },
              ]
            : []),
        ],
        { placeHolder: "🔑 Configure Alex AI" }
      );

      if (!action) return;

      switch (action.value) {
        case "enter":
          const apiKey = await vscode.window.showInputBox({
            prompt: "Enter your OpenRouter API key",
            placeHolder: "sk-or-v1-...",
            password: true,
            ignoreFocusOut: true,
            validateInput: (value) => {
              if (!value) return "API key is required";
              if (!value.startsWith("sk-or-"))
                return "OpenRouter keys start with 'sk-or-'";
              if (value.length < 20) return "API key seems too short";
              return null;
            },
          });
          if (apiKey) {
            await config.update(
              "openRouterApiKey",
              apiKey,
              vscode.ConfigurationTarget.Global
            );
            vscode.window.showInformationMessage(
              "🖖 API key saved! You're ready to chat with the crew."
            );
          }
          break;

        case "get":
          vscode.env.openExternal(
            vscode.Uri.parse("https://openrouter.ai/keys")
          );
          vscode.window.showInformationMessage(
            "Opening OpenRouter... After getting your key, run 'Alex AI: Configure API Key' again."
          );
          break;

        case "settings":
          vscode.commands.executeCommand(
            "workbench.action.openSettings",
            "alexAi"
          );
          break;

        case "test":
          vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: "Testing API key...",
            },
            async () => {
              const response = await alexAiService.chat(
                "data",
                "Say 'API key verified' in one sentence."
              );
              if (response.includes("Error") || response.includes("❌")) {
                vscode.window.showErrorMessage(
                  `API key test failed: ${response}`
                );
              } else {
                vscode.window.showInformationMessage(
                  "✅ API key is working! " + response.slice(0, 50) + "..."
                );
              }
            }
          );
          break;
      }
    })
  );

  // Open Settings command
  context.subscriptions.push(
    vscode.commands.registerCommand("alexAi.openSettings", () => {
      vscode.commands.executeCommand("workbench.action.openSettings", "alexAi");
    })
  );

  // Check for API key on activation
  const config = vscode.workspace.getConfiguration("alexAi");
  const apiKey = config.get<string>("openRouterApiKey");

  // Show welcome message on first activation or if no API key
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

  // Auto-open chat on startup if configured
  if (config.get<boolean>("openChatOnStartup")) {
    // Small delay to let VS Code fully initialize
    setTimeout(async () => {
      // Open the VS Code chat panel with @alex pre-typed
      try {
        await vscode.commands.executeCommand("workbench.action.chat.open", {
          query: "@alex ",
        });
      } catch {
        // Fallback to our sidebar chat if native chat fails
        vscode.commands.executeCommand("alexAi.chatView.focus");
      }
    }, 1500);
  }

  // Register command to open native chat with @alex
  context.subscriptions.push(
    vscode.commands.registerCommand("alexAi.openNativeChat", async () => {
      try {
        await vscode.commands.executeCommand("workbench.action.chat.open", {
          query: "@alex ",
        });
      } catch {
        vscode.window.showInformationMessage(
          "VS Code Chat not available. Using Alex AI sidebar instead."
        );
        vscode.commands.executeCommand("alexAi.chatView.focus");
      }
    })
  );
}

export function deactivate() {
  console.log("Alex AI Extension deactivated");
}
