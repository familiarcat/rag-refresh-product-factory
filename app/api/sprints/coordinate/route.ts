import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import {
  Sprint,
  Story,
  createTask,
  estimateStoryCost,
  calculateSprintROI,
} from "../../../../lib/sprints";
import {
  crewRoster,
  findOptimalTeam,
  getCrewMember,
} from "../../../../lib/alex-ai/crew/collaboration-engine";

const SPRINTS_FILE = path.join(process.cwd(), "data/sprints.json");
const MEMORIES_FILE = path.join(process.cwd(), "data/crew_memories.json");

interface SprintsData {
  sprints: Sprint[];
  meta: { version: string; createdAt: string; description: string };
}

interface Memory {
  id: string;
  crewId: string;
  content: string;
  type: string;
  projectContext?: string;
  createdAt: string;
}

async function loadSprints(): Promise<SprintsData> {
  try {
    const data = await fs.readFile(SPRINTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return {
      sprints: [],
      meta: {
        version: "1.0",
        createdAt: new Date().toISOString(),
        description: "",
      },
    };
  }
}

async function saveSprints(data: SprintsData): Promise<void> {
  await fs.writeFile(SPRINTS_FILE, JSON.stringify(data, null, 2));
}

async function loadMemories(): Promise<Memory[]> {
  try {
    const data = await fs.readFile(MEMORIES_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveMemories(memories: Memory[]): Promise<void> {
  await fs.writeFile(MEMORIES_FILE, JSON.stringify(memories, null, 2));
}

/**
 * POST /api/sprints/coordinate
 *
 * Actions:
 * - assign-crew: Riker assigns optimal crew to story
 * - generate-tasks: Riker breaks story into tasks
 * - estimate-cost: Quark estimates story cost
 * - calculate-roi: Quark calculates sprint ROI
 * - apply-memories: Find relevant crew memories for story
 * - save-lesson: Save lesson learned as new memory
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { action, sprintId, storyId, ...payload } = body;

  const sprintsData = await loadSprints();
  const sprint = sprintsData.sprints.find((s) => s.id === sprintId);

  if (!sprint && action !== "calculate-roi") {
    return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
  }

  const storyIndex = sprint?.stories.findIndex((s) => s.id === storyId) ?? -1;
  const story = storyIndex >= 0 ? sprint!.stories[storyIndex] : null;

  switch (action) {
    case "assign-crew": {
      // Riker's optimal crew assignment
      if (!story) {
        return NextResponse.json({ error: "Story not found" }, { status: 404 });
      }

      // Infer required skills from story
      const requiredSkills = inferSkillsFromStory(story);

      // Find optimal team using Riker's algorithm
      const taskType:
        | "development"
        | "review"
        | "planning"
        | "optimization"
        | "research" =
        story.type === "feature"
          ? "development"
          : story.type === "bug"
          ? "development"
          : story.type === "spike"
          ? "research"
          : "optimization";

      const task = {
        id: story.id,
        projectId: sprint!.projectId,
        domainSlug: story.domainSlug || "general",
        taskType,
        description: story.title,
        requiredSkills,
        estimatedHours: story.estimatedHours || story.storyPoints * 4,
        priority: story.priority,
        status: "pending" as const,
      };

      const { team, pairs } = findOptimalTeam(task, payload.teamSize || 3);

      // Update story with crew assignment
      story.assignedCrew = team.map((member) => ({
        memberId: member.id,
        role: member.specializations[0] || "contributor",
        assignment: `${story.title} - ${member.specializations.join(", ")}`,
      }));
      story.leadCrew = team[0]?.id || "";

      // Auto-estimate cost
      story.estimatedCost = estimateStoryCost(
        story.storyPoints,
        team.map((m) => m.id),
        story.priority === "critical" ? "high" : "medium"
      );

      sprint!.stories[storyIndex] = story;
      sprint!.updatedAt = new Date().toISOString();
      await saveSprints(sprintsData);

      // Riker's briefing
      const rikerNotes = generateRikerBriefing(story, team, pairs);

      return NextResponse.json({
        ok: true,
        story,
        team: team.map((m) => ({
          id: m.id,
          name: m.name,
          role: m.specializations[0],
          specializations: m.specializations,
        })),
        pairs: pairs.map((p) => ({
          leadId: p.leadId,
          supportId: p.supportId,
          synergy: p.synergy,
          reasoning: p.reasoning,
        })),
        rikerNotes,
      });
    }

    case "generate-tasks": {
      // Riker breaks down story into crew-assigned tasks
      if (!story) {
        return NextResponse.json({ error: "Story not found" }, { status: 404 });
      }

      const tasks = generateTaskBreakdown(story);

      story.tasks = tasks;
      sprint!.stories[storyIndex] = story;
      sprint!.updatedAt = new Date().toISOString();
      await saveSprints(sprintsData);

      return NextResponse.json({
        ok: true,
        tasks,
        story,
        rikerNotes: `Tasks generated for "${story.title}". ${tasks.length} subtasks assigned to crew members based on their expertise.`,
      });
    }

    case "estimate-cost": {
      // Quark's cost estimation
      if (!story) {
        return NextResponse.json({ error: "Story not found" }, { status: 404 });
      }

      const crewIds = story.assignedCrew.map(
        (c) => c.memberId || c.crewMemberId || ""
      );
      const complexity =
        story.priority === "critical" || story.priority === "high"
          ? "high"
          : story.type === "spike"
          ? "low"
          : "medium";

      const estimatedCost = estimateStoryCost(
        story.storyPoints,
        crewIds,
        complexity
      );

      // Quark's analysis
      const quarkAnalysis = generateQuarkAnalysis(story, estimatedCost);

      story.estimatedCost = estimatedCost;
      sprint!.stories[storyIndex] = story;
      sprint!.updatedAt = new Date().toISOString();
      await saveSprints(sprintsData);

      return NextResponse.json({
        ok: true,
        estimatedCost,
        breakdown: {
          baseRate: 150,
          storyPoints: story.storyPoints,
          crewSize: crewIds.length,
          complexity,
        },
        quarkAnalysis,
      });
    }

    case "calculate-roi": {
      // Quark's ROI calculation for sprint
      const { projectedRevenue } = payload;

      if (!sprint) {
        return NextResponse.json(
          { error: "Sprint not found" },
          { status: 404 }
        );
      }

      const totalCost =
        sprint.budgetedCost ||
        sprint.stories.reduce((sum, s) => sum + (s.estimatedCost || 0), 0);

      sprint.budgetedCost = totalCost;
      const { roi, breakeven, recommendation } = calculateSprintROI(
        sprint,
        projectedRevenue || 0
      );

      sprint.projectedROI = roi;
      sprint.updatedAt = new Date().toISOString();
      await saveSprints(sprintsData);

      return NextResponse.json({
        ok: true,
        roi,
        breakeven,
        totalCost,
        projectedRevenue,
        recommendation,
        quarkWisdom: getQuarkWisdom(roi),
      });
    }

    case "apply-memories": {
      // Find relevant crew memories for story
      if (!story) {
        return NextResponse.json({ error: "Story not found" }, { status: 404 });
      }

      const memories = await loadMemories();
      const relevantMemories = findRelevantMemories(story, memories);

      story.relatedMemories = relevantMemories.map((m) => m.id);
      sprint!.stories[storyIndex] = story;
      sprint!.updatedAt = new Date().toISOString();
      await saveSprints(sprintsData);

      return NextResponse.json({
        ok: true,
        memories: relevantMemories,
        story,
      });
    }

    case "save-lesson": {
      // Save lesson learned as new crew memory
      const { crewId, lesson, type = "lesson" } = payload;

      if (!crewId || !lesson) {
        return NextResponse.json(
          { error: "crewId and lesson required" },
          { status: 400 }
        );
      }

      const memories = await loadMemories();
      const newMemory: Memory = {
        id: `mem_${crewId}_${Date.now()}`,
        crewId,
        content: lesson,
        type,
        projectContext: sprint?.projectId,
        createdAt: new Date().toISOString(),
      };

      memories.push(newMemory);
      await saveMemories(memories);

      // Update task if provided
      if (story && payload.taskId) {
        const taskIndex = story.tasks.findIndex((t) => t.id === payload.taskId);
        if (taskIndex >= 0) {
          story.tasks[taskIndex].lessonsLearned = lesson;
          sprint!.stories[storyIndex] = story;
          await saveSprints(sprintsData);
        }
      }

      return NextResponse.json({
        ok: true,
        memory: newMemory,
        message: `New lesson saved to ${
          getCrewMember(crewId)?.name || crewId
        }'s memory bank.`,
      });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

/**
 * Infer required skills from story content
 */
function inferSkillsFromStory(story: Story): string[] {
  const skills: string[] = [];
  const text = `${story.title} ${story.description} ${story.tags.join(
    " "
  )}`.toLowerCase();

  const skillMap: Record<string, string[]> = {
    "ai|llm|model|embedding": ["ai-integration", "prompt-engineering"],
    "api|endpoint|rest|graphql": ["api-design", "backend"],
    "ui|frontend|component|react": ["ux-design", "frontend"],
    "auth|login|security|permission": ["security", "auth-systems"],
    "database|query|sql|postgres": ["database-ops", "performance-optimization"],
    "deploy|docker|ci|cd|pipeline": ["ci-cd", "infrastructure-design"],
    "test|spec|coverage": ["testing-strategy", "quality-assurance"],
    "cost|budget|price|revenue": ["business-analysis", "pricing-strategy"],
    "doc|readme|guide": ["documentation", "communication"],
  };

  for (const [pattern, mappedSkills] of Object.entries(skillMap)) {
    if (new RegExp(pattern).test(text)) {
      skills.push(...mappedSkills);
    }
  }

  // Always include general skill based on story type
  if (story.type === "feature") skills.push("development");
  if (story.type === "bug") skills.push("debugging");
  if (story.type === "tech_debt") skills.push("refactoring");

  return [...new Set(skills)];
}

/**
 * Generate Riker's briefing for crew assignment
 */
function generateRikerBriefing(
  story: Story,
  team: typeof crewRoster,
  pairs: {
    leadId: string;
    supportId: string;
    synergy: number;
    reasoning: string;
  }[]
): string {
  const lead = team[0];
  let briefing = `Commander Riker's Assignment Briefing\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  briefing += `**Story:** ${story.title}\n`;
  briefing += `**Priority:** ${story.priority.toUpperCase()}\n`;
  briefing += `**Points:** ${story.storyPoints}\n\n`;

  briefing += `**Team Lead:** ${lead?.name || "TBD"}\n`;
  briefing += `${lead?.name || "Lead"} will coordinate the ${
    story.type
  } implementation.\n\n`;

  if (team.length > 1) {
    briefing += `**Support Team:**\n`;
    team.slice(1).forEach((member) => {
      briefing += `• ${member.name} - ${member.specializations.join(", ")}\n`;
    });
    briefing += "\n";
  }

  if (pairs.length > 0) {
    briefing += `**Collaboration Pairs:**\n`;
    pairs.forEach((p) => {
      const leadMember = team.find((m) => m.id === p.leadId);
      const supportMember = team.find((m) => m.id === p.supportId);
      briefing += `• ${leadMember?.name || p.leadId} + ${
        supportMember?.name || p.supportId
      } (Synergy: ${p.synergy}%) - ${p.reasoning}\n`;
    });
    briefing += "\n";
  }

  briefing += `"Let's make it happen, team." - Commander Riker`;

  return briefing;
}

/**
 * Generate task breakdown for a story
 */
function generateTaskBreakdown(story: Story): ReturnType<typeof createTask>[] {
  const tasks: ReturnType<typeof createTask>[] = [];
  const crewIds = story.assignedCrew.map(
    (c) => c.memberId || c.crewMemberId || ""
  );

  // Determine tasks based on story type
  const taskTemplates: { title: string; hours: number; crewRole: string }[] =
    [];

  if (story.type === "feature") {
    taskTemplates.push(
      { title: "Technical design & planning", hours: 2, crewRole: "lead" },
      {
        title: "Core implementation",
        hours: story.storyPoints * 2,
        crewRole: "developer",
      },
      {
        title: "Unit tests & validation",
        hours: story.storyPoints,
        crewRole: "qa",
      },
      { title: "Documentation update", hours: 1, crewRole: "docs" }
    );
  } else if (story.type === "bug") {
    taskTemplates.push(
      {
        title: "Reproduce & analyze root cause",
        hours: 2,
        crewRole: "debugger",
      },
      {
        title: "Implement fix",
        hours: story.storyPoints * 1.5,
        crewRole: "developer",
      },
      { title: "Add regression test", hours: 1, crewRole: "qa" }
    );
  } else if (story.type === "tech_debt") {
    taskTemplates.push(
      {
        title: "Code analysis & refactoring plan",
        hours: 2,
        crewRole: "architect",
      },
      {
        title: "Refactor implementation",
        hours: story.storyPoints * 2,
        crewRole: "developer",
      },
      { title: "Verify no regressions", hours: 1, crewRole: "qa" }
    );
  } else {
    taskTemplates.push(
      {
        title: "Research & analysis",
        hours: story.storyPoints * 2,
        crewRole: "researcher",
      },
      { title: "Document findings", hours: 2, crewRole: "docs" }
    );
  }

  // Assign crew to tasks
  taskTemplates.forEach((template, i) => {
    const assignedTo = crewIds[i % crewIds.length] || "commander_riker";
    tasks.push(
      createTask(story.id, assignedTo, {
        title: template.title,
        description: `Part of story: ${story.title}`,
        estimatedHours: template.hours,
        assignedBy: "commander_riker",
      })
    );
  });

  return tasks;
}

/**
 * Generate Quark's cost analysis
 */
function generateQuarkAnalysis(story: Story, cost: number): string {
  const costPerPoint = cost / story.storyPoints;
  let analysis = `💰 Quark's Financial Analysis\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  analysis += `**Estimated Cost:** $${cost.toLocaleString()}\n`;
  analysis += `**Cost per Point:** $${costPerPoint.toFixed(0)}\n`;
  analysis += `**Story Points:** ${story.storyPoints}\n`;
  analysis += `**Crew Size:** ${story.assignedCrew.length}\n\n`;

  if (costPerPoint < 100) {
    analysis += `📈 This is below average cost - excellent efficiency!\n`;
  } else if (costPerPoint < 200) {
    analysis += `📊 Standard cost range - acceptable ROI expected.\n`;
  } else {
    analysis += `⚠️ Above average cost - consider scope reduction.\n`;
  }

  analysis += `\nRule of Acquisition #9: "Opportunity plus instinct equals profit."`;

  return analysis;
}

/**
 * Get Quark's wisdom based on ROI
 */
function getQuarkWisdom(roi: number): string {
  if (roi > 200)
    return "Rule #10: 'Greed is eternal.' This sprint is pure latinum!";
  if (roi > 100)
    return "Rule #57: 'Good customers are as rare as latinum.' Nurture this investment.";
  if (roi > 50)
    return "Rule #3: 'Never spend more for an acquisition than you have to.' Acceptable margins.";
  if (roi > 0)
    return "Rule #18: 'A Ferengi without profit is no Ferengi at all.' Tread carefully.";
  return "Rule #62: 'The riskier the road, the greater the profit.' But this road looks too risky!";
}

/**
 * Find relevant memories for a story
 */
function findRelevantMemories(story: Story, memories: Memory[]): Memory[] {
  const text = `${story.title} ${story.description} ${story.tags.join(
    " "
  )}`.toLowerCase();
  const crewIds = story.assignedCrew.map((c) => c.memberId || c.crewMemberId);

  return memories
    .filter((m) => {
      // Match by crew assignment
      if (crewIds.includes(m.crewId)) return true;

      // Match by content keywords
      const memoryText = m.content.toLowerCase();
      const keywords = text.split(/\s+/).filter((w) => w.length > 3);
      return keywords.some((k) => memoryText.includes(k));
    })
    .slice(0, 5); // Return top 5 matches
}
