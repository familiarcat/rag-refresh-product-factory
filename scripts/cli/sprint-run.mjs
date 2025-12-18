#!/usr/bin/env node
/**
 * CLI for running sprint automation until completion
 *
 * Usage:
 *   npm run sprint:run
 *   npm run sprint:run -- sprint_id
 */

const BASE_URL = process.env.ALEX_AI_URL || "http://localhost:3001";
const DEFAULT_PROJECT = "proj_1765948227414_iw68yf";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runToCompletion(sprintId) {
  // If no sprint ID provided, find the active sprint
  if (!sprintId) {
    const res = await fetch(
      `${BASE_URL}/api/sprints?projectId=${DEFAULT_PROJECT}`
    );
    const data = await res.json();
    const activeSprint = data.sprints?.find(
      (s) => s.status === "active" || s.status === "planning"
    );

    if (!activeSprint) {
      console.log("❌ No active or planning sprint found");
      process.exit(1);
    }

    sprintId = activeSprint.id;

    // Start if in planning
    if (activeSprint.status === "planning") {
      console.log("📋 Sprint in planning - starting first...\n");
      await fetch(`${BASE_URL}/api/sprints/auto-execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start-sprint", sprintId }),
      });
    }
  }

  console.log("🤖 Running sprint automation...\n");
  console.log("═".repeat(50));

  let cycle = 1;
  let complete = false;
  let blocked = 0;

  while (!complete && cycle <= 20) {
    console.log(`\n🔄 Cycle ${cycle}`);

    try {
      const res = await fetch(`${BASE_URL}/api/sprints/auto-execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run-cycle", sprintId }),
      });

      const data = await res.json();

      if (!data.ok) {
        console.error(`❌ Error: ${data.error}`);
        break;
      }

      // Show progress
      const { summary } = data;
      const progress =
        summary.total > 0
          ? Math.round((summary.done / summary.total) * 100)
          : 0;

      const progressBar =
        "█".repeat(Math.floor(progress / 5)) +
        "░".repeat(20 - Math.floor(progress / 5));

      console.log(`   [${progressBar}] ${progress}%`);
      console.log(
        `   ✅ ${summary.done} done | 🚀 ${summary.inProgress} in progress | 👀 ${summary.review} review | 🚫 ${summary.blocked} blocked`
      );

      // Show completed stories this cycle
      const completed =
        data.cycleResults?.filter((r) => r.newStatus === "done") || [];
      for (const story of completed) {
        console.log(`   ✅ Completed: ${story.title.slice(0, 40)}...`);
      }

      complete = data.sprintComplete;
      blocked = summary.blocked;

      if (blocked > 0) {
        console.log(`\n⚠️  ${blocked} stories blocked - stopping automation`);
        break;
      }

      cycle++;
      await sleep(1000); // Brief pause between cycles
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      break;
    }
  }

  console.log("\n" + "═".repeat(50));

  if (complete) {
    console.log("\n🎉 SPRINT COMPLETE!");
    console.log("All stories have been completed by the crew.");
  } else if (blocked > 0) {
    console.log(`\n⚠️  Sprint paused - ${blocked} stories need human review`);
    console.log("Open the UI to review and unblock stories.");
  } else if (cycle > 20) {
    console.log("\n⏱️  Max cycles reached. Sprint still in progress.");
    console.log("Run again to continue: npm run sprint:run");
  }
}

runToCompletion(process.argv[2]);
