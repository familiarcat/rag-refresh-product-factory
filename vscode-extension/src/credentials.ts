import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Secure credential management for Alex AI
 * Extracts API keys from ~/.zshrc or VS Code settings
 */
export class CredentialManager {
  private cachedApiKey: string | null = null;

  /**
   * Get OpenRouter API key from multiple sources:
   * 1. VS Code settings (explicit configuration)
   * 2. Environment variable (current session)
   * 3. ~/.zshrc or ~/.zshenv (persistent)
   */
  async getOpenRouterApiKey(): Promise<string | null> {
    // Return cached value if available
    if (this.cachedApiKey) {
      return this.cachedApiKey;
    }

    // 1. Check VS Code settings first
    const config = vscode.workspace.getConfiguration("alexAi");
    const settingsKey = config.get<string>("openRouterApiKey");
    if (settingsKey && settingsKey.trim()) {
      this.cachedApiKey = settingsKey.trim();
      return this.cachedApiKey;
    }

    // 2. Check current environment
    if (process.env.OPENROUTER_API_KEY) {
      this.cachedApiKey = process.env.OPENROUTER_API_KEY;
      return this.cachedApiKey;
    }

    // 3. Extract from shell config files
    const shellKey = await this.extractFromShellConfig();
    if (shellKey) {
      this.cachedApiKey = shellKey;
      return this.cachedApiKey;
    }

    return null;
  }

  /**
   * Extract OPENROUTER_API_KEY from ~/.zshrc or ~/.zshenv
   */
  private async extractFromShellConfig(): Promise<string | null> {
    const homeDir = os.homedir();
    const configFiles = [
      path.join(homeDir, ".zshrc"),
      path.join(homeDir, ".zshenv"),
      path.join(homeDir, ".bashrc"),
      path.join(homeDir, ".bash_profile"),
    ];

    for (const configFile of configFiles) {
      try {
        if (!fs.existsSync(configFile)) continue;

        const content = fs.readFileSync(configFile, "utf-8");

        // Match various export patterns
        const patterns = [
          /export\s+OPENROUTER_API_KEY=["']?([^"'\n]+)["']?/,
          /OPENROUTER_API_KEY=["']?([^"'\n]+)["']?/,
        ];

        for (const pattern of patterns) {
          const match = content.match(pattern);
          if (match && match[1]) {
            // Don't return if it's a variable reference
            if (!match[1].startsWith("$")) {
              return match[1].trim();
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to read ${configFile}:`, error);
      }
    }

    // Try sourcing the shell to get the actual value
    try {
      const { stdout } = await execAsync('zsh -lc "echo $OPENROUTER_API_KEY"', {
        timeout: 5000,
      });
      const key = stdout.trim();
      if (key && key !== "" && !key.startsWith("$")) {
        return key;
      }
    } catch (error) {
      console.warn("Failed to extract from shell:", error);
    }

    return null;
  }

  /**
   * Store API key securely in VS Code's secret storage
   */
  async storeApiKey(
    context: vscode.ExtensionContext,
    apiKey: string
  ): Promise<void> {
    await context.secrets.store("alexAi.openRouterApiKey", apiKey);
    this.cachedApiKey = apiKey;
  }

  /**
   * Get API key from secret storage
   */
  async getStoredApiKey(
    context: vscode.ExtensionContext
  ): Promise<string | undefined> {
    return await context.secrets.get("alexAi.openRouterApiKey");
  }

  /**
   * Clear cached credentials
   */
  clearCache(): void {
    this.cachedApiKey = null;
  }

  /**
   * Validate API key format
   */
  isValidApiKey(key: string): boolean {
    // OpenRouter keys typically start with 'sk-or-'
    return key.startsWith("sk-or-") && key.length > 20;
  }
}
