#!/usr/bin/env node

/**
 * Alex AI Activation Script
 *
 * Activates the Alex AI crew system and displays status.
 * Can be run from VS Code tasks or command line.
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "../..");

const CREW_MEMBERS = [
  {
    id: "captain_picard",
    name: "Captain Picard",
    icon: "🎖️",
    role: "Strategic Leadership",
  },
  {
    id: "commander_riker",
    name: "Commander Riker",
    icon: "⚡",
    role: "Tactical Coordination",
  },
  {
    id: "commander_data",
    name: "Commander Data",
    icon: "🤖",
    role: "Technical Analysis",
  },
  {
    id: "geordi_la_forge",
    name: "Lt. Cmdr. La Forge",
    icon: "🔧",
    role: "Infrastructure",
  },
  {
    id: "counselor_troi",
    name: "Counselor Troi",
    icon: "💭",
    role: "UX Design",
  },
  { id: "lieutenant_worf", name: "Lt. Worf", icon: "⚔️", role: "Security" },
  { id: "dr_crusher", name: "Dr. Crusher", icon: "💊", role: "System Health" },
  {
    id: "chief_obrien",
    name: "Chief O'Brien",
    icon: "🛠️",
    role: "Implementation",
  },
  { id: "quark", name: "Quark", icon: "💰", role: "Business Strategy" },
  {
    id: "lieutenant_uhura",
    name: "Lt. Uhura",
    icon: "📻",
    role: "Communication",
  },
];

async function loadMemories() {
  const memoriesPath = path.join(ROOT_DIR, "data", "crew_memories.json");
  try {
    const content = await readFile(memoriesPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function loadProjects() {
  const projectsPath = path.join(ROOT_DIR, "data", "projects.json");
  try {
    const content = await readFile(projectsPath, "utf-8");
    const data = JSON.parse(content);
    return data.projects || [];
  } catch {
    return [];
  }
}

async function saveActivationState() {
  const stateDir = path.join(process.env.HOME || "~", ".alex-ai");
  const stateFile = path.join(stateDir, "activation-state.json");

  if (!existsSync(stateDir)) {
    await mkdir(stateDir, { recursive: true });
  }

  const state = {
    activated: true,
    timestamp: new Date().toISOString(),
    project: "rag-refresh-product-factory",
    crewMembers: CREW_MEMBERS.map((c) => c.id),
  };

  await writeFile(stateFile, JSON.stringify(state, null, 2));
  return state;
}

async function main() {
  console.log("\n");
  console.log(
    "╔═══════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║                                                               ║"
  );
  console.log(
    "║   🖖  ALEX AI CREW SYSTEM - ACTIVATED                         ║"
  );
  console.log(
    "║                                                               ║"
  );
  console.log(
    "╚═══════════════════════════════════════════════════════════════╝"
  );
  console.log("\n");

  // Load data
  const memories = await loadMemories();
  const projects = await loadProjects();
  const activeProjects = projects.filter((p) => p.status === "active");

  // Display crew roster
  console.log("👥 CREW ROSTER");
  console.log("─".repeat(60));
  for (const member of CREW_MEMBERS) {
    const memberMemories = memories.filter(
      (m) => m.crewId === member.id
    ).length;
    console.log(
      `  ${member.icon} ${member.name.padEnd(22)} │ ${member.role.padEnd(
        20
      )} │ ${memberMemories} memories`
    );
  }
  console.log("─".repeat(60));
  console.log(
    `  Total: ${CREW_MEMBERS.length} crew members | ${memories.length} memories loaded\n`
  );

  // Display project status
  console.log("📦 PROJECT STATUS");
  console.log("─".repeat(60));
  console.log(`  Active Projects: ${activeProjects.length}`);
  console.log(`  Total Projects:  ${projects.length}`);
  if (activeProjects.length > 0) {
    console.log("\n  Active:");
    for (const proj of activeProjects.slice(0, 5)) {
      console.log(`    • ${proj.name} (${proj.progress}%)`);
    }
  }
  console.log("─".repeat(60));
  console.log("\n");

  // Display available commands
  console.log("⚡ AVAILABLE COMMANDS");
  console.log("─".repeat(60));
  console.log("  npm run alex-ai:activate    │ Show this activation screen");
  console.log("  npm run alex-ai:memories    │ Display crew memories");
  console.log("  npm run alex-ai:coordinate  │ Run Riker coordination");
  console.log("  npm run milestone           │ Push milestone to RAG");
  console.log("  npm run milestone:deploy    │ Push milestone & deploy");
  console.log("  npm run deploy              │ Deploy to AWS");
  console.log("─".repeat(60));
  console.log("\n");

  // Display quick tips
  console.log("💡 QUICK TIPS");
  console.log("─".repeat(60));
  console.log("  • In Cursor: Rules are auto-loaded from .cursorrules");
  console.log('  • In VS Code: Use Cmd+Shift+P → "Tasks: Run Task"');
  console.log('  • Natural language: "make a milestone push and deploy"');
  console.log("  • Web UI: http://localhost:3000/observation-lounge");
  console.log("─".repeat(60));
  console.log("\n");

  // Save activation state
  await saveActivationState();

  console.log("✅ Alex AI is ready. The crew awaits your orders, Captain.\n");
  console.log('   "Make it so." — Captain Picard\n');
}

main().catch(console.error);
