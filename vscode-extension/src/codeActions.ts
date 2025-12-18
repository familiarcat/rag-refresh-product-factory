import * as vscode from "vscode";

/**
 * Code Actions Provider - Lightbulb menu integration
 * Shows "Ask Alex AI" options when selecting code
 */
export class AlexAiCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
    vscode.CodeActionKind.Refactor,
  ];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.CodeAction[] | undefined {
    // Only show actions when there's a selection
    if (range.isEmpty) {
      return undefined;
    }

    const selectedText = document.getText(range);
    if (selectedText.trim().length < 5) {
      return undefined;
    }

    const actions: vscode.CodeAction[] = [];

    // Explain Code action
    const explainAction = new vscode.CodeAction(
      "🤖 Alex AI: Explain this code",
      vscode.CodeActionKind.QuickFix
    );
    explainAction.command = {
      command: "alexAi.explainCode",
      title: "Explain Code",
    };
    actions.push(explainAction);

    // Review Code action (Worf)
    const reviewAction = new vscode.CodeAction(
      "⚔️ Alex AI: Security review (Worf)",
      vscode.CodeActionKind.QuickFix
    );
    reviewAction.command = {
      command: "alexAi.reviewCode",
      title: "Review Code",
    };
    actions.push(reviewAction);

    // Optimize Code action
    const optimizeAction = new vscode.CodeAction(
      "🔧 Alex AI: Optimize this code",
      vscode.CodeActionKind.Refactor
    );
    optimizeAction.command = {
      command: "alexAi.optimizeCode",
      title: "Optimize Code",
    };
    actions.push(optimizeAction);

    // Ask Crew action
    const askCrewAction = new vscode.CodeAction(
      "🖖 Alex AI: Ask a crew member",
      vscode.CodeActionKind.QuickFix
    );
    askCrewAction.command = {
      command: "alexAi.askCrew",
      title: "Ask Crew",
    };
    actions.push(askCrewAction);

    // Refactor suggestion
    const refactorAction = new vscode.CodeAction(
      "💭 Alex AI: Suggest refactoring (Troi)",
      vscode.CodeActionKind.Refactor
    );
    refactorAction.command = {
      command: "alexAi.refactorCode",
      title: "Suggest Refactoring",
    };
    actions.push(refactorAction);

    // If there are diagnostics (errors/warnings), add fix suggestion
    if (context.diagnostics.length > 0) {
      const fixAction = new vscode.CodeAction(
        "🛠️ Alex AI: Help fix this issue (O'Brien)",
        vscode.CodeActionKind.QuickFix
      );
      fixAction.command = {
        command: "alexAi.fixCode",
        title: "Fix Code",
        arguments: [context.diagnostics],
      };
      fixAction.isPreferred = true;
      actions.push(fixAction);
    }

    return actions;
  }
}

export function registerCodeActionProvider(
  context: vscode.ExtensionContext
) {
  // Register for common programming languages
  const languages = [
    "typescript",
    "javascript",
    "typescriptreact",
    "javascriptreact",
    "python",
    "java",
    "csharp",
    "go",
    "rust",
    "ruby",
    "php",
    "swift",
    "kotlin",
    "c",
    "cpp",
    "html",
    "css",
    "json",
    "yaml",
    "markdown",
  ];

  for (const lang of languages) {
    const disposable = vscode.languages.registerCodeActionsProvider(
      lang,
      new AlexAiCodeActionProvider(),
      {
        providedCodeActionKinds: AlexAiCodeActionProvider.providedCodeActionKinds,
      }
    );
    context.subscriptions.push(disposable);
  }

  // Also register for all files as fallback
  const fallbackDisposable = vscode.languages.registerCodeActionsProvider(
    { pattern: "**/*" },
    new AlexAiCodeActionProvider(),
    {
      providedCodeActionKinds: AlexAiCodeActionProvider.providedCodeActionKinds,
    }
  );
  context.subscriptions.push(fallbackDisposable);

  console.log("🖖 Alex AI Code Actions registered (lightbulb menu)");
}
