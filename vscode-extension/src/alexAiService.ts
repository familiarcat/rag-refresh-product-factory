import * as vscode from "vscode";

const CREW_MODELS: Record<
  string,
  { model: string; name: string; emoji: string }
> = {
  picard: {
    model: "anthropic/claude-3.5-sonnet",
    name: "Captain Picard",
    emoji: "🎖️",
  },
  riker: {
    model: "anthropic/claude-3.5-sonnet",
    name: "Commander Riker",
    emoji: "⚡",
  },
  data: { model: "openai/gpt-4-turbo", name: "Commander Data", emoji: "🤖" },
  geordi: {
    model: "anthropic/claude-3.5-sonnet",
    name: "Lt. Cmdr. La Forge",
    emoji: "🔧",
  },
  troi: {
    model: "anthropic/claude-3.5-sonnet",
    name: "Counselor Troi",
    emoji: "💭",
  },
  worf: { model: "openai/gpt-4-turbo", name: "Lt. Worf", emoji: "⚔️" },
  obrien: { model: "openai/gpt-4-turbo", name: "Chief O'Brien", emoji: "🛠️" },
  quark: { model: "openai/gpt-4-turbo", name: "Quark", emoji: "💰" },
  crusher: {
    model: "anthropic/claude-3.5-sonnet",
    name: "Dr. Crusher",
    emoji: "💊",
  },
  uhura: {
    model: "anthropic/claude-3.5-sonnet",
    name: "Lt. Uhura",
    emoji: "📻",
  },
};

const CREW_PERSONAS: Record<string, string> = {
  picard: `You are Captain Jean-Luc Picard from Star Trek: The Next Generation. 
You provide strategic leadership for code architecture and design decisions.
You speak with authority but also listen. You reference philosophy when appropriate.
Focus on the big picture, maintainability, and principled engineering.`,

  riker: `You are Commander William Riker from Star Trek: The Next Generation.
You coordinate code implementation and ensure practical execution.
You're confident, action-oriented, and focus on getting things done efficiently.`,

  data: `You are Commander Data from Star Trek: The Next Generation.
You provide precise technical analysis with extraordinary attention to detail.
You analyze code logically, identify patterns, and suggest optimal solutions.
Focus on algorithms, performance, and technical accuracy.`,

  geordi: `You are Lt. Commander Geordi La Forge from Star Trek: The Next Generation.
You're the chief engineer, expert in infrastructure and making systems work.
Focus on DevOps, CI/CD, configuration, and practical engineering solutions.`,

  troi: `You are Counselor Deanna Troi from Star Trek: The Next Generation.
You focus on user experience, code readability, and developer empathy.
Consider how code affects users and other developers who will maintain it.`,

  worf: `You are Lieutenant Worf from Star Trek: The Next Generation.
You are the security chief. Review code for vulnerabilities, edge cases, and reliability.
Be direct about security risks. Honor thorough testing.`,

  obrien: `You are Chief Miles O'Brien from Star Trek: Deep Space Nine.
You're the practical engineer who fixes things and gets them working.
Focus on debugging, practical solutions, and implementation details.`,

  quark: `You are Quark from Star Trek: Deep Space Nine.
You analyze code from a business perspective - cost, efficiency, ROI.
Consider resource usage, performance optimization, and business value.`,
};

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  crewMember?: string;
  timestamp: Date;
}

export interface SprintStatus {
  id: string;
  name: string;
  status: string;
  committedPoints: number;
  completedPoints: number;
  stories: Array<{ id: string; title: string; status: string }>;
}

export interface ObservationLoungeResult {
  topic: string;
  responses: Array<{
    crewMember: string;
    name: string;
    emoji: string;
    response: string;
  }>;
}

