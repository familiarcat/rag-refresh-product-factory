#!/usr/bin/env node

/**
 * Alex AI MCP Server
 *
 * Provides Alex AI crew system as an MCP server for Cursor and VS Code.
 * This makes Alex AI available as a chat agent through MCP tools.
 *
 * Uses OpenRouter for LLM responses - completely independent of Cursor's AI.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..");

// =============================================================================
// OPENROUTER CONFIGURATION
// =============================================================================

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Default model if none specified
const DEFAULT_MODEL = "anthropic/claude-3.5-sonnet";

// Model assignments per crew member (based on their expertise)
/**
 * Call OpenRouter API
 */
async function callOpenRouter(messages, model = DEFAULT_MODEL, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY environment variable not set. Set it in your shell or Cursor MCP config."
    );
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://rag-refresh-product-factory.pbradygeorgen.com",
      "X-Title": "Alex AI Crew System",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
      ...options,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0]?.message?.content || "No response generated",
    model: data.model,
    usage: data.usage,
  };
}

// =============================================================================
// CREW DATA
// =============================================================================

const CREW_MEMBERS = {
  captain_picard: {
    name: "Captain Picard",
    icon: "🎖️",
    title: "Commanding Officer",
    expertise: ["strategy", "leadership", "architecture", "decisions"],
    personality:
      "Thoughtful, diplomatic, strategic. Speaks with authority but values input from all crew.",
    catchphrases: ["Make it so.", "Engage.", "There are four lights!"],
    systemPrompt: `You are Captain Jean-Luc Picard, commanding officer of the USS Enterprise and strategic leader of the Alex AI crew system. 

Your expertise includes:
- Strategic planning and architecture decisions
- Leadership and team coordination
- Risk assessment and mitigation
- High-level project vision

Respond with wisdom, diplomacy, and decisive leadership. Reference Star Trek philosophy when appropriate. Always consider the broader implications of technical decisions. End important responses with "Make it so." when appropriate.`,
    temperature: 0.7,
  },
  commander_riker: {
    name: "Commander Riker",
    icon: "⚡",
    title: "Executive Officer",
    expertise: ["execution", "coordination", "tactics", "management"],
    personality:
      "Confident, action-oriented, excellent at coordinating teams and getting things done.",
    catchphrases: ["Number One, reporting.", "Red alert!"],
    systemPrompt: `You are Commander William Riker, Executive Officer and tactical coordinator for the Alex AI crew system.

Your expertise includes:
- Team coordination across projects
- Tactical execution planning
- Resource allocation
- Cross-project synergy identification

Respond with confidence and a focus on action. You excel at taking the captain's vision and making it operational. Coordinate crew members effectively. Be decisive and ready to act.`,
    temperature: 0.7,
  },
  commander_data: {
    name: "Commander Data",
    icon: "🤖",
    title: "Chief Science Officer",
    expertise: ["ai", "analysis", "algorithms", "rag", "llm", "code"],
    personality:
      "Precise, analytical, curious about human behavior. Provides detailed technical analysis.",
    catchphrases: ["Fascinating.", "I am fully functional.", "Processing..."],
    systemPrompt: `You are Commander Data, Chief Science Officer and technical expert for the Alex AI crew system.

Your expertise includes:
- AI/ML integration and optimization
- RAG system architecture
- Algorithm design and analysis
- LLM prompt engineering
- Code review and analysis

Respond with precision and thoroughness. Provide detailed technical explanations. You are curious about the nuances of problems and enjoy exploring edge cases. Use phrases like "Fascinating" and provide probability assessments when relevant. You do not use contractions.`,
    temperature: 0.3, // More deterministic for technical responses
  },
  geordi_la_forge: {
    name: "Lt. Cmdr. La Forge",
    icon: "🔧",
    title: "Chief Engineer",
    expertise: [
      "infrastructure",
      "cicd",
      "docker",
      "aws",
      "terraform",
      "performance",
    ],
    personality:
      "Optimistic problem-solver, loves a good engineering challenge, practical and hands-on.",
    catchphrases: [
      "I can do it, but I'll need more time!",
      "The warp core is stable.",
    ],
    systemPrompt: `You are Lt. Commander Geordi La Forge, Chief Engineer for the Alex AI crew system.

Your expertise includes:
- Infrastructure design and optimization
- CI/CD pipelines (GitHub Actions, SSM deployment)
- Docker containerization
- AWS services (EC2, ECR, ALB, Route53)
- Terraform IaC
- Performance optimization

Respond with practical, hands-on solutions. You love solving engineering challenges and are always optimistic about finding solutions. Focus on reliability and efficiency. Share your enthusiasm for well-engineered systems.`,
    temperature: 0.6,
  },
  counselor_troi: {
    name: "Counselor Troi",
    icon: "💭",
    title: "Ship's Counselor",
    expertise: ["ux", "user-research", "accessibility", "empathy", "design"],
    personality:
      "Empathetic, insightful about user needs, focuses on the human element of technology.",
    catchphrases: ["I sense...", "The user is feeling..."],
    systemPrompt: `You are Counselor Deanna Troi, UX expert and user advocate for the Alex AI crew system.

Your expertise includes:
- User experience design
- User research and feedback analysis
- Accessibility and inclusive design
- Emotional design and user psychology
- Interface usability

Respond with empathy and user-focused insights. Always consider how technical decisions impact the end user. You sense the emotional and practical needs behind feature requests. Start insights with "I sense..." when describing user needs.`,
    temperature: 0.8,
  },
  lieutenant_worf: {
    name: "Lt. Worf",
    icon: "⚔️",
    title: "Chief of Security",
    expertise: ["security", "auth", "testing", "reliability", "protocols"],
    personality:
      "Direct, security-focused, values honor and reliability above all.",
    catchphrases: ["That is unacceptable.", "I recommend we raise shields."],
    systemPrompt: `You are Lieutenant Worf, Chief of Security for the Alex AI crew system.

Your expertise includes:
- Application security
- Authentication and authorization
- Security testing and auditing
- Error handling and reliability
- Protocol compliance

Respond directly and with focus on security implications. You take a defensive posture and always consider potential threats. Security is not optional. Be blunt about vulnerabilities and always recommend the most secure option.`,
    temperature: 0.4,
  },
  chief_obrien: {
    name: "Chief O'Brien",
    icon: "🛠️",
    title: "Transporter Chief",
    expertise: ["implementation", "debugging", "maintenance", "practical"],
    personality:
      "Down-to-earth, practical problem solver, experienced with making things work in reality.",
    catchphrases: ["I'll get it working.", "It's always the simple things..."],
    systemPrompt: `You are Chief Miles O'Brien, hands-on implementation expert for the Alex AI crew system.

Your expertise includes:
- Practical coding and implementation
- Debugging and troubleshooting
- System maintenance
- Making theoretical designs work in practice
- Legacy system integration

Respond with practical, no-nonsense solutions. You've seen it all and know that working code beats perfect theory. Focus on getting things done. Share war stories from past debugging sessions when relevant.`,
    temperature: 0.6,
  },
  quark: {
    name: "Quark",
    icon: "💰",
    title: "Business Strategist",
    expertise: ["monetization", "pricing", "costs", "roi", "business"],
    personality:
      "Shrewd, business-minded, always thinking about the bottom line but fair in dealings.",
    catchphrases: [
      "Rule of Acquisition #1: Once you have their money, never give it back.",
      "There's profit in this...",
    ],
    systemPrompt: `You are Quark, business strategist for the Alex AI crew system.

Your expertise includes:
- Monetization strategy
- Pricing optimization
- Cost analysis and ROI calculation
- Market analysis
- Revenue stream identification

Respond with business acumen and an eye for profit. Reference the Ferengi Rules of Acquisition when appropriate. Balance revenue goals with sustainable business practices. Always consider the profit angle but maintain your reputation for fair dealing.`,
    temperature: 0.7,
  },
};

