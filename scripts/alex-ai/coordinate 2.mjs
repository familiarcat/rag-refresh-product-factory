#!/usr/bin/env node

/**
 * Alex AI Riker Coordination Script
 *
 * Runs Commander Riker's coordination analysis on all projects.
 */

import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, "../..");

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

async function loadMemories() {
  const memoriesPath = path.join(ROOT_DIR, "data", "crew_memories.json");
  try {
    const content = await readFile(memoriesPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

function analyzeProject(project) {
  const opportunities = [];

  // Find domains needing help
  for (const domain of project.domains || []) {
    if (domain.status === "in-progress" && domain.progress < 50) {
      opportunities.push({
        type: "acceleration",
        project: project.name,
        domain: domain.name,
        progress: domain.progress,
        priority: domain.progress < 25 ? "high" : "medium",
      });
    }
  }

  return opportunities;
}

function suggestTeam(opportunity) {
  const teams = {
    ai: ["commander_data", "geordi_la_forge"],
    infrastructure: ["geordi_la_forge", "chief_obrien"],
    ux: ["counselor_troi", "lieutenant_uhura"],
    security: ["lieutenant_worf", "commander_data"],
    business: ["quark", "commander_riker"],
  };

  // Default team
  return ["commander_data", "geordi_la_forge", "counselor_troi"];
}

async function main() {
  const projects = await loadProjects();
  const memories = await loadMemories();
  const activeProjects = projects.filter((p) => p.status === "active");

  console.log("\n");
  console.log(
    "╔═══════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║                                                               ║"
  );
  console.log(
    "║   ⚡  COMMANDER RIKER - COORDINATION BRIEFING                 ║"
  );
  console.log(
    "║                                                               ║"
  );
  console.log(
    "╚═══════════════════════════════════════════════════════════════╝"
  );
  console.log("\n");

  // Analyze projects
  const allOpportunities = [];
  for (const project of activeProjects) {
    const opps = analyzeProject(project);
    allOpportunities.push(...opps);
  }

  // Sort by priority
  allOpportunities.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Display status
  console.log("📊 STATUS REPORT");
  console.log("─".repeat(60));
  console.log(`  Active Projects:     ${activeProjects.length}`);
  console.log(`  Opportunities Found: ${allOpportunities.length}`);
  console.log(`  RAG Memories:        ${memories.length}`);
  console.log("─".repeat(60));
  console.log("\n");

  // Display opportunities
  if (allOpportunities.length > 0) {
    console.log("🎯 COLLABORATION OPPORTUNITIES");
    console.log("─".repeat(60));

    for (const opp of allOpportunities.slice(0, 5)) {
      const priorityIcon = opp.priority === "high" ? "🔴" : "🟡";
      const team = suggestTeam(opp);

      console.log(`\n  ${priorityIcon} ${opp.project} → ${opp.domain}`);
      console.log(
        `     Progress: ${
          opp.progress
        }% | Priority: ${opp.priority.toUpperCase()}`
      );
      console.log(`     Suggested Team: ${team.join(", ")}`);
    }

    console.log("\n" + "─".repeat(60));
  } else {
    console.log(
      "✅ All projects are on track. No immediate interventions needed.\n"
    );
  }

  // Recommendations
  console.log("\n💡 RECOMMENDATIONS");
  console.log("─".repeat(60));

  if (allOpportunities.filter((o) => o.priority === "high").length > 0) {
    console.log("  ⚠️  High-priority domains need immediate attention");
    console.log("  → Run: npm run alex-ai:coordinate to view details");
    console.log("  → Or visit: /observation-lounge in the web UI");
  } else {
    console.log("  ✅ Continue current trajectory");
    console.log("  → Consider cross-project knowledge sharing");
  }

  console.log("─".repeat(60));
  console.log("\n");

  console.log('"Number One, make it so." — Captain Picard\n');
}

main().catch(console.error);



