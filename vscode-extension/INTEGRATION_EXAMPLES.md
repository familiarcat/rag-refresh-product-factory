/**
 * Example: How to integrate crew recommendations and plan execution
 * into your Alex AI chat interactions
 */

import { AlexAiService } from "./alexAiService";

/**
 * Example 1: Automatically save recommendations from crew analysis
 *
 * When a crew member provides analysis or recommendations,
 * save them to the file system for future reference
 */
async function exampleSaveRecommendation(alexAiService: AlexAiService) {
  // Get crew analysis
  const analysis = await alexAiService.chat(
    "data",
    "Review this database query for performance issues"
  );

  // Save the recommendation
  const filename = await alexAiService.saveRecommendation("data", {
    title: "Database Query Performance Review",
    content: analysis,
    context: "Performance analysis of user search endpoint",
    priority: "high",
    file: "src/api/users.ts",
    lineStart: 15,
    lineEnd: 30,
  });

  console.log(`✅ Recommendation saved: ${filename}`);
}

/**
 * Example 2: Create a coordinated execution plan
 *
 * Have the crew coordinate on a complex task and save the plan
 */
async function exampleCreateExecutionPlan(alexAiService: AlexAiService) {
  // Get Riker (coordinator) to create a plan
  const planDescription = await alexAiService.chat(
    "riker",
    `Create a plan to refactor our authentication system.
    We need to:
    1. Replace session-based auth with JWT
    2. Update database schema
    3. Migrate existing sessions
    4. Add security tests
    
    Coordinate with the appropriate crew members for each step.`
  );

  // Create the plan structure
  const plan = {
    name: "JWT Authentication Migration",
    description: planDescription,
    objectives: [
      "Replace session-based auth with JWT tokens",
      "Update database schema for token storage",
      "Migrate existing sessions to JWT format",
      "Implement security testing",
    ],
    steps: [
      {
        step: 1,
        task: "Review current authentication architecture",
        assignedTo: "picard",
        priority: "high" as const,
      },
      {
        step: 2,
        task: "Design JWT token schema and database changes",
        assignedTo: "data",
        priority: "high" as const,
      },
      {
        step: 3,
        task: "Implement JWT middleware and token generation",
        assignedTo: "geordi",
        priority: "high" as const,
      },
      {
        step: 4,
        task: "Add comprehensive security and unit tests",
        assignedTo: "worf",
        priority: "high" as const,
      },
      {
        step: 5,
        task: "Update API documentation and examples",
        assignedTo: "troi",
        priority: "medium" as const,
      },
      {
        step: 6,
        task: "Debug migration issues and edge cases",
        assignedTo: "obrien",
        priority: "high" as const,
      },
    ],
    estimatedTime: "1 week",
    files: [
      "src/auth/jwt.ts",
      "src/middleware/auth.ts",
      "migrations/add_jwt_tokens.sql",
      "tests/auth.test.ts",
    ],
  };

  const filename = await alexAiService.savePlan(plan);
  console.log(`✅ Plan saved: ${filename}`);
}

/**
 * Example 3: Execute a code recommendation
 *
 * Apply a crew member's code suggestion to your project
 */
async function exampleExecuteRecommendation(alexAiService: AlexAiService) {
  const success = await alexAiService.executeCodeRecommendation(
    "src/components/Button.tsx",
    // Old code
    `const Button = ({ onClick, children }) => (
  <button onClick={onClick}>{children}</button>
);`,
    // New code with accessibility improvements
    `const Button = ({ onClick, children, disabled = false, ariaLabel }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
  >
    {children}
  </button>
);`
  );

  if (success) {
    console.log("✅ Code change applied successfully");
  } else {
    console.log("❌ Code change failed - code pattern not found");
  }
}

/**
 * Example 4: Load and use crew memories
 *
 * Access shared insights that the crew has learned
 */
async function exampleUseCrewMemories(alexAiService: AlexAiService) {
  // Load crew memories
  const memories = await alexAiService.loadCrewMemories();

  console.log("📚 Crew Memories:", memories);

  // Update with new learnings
  const updatedMemories = {
    ...memories,
    codePatterns: {
      ...(memories.codePatterns || {}),
      buttonsNeedAccessibility: true,
      preferReactHooksOverClasses: true,
    },
    architectureDecisions: {
      ...(memories.architectureDecisions || {}),
      useJWTForAuth: true,
      migrateToNextJS: true,
    },
  };

  // Save updated memories
  await alexAiService.updateCrewMemories(updatedMemories);
  console.log("✅ Crew memories updated");
}

/**
 * Example 5: Query and display saved recommendations
 *
 * Retrieve and review crew recommendations from file system
 */