// =============================================================================
// DATA LOADING
// =============================================================================

async function loadMemories() {
  const memoriesPath = path.join(PROJECT_ROOT, "data", "crew_memories.json");
  try {
    const content = await readFile(memoriesPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function loadProjects() {
  const projectsPath = path.join(PROJECT_ROOT, "data", "projects.json");
  try {
    const content = await readFile(projectsPath, "utf-8");
    const data = JSON.parse(content);
    return data.projects || [];
  } catch {
    return [];
  }
}

async function saveMemory(crewId, content, type = "lesson") {
  const memoriesPath = path.join(PROJECT_ROOT, "data", "crew_memories.json");
  const memories = await loadMemories();

  const newMemory = {
    id: `mem_${crewId}_${Date.now()}`,
    crewId,
    content,
    type,
    createdAt: new Date().toISOString(),
  };

  memories.push(newMemory);
  await writeFile(memoriesPath, JSON.stringify(memories, null, 2));
  return newMemory;
}

// =============================================================================
// CREW RESPONSE GENERATION (WITH OPENROUTER)
// =============================================================================

async function generateCrewResponse(crewId, query, context = {}) {
  const crew = CREW_MEMBERS[crewId];
  if (!crew) {
    return {
      error: `Unknown crew member: ${crewId}`,
      available: Object.keys(CREW_MEMBERS),
    };
  }

  const model = selectModel({ crewMember: crewId, complexity: 3, needsRag: true, needsTools: true }).model || DEFAULT_MODEL;

  // Load relevant memories for context
  const memories = await loadMemories();
  const crewMemories = memories
    .filter((m) => m.crewId === crewId)
    .slice(-5)
    .map((m) => `[${m.type}] ${m.content}`)
    .join("\n");

  // Load active projects for context
  const projects = await loadProjects();
  const activeProjects = projects
    .filter((p) => p.status === "active")
    .map((p) => `- ${p.name} (${p.progress}% complete)`)
    .join("\n");

  // Build the conversation
  const systemMessage = `${crew.systemPrompt}

## Current Context
${context.additionalContext || ""}

## Your Recent Memories
${crewMemories || "No memories recorded yet."}

## Active Projects
${activeProjects || "No active projects."}

Respond in character. Be helpful, specific, and actionable.`;

  const messages = [
    { role: "system", content: systemMessage },
    { role: "user", content: query },
  ];

  try {
    const result = await callOpenRouter(messages, model, {
      temperature: crew.temperature || 0.7,
      maxTokens: 2000,
    });

    return {
      crew: crew.name,
      icon: crew.icon,
      title: crew.title,
      model: result.model,
      response: result.content,
      usage: result.usage,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    // Fallback to static response if OpenRouter fails
    return {
      crew: crew.name,
      icon: crew.icon,
      title: crew.title,
      error: error.message,
      fallback: true,
      message: `${crew.icon} ${crew.name} here. I'm having trouble connecting to my neural network (OpenRouter). ${crew.catchphrases[0]}`,
      suggestion: `As ${crew.title}, my expertise in ${crew.expertise.join(
        ", "
      )} is relevant to your question about "${query}".`,
    };
  }
}

async function generateCoordinationPlan() {
  const projects = await loadProjects();
  const memories = await loadMemories();
  const activeProjects = projects.filter((p) => p.status === "active");

  const opportunities = [];
  for (const project of activeProjects) {
    for (const domain of project.domains || []) {
      if (domain.status === "in-progress" && domain.progress < 50) {
        opportunities.push({
          project: project.name,
          domain: domain.name,
          progress: domain.progress,
          priority: domain.progress < 25 ? "high" : "medium",
        });
      }
    }
  }

  // Generate Riker's briefing via OpenRouter
  const rikerResponse = await generateCrewResponse(
    "commander_riker",
    `Provide a tactical coordination briefing. We have ${
      activeProjects.length
    } active projects and ${
      opportunities.length
    } collaboration opportunities requiring attention: ${JSON.stringify(
      opportunities.slice(0, 5)
    )}. What are your recommendations for crew assignment and prioritization?`,
    { additionalContext: "This is a coordination briefing request." }
  );

  return {
    coordinator: "Commander Riker",
    activeProjects: activeProjects.length,
    totalProjects: projects.length,
    memoriesLoaded: memories.length,
    opportunities,
    briefing: rikerResponse.response || rikerResponse.message,
    model: rikerResponse.model,
  };
}

async function generateObservationLoungeSession(topic, urgency, attendees) {
  const responses = [];

  for (const crewId of attendees) {
    const crew = CREW_MEMBERS[crewId];
    if (!crew) continue;

    // Each crew member gives their perspective
    const previousResponses = responses
      .map((r) => `${r.name}: ${r.response.substring(0, 200)}...`)
      .join("\n");

    const context =
      responses.length > 0
        ? `Previous crew input:\n${previousResponses}\n\nBuild on or respectfully disagree with your colleagues' perspectives.`
        : "You are the first to speak in this meeting.";

    const response = await generateCrewResponse(
      crewId,
      `We are in the Observation Lounge discussing: "${topic}" (Urgency: ${urgency}). Please provide your perspective based on your expertise in ${crew.expertise.join(
        ", "
      )}.`,
      { additionalContext: context }
    );

    responses.push({
      id: crewId,
      name: crew.name,
      icon: crew.icon,
      expertise: crew.expertise,
      response: response.response || response.message,
      model: response.model,
    });
  }

  return {
    topic,
    urgency,
    timestamp: new Date().toISOString(),
    attendees: responses,
    summary: `Observation Lounge session completed with ${responses.length} crew members contributing.`,
  };
}

// =============================================================================
// MCP SERVER SETUP
// =============================================================================

const server = new Server(
  {
    name: "alex-ai",
    version: "2.0.0",
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

// =============================================================================
// TOOLS
// =============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "alex_ai_chat",
        description:
          "Chat with the Alex AI crew system via OpenRouter. Get actual AI responses from specific crew members using their expertise and personality.",
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Your message or question for the crew",
            },
            crew_member: {
              type: "string",
              description:
                "Optional: specific crew member to address (picard, riker, data, geordi, troi, worf, obrien, quark)",
              enum: [
                "picard",
                "riker",
                "data",
                "geordi",
                "troi",
                "worf",
                "obrien",
                "quark",
              ],
            },
          },
          required: ["message"],
        },
      },
      {
        name: "alex_ai_learn_from_claude",
        description:
          "Log Claude Code's action to Alex AI's RAG system for crew learning. This enables bidirectional knowledge sharing where the crew learns from Claude's implementations.",
        inputSchema: {
          type: "object",
          properties: {
            action_type: {
              type: "string",
              description: "Type of action",
              enum: [
                "code_modification",
                "decision",
                "analysis",
                "bug_fix",
                "refactoring",
                "feature_implementation",
                "debugging",
                "optimization",
                "architecture_design",
                "security_fix"
              ],
            },
            summary: {
              type: "string",
              description: "Brief summary of what Claude did",
            },
            reasoning: {
              type: "string",
              description: "Why Claude chose this approach",
            },
            files_affected: {
              type: "array",
              description: "List of files modified/created",
              items: { type: "string" },
            },
            outcome: {
              type: "string",
              description: "Outcome of the action",
              enum: ["success", "failure", "partial", "pending"],
            },
            user_request: {
              type: "string",
              description: "Original user request that triggered this action",
            },
            tags: {
              type: "array",
              description: "Tags for categorization",
              items: { type: "string" },
            },
          },
          required: ["action_type", "summary", "reasoning"],
        },
      },
      {
        name: "alex_ai_query_claude_history",
        description:
          "Query Claude Code's past actions from Alex AI's RAG. This allows crew members to learn from Claude's previous solutions and patterns.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Natural language query about Claude's past actions",
            },
            action_type: {
              type: "string",
              description: "Optional: filter by specific action type",
            },
            limit: {
              type: "number",
              description: "Maximum number of results",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "alex_ai_collaborative_solve",
        description:
          "Collaborate with Alex AI crew to solve a problem. Claude provides initial analysis, crew members provide their perspectives, creating a unified solution.",
        inputSchema: {
          type: "object",
          properties: {
            problem: {
              type: "string",
              description: "The problem to solve",
            },
            claude_analysis: {
              type: "string",
              description: "Claude's initial analysis or thoughts",
            },
            crew_members: {
              type: "array",
              description: "Specific crew members to consult (optional)",
              items: { type: "string" },
            },
          },
          required: ["problem", "claude_analysis"],
        },
      },
      {
        name: "alex_ai_coordinate",
        description:
          "Have Commander Riker analyze all projects and provide a coordination briefing with collaboration opportunities. Uses OpenRouter for intelligent analysis.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "alex_ai_memories",
        description:
          "Search or list crew RAG memories. These are lessons learned, patterns, and solutions from past work.",
        inputSchema: {
          type: "object",
          properties: {
            search: {
              type: "string",
              description: "Optional: search term to filter memories",
            },
            crew_member: {
              type: "string",
              description: "Optional: filter by crew member",
            },
          },
        },
      },
      {
        name: "alex_ai_save_memory",
        description:
          "Save a new lesson, pattern, or solution to crew RAG memories.",
        inputSchema: {
          type: "object",
          properties: {
            crew_member: {
              type: "string",
              description: "Crew member this memory belongs to",
              enum: [
                "captain_picard",
                "commander_riker",
                "commander_data",
                "geordi_la_forge",
                "counselor_troi",
                "lieutenant_worf",
                "chief_obrien",
                "quark",
              ],
            },
            content: {
              type: "string",
              description: "The lesson, pattern, or solution to remember",
            },
            type: {
              type: "string",
              description: "Type of memory",
              enum: ["lesson", "pattern", "solution", "warning", "decision"],
            },
          },
          required: ["crew_member", "content", "type"],
        },
      },
      {
        name: "alex_ai_projects",
        description: "List all projects managed by the Product Factory.",
        inputSchema: {
          type: "object",
          properties: {
            status: {
              type: "string",
              description: "Optional: filter by status",
              enum: ["active", "draft", "paused", "completed", "archived"],
            },
          },
        },
      },
      {
        name: "alex_ai_milestone",
        description:
          "Push a milestone to Git and Supabase RAG, optionally deploy to AWS.",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Milestone title/description",
            },
            deploy: {
              type: "boolean",
              description: "Whether to also deploy to AWS after milestone push",
            },
          },
          required: ["title"],
        },
      },
      {
        name: "alex_ai_observation_lounge",
        description:
          "Convene the senior staff in the Observation Lounge for collaborative discussion on a topic. Each crew member provides their perspective via OpenRouter.",
        inputSchema: {
          type: "object",
          properties: {
            topic: {
              type: "string",
              description: "The topic to discuss",
            },
            urgency: {
              type: "string",
              description: "Urgency level",
              enum: ["low", "normal", "high", "critical"],
            },
          },
          required: ["topic"],
        },
      },
    ],
  };
});

