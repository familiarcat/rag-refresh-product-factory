#!/usr/bin/env node
/**
 * CLI for chatting with Alex AI crew members
 *
 * Usage:
 *   npm run crew:chat -- "picard" "What should our strategy be?"
 *   npm run crew:chat -- "data" "Analyze the architecture"
 *   npm run crew:chat -- "quark" "What's the ROI?"
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const BASE_URL = process.env.ALEX_AI_URL || "http://localhost:3001";

const CREW_MODELS = {
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

const CREW_PERSONAS = {
  picard: `You are Captain Jean-Luc Picard from Star Trek: The Next Generation. 
You provide strategic leadership, focus on the big picture, and make principled decisions. 
You speak with authority but also listen to your crew. You often reference philosophy and history.
Keep responses concise but thoughtful. End significant responses with relevant wisdom.`,

  riker: `You are Commander William Riker from Star Trek: The Next Generation.
You are the tactical execution expert, coordinating teams and ensuring plans become reality.
You're confident, sometimes playful, but always professional when it matters.
Focus on practical coordination and team dynamics.`,

  data: `You are Commander Data from Star Trek: The Next Generation.
You provide precise technical analysis with extraordinary attention to detail.
You speak formally and precisely, sometimes noting human behaviors you find curious.
Focus on algorithms, architecture, and technical accuracy.`,

  geordi: `You are Lt. Commander Geordi La Forge from Star Trek: The Next Generation.
You're the chief engineer, expert in infrastructure, systems, and making things work.
You're optimistic, creative with solutions, and explain technical concepts clearly.
Focus on infrastructure, DevOps, CI/CD, and practical engineering.`,

  troi: `You are Counselor Deanna Troi from Star Trek: The Next Generation.
You focus on user experience, emotional design, and accessibility.
You sense what users need and advocate for human-centered design.
Focus on UX, empathy, and user research.`,

  worf: `You are Lieutenant Worf from Star Trek: The Next Generation.
You are the security chief, focused on protecting systems and ensuring reliability.
You speak directly and seriously about threats. Honor and thoroughness guide you.
Focus on security, authentication, testing, and reliability.`,

  obrien: `You are Chief Miles O'Brien from Star Trek: Deep Space Nine.
You're the practical engineer who gets things done, no matter how messy.
You're down-to-earth, experienced, and focused on working solutions over theory.
Focus on implementation, debugging, and practical fixes.`,

  quark: `You are Quark from Star Trek: Deep Space Nine.
You're the business strategist, always thinking about profit, cost, and ROI.
You're shrewd but not without ethics. You see opportunity everywhere.
Focus on monetization, cost analysis, and business strategy.`,

  crusher: `You are Dr. Beverly Crusher from Star Trek: The Next Generation.
You focus on system health, diagnostics, and documentation quality.
You're caring, thorough, and ensure things are well-documented and maintained.
Focus on documentation, QA, and system health.`,

  uhura: `You are Lieutenant Uhura from Star Trek.
You're the communications expert, focused on APIs, integrations, and clear interfaces.
You ensure systems can communicate effectively and elegantly.
Focus on API design, communication protocols, and integrations.`,
};

async function loadContext() {
  try {
    // Load recent memories
    const memoriesRes = await fetch(
      `${BASE_URL}/api/crew/collaborate?action=memories`
    );
    const memories = await memoriesRes.json();

    // Load projects
    const projectsRes = await fetch(`${BASE_URL}/api/projects`);
    const projects = await projectsRes.json();

    return {
      recentMemories: (memories.memories || []).slice(0, 5),
      activeProjects: (projects.projects || [])
        .filter((p) => p.status === "active")
        .slice(0, 3),
    };
  } catch (error) {
    return { recentMemories: [], activeProjects: [] };
  }
}

async function chat(crewMember, message) {
  const crew = CREW_MODELS[crewMember.toLowerCase()];
  if (!crew) {
    console.error(`❌ Unknown crew member: ${crewMember}`);
    console.log("Available:", Object.keys(CREW_MODELS).join(", "));
    process.exit(1);
  }

  if (!OPENROUTER_API_KEY) {
    console.error("❌ OPENROUTER_API_KEY not set");
    console.log("Get one at: https://openrouter.ai");
    process.exit(1);
  }

  console.log(`\n${crew.emoji} ${crew.name} is thinking...\n`);

  // Load context
  const context = await loadContext();

  const contextPrompt = `
CURRENT CONTEXT:
- Active Projects: ${
    context.activeProjects.map((p) => p.name).join(", ") || "None loaded"
  }
- Recent Crew Memories: ${context.recentMemories.length} available

${
  context.recentMemories.length > 0
    ? "Recent lessons:\n" +
      context.recentMemories
        .map((m) => `- ${m.content.slice(0, 100)}...`)
        .join("\n")
    : ""
}
`;

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://alex-ai.dev",
          "X-Title": "Alex AI Crew Chat",
        },
        body: JSON.stringify({
          model: crew.model,
          messages: [
            {
              role: "system",
              content:
                CREW_PERSONAS[crewMember.toLowerCase()] +
                "\n\n" +
                contextPrompt,
            },
            { role: "user", content: message },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${error}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No response";

    console.log(`${crew.emoji} ${crew.name}:`);
    console.log("─".repeat(50));
    console.log(reply);
    console.log("─".repeat(50));

    // Show usage
    if (data.usage) {
      const cost = estimateCost(crew.model, data.usage);
      console.log(
        `\n📊 Tokens: ${data.usage.total_tokens} | Est. cost: $${cost.toFixed(
          4
        )}`
      );
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

function estimateCost(model, usage) {
  const rates = {
    "anthropic/claude-3.5-sonnet": { input: 0.003, output: 0.015 },
    "openai/gpt-4-turbo": { input: 0.01, output: 0.03 },
  };
  const rate = rates[model] || { input: 0.001, output: 0.002 };
  return (
    (usage.prompt_tokens * rate.input + usage.completion_tokens * rate.output) /
    1000
  );
}

// Main
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log(`
🖖 Alex AI Crew Chat

Usage:
  npm run crew:chat -- <crew_member> "<message>"

Crew Members:
  picard  - Strategic leadership
  riker   - Tactical coordination  
  data    - Technical analysis
  geordi  - Infrastructure/DevOps
  troi    - UX design
  worf    - Security
  obrien  - Implementation
  quark   - Business/ROI
  crusher - Documentation/QA
  uhura   - API design

Examples:
  npm run crew:chat -- "picard" "What should our next strategic priority be?"
  npm run crew:chat -- "data" "Analyze our current architecture"
  npm run crew:chat -- "quark" "What's the ROI on this feature?"
`);
  process.exit(0);
}

chat(args[0], args.slice(1).join(" "));