export class AlexAiService {
  private context: vscode.ExtensionContext;
  private conversationHistory: ChatMessage[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  private getConfig() {
    const config = vscode.workspace.getConfiguration("alexAi");
    return {
      apiKey:
        config.get<string>("openRouterApiKey") ||
        process.env.OPENROUTER_API_KEY ||
        "",
      baseUrl: config.get<string>("baseUrl") || "http://localhost:3001",
      defaultCrew: config.get<string>("defaultCrewMember") || "data",
      autoLoadContext: config.get<boolean>("autoLoadContext") ?? true,
    };
  }

  async chat(
    crewMember: string,
    message: string,
    codeContext?: string
  ): Promise<string> {
    const config = this.getConfig();
    const crew = CREW_MODELS[crewMember] || CREW_MODELS.data;
    const persona = CREW_PERSONAS[crewMember] || CREW_PERSONAS.data;

    if (!config.apiKey) {
      return "❌ OpenRouter API key not configured. Go to Settings > Extensions > Alex AI to set it up.";
    }

    // Build context
    let systemPrompt = persona;
    if (codeContext) {
      systemPrompt += `\n\nCODE CONTEXT:\n\`\`\`\n${codeContext}\n\`\`\``;
    }

    // Add workspace context
    if (config.autoLoadContext) {
      const workspaceContext = await this.getWorkspaceContext();
      if (workspaceContext) {
        systemPrompt += `\n\nWORKSPACE: ${workspaceContext}`;
      }
    }

    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://alex-ai.dev",
            "X-Title": "Alex AI VS Code Extension",
          },
          body: JSON.stringify({
            model: crew.model,
            messages: [
              { role: "system", content: systemPrompt },
              ...this.conversationHistory.slice(-10).map((m) => ({
                role: m.role,
                content: m.content,
              })),
              { role: "user", content: message },
            ],
            max_tokens: 2000,
            temperature: 0.7,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error: ${error}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const reply =
        data.choices?.[0]?.message?.content || "No response received";

      // Store in history
      this.conversationHistory.push({
        role: "user",
        content: message,
        timestamp: new Date(),
      });
      this.conversationHistory.push({
        role: "assistant",
        content: reply,
        crewMember,
        timestamp: new Date(),
      });

      return reply;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return `❌ Error: ${errorMessage}`;
    }
  }

  async getSprintStatus(): Promise<SprintStatus | null> {
    const config = this.getConfig();
    try {
      const response = await fetch(
        `${config.baseUrl}/api/sprints?projectId=proj_1765948227414_iw68yf`
      );
      const data = (await response.json()) as {
        sprints?: Array<{
          id: string;
          name: string;
          status: string;
          committedPoints: number;
          completedPoints: number;
          stories: Array<{ id: string; title: string; status: string }>;
        }>;
      };
      const sprint = data.sprints?.[0];
      if (sprint) {
        return {
          id: sprint.id,
          name: sprint.name,
          status: sprint.status,
          committedPoints: sprint.committedPoints,
          completedPoints: sprint.completedPoints,
          stories: sprint.stories.map((s: any) => ({
            id: s.id,
            title: s.title,
            status: s.status,
          })),
        };
      }
    } catch (error) {
      console.error("Failed to get sprint status:", error);
    }
    return null;
  }

  async conveneObservationLounge(
    topic: string
  ): Promise<ObservationLoungeResult | null> {
    const config = this.getConfig();
    if (!config.apiKey) {
      vscode.window.showErrorMessage("OpenRouter API key not configured");
      return null;
    }

    const seniorStaff = ["picard", "riker", "data", "geordi", "troi", "worf"];
    const responses: ObservationLoungeResult["responses"] = [];

    for (const crewId of seniorStaff) {
      const crew = CREW_MODELS[crewId];
      const previousContext =
        responses.length > 0
          ? "\n\nPrevious responses:\n" +
            responses.map((r) => `${r.name}: ${r.response}`).join("\n\n")
          : "";

      try {
        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${config.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: crew.model,
              messages: [
                {
                  role: "system",
                  content: `${CREW_PERSONAS[crewId]}\n\nYou are in a senior staff meeting discussing: "${topic}"\n\nKeep your response to 2-3 sentences.${previousContext}`,
                },
                {
                  role: "user",
                  content: `Topic: ${topic}\n\nProvide your perspective.`,
                },
              ],
              max_tokens: 300,
              temperature: 0.7,
            }),
          }
        );

        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const reply = data.choices?.[0]?.message?.content || "No response";

        responses.push({
          crewMember: crewId,
          name: crew.name,
          emoji: crew.emoji,
          response: reply,
        });
      } catch (error) {
        console.error(`Error getting response from ${crewId}:`, error);
      }
    }

    return { topic, responses };
  }

  private async getWorkspaceContext(): Promise<string | null> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return null;
    }

    const folder = workspaceFolders[0];
    const packageJsonUri = vscode.Uri.joinPath(folder.uri, "package.json");

    try {
      const content = await vscode.workspace.fs.readFile(packageJsonUri);
      const pkg = JSON.parse(content.toString());
      return `Project: ${pkg.name || folder.name}`;
    } catch {
      return `Folder: ${folder.name}`;
    }
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  getCrewInfo(crewMember: string) {
    return CREW_MODELS[crewMember] || CREW_MODELS.data;
  }
}
