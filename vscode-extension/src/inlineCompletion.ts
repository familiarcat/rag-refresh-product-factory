import * as vscode from "vscode";
import { AlexAiService } from "./alexAiService";

/**
 * Inline Completion Provider - AI autocomplete like Copilot
 * Suggests code completions as you type
 */
export class AlexAiInlineCompletionProvider
  implements vscode.InlineCompletionItemProvider
{
  private alexAiService: AlexAiService;
  private lastRequest: number = 0;
  private debounceMs: number = 500;

  constructor(alexAiService: AlexAiService) {
    this.alexAiService = alexAiService;
  }

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionItem[] | null> {
    // Check if feature is enabled
    const config = vscode.workspace.getConfiguration("alexAi");
    if (!config.get<boolean>("enableInlineCompletions", true)) {
      return null;
    }

    // Debounce requests
    const now = Date.now();
    if (now - this.lastRequest < this.debounceMs) {
      return null;
    }
    this.lastRequest = now;

    // Don't trigger on empty lines or just whitespace
    const lineText = document.lineAt(position.line).text;
    const textBeforeCursor = lineText.substring(0, position.character).trim();
    if (textBeforeCursor.length < 3) {
      return null;
    }

    // Get context: current line and a few lines before
    const startLine = Math.max(0, position.line - 10);
    const contextRange = new vscode.Range(startLine, 0, position.line, position.character);
    const contextText = document.getText(contextRange);

    // Build prompt for completion
    const prompt = `Complete this ${document.languageId} code. Only provide the completion, no explanation:

\`\`\`${document.languageId}
${contextText}
\`\`\`

Continue from where the code ends. Provide only the next 1-3 lines of code.`;

    try {
      // Use Data for technical completions
      const response = await this.alexAiService.chat("data", prompt);

      if (token.isCancellationRequested) {
        return null;
      }

      // Extract code from response
      let completion = this.extractCode(response);
      if (!completion || completion.trim().length === 0) {
        return null;
      }

      // Create inline completion item
      const completionItem = new vscode.InlineCompletionItem(
        completion,
        new vscode.Range(position, position)
      );

      return [completionItem];
    } catch (error) {
      console.error("Inline completion error:", error);
      return null;
    }
  }

  private extractCode(response: string): string {
    // Try to extract code from markdown code blocks
    const codeBlockMatch = response.match(/```[\w]*\n?([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // If no code block, clean up the response
    return response
      .replace(/^(Here's|Here is|The completion|Completion:).*/i, "")
      .trim()
      .split("\n")
      .slice(0, 3) // Limit to 3 lines
      .join("\n");
  }
}

export function registerInlineCompletionProvider(
  context: vscode.ExtensionContext,
  alexAiService: AlexAiService
) {
  const provider = new AlexAiInlineCompletionProvider(alexAiService);

  // Register for all file types
  const disposable = vscode.languages.registerInlineCompletionItemProvider(
    { pattern: "**/*" },
    provider
  );

  context.subscriptions.push(disposable);
  console.log("🖖 Alex AI Inline Completions registered");
}
