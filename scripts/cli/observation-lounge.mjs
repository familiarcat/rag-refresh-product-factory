#!/usr/bin/env node
/**
 * CLI for convening the Observation Lounge (senior staff meeting)
 *
 * Usage:
 *   npm run crew:lounge -- "topic" "urgency"
 *   npm run crew:lounge -- "Should we refactor the API?" "high"
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const BASE_URL = process.env.ALEX_AI_URL || "http://localhost:3001";

const SENIOR_STAFF = [
  {
    id: "picard",
    name: "Captain Picard",
    model: "anthropic/claude-3.5-sonnet",
    emoji: "🎖️",
    role: "Strategic Decision",
  },
  {
    id: "riker",
    name: "Commander Riker",
    model: "anthropic/claude-3.5-sonnet",
    emoji: "⚡",
    role: "Tactical Assessment",
  },
  {
    id: "data",
    name: "Commander Data",
    model: "openai/gpt-4-turbo",
    emoji: "🤖",
    role: "Technical Analysis",
  },
  {
    id: "geordi",
    name: "Lt. Cmdr. La Forge",
    model: "anthropic/claude-3.5-sonnet",
    emoji: "🔧",
    role: "Engineering Feasibility",
  },
  {
    id: "troi",
    name: "Counselor Troi",
    model: "anthropic/claude-3.5-sonnet",
    emoji: "💭",
    role: "User Impact",
  },
  {
    id: "worf",
    name: "Lt. Worf",
    model: "openai/gpt-4-turbo",
    emoji: "⚔️",
    role: "Security Concerns",
  },
];

const PERSONAS = {
  picard:
    "You are Captain Picard. Give strategic direction and make the final recommendation. Be decisive but thoughtful.",
  riker:
    "You are Commander Riker. Assess tactical implications and coordination needs. Be practical and action-oriented.",
  data: "You are Commander Data. Provide precise technical analysis. Be thorough but concise.",
  geordi:
    "You are Lt. Cmdr. La Forge. Assess engineering feasibility and infrastructure implications.",
  troi: "You are Counselor Troi. Consider user experience and team morale implications.",
  worf: "You are Lt. Worf. Identify security risks and reliability concerns. Be direct.",
};

async function loadContext() {
  try {
    const memoriesRes = await fetch(
      `${BASE_URL}/api/crew/collaborate?action=memories`
    );
    const memories = await memoriesRes.json();
    return { recentMemories: (memories.memories || []).slice(0, 5) };
  } catch {
    return { recentMemories: [] };
  }
}

async function getCrewResponse(crew, topic, previousResponses, context) {
  const previousContext =
    previousResponses.length > 0
      ? "\n\nPrevious responses in this meeting:\n" +
        previousResponses.map((r) => `${r.name}: ${r.response}`).join("\n\n")
      : "";

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: crew.model,
        messages: [
          {
            role: "system",
            content: `${
              PERSONAS[crew.id]
            }\n\nYou are in a senior staff meeting discussing: "${topic}"\n\nKeep your response to 2-3 sentences focused on your area of expertise.${previousContext}`,
          },
          {
            role: "user",
            content: `Topic: ${topic}\n\nProvide your perspective on this topic.`,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    }
  );

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "No response";
}

async function conveneLounge(topic, urgency = "normal") {
  if (!OPENROUTER_API_KEY) {
    console.error("❌ OPENROUTER_API_KEY not set");
    process.exit(1);
  }

  console.log(`
╔════════════════════════════════════════════════════════════╗
║                    OBSERVATION LOUNGE                       ║
║                   Senior Staff Meeting                      ║
╚════════════════════════════════════════════════════════════╝

📋 Topic: ${topic}
⚠️  Urgency: ${urgency.toUpperCase()}

Convening senior staff...
`);

  const context = await loadContext();
  const responses = [];
  let totalCost = 0;

  for (const crew of SENIOR_STAFF) {
    process.stdout.write(`${crew.emoji} ${crew.name} (${crew.role})... `);

    try {
      const response = await getCrewResponse(crew, topic, responses, context);
      responses.push({ id: crew.id, name: crew.name, response });
      console.log("✓");

      // Estimate cost (rough)
      totalCost += 0.002;
    } catch (error) {
      console.log(`✗ (${error.message})`);
    }
  }

  // Display responses
  console.log("\n" + "═".repeat(60) + "\n");

  for (const { name, response } of responses) {
    const crew = SENIOR_STAFF.find((c) => c.name === name);
    console.log(`${crew?.emoji || "👤"} ${name}:`);
    console.log(`   ${response}`);
    console.log();
  }

  console.log("═".repeat(60));
  console.log(`\n📊 Meeting cost: ~$${totalCost.toFixed(3)}`);
  console.log('🖖 "Make it so." — Captain Picard\n');
}

const args = process.argv.slice(2);
if (args.length < 1) {
  console.log(`
🖖 Alex AI Observation Lounge

Usage:
  npm run crew:lounge -- "topic" [urgency]

Urgency levels: low, normal, high, critical

Examples:
  npm run crew:lounge -- "Should we refactor the database layer?"
  npm run crew:lounge -- "How should we approach the new AI feature?" "high"
  npm run crew:lounge -- "Security incident detected" "critical"
`);
  process.exit(0);
}

conveneLounge(args[0], args[1] || "normal");
