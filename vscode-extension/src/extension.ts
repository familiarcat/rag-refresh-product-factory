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

  // Show welcome message on first activation
  const hasShownWelcome = context.globalState.get("alexAi.welcomeShown");
  if (!hasShownWelcome) {
    vscode.window
      .showInformationMessage(
        "🖖 Alex AI activated! Press Cmd+Shift+A to open chat.",
        "Open Chat",
        "Configure"
      )
      .then((selection) => {
        if (selection === "Open Chat") {
          vscode.commands.executeCommand("alexAi.chatView.focus");
        } else if (selection === "Configure") {
          vscode.commands.executeCommand(
            "workbench.action.openSettings",
            "alexAi"
          );
        }
      });
    context.globalState.update("alexAi.welcomeShown", true);
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