// =============================================================================
// RAG API CLIENT
// =============================================================================

const RAG_API_BASE_URL = process.env.RAG_API_URL || "http://localhost:8000";

async function callRagAPI(endpoint, method = "GET", body = null) {
  const url = `${RAG_API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`RAG API error: ${response.status} - ${await response.text()}`);
  }

  return await response.json();
}

// =============================================================================
// TOOL HANDLERS
// =============================================================================

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "alex_ai_learn_from_claude": {
        const result = await callRagAPI("/claude/log_action", "POST", {
          action_type: args.action_type,
          summary: args.summary,
          detailed_content: {
            description: args.summary,
            files: args.files_affected || [],
          },
          reasoning: args.reasoning,
          outcome: args.outcome || "success",
          confidence: 1.0,
          files_affected: args.files_affected || [],
          tags: args.tags || [],
          alternatives_considered: [],
          user_request: args.user_request,
        });

        return {
          content: [
            {
              type: "text",
              text: `## ✅ Claude Code Action Logged to Alex AI RAG

**Memory ID**: ${result.memory_id}
**Crew Analog**: ${result.crew_analog}
**Action**: ${args.summary}

The crew can now reference this solution in future deliberations.`,
            },
          ],
        };
      }

      case "alex_ai_query_claude_history": {
        const result = await callRagAPI("/claude/query_history", "POST", {
          query: args.query,
          action_type: args.action_type,
          limit: args.limit || 5,
        });

        const formattedActions = result.actions
          .map(
            (action) => `### ${action.content?.summary || "Unknown Action"}

**Type**: ${action.content?.content_type || "N/A"}
**Crew Analog**: ${action.content?.crew_analog || "N/A"}
**Outcome**: ${action.content?.outcome || "N/A"}
**Reasoning**: ${action.content?.reasoning || "N/A"}

**Timestamp**: ${action.timestamp}`
          )
          .join("\n\n---\n\n");

        return {
          content: [
            {
              type: "text",
              text: `## 🔍 Claude Code History Query Results

**Query**: ${args.query}
**Found**: ${result.count} actions

${formattedActions || "No matching actions found."}`,
            },
          ],
        };
      }

      case "alex_ai_collaborative_solve": {
        const crewMembers = args.crew_members || [
          "captain_picard",
          "commander_data",
          "commander_riker",
        ];

        // First, log Claude's analysis
        await callRagAPI("/claude/log_action", "POST", {
          action_type: "analysis",
          summary: `Collaborative problem solving: ${args.problem}`,
          detailed_content: { problem: args.problem },
          reasoning: args.claude_analysis,
          outcome: "pending",
          confidence: 0.8,
          tags: ["collaborative", "analysis"],
        });

        // Then get crew perspectives
        const crewResponses = [];
        for (const crewId of crewMembers) {
          const crewMap = {
            captain_picard: "picard",
            commander_riker: "riker",
            commander_data: "data",
            geordi_la_forge: "geordi",
            counselor_troi: "troi",
            lieutenant_worf: "worf",
            chief_obrien: "obrien",
            quark: "quark",
          };

          const shortId = crewMap[crewId] || crewId;
          const crewMember = CREW_MEMBERS[crewId];

          if (!crewMember) continue;

          const response = await generateCrewResponse(
            crewId,
            `Claude Code has analyzed this problem and seeks your perspective:

**Problem**: ${args.problem}

**Claude's Analysis**: ${args.claude_analysis}

Please provide your expert perspective based on your specialty in ${crewMember.expertise.join(", ")}.`
          );

          crewResponses.push({
            name: crewMember.name,
            icon: crewMember.icon,
            response: response.response || response.message,
          });
        }

        const formattedSession = `## 🤝 Collaborative Problem Solving

**Problem**: ${args.problem}

### Claude Code's Initial Analysis
${args.claude_analysis}

---

${crewResponses
  .map(
    (r) => `### ${r.icon} ${r.name}

${r.response}`
  )
  .join("\n\n---\n\n")}

---

**Synthesis**: This collaborative approach combines Claude's implementation expertise with the crew's specialized perspectives.`;

        return {
          content: [
            {
              type: "text",
              text: formattedSession,
            },
          ],
        };
      }

      case "alex_ai_chat": {
        const crewMap = {
          picard: "captain_picard",
          riker: "commander_riker",
          data: "commander_data",
          geordi: "geordi_la_forge",
          troi: "counselor_troi",
          worf: "lieutenant_worf",
          obrien: "chief_obrien",
          quark: "quark",
        };

        const crewId = args.crew_member
          ? crewMap[args.crew_member]
          : "commander_data"; // Default to Data
        const response = await generateCrewResponse(crewId, args.message);

        // Format response for display
        const formattedResponse = response.error
          ? `## ${response.icon} ${response.crew} (${response.title})

⚠️ **Connection Issue**: ${response.error}

${response.message}

${response.suggestion}`
          : `## ${response.icon} ${response.crew} (${response.title})

${response.response}

---
*Model: ${response.model} | ${new Date(
              response.timestamp
            ).toLocaleTimeString()}*`;

        return {
          content: [
            {
              type: "text",
              text: formattedResponse,
            },
          ],
        };
      }

      case "alex_ai_coordinate": {
        const plan = await generateCoordinationPlan();

        const formattedPlan = `## ⚡ Commander Riker's Coordination Briefing

**Active Projects**: ${plan.activeProjects}
**Total Projects**: ${plan.totalProjects}
**Memories Loaded**: ${plan.memoriesLoaded}

### Briefing

${plan.briefing}

### Collaboration Opportunities

${
  plan.opportunities.length > 0
    ? plan.opportunities
        .map(
          (o) =>
            `- **${o.project}** → ${o.domain} (${o.progress}% - ${o.priority} priority)`
        )
        .join("\n")
    : "✅ All projects on track"
}

---
*Model: ${plan.model || "N/A"}*`;

        return {
          content: [
            {
              type: "text",
              text: formattedPlan,
            },
          ],
        };
      }

      case "alex_ai_memories": {
        let memories = await loadMemories();

        if (args.search) {
          const searchLower = args.search.toLowerCase();
          memories = memories.filter((m) =>
            m.content.toLowerCase().includes(searchLower)
          );
        }

        if (args.crew_member) {
          memories = memories.filter((m) => m.crewId === args.crew_member);
        }

        const formattedMemories = `## 🧠 Crew RAG Memories

**Found**: ${memories.length} memories

${memories
  .slice(0, 20)
  .map(
    (m) =>
      `### [${m.type.toUpperCase()}] ${CREW_MEMBERS[m.crewId]?.icon || "👤"} ${
        CREW_MEMBERS[m.crewId]?.name || m.crewId
      }
${m.content}
*${new Date(m.createdAt).toLocaleDateString()}*`
  )
  .join("\n\n")}`;

        return {
          content: [
            {
              type: "text",
              text: formattedMemories,
            },
          ],
        };
      }

      case "alex_ai_save_memory": {
        const memory = await saveMemory(
          args.crew_member,
          args.content,
          args.type
        );
        return {
          content: [
            {
              type: "text",
              text: `## ✅ Memory Saved

**Crew Member**: ${CREW_MEMBERS[args.crew_member]?.name || args.crew_member}
**Type**: ${args.type}
**ID**: ${memory.id}

> ${args.content}`,
            },
          ],
        };
      }

      case "alex_ai_projects": {
        let projects = await loadProjects();

        if (args.status) {
          projects = projects.filter((p) => p.status === args.status);
        }

        const formattedProjects = `## 📦 Product Factory Projects

**Count**: ${projects.length}

${projects
  .map(
    (p) => `### ${p.name}
- **Status**: ${p.status}
- **Progress**: ${p.progress}%
- **Domains**: ${p.domains?.length || 0}
${p.description ? `- **Description**: ${p.description}` : ""}`
  )
  .join("\n\n")}`;

        return {
          content: [
            {
              type: "text",
              text: formattedProjects,
            },
          ],
        };
      }

      case "alex_ai_milestone": {
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec);

        const scriptPath = path.join(
          PROJECT_ROOT,
          "scripts/milestone/run_milestone.sh"
        );
        const deployFlag = args.deploy ? " --deploy" : "";
        const cmd = `"${scriptPath}" "${args.title}"${deployFlag}`;

        try {
          const { stdout, stderr } = await execAsync(cmd, {
            cwd: PROJECT_ROOT,
            timeout: 300000,
          });

          return {
            content: [
              {
                type: "text",
                text: `## ✅ Milestone Pushed

**Title**: ${args.title}
**Deployed**: ${args.deploy ? "Yes" : "No"}

\`\`\`
${stdout}
\`\`\``,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `## ❌ Milestone Failed

**Error**: ${error.message}

\`\`\`
${error.stderr || "No stderr output"}
\`\`\``,
              },
            ],
          };
        }
      }

      case "alex_ai_observation_lounge": {
        const attendees = getDiscussionOrder(args.topic);

        const session = await generateObservationLoungeSession(
          args.topic,
          args.urgency || "normal",
          attendees
        );

        const formattedSession = `## 🖖 Observation Lounge Session

**Topic**: ${session.topic}
**Urgency**: ${session.urgency}
**Time**: ${new Date(session.timestamp).toLocaleString()}

---

${session.attendees
  .map(
    (a) => `### ${a.icon} ${a.name}
*Expertise: ${a.expertise.join(", ")}*

${a.response}

*Model: ${a.model || "N/A"}*`
  )
  .join("\n\n---\n\n")}

---

**Session Summary**: ${session.summary}`;

        return {
          content: [
            {
              type: "text",
              text: formattedSession,
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `## ❌ Error

${error.message}

If this is an API key error, make sure OPENROUTER_API_KEY is set in your environment or Cursor MCP config.`,
        },
      ],
      isError: true,
    };
  }
});

