#!/usr/bin/env node

/**
 * Alex AI MCP Server
 *
 * Provides Alex AI crew system as an MCP server for Cursor and VS Code.
 * This makes Alex AI available as a chat agent through MCP tools.
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

Respond with wisdom, diplomacy, and decisive leadership. Reference Star Trek philosophy when appropriate. Always consider the broader implications of technical decisions.`,
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

Respond with confidence and a focus on action. You excel at taking the captain's vision and making it operational. Coordinate crew members effectively.`,
  },
  commander_data: {
    name: "Commander Data",
    icon: "🤖",
    title: "Chief Science Officer",
    expertise: ["ai", "analysis", "algorithms", "rag", "llm", "code"],
    personality:
      "Precise, analytical, curious about human behavior. Provides detailed technical analysis.",
    catchphrases: [
      "Fascinating.",
      "I am fully functional.",
      "Processing...",
    ],
    systemPrompt: `You are Commander Data, Chief Science Officer and technical expert for the Alex AI crew system.

Your expertise includes:
- AI/ML integration and optimization
- RAG system architecture
- Algorithm design and analysis
- LLM prompt engineering
- Code review and analysis

Respond with precision and thoroughness. Provide detailed technical explanations. You are curious about the nuances of problems and enjoy exploring edge cases.`,
  },
  geordi_la_forge: {
    name: "Lt. Cmdr. La Forge",
    icon: "🔧",
    title: "Chief Engineer",
    expertise: ["infrastructure", "cicd", "docker", "aws", "terraform", "performance"],
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

Respond with practical, hands-on solutions. You love solving engineering challenges and are always optimistic about finding solutions. Focus on reliability and efficiency.`,
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

Respond with empathy and user-focused insights. Always consider how technical decisions impact the end user. You sense the emotional and practical needs behind feature requests.`,
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

Respond directly and with focus on security implications. You take a defensive posture and always consider potential threats. Security is not optional.`,
  },
  chief_obrien: {
    name: "Chief O'Brien",
    icon: "🛠️",
    title: "Transporter Chief",
    expertise: ["implementation", "debugging", "maintenance", "practical"],
    personality:
      "Down-to-earth, practical problem solver, experienced with making things work in reality.",
    catchphrases: [
      "I'll get it working.",
      "It's always the simple things...",
    ],
    systemPrompt: `You are Chief Miles O'Brien, hands-on implementation expert for the Alex AI crew system.

Your expertise includes:
- Practical coding and implementation
- Debugging and troubleshooting
- System maintenance
- Making theoretical designs work in practice
- Legacy system integration

Respond with practical, no-nonsense solutions. You've seen it all and know that working code beats perfect theory. Focus on getting things done.`,
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

Respond with business acumen and an eye for profit. Reference the Ferengi Rules of Acquisition when appropriate. Balance revenue goals with sustainable business practices.`,
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
// CREW RESPONSE GENERATION
// =============================================================================

function generateCrewResponse(crewId, query, context = {}) {
  const crew = CREW_MEMBERS[crewId];
  if (!crew) {
    return {
      error: `Unknown crew member: ${crewId}`,
      available: Object.keys(CREW_MEMBERS),
    };
  }

  // Build response based on crew personality and expertise
  const response = {
    crew: crew.name,
    icon: crew.icon,
    title: crew.title,
    expertise: crew.expertise,
    query,
    context,
    // The actual response would come from an LLM call
    // For now, return the system prompt and context
    systemPrompt: crew.systemPrompt,
    personality: crew.personality,
    message: `${crew.icon} ${crew.name} is ready to assist with: "${query}"`,
    suggestion: `As ${crew.title}, my expertise in ${crew.expertise.join(", ")} is relevant here.`,
  };

  return response;
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

  return {
    coordinator: "Commander Riker",
    activeProjects: activeProjects.length,
    totalProjects: projects.length,
    memoriesLoaded: memories.length,
    opportunities,
    briefing:
      opportunities.length > 0
        ? `${opportunities.length} collaboration opportunities identified`
        : "All projects on track",
  };
}

// =============================================================================
// MCP SERVER SETUP
// =============================================================================

const server = new Server(
  {
    name: "alex-ai",
    version: "1.0.0",
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
          "Chat with the Alex AI crew system. Ask questions to specific crew members or get general assistance.",
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
        name: "alex_ai_coordinate",
        description:
          "Have Commander Riker analyze all projects and provide a coordination briefing with collaboration opportunities.",
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
          "Convene the senior staff in the Observation Lounge for collaborative discussion on a topic.",
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

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
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
        const response = generateCrewResponse(crewId, args.message);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case "alex_ai_coordinate": {
        const plan = await generateCoordinationPlan();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(plan, null, 2),
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

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  count: memories.length,
                  memories: memories.slice(0, 20),
                },
                null,
                2
              ),
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
              text: JSON.stringify(
                {
                  success: true,
                  memory,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "alex_ai_projects": {
        let projects = await loadProjects();

        if (args.status) {
          projects = projects.filter((p) => p.status === args.status);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  count: projects.length,
                  projects: projects.map((p) => ({
                    id: p.id,
                    name: p.name,
                    status: p.status,
                    progress: p.progress,
                    domains: p.domains?.length || 0,
                  })),
                },
                null,
                2
              ),
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
                text: JSON.stringify(
                  {
                    success: true,
                    title: args.title,
                    deployed: args.deploy || false,
                    output: stdout,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: false,
                    error: error.message,
                    stderr: error.stderr,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }

      case "alex_ai_observation_lounge": {
        const attendees = [
          "captain_picard",
          "commander_riker",
          "commander_data",
          "geordi_la_forge",
          "counselor_troi",
          "lieutenant_worf",
        ];

        const session = {
          id: `obs_${Date.now()}`,
          topic: args.topic,
          urgency: args.urgency || "normal",
          timestamp: new Date().toISOString(),
          attendees: attendees.map((id) => ({
            id,
            name: CREW_MEMBERS[id].name,
            icon: CREW_MEMBERS[id].icon,
            expertise: CREW_MEMBERS[id].expertise,
          })),
          discussionOrder: getDiscussionOrder(args.topic),
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(session, null, 2),
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
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

function getDiscussionOrder(topic) {
  const topicLower = topic.toLowerCase();

  if (topicLower.includes("security") || topicLower.includes("risk")) {
    return ["lieutenant_worf", "commander_data", "geordi_la_forge", "captain_picard"];
  }

  if (topicLower.includes("infrastructure") || topicLower.includes("deploy")) {
    return ["geordi_la_forge", "commander_data", "chief_obrien", "captain_picard"];
  }

  if (topicLower.includes("user") || topicLower.includes("ux")) {
    return ["counselor_troi", "commander_riker", "captain_picard"];
  }

  if (topicLower.includes("cost") || topicLower.includes("business")) {
    return ["quark", "commander_riker", "captain_picard"];
  }

  return ["commander_data", "geordi_la_forge", "commander_riker", "captain_picard"];
}

// =============================================================================
// PROMPTS
// =============================================================================

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "alex_ai_crew_context",
        description: "Get the full Alex AI crew context for the current session",
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
      `- ${crew.icon} **${crew.name}** (${crew.title}): ${crew.expertise.join(", ")}`
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

You are now operating with the Alex AI crew system. Respond with the personality and expertise of the relevant crew members.`,
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

Please respond in character as ${crew.name}.`,
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
  console.error("Alex AI MCP Server running on stdio");
}

main().catch(console.error);
