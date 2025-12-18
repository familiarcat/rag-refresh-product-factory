#!/usr/bin/env node
/**
 * CLI for running a single sprint automation cycle
 *
 * Usage:
 *   npm run sprint:cycle
 *   npm run sprint:cycle -- sprint_id
 */

const BASE_URL = process.env.ALEX_AI_URL || "http://localhost:3001";
const DEFAULT_PROJECT = "proj_1765948227414_iw68yf";

async function runCycle(sprintId) {
  // If no sprint ID provided, find the active sprint
  if (!sprintId) {
    const res = await fetch(
      `${BASE_URL}/api/sprints?projectId=${DEFAULT_PROJECT}`
    );
    const data = await res.json();
    const activeSprint = data.sprints?.find((s) => s.status === "active");

    if (!activeSprint) {
      console.log("❌ No active sprint found");
      console.log("Start a sprint first: npm run sprint:start");
      process.exit(1);
    }

    sprintId = activeSprint.id;
  }

  console.log("🤖 Running automation cycle...\n");

  try {
    const res = await fetch(`${BASE_URL}/api/sprints/auto-execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "run-cycle",
        sprintId,
      }),
    });

    const data = await res.json();

    if (data.ok) {
      // Show cycle results
      console.log("📋 Cycle Results:");
      console.log("─".repeat(50));

      for (const result of data.cycleResults || []) {
        const emoji =
          result.newStatus === "done"
            ? "✅"
            : result.newStatus === "blocked"
            ? "🚫"
            : result.newStatus === "review"
            ? "👀"
            : result.newStatus === "in_progress"
            ? "🚀"
            : "📝";
        console.log(`${emoji} ${result.title.slice(0, 45)}...`);
        console.log(`   ${result.action}`);
      }

      console.log("─".repeat(50));
      console.log(`\n📊 Summary:`);
      console.log(`   Done:        ${data.summary.done}/${data.summary.total}`);
      console.log(`   In Progress: ${data.summary.inProgress}`);
      console.log(`   Review:      ${data.summary.review}`);
      console.log(`   Blocked:     ${data.summary.blocked}`);

      if (data.sprintComplete) {
        console.log("\n🎉 SPRINT COMPLETE! All stories done.");
      } else if (data.summary.blocked > 0) {
        console.log(
          `\n⚠️  ${data.summary.blocked} stories blocked - human review needed!`
        );
        console.log("   Open the UI to review and unblock.");
      } else {
        console.log("\n💡 Run another cycle: npm run sprint:cycle");
      }
    } else {
      console.error(`❌ Error: ${data.error}`);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

runCycle(process.argv[2]);
