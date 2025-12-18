import * as vscode from "vscode";
import { CrewChatViewProvider } from "./chatView";
import { CrewTreeProvider } from "./crewTree";
import { SprintTreeProvider } from "./sprintTree";
import { AlexAiService } from "./alexAiService";

let alexAiService: AlexAiService;

export function activate(context: vscode.ExtensionContext) {
  console.log("🖖 Alex AI Extension activated");

  // Initialize service
  alexAiService = new AlexAiService(context);

  // Register Chat View
  const chatViewProvider = new CrewChatViewProvider(context, alexAiService);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "alexAi.chatView",
      chatViewProvider
    )
  );

  // Register Crew Tree View
  const crewTreeProvider = new CrewTreeProvider();
  vscode.window.registerTreeDataProvider("alexAi.crewView", crewTreeProvider);

  // Register Sprint Tree View
  const sprintTreeProvider = new SprintTreeProvider(alexAiService);
  vscode.window.registerTreeDataProvider(
    "alexAi.sprintView",
    sprintTreeProvider
  );

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

  context.subscriptions.push(
    vscode.commands.registerCommand("alexAi.sprintStatus", async () => {
      const status = await alexAiService.getSprintStatus();
      if (status) {
        vscode.window.showInformationMessage(
          `${status.name}: ${status.completedPoints}/${status.committedPoints} pts (${status.status})`
        );
      }
      sprintTreeProvider.refresh();
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
                vscode.window.showErrorMessage(`API key test failed: ${response}`);
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
      : "🖖 Alex AI activated! Press Cmd+Shift+A to open chat.";

    const buttons = needsSetup
      ? ["Configure API Key", "Get API Key"]
      : ["Open Chat", "Configure"];

    vscode.window.showInformationMessage(message, ...buttons).then((selection) => {
      if (selection === "Open Chat") {
        vscode.commands.executeCommand("alexAi.chatView.focus");
      } else if (selection === "Configure" || selection === "Configure API Key") {
        vscode.commands.executeCommand("alexAi.configure");
      } else if (selection === "Get API Key") {
        vscode.env.openExternal(vscode.Uri.parse("https://openrouter.ai/keys"));
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
  statusBarItem.tooltip = "Open Alex AI Chat";
  statusBarItem.command = "alexAi.openChat";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);
}

export function deactivate() {
  console.log("Alex AI Extension deactivated");
}