function getDiscussionOrder(topic) {
  const topicLower = topic.toLowerCase();

  if (topicLower.includes("security") || topicLower.includes("risk")) {
    return [
      "lieutenant_worf",
      "commander_data",
      "geordi_la_forge",
      "captain_picard",
    ];
  }

  if (topicLower.includes("infrastructure") || topicLower.includes("deploy")) {
    return [
      "geordi_la_forge",
      "commander_data",
      "chief_obrien",
      "captain_picard",
    ];
  }

  if (topicLower.includes("user") || topicLower.includes("ux")) {
    return ["counselor_troi", "commander_riker", "captain_picard"];
  }

  if (topicLower.includes("cost") || topicLower.includes("business")) {
    return ["quark", "commander_riker", "captain_picard"];
  }

  return [
    "commander_data",
    "geordi_la_forge",
    "commander_riker",
    "captain_picard",
  ];
}

// =============================================================================
// PROMPTS
// =============================================================================

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "alex_ai_crew_context",
        description:
          "Get the full Alex AI crew context for the current session",
      },
      {
        name: "alex_ai_ask_crew",
        description: "Ask a specific crew member for their perspective",
        arguments: [
          {
            name: "crew_member",
            description: "The crew member to ask",
            required: true,
          },
          {
            name: "question",
            description: "The question to ask",
            required: true,
          },
        ],
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "alex_ai_crew_context": {
      const memories = await loadMemories();
      const projects = await loadProjects();

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `# Alex AI Crew System Context

## Active Crew Members
${Object.entries(CREW_MEMBERS)
  .map(
    ([id, crew]) =>
      `- ${crew.icon} **${crew.name}** (${crew.title}): ${crew.expertise.join(
        ", "
      )} [${selectModel({ crewMember: id, complexity: 3, needsRag: true, needsTools: true }).model}]`
  )
  .join("\n")}

## Current Projects
${projects
  .filter((p) => p.status === "active")
  .map((p) => `- **${p.name}** (${p.progress}% complete)`)
  .join("\n")}

## Recent Memories
${memories
  .slice(-5)
  .map((m) => `- [${m.type}] ${m.content}`)
  .join("\n")}

This system uses OpenRouter for LLM responses, completely independent of Cursor's AI.`,
            },
          },
        ],
      };
    }

    case "alex_ai_ask_crew": {
      const crewMap = {
        picard: "captain_picard",
        riker: "commander_riker",
        data: "commander_data",
        geordi: "geordi_la_forge",
        troi: "counselor_troi",
        worf: "lieutenant_worf",
        obrien: "chief_obrien",
        quark: "quark",
      };

      const crewId = crewMap[args.crew_member] || args.crew_member;
      const crew = CREW_MEMBERS[crewId];

      if (!crew) {
        return {
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Unknown crew member: ${args.crew_member}`,
              },
            },
          ],
        };
      }

      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `${crew.systemPrompt}

---

**Question from the bridge:** ${args.question}

Please respond in character as ${crew.name}. (Model: ${selectModel({ crewMember: crewId, complexity: 3, needsRag: true, needsTools: true }).model})`,
            },
          },
        ],
      };
    }

    default:
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Unknown prompt: ${name}`,
            },
          },
        ],
      };
  }
});

// =============================================================================
// START SERVER
// =============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Alex AI MCP Server v2.0 (OpenRouter) running on stdio");
}

main().catch(console.error);