async function exampleViewRecommendations(alexAiService: AlexAiService) {
  // Get recent recommendations
  const recommendations = await alexAiService.getRecentRecommendations(10);

  console.log(
    `📋 Found ${recommendations.length} recent recommendations:\n`
  );

  for (const rec of recommendations) {
    console.log(`
🖖 ${rec.data.crewMember.toUpperCase()}
   Title: ${rec.data.title}
   File: ${rec.data.file || "N/A"}
   Priority: ${rec.data.priority || "normal"}
   Date: ${new Date(rec.data.timestamp).toLocaleString()}
   ---`);
  }
}

/**
 * Example 6: Retrieve and display execution plans
 *
 * View all saved execution plans and their status
 */
async function exampleViewPlans(alexAiService: AlexAiService) {
  // Get recent plans
  const plans = await alexAiService.getRecentPlans(5);

  console.log(`📋 Found ${plans.length} execution plans:\n`);

  for (const plan of plans) {
    console.log(`
📄 ${plan.data.name}
   Steps: ${plan.data.steps.length}
   Estimated Time: ${plan.data.estimatedTime || "Unknown"}
   Created: ${new Date(plan.data.timestamp).toLocaleString()}
   
   Objectives:`);

    for (const obj of plan.data.objectives) {
      console.log(`   - ${obj}`);
    }

    console.log("   ---");
  }
}

/**
 * Example 7: Automatic crew coordination workflow
 *
 * Complete workflow: analyze → recommend → plan → execute
 */
async function exampleCompleteWorkflow(
  alexAiService: AlexAiService,
  codeToReview: string
) {
  console.log("🖖 Starting crew coordination workflow...\n");

  // Step 1: Get crew analysis
  console.log("1️⃣  Getting crew analysis...");
  const dataAnalysis = await alexAiService.chat("data", codeToReview);
  const troiAnalysis = await alexAiService.chat("troi", codeToReview);

  // Step 2: Save individual recommendations
  console.log("2️⃣  Saving recommendations...");
  await alexAiService.saveRecommendation("data", {
    title: "Technical Analysis",
    content: dataAnalysis,
    priority: "high",
  });

  await alexAiService.saveRecommendation("troi", {
    title: "UX/Readability Review",
    content: troiAnalysis,
    priority: "medium",
  });

  // Step 3: Have Riker coordinate and create plan
  console.log("3️⃣  Creating coordinated plan...");
  const plan = {
    name: "Code Review and Improvements",
    description: "Coordinated response to code review",
    objectives: [
      "Address Data's technical concerns",
      "Implement Troi's UX improvements",
    ],
    steps: [
      {
        step: 1,
        task: "Implement Data's technical recommendations",
        assignedTo: "data",
        priority: "high" as const,
      },
      {
        step: 2,
        task: "Apply Troi's readability improvements",
        assignedTo: "troi",
        priority: "high" as const,
      },
      {
        step: 3,
        task: "Review and approve changes",
        assignedTo: "riker",
        priority: "high" as const,
      },
    ],
    estimatedTime: "2 hours",
  };

  await alexAiService.savePlan(plan);

  // Step 4: Display results
  console.log("\n✅ Workflow complete!\n");
  console.log("📊 Summary:");
  console.log("   - 2 recommendations saved");
  console.log("   - 1 execution plan created");
  console.log("   - Crew coordination logged");
}

/**
 * Example 8: Integration with VS Code extension commands
 *
 * These commands are available in the Command Palette
 */
const VSCodeCommands = {
  // Save a recommendation
  saveRecommendation: "alexAi.saveRecommendation",

  // Save an execution plan
  savePlan: "alexAi.savePlan",

  // Execute a code change from a recommendation
  executeRecommendation: "alexAi.executeRecommendation",

  // View all saved recommendations
  viewRecommendations: "alexAi.viewRecommendations",

  // View all saved plans
  viewPlans: "alexAi.viewPlans",

  // Export recommendations to markdown
  exportRecommendations: "alexAi.exportRecommendations",

  // Export plans to markdown
  exportPlans: "alexAi.exportPlans",
};

/**
 * Integration Notes:
 *
 * 1. The FileSystemManager handles all file I/O operations
 * 2. All files are stored with ISO timestamps for sorting/versioning
 * 3. Crew member profiles are loaded from crew-members/ directory
 * 4. Recommendations and plans use VS Code's workspace file system API
 * 5. Crew memories are shared across all crew members
 * 6. All operations include error handling and user feedback
 *
 * Usage in Chat:
 * - "@alex data, review this code and @save your recommendation"
 * - "@alex riker, create a plan to implement these changes"
 * - "@alex execute step 1: apply data's optimization"
 */

export {
  exampleSaveRecommendation,
  exampleCreateExecutionPlan,
  exampleExecuteRecommendation,
  exampleUseCrewMemories,
  exampleViewRecommendations,
  exampleViewPlans,
  exampleCompleteWorkflow,
  VSCodeCommands,
};
