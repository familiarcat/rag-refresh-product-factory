import * as vscode from "vscode";
import { AlexAiService } from "./alexAiService";

/**
 * Diagnostic Provider - AI code review as warnings/suggestions
 * Analyzes code and shows suggestions in the Problems panel
 */
export class AlexAiDiagnosticProvider {
  private alexAiService: AlexAiService;
  private diagnosticCollection: vscode.DiagnosticCollection;
  private analysisInProgress: Set<string> = new Set();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    alexAiService: AlexAiService,
    diagnosticCollection: vscode.DiagnosticCollection
  ) {
    this.alexAiService = alexAiService;
    this.diagnosticCollection = diagnosticCollection;
  }

  async analyzeDocument(document: vscode.TextDocument): Promise<void> {
    const config = vscode.workspace.getConfiguration("alexAi");
    if (!config.get<boolean>("enableCodeReview", false)) {
      return;
    }

    // Only analyze supported languages
    const supportedLanguages = [
      "typescript",
      "javascript",
      "typescriptreact",
      "javascriptreact",
      "python",
    ];
    if (!supportedLanguages.includes(document.languageId)) {
      return;
    }

    const uri = document.uri.toString();

    // Prevent concurrent analysis of the same document
    if (this.analysisInProgress.has(uri)) {
      return;
    }

    // Debounce analysis
    const existingTimer = this.debounceTimers.get(uri);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    this.debounceTimers.set(
      uri,
      setTimeout(() => this.performAnalysis(document), 2000)
    );
  }

  private async performAnalysis(document: vscode.TextDocument): Promise<void> {
    const uri = document.uri.toString();
    this.analysisInProgress.add(uri);

    try {
      const text = document.getText();

      // Skip very short or very long files
      if (text.length < 50 || text.length > 10000) {
        return;
      }

      const prompt = `Review this ${document.languageId} code for potential issues. 
List only significant problems (security, bugs, performance).
Format each issue as: LINE:ISSUE

\`\`\`${document.languageId}
${text}
\`\`\`

Return max 5 issues. Format:
LINE_NUMBER:SEVERITY:DESCRIPTION
(SEVERITY is one of: error, warning, info)

Example:
15:warning:Variable 'data' is not validated before use
28:info:Consider using async/await instead of callbacks`;

      // Use Worf for security-focused review
      const response = await this.alexAiService.chat("worf", prompt);

      const diagnostics = this.parseResponse(response, document);
      this.diagnosticCollection.set(document.uri, diagnostics);
    } catch (error) {
      console.error("Diagnostic analysis error:", error);
    } finally {
      this.analysisInProgress.delete(uri);
    }
  }

  private parseResponse(
    response: string,
    document: vscode.TextDocument
  ): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const lines = response.split("\n");

    for (const line of lines) {
      // Match pattern: LINE:SEVERITY:MESSAGE
      const match = line.match(/^(\d+):(\w+):(.+)$/);
      if (match) {
        const lineNum = parseInt(match[1], 10) - 1; // Convert to 0-indexed
        const severityStr = match[2].toLowerCase();
        const message = match[3].trim();

        // Validate line number
        if (lineNum < 0 || lineNum >= document.lineCount) {
          continue;
        }

        const lineText = document.lineAt(lineNum);
        const range = new vscode.Range(
          lineNum,
          lineText.firstNonWhitespaceCharacterIndex,
          lineNum,
          lineText.text.length
        );

        let severity: vscode.DiagnosticSeverity;
        switch (severityStr) {
          case "error":
            severity = vscode.DiagnosticSeverity.Error;
            break;
          case "warning":
            severity = vscode.DiagnosticSeverity.Warning;
            break;
          default:
            severity = vscode.DiagnosticSeverity.Information;
        }

        const diagnostic = new vscode.Diagnostic(
          range,
          `⚔️ ${message}`,
          severity
        );
        diagnostic.source = "Alex AI (Worf)";
        diagnostic.code = "alex-ai-review";

        diagnostics.push(diagnostic);
      }
    }

    return diagnostics;
  }

  clear(uri: vscode.Uri): void {
    this.diagnosticCollection.delete(uri);
  }

  clearAll(): void {
    this.diagnosticCollection.clear();
  }
}

export function registerDiagnosticProvider(
  context: vscode.ExtensionContext,
  alexAiService: AlexAiService
): AlexAiDiagnosticProvider {
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("alexAi");
  context.subscriptions.push(diagnosticCollection);

  const provider = new AlexAiDiagnosticProvider(
    alexAiService,
    diagnosticCollection
  );

  // Analyze on document save
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      provider.analyzeDocument(document);
    })
  );

  // Clear diagnostics when document closes
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((document) => {
      provider.clear(document.uri);
    })
  );

  // Add command to manually trigger analysis
  context.subscriptions.push(
    vscode.commands.registerCommand("alexAi.analyzeFile", async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "⚔️ Worf is reviewing your code...",
          },
          async () => {
            await provider.analyzeDocument(editor.document);
          }
        );
      }
    })
  );

  // Add command to clear diagnostics
  context.subscriptions.push(
    vscode.commands.registerCommand("alexAi.clearDiagnostics", () => {
      provider.clearAll();
      vscode.window.showInformationMessage("Alex AI diagnostics cleared");
    })
  );

  console.log("🖖 Alex AI Diagnostic Provider registered (code review)");

  return provider;
}
