import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import {
  Sprint,
  SprintTask,
  calculateStoryProgress,
} from "../../../../lib/sprints";
import { getCrewMember } from "../../../../lib/alex-ai/crew/collaboration-engine";

const SPRINTS_FILE = path.join(process.cwd(), "data/sprints.json");
const MEMORIES_FILE = path.join(process.cwd(), "data/crew_memories.json");

interface Memory {
  id: string;
  crewId: string;
  content: string;
  type: string;
  projectContext?: string;
  createdAt: string;
}

interface SprintsData {
  sprints: Sprint[];
  meta: { version: string; createdAt: string; description: string };
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
 * POST /api/sprints/execute
 *
 * Autonomous crew task execution with RAG memory integration
 *
 * Actions:
 * - execute-task: Crew member autonomously executes a task using memories
 * - complete-story: Mark story complete and generate lessons learned
 * - sprint-standup: Generate standup report using crew memories
 * - auto-assign: Autonomously assign all unassigned stories
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { action, sprintId, ...payload } = body;

  const sprintsData = await loadSprints();
  const sprint = sprintsData.sprints.find((s) => s.id === sprintId);

  if (!sprint) {
    return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
  }

  const memories = await loadMemories();

  switch (action) {
    case "execute-task": {
      // Autonomous task execution by crew member
      const { storyId, taskId, crewId } = payload;

      const storyIndex = sprint.stories.findIndex((s) => s.id === storyId);
      if (storyIndex === -1) {
        return NextResponse.json({ error: "Story not found" }, { status: 404 });
      }

      const story = sprint.stories[storyIndex];
      const taskIndex = story.tasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      const task = story.tasks[taskIndex];
      const crewMember = getCrewMember(crewId || task.assignedTo);

      // Find relevant memories for this task
      const relevantMemories = findRelevantMemoriesForTask(
        task,
        story,
        memories,
        crewId || task.assignedTo
      );

      // Simulate autonomous execution
      const executionResult = autonomousExecute(
        task,
        crewMember,
        relevantMemories
      );

      // Update task
      task.status = "completed";
      task.completedAt = new Date().toISOString();
      task.actualHours = task.estimatedHours * executionResult.efficiencyFactor;
      task.memoriesApplied = relevantMemories.map((m) => m.id);
      task.lessonsLearned = executionResult.lessonLearned;

      story.tasks[taskIndex] = task;
      story.progress = calculateStoryProgress(story);
      story.actualHours += task.actualHours;

      // Auto-complete story if all tasks done
      if (story.tasks.every((t) => t.status === "completed")) {
        story.status = "done";
        story.completedAt = new Date().toISOString();
        sprint.completedPoints += story.storyPoints;
      }

      sprint.stories[storyIndex] = story;
      sprint.updatedAt = new Date().toISOString();
      await saveSprints(sprintsData);

      // Save lesson learned as new memory
      if (executionResult.lessonLearned) {
        const newMemory: Memory = {
          id: `mem_${crewId || task.assignedTo}_${Date.now()}`,
          crewId: crewId || task.assignedTo,
          content: executionResult.lessonLearned,
          type: "lesson",
          projectContext: sprint.projectId,
          createdAt: new Date().toISOString(),
        };
        memories.push(newMemory);
        await saveMemories(memories);
      }

      return NextResponse.json({
        ok: true,
        task,
        story,
        execution: {
          crewMember: crewMember?.name || crewId,
          memoriesApplied: relevantMemories.length,
          efficiencyFactor: executionResult.efficiencyFactor,
          lessonLearned: executionResult.lessonLearned,
          executionNotes: executionResult.notes,
        },
      });
    }

    case "complete-story": {
      // Complete story and generate comprehensive lessons
      const { storyId } = payload;

      const storyIndex = sprint.stories.findIndex((s) => s.id === storyId);
      if (storyIndex === -1) {
        return NextResponse.json({ error: "Story not found" }, { status: 404 });
      }

      const story = sprint.stories[storyIndex];

      // Mark all remaining tasks complete
      story.tasks.forEach((task) => {
        if (task.status !== "completed") {
          task.status = "completed";
          task.completedAt = new Date().toISOString();
        }
      });

      story.status = "done";
      story.completedAt = new Date().toISOString();
      story.progress = 100;

      if (
        !sprint.completedPoints ||
        sprint.stories[storyIndex].status !== "done"
      ) {
        sprint.completedPoints += story.storyPoints;
      }

      // Generate summary lessons from all tasks
      const lessons = generateStoryLessons(story, sprint);

      // Save lessons as memories for each involved crew member
      const newMemories: Memory[] = [];
      story.assignedCrew.forEach((crew) => {
        const crewId = crew.memberId || crew.crewMemberId || "";
        if (crewId && lessons[crewId]) {
          newMemories.push({
            id: `mem_${crewId}_${Date.now()}_${Math.random()
              .toString(36)
              .slice(2, 4)}`,
            crewId,
            content: lessons[crewId],
            type: "lesson",
            projectContext: sprint.projectId,
            createdAt: new Date().toISOString(),
          });
        }
      });

      if (newMemories.length > 0) {
        memories.push(...newMemories);
        await saveMemories(memories);
      }

      sprint.stories[storyIndex] = story;
      sprint.updatedAt = new Date().toISOString();
      await saveSprints(sprintsData);

      return NextResponse.json({
        ok: true,
        story,
        lessonsGenerated: newMemories.length,
        lessons,
      });
    }

    case "sprint-standup": {
      // Generate standup report using crew memories and current progress
      const standupReport = generateStandupReport(sprint, memories);

      return NextResponse.json({
        ok: true,
        standup: standupReport,
        sprintProgress: {
          committed: sprint.committedPoints,
          completed: sprint.completedPoints,
          remaining: sprint.committedPoints - sprint.completedPoints,
          percentComplete:
            sprint.committedPoints > 0
              ? Math.round(
                  (sprint.completedPoints / sprint.committedPoints) * 100
                )
              : 0,
        },
      });
    }

    case "auto-assign": {
      // Autonomously assign all unassigned stories
      const unassigned = sprint.stories.filter(
        (s) => s.assignedCrew.length === 0
      );
      const results: { storyId: string; assigned: string[] }[] = [];

      for (const story of unassigned) {
        // Find best crew based on story requirements and memories
        const bestCrew = findBestCrewForStory(
          story,
          sprint.activeCrewMembers,
          memories
        );

        story.assignedCrew = bestCrew.map((crewId) => ({
          memberId: crewId,
          role: "contributor",
          assignment: story.title,
        }));
        story.leadCrew = bestCrew[0] || "";

        results.push({ storyId: story.id, assigned: bestCrew });
      }

      sprint.updatedAt = new Date().toISOString();
      await saveSprints(sprintsData);

      return NextResponse.json({
        ok: true,
        assigned: results,
        totalAssigned: results.length,
      });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

/**
 * Find relevant memories for a specific task
 */
function findRelevantMemoriesForTask(
  task: SprintTask,
  story: { title: string; description: string; type: string; tags: string[] },
  memories: Memory[],
  crewId: string
): Memory[] {
  const taskText =
    `${task.title} ${task.description} ${story.title} ${story.description}`.toLowerCase();

  return memories
    .filter((m) => {
      // Prioritize memories from assigned crew
      if (m.crewId === crewId) return true;

      // Match by content keywords
      const memoryText = m.content.toLowerCase();
      const keywords = taskText.split(/\s+/).filter((w) => w.length > 3);
      const matchCount = keywords.filter((k) => memoryText.includes(k)).length;
      return matchCount >= 2;
    })
    .sort((a, b) => {
      // Prioritize crew member's own memories
      if (a.crewId === crewId && b.crewId !== crewId) return -1;
      if (b.crewId === crewId && a.crewId !== crewId) return 1;
      // Then by recency
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 5);
}

/**
 * Simulate autonomous task execution
 */
function autonomousExecute(
  task: SprintTask,
  crewMember: ReturnType<typeof getCrewMember>,
  memories: Memory[]
): { efficiencyFactor: number; lessonLearned: string; notes: string } {
  // Efficiency based on memories applied
  const baseEfficiency = 1.0;
  const memoryBonus = memories.length * 0.05; // 5% efficiency per memory applied
  const efficiencyFactor = Math.max(0.5, baseEfficiency - memoryBonus);

  // Generate lesson learned
  let lessonLearned = "";
  if (Math.random() > 0.3) {
    // 70% chance to learn something
    const lessons = [
      `${task.title} completed efficiently by applying ${memories.length} prior learnings.`,
      `Breaking down ${task.title} into smaller steps improved execution speed.`,
      `Cross-referencing related memories accelerated the ${task.title} process.`,
      `${task.title} revealed new optimization opportunities for similar future tasks.`,
    ];
    lessonLearned = lessons[Math.floor(Math.random() * lessons.length)];
  }

  // Generate execution notes
  const notes = crewMember
    ? `${crewMember.name} executed "${task.title}" using ${
        memories.length
      } relevant memories. Efficiency: ${Math.round(
        (1 - efficiencyFactor) * 100
      )}% faster than baseline.`
    : `Task "${task.title}" completed autonomously with ${memories.length} memories applied.`;

  return { efficiencyFactor, lessonLearned, notes };
}

/**
 * Generate lessons learned from completed story
 */
function generateStoryLessons(
  story: {
    title: string;
    type: string;
    tasks: SprintTask[];
    storyPoints: number;
    estimatedHours: number;
    actualHours: number;
  },
  sprint: Sprint
): Record<string, string> {
  const lessons: Record<string, string> = {};
  const efficiency =
    story.estimatedHours > 0
      ? Math.round((1 - story.actualHours / story.estimatedHours) * 100)
      : 0;

  // Group tasks by assignee
  const tasksByCrewMember: Record<string, SprintTask[]> = {};
  story.tasks.forEach((task) => {
    const crewId = task.assignedTo;
    if (!tasksByCrewMember[crewId]) {
      tasksByCrewMember[crewId] = [];
    }
    tasksByCrewMember[crewId].push(task);
  });

  // Generate lesson for each crew member
  for (const [crewId, tasks] of Object.entries(tasksByCrewMember)) {
    const completedTasks = tasks.filter((t) => t.status === "completed");
    const taskNames = completedTasks.map((t) => t.title).join(", ");

    lessons[crewId] =
      `Completed ${completedTasks.length} tasks on "${story.title}" (${story.type}): ${taskNames}. ` +
      `Story efficiency: ${efficiency}% vs estimate. Points: ${story.storyPoints}.`;
  }

  return lessons;
}

/**
 * Generate standup report from sprint state and memories
 */
function generateStandupReport(
  sprint: Sprint,
  memories: Memory[]
): {
  summary: string;
  blockers: string[];
  todaysFocus: string[];
  crewStatus: Record<string, { working: string; blockers: string[] }>;
} {
  const inProgress = sprint.stories.filter((s) => s.status === "in_progress");
  const blocked = sprint.stories.filter((s) => s.status === "blocked");
  const completed = sprint.stories.filter((s) => s.status === "done");

  // Get recent memories for context
  const recentMemories = memories
    .filter((m) => sprint.activeCrewMembers.includes(m.crewId))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  // Build crew status
  const crewStatus: Record<string, { working: string; blockers: string[] }> =
    {};
  sprint.activeCrewMembers.forEach((crewId) => {
    const crewStories = inProgress.filter((s) =>
      s.assignedCrew.some((c) => (c.memberId || c.crewMemberId) === crewId)
    );
    const crewBlockers = blocked
      .filter((s) =>
        s.assignedCrew.some((c) => (c.memberId || c.crewMemberId) === crewId)
      )
      .map((s) => s.blockedReason || s.title);

    crewStatus[crewId] = {
      working:
        crewStories.map((s) => s.title).join(", ") || "Available for new tasks",
      blockers: crewBlockers,
    };
  });

  return {
    summary:
      `Sprint "${sprint.name}" - Day ${sprint.dailyProgress.length + 1}/${
        sprint.duration
      }\n` +
      `Progress: ${sprint.completedPoints}/${
        sprint.committedPoints
      } points (${Math.round(
        (sprint.completedPoints / Math.max(sprint.committedPoints, 1)) * 100
      )}%)\n` +
      `Stories: ${completed.length} done, ${inProgress.length} in progress, ${blocked.length} blocked`,
    blockers: blocked.map(
      (s) => `${s.title}: ${s.blockedReason || "No reason specified"}`
    ),
    todaysFocus: inProgress.slice(0, 3).map((s) => s.title),
    crewStatus,
  };
}

/**
 * Find best crew members for a story based on skills and memories
 */
function findBestCrewForStory(
  story: { title: string; description: string; type: string; tags: string[] },
  availableCrew: string[],
  memories: Memory[]
): string[] {
  const storyText = `${story.title} ${story.description} ${story.tags.join(
    " "
  )}`.toLowerCase();

  // Score each crew member
  const scores = availableCrew.map((crewId) => {
    const crewMemories = memories.filter((m) => m.crewId === crewId);

    // Count relevant memories
    const relevantMemories = crewMemories.filter((m) => {
      const memoryText = m.content.toLowerCase();
      const keywords = storyText.split(/\s+/).filter((w) => w.length > 3);
      return keywords.some((k) => memoryText.includes(k));
    });

    return {
      crewId,
      score: relevantMemories.length,
      totalMemories: crewMemories.length,
    };
  });

  // Sort by score and return top 3
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.crewId);
}


