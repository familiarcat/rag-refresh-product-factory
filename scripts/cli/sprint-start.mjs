#!/usr/bin/env node
/**
 * CLI for starting a sprint
 *
 * Usage:
 *   npm run sprint:start
 *   npm run sprint:start -- sprint_id
 */

const BASE_URL = process.env.ALEX_AI_URL || "http://localhost:3001";
const DEFAULT_PROJECT = "proj_1765948227414_iw68yf";

async function startSprint(sprintId) {
  // If no sprint ID provided, find the active planning sprint
  if (!sprintId) {
    const res = await fetch(
      `${BASE_URL}/api/sprints?projectId=${DEFAULT_PROJECT}`
    );
    const data = await res.json();
    const planningSprint = data.sprints?.find((s) => s.status === "planning");

    if (!planningSprint) {
      console.log("❌ No sprint in planning status found");
      console.log("Create a new sprint in the UI first.");
      process.exit(1);
    }

    sprintId = planningSprint.id;
    console.log(`📋 Found sprint: ${planningSprint.name}`);
  }

  console.log("\n🚀 Starting sprint...\n");

  try {
    const res = await fetch(`${BASE_URL}/api/sprints/auto-execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "start-sprint",
        sprintId,
      }),
    });

    const data = await res.json();

    if (data.ok) {
      console.log(`✅ Sprint started!`);
      console.log(`   Status: ${data.sprint.status}`);
      console.log(`   Stories activated: ${data.storiesActivated}`);
      console.log(`\n💡 Run automation cycles with: npm run sprint:cycle`);
    } else {
      console.error(`❌ Error: ${data.error}`);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

startSprint(process.argv[2]);
