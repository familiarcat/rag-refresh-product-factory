#!/usr/bin/env node
/**
 * CLI for checking sprint status
 *
 * Usage:
 *   npm run sprint:status
 *   npm run sprint:status -- proj_1765948227414_iw68yf
 */

const BASE_URL = process.env.ALEX_AI_URL || "http://localhost:3001";
const DEFAULT_PROJECT = "proj_1765948227414_iw68yf"; // AI Writing Assistant

async function getSprintStatus(projectId) {
  try {
    const res = await fetch(`${BASE_URL}/api/sprints?projectId=${projectId}`);
    const data = await res.json();

    if (!data.sprints || data.sprints.length === 0) {
      console.log("📋 No sprints found for this project");
      return;
    }

    const sprint = data.sprints[0];
    const statusEmoji = {
      planning: "📋",
      active: "🏃",
      review: "👀",
      completed: "✅",
    };

    console.log(`
${statusEmoji[sprint.status] || "📦"} ${
      sprint.name
    } - ${sprint.status.toUpperCase()}
${"═".repeat(50)}

📎 Sprint ID: ${sprint.id}
🎯 Goal: ${sprint.goal.slice(0, 80)}...

📊 Progress
   Committed: ${sprint.committedPoints} points
   Completed: ${sprint.completedPoints} points
   Progress:  ${
     sprint.committedPoints > 0
       ? Math.round((sprint.completedPoints / sprint.committedPoints) * 100)
       : 0
   }%

📋 Stories by Status
`);

    const statusGroups = {};
    for (const story of sprint.stories) {
      statusGroups[story.status] = (statusGroups[story.status] || 0) + 1;
    }

    const statusOrder = [
      "backlog",
      "todo",
      "in_progress",
      "review",
      "done",
      "blocked",
    ];
    const statusIcons = {
      backlog: "📋",
      todo: "📝",
      in_progress: "🚀",
      review: "👀",
      done: "✅",
      blocked: "🚫",
    };

    for (const status of statusOrder) {
      if (statusGroups[status]) {
        const bar =
          "█".repeat(statusGroups[status]) +
          "░".repeat(Math.max(0, 10 - statusGroups[status]));
        console.log(
          `   ${statusIcons[status]} ${status.padEnd(12)} ${bar} ${
            statusGroups[status]
          }`
        );
      }
    }

    console.log(`
💰 Budget
   Budgeted: $${(sprint.budgetedCost || 0).toLocaleString()}
   Actual:   $${(sprint.actualCost || 0).toLocaleString()}
   
👥 Active Crew: ${sprint.activeCrewMembers?.length || 0} members
${"═".repeat(50)}
`);

    // Quick actions
    if (sprint.status === "planning" && sprint.stories.length > 0) {
      console.log("💡 Ready to start! Run: npm run sprint:start");
    } else if (sprint.status === "active") {
      console.log("💡 Sprint active! Run: npm run sprint:cycle");
    } else if (sprint.status === "completed") {
      console.log("🎉 Sprint completed! Create a new sprint in the UI.");
    }

    if (statusGroups.blocked > 0) {
      console.log(
        `\n⚠️  ${statusGroups.blocked} stories blocked - human review needed!`
      );
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.log("\nMake sure the dev server is running: npm run dev");
    process.exit(1);
  }
}

const projectId = process.argv[2] || DEFAULT_PROJECT;
getSprintStatus(projectId);


