import * as vscode from "vscode";
import { AlexAiService } from "./alexAiService";

/**
 * Hover Provider - AI explanations on hover
 * Shows explanations when hovering over code with modifier key
 */
export class AlexAiHoverProvider implements vscode.HoverProvider {
  private alexAiService: AlexAiService;
  private cache: Map<string, { content: string; timestamp: number }> = new Map();
  private cacheTtl = 60000; // 1 minute cache

  constructor(alexAiService: AlexAiService) {
    this.alexAiService = alexAiService;
  }

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | null> {
    // Check if feature is enabled
    const config = vscode.workspace.getConfiguration("alexAi");
    if (!config.get<boolean>("enableHoverExplanations", false)) {
      return null;
    }

    // Get the word at the current position
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) {
      return null;
    }

    const word = document.getText(wordRange);
    if (word.length < 2) {
      return null;
    }

    // Get surrounding context (current line + a few lines around)
    const startLine = Math.max(0, position.line - 3);
    const endLine = Math.min(document.lineCount - 1, position.line + 3);
    const contextRange = new vscode.Range(startLine, 0, endLine + 1, 0);
    const contextText = document.getText(contextRange);

    // Create cache key
    const cacheKey = `${document.uri.toString()}:${word}:${position.line}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      return new vscode.Hover(this.formatHoverContent(cached.content, word));
    }

    // Only proceed if we're hovering over something interesting
    // (function calls, class names, complex expressions)
    if (!this.isInterestingSymbol(word, contextText, document.languageId)) {
      return null;
    }

    try {
      const prompt = `Briefly explain what "${word}" does in this ${document.languageId} context (1-2 sentences max):

\`\`\`${document.languageId}
${contextText}
\`\`\`

Focus on: What is "${word}" and what does it do here?`;

      const response = await this.alexAiService.chat("data", prompt);

      if (token.isCancellationRequested) {
        return null;
      }

      // Cache the response
      this.cache.set(cacheKey, { content: response, timestamp: Date.now() });

      return new vscode.Hover(this.formatHoverContent(response, word));
    } catch (error) {
      console.error("Hover provider error:", error);
      return null;
    }
  }

  private isInterestingSymbol(
    word: string,
    context: string,
    languageId: string
  ): boolean {
    // Skip common keywords and short words
    const commonKeywords = [
      "if", "else", "for", "while", "return", "const", "let", "var",
      "function", "class", "import", "export", "from", "true", "false",
      "null", "undefined", "this", "new", "async", "await", "try", "catch",
    ];

    if (commonKeywords.includes(word.toLowerCase())) {
      return false;
    }

    // Check if it looks like a function call or method
    if (context.includes(`${word}(`)) {
      return true;
    }

    // Check if it's a class or type (PascalCase)
    if (/^[A-Z][a-zA-Z0-9]*$/.test(word)) {
      return true;
    }

    // Check if it's an imported symbol
    if (context.includes(`import`) && context.includes(word)) {
      return true;
    }

    return false;
  }

  private formatHoverContent(response: string, word: string): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.supportHtml = true;

    md.appendMarkdown(`**🤖 Alex AI** - \`${word}\`\n\n`);
    md.appendMarkdown(response.trim());
    md.appendMarkdown("\n\n---\n");
    md.appendMarkdown("*[Ask more](command:alexAi.askCrew)*");

    return md;
  }
}

export function registerHoverProvider(
  context: vscode.ExtensionContext,
  alexAiService: AlexAiService
) {
  const provider = new AlexAiHoverProvider(alexAiService);

  // Register for common programming languages
  const languages = [
    "typescript",
    "javascript",
    "typescriptreact",
    "javascriptreact",
    "python",
    "java",
    "go",
    "rust",
  ];

  for (const lang of languages) {
    const disposable = vscode.languages.registerHoverProvider(lang, provider);
    context.subscriptions.push(disposable);
  }

  console.log("🖖 Alex AI Hover Provider registered (explanations on hover)");
}
