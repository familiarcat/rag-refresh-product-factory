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
};

const CREW_PERSONAS: Record<string, string> = {
  picard: `You are Captain Jean-Luc Picard. Provide strategic guidance and principled decisions. Be thoughtful and decisive.`,
  riker: `You are Commander Riker. Focus on tactical execution and team coordination. Be practical and action-oriented.`,
  data: `You are Commander Data. Provide precise technical analysis with attention to detail. Be thorough and analytical.`,
  geordi: `You are Lt. Cmdr. La Forge. Focus on engineering solutions and infrastructure. Be creative and optimistic.`,
  troi: `You are Counselor Troi. Consider user experience and accessibility. Be empathetic and user-focused.`,
  worf: `You are Lt. Worf. Focus on security, reliability, and testing. Be direct and thorough about potential issues.`,
  obrien: `You are Chief O'Brien. Focus on practical implementation and debugging. Be down-to-earth and solution-oriented.`,
  quark: `You are Quark. Consider business value, cost, and ROI. Be shrewd but helpful.`,
};

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
  responses: Array<{ name: string; emoji: string; response: string }>;
}

export class AlexAiClient {
  private getConfig() {
    const config = vscode.workspace.getConfiguration("alexAi");
    return {
      apiKey:
        config.get<string>("openRouterApiKey") ||
        process.env.OPENROUTER_API_KEY ||
        "",
      baseUrl: config.get<string>("baseUrl") || "http://localhost:3001",
      autoLoadContext: config.get<boolean>("autoLoadContext") ?? true,
    };
  }

  async chat(
    crewMember: string,
    message: string,
    fileContext?: string
  ): Promise<string> {
    const config = this.getConfig();
    const crew = CREW_MODELS[crewMember.toLowerCase()];

    if (!crew) {
      return `Unknown crew member: ${crewMember}. Available: ${Object.keys(
        CREW_MODELS
      ).join(", ")}`;
    }

    if (!config.apiKey) {
      return "❌ OpenRouter API key not configured. Set it in Settings > Alex AI > Open Router Api Key";
    }

    // Build context
    let contextPrompt = "";
    if (fileContext) {
      contextPrompt = `\n\nCurrent file context:\n${fileContext}`;
    }

    // Try to load memories
    try {
      const memories = await this.getMemories(crewMember);
      if (memories.length > 0) {
        contextPrompt += `\n\nYour recent memories:\n${memories
          .map((m) => `- ${m}`)
          .join("\n")}`;
      }
    } catch {
      // Ignore memory loading errors
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
              {
                role: "system",
                content:
                  CREW_PERSONAS[crewMember.toLowerCase()] + contextPrompt,
              },
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
      return data.choices?.[0]?.message?.content || "No response received";
    } catch (error) {
      return `❌ Error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
    }
  }

  async getMemories(crewMember?: string): Promise<string[]> {
    const config = this.getConfig();
    try {
      const response = await fetch(
        `${config.baseUrl}/api/crew/collaborate?action=memories`
      );
      const data = (await response.json()) as {
        memories?: Array<{ crewId?: string; content?: string }>;
      };
      const memories = data.memories || [];

      if (crewMember) {
        return memories
          .filter((m: any) => m.crewId?.includes(crewMember))
          .slice(0, 3)
          .map((m: any) => m.content?.slice(0, 100) + "...");
      }
      return memories
        .slice(0, 5)
        .map((m: any) => m.content?.slice(0, 100) + "...");
    } catch {
      return [];
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

      if (!sprint) return null;

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
    } catch {
      return null;
    }
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
    const responses: Array<{ name: string; emoji: string; response: string }> =
      [];

    for (const crewId of seniorStaff) {
      const crew = CREW_MODELS[crewId];
      const previousContext =
        responses.length > 0
          ? `\n\nPrevious responses:\n${responses
              .map((r) => `${r.name}: ${r.response}`)
              .join("\n\n")}`
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
                  content: `${CREW_PERSONAS[crewId]}\n\nYou are in a senior staff meeting. Topic: "${topic}"\n\nKeep response to 2-3 sentences.${previousContext}`,
                },
                {
                  role: "user",
                  content: `Topic: ${topic}\n\nProvide your perspective.`,
                },
              ],
              max_tokens: 300,
            }),
          }
        );

        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        responses.push({
          name: crew.name,
          emoji: crew.emoji,
          response: data.choices?.[0]?.message?.content || "No response",
        });
      } catch {
        responses.push({
          name: crew.name,
          emoji: crew.emoji,
          response: "(Unable to respond)",
        });
      }
    }

    return { topic, responses };
  }

  getCrewInfo() {
    return Object.entries(CREW_MODELS).map(([id, info]) => ({
      id,
      ...info,
      persona: CREW_PERSONAS[id],
    }));
  }
}


