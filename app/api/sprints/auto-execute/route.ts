import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import {
  Sprint,
  Story,
  StoryStatus,
  SprintTask,
  createTask,
  calculateStoryProgress,
} from "../../../../lib/sprints";
import {
  crewRoster,
  getCrewMember,
} from "../../../../lib/alex-ai/crew/collaboration-engine";

const SPRINTS_FILE = path.join(process.cwd(), "data/sprints.json");
const MEMORIES_FILE = path.join(process.cwd(), "data/crew_memories.json");
const PROJECTS_FILE = path.join(process.cwd(), "data/projects.json");

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
  storyContext?: string;
  createdAt: string;
}

interface ReviewComment {
  crewId: string;
  crewName: string;
  comment: string;
  timestamp: string;
  memoriesReferenced: string[];
  approval: boolean;
}

interface ReviewSession {
  storyId: string;
  storyTitle: string;
  comments: ReviewComment[];
  consensus: boolean;
  definitionOfDoneMet: boolean;
  summary: string;
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

// Status progression order
const statusProgression: StoryStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "review",
  "done",
];

/**
 * POST /api/sprints/auto-execute
 *
 * Autonomous sprint execution with crew collaboration:
 * - start-sprint: Activate sprint and begin autonomous execution
 * - advance-story: Move a story to the next status
 * - work-on-story: Crew autonomously works on a story
 * - review-story: Crew conducts communal review session
 * - complete-story: Finalize story with Definition of Done
 * - run-cycle: Execute one full automation cycle
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { action, sprintId, storyId, ...payload } = body;

  const sprintsData = await loadSprints();
  const sprintIndex = sprintsData.sprints.findIndex((s) => s.id === sprintId);

  if (sprintIndex === -1) {
    return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
  }

  const sprint = sprintsData.sprints[sprintIndex];
  const memories = await loadMemories();

  switch (action) {
    case "start-sprint": {
      // Activate sprint and move stories to todo
      sprint.status = "active";
      sprint.startDate = new Date().toISOString();

      // Move all backlog stories to todo
      const backlogStories = sprint.stories.filter(
        (s) => s.status === "backlog"
      );
      for (const story of backlogStories) {
        story.status = "todo";
        story.updatedAt = new Date().toISOString();

        // Add memory for sprint start
        const leadCrew = getCrewMember(story.leadCrew);
        if (leadCrew) {
          memories.push({
            id: `mem_${story.leadCrew}_sprint_start_${Date.now()}`,
            crewId: story.leadCrew,
            content: `Sprint started: "${
              story.title
            }" moved to TODO. Ready to begin implementation with team: ${story.assignedCrew
              .map((c) => c.memberId)
              .join(", ")}.`,
            type: "event",
            projectContext: sprint.projectId,
            storyContext: story.id,
            createdAt: new Date().toISOString(),
          });
        }
      }

      sprint.updatedAt = new Date().toISOString();
      sprintsData.sprints[sprintIndex] = sprint;
      await saveSprints(sprintsData);
      await saveMemories(memories);

      return NextResponse.json({
        ok: true,
        sprint,
        storiesActivated: backlogStories.length,
        message: `Sprint "${sprint.name}" is now active! ${backlogStories.length} stories moved to TODO.`,
      });
    }

    case "work-on-story": {
      // Crew autonomously works on a story
      const storyIndex = sprint.stories.findIndex((s) => s.id === storyId);
      if (storyIndex === -1) {
        return NextResponse.json({ error: "Story not found" }, { status: 404 });
      }

      const story = sprint.stories[storyIndex];

      // Move to in_progress if in todo
      if (story.status === "todo") {
        story.status = "in_progress";
        story.startedAt = new Date().toISOString();
      }

      // Generate tasks if none exist
      if (story.tasks.length === 0) {
        story.tasks = generateStoryTasks(story);
      }

      // Simulate crew working on tasks
      const workResult = simulateCrewWork(story, memories);

      // Update tasks based on work
      for (const taskResult of workResult.taskUpdates) {
        const taskIndex = story.tasks.findIndex(
          (t) => t.id === taskResult.taskId
        );
        if (taskIndex >= 0) {
          story.tasks[taskIndex].status = taskResult.newStatus;
          if (taskResult.newStatus === "completed") {
            story.tasks[taskIndex].completedAt = new Date().toISOString();
            story.tasks[taskIndex].actualHours = taskResult.actualHours;
          }
          story.tasks[taskIndex].memoriesApplied = taskResult.memoriesApplied;
          if (taskResult.lessonLearned) {
            story.tasks[taskIndex].lessonsLearned = taskResult.lessonLearned;
          }
        }
      }

      // Update story progress
      story.progress = calculateStoryProgress(story);
      story.actualHours = story.tasks.reduce(
        (sum, t) => sum + (t.actualHours || 0),
        0
      );
      story.updatedAt = new Date().toISOString();

      // Add work memories
      for (const memory of workResult.newMemories) {
        memories.push(memory);
      }

      // Check if ready for review (all tasks complete)
      const allTasksComplete = story.tasks.every(
        (t) => t.status === "completed"
      );
      if (allTasksComplete && story.status === "in_progress") {
        story.status = "review";
        story.updatedAt = new Date().toISOString();
      }

      sprint.stories[storyIndex] = story;
      sprint.updatedAt = new Date().toISOString();
      sprintsData.sprints[sprintIndex] = sprint;
      await saveSprints(sprintsData);
      await saveMemories(memories);

      return NextResponse.json({
        ok: true,
        story,
        workResult: {
          tasksCompleted: workResult.taskUpdates.filter(
            (t) => t.newStatus === "completed"
          ).length,
          totalTasks: story.tasks.length,
          progress: story.progress,
          movedToReview: story.status === "review",
        },
        crewActivity: workResult.crewActivity,
      });
    }

    case "review-story": {
      // Crew conducts communal review session
      const storyIndex = sprint.stories.findIndex((s) => s.id === storyId);
      if (storyIndex === -1) {
        return NextResponse.json({ error: "Story not found" }, { status: 404 });
      }

      const story = sprint.stories[storyIndex];

      if (story.status !== "review") {
        return NextResponse.json(
          {
            error: "Story must be in review status",
          },
          { status: 400 }
        );
      }

      // Conduct crew review session
      const reviewSession = conductCrewReview(story, sprint, memories);

      // Add review memories
      for (const comment of reviewSession.comments) {
        memories.push({
          id: `mem_${comment.crewId}_review_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 4)}`,
          crewId: comment.crewId,
          content: `Review of "${story.title}": ${comment.comment}`,
          type: "review",
          projectContext: sprint.projectId,
          storyContext: story.id,
          createdAt: comment.timestamp,
        });
      }

      // If consensus reached, move to done
      if (reviewSession.consensus && reviewSession.definitionOfDoneMet) {
        story.status = "done";
        story.completedAt = new Date().toISOString();
        story.progress = 100;
        sprint.completedPoints += story.storyPoints;

        // Add completion memory
        memories.push({
          id: `mem_completion_${story.id}_${Date.now()}`,
          crewId: story.leadCrew,
          content: `Story "${story.title}" completed! Definition of Done met. Team consensus achieved. Points: ${story.storyPoints}, Actual hours: ${story.actualHours}`,
          type: "milestone",
          projectContext: sprint.projectId,
          storyContext: story.id,
          createdAt: new Date().toISOString(),
        });
      }

      story.updatedAt = new Date().toISOString();
      sprint.stories[storyIndex] = story;
      sprint.updatedAt = new Date().toISOString();
      sprintsData.sprints[sprintIndex] = sprint;
      await saveSprints(sprintsData);
      await saveMemories(memories);

      return NextResponse.json({
        ok: true,
        story,
        reviewSession,
        completed: story.status === "done",
      });
    }

    case "run-cycle": {
      // Execute one full automation cycle for all stories
      const cycleResults: {
        storyId: string;
        title: string;
        previousStatus: StoryStatus;
        newStatus: StoryStatus;
        action: string;
      }[] = [];

      const storiesDone: string[] = [];

      // Process each story based on current status
      for (let i = 0; i < sprint.stories.length; i++) {
        const story = sprint.stories[i];
        const previousStatus = story.status;

        if (story.status === "backlog") {
          // Move to todo
          story.status = "todo";
          story.updatedAt = new Date().toISOString();
          cycleResults.push({
            storyId: story.id,
            title: story.title,
            previousStatus,
            newStatus: "todo",
            action: "Moved to TODO",
          });
        } else if (story.status === "todo") {
          // Start work
          story.status = "in_progress";
          story.startedAt = new Date().toISOString();
          if (story.tasks.length === 0) {
            story.tasks = generateStoryTasks(story);
          }
          story.updatedAt = new Date().toISOString();
          cycleResults.push({
            storyId: story.id,
            title: story.title,
            previousStatus,
            newStatus: "in_progress",
            action: "Started work",
          });
        } else if (story.status === "in_progress") {
          // Work on tasks
          const workResult = simulateCrewWork(story, memories);
          for (const taskResult of workResult.taskUpdates) {
            const taskIndex = story.tasks.findIndex(
              (t) => t.id === taskResult.taskId
            );
            if (taskIndex >= 0) {
              story.tasks[taskIndex].status = taskResult.newStatus;
              if (taskResult.newStatus === "completed") {
                story.tasks[taskIndex].completedAt = new Date().toISOString();
                story.tasks[taskIndex].actualHours = taskResult.actualHours;
              }
            }
          }
          story.progress = calculateStoryProgress(story);
          story.actualHours = story.tasks.reduce(
            (sum, t) => sum + (t.actualHours || 0),
            0
          );

          // Check if ready for review
          if (story.tasks.every((t) => t.status === "completed")) {
            story.status = "review";
            cycleResults.push({
              storyId: story.id,
              title: story.title,
              previousStatus,
              newStatus: "review",
              action: "Moved to review - all tasks complete",
            });
          } else {
            cycleResults.push({
              storyId: story.id,
              title: story.title,
              previousStatus,
              newStatus: "in_progress",
              action: `Working: ${story.progress}% complete`,
            });
          }

          // Add memories
          for (const memory of workResult.newMemories) {
            memories.push(memory);
          }
          story.updatedAt = new Date().toISOString();
        } else if (story.status === "review") {
          // Conduct review
          const reviewSession = conductCrewReview(story, sprint, memories);

          if (reviewSession.consensus && reviewSession.definitionOfDoneMet) {
            story.status = "done";
            story.completedAt = new Date().toISOString();
            story.progress = 100;
            sprint.completedPoints += story.storyPoints;
            storiesDone.push(story.id);

            cycleResults.push({
              storyId: story.id,
              title: story.title,
              previousStatus,
              newStatus: "done",
              action: "COMPLETED - Definition of Done met!",
            });

            // Add completion memory
            memories.push({
              id: `mem_completion_${story.id}_${Date.now()}`,
              crewId: story.leadCrew,
              content: `Story "${story.title}" completed through crew review. ${story.storyPoints} points delivered.`,
              type: "milestone",
              projectContext: sprint.projectId,
              storyContext: story.id,
              createdAt: new Date().toISOString(),
            });
          } else {
            // Track review attempts
            const reviewAttempts =
              (story as Story & { reviewAttempts?: number }).reviewAttempts ||
              0;
            (story as Story & { reviewAttempts?: number }).reviewAttempts =
              reviewAttempts + 1;

            // After 3 failed review attempts, block for human review
            if (reviewAttempts >= 2) {
              story.status = "blocked";
              (
                story as Story & { blockedReason?: string }
              ).blockedReason = `Crew unable to reach consensus after ${
                reviewAttempts + 1
              } review cycles. Human review required.`;
              (story as Story & { blockedAt?: string }).blockedAt =
                new Date().toISOString();

              cycleResults.push({
                storyId: story.id,
                title: story.title,
                previousStatus,
                newStatus: "blocked",
                action:
                  "🚫 BLOCKED - Human review required (crew unable to reach consensus)",
              });

              // Add blocking memory
              memories.push({
                id: `mem_blocked_${story.id}_${Date.now()}`,
                crewId: "captain_picard",
                content: `Story "${story.title}" blocked after ${
                  reviewAttempts + 1
                } review attempts. Crew could not reach consensus on Definition of Done. Human intervention needed.`,
                type: "event",
                projectContext: sprint.projectId,
                storyContext: story.id,
                createdAt: new Date().toISOString(),
              });
            } else {
              cycleResults.push({
                storyId: story.id,
                title: story.title,
                previousStatus,
                newStatus: "review",
                action: `Review attempt ${
                  reviewAttempts + 1
                }/3 - awaiting consensus`,
              });
            }
          }

          // Add review memories
          for (const comment of reviewSession.comments) {
            memories.push({
              id: `mem_${comment.crewId}_review_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 4)}`,
              crewId: comment.crewId,
              content: `Review: ${comment.comment}`,
              type: "review",
              projectContext: sprint.projectId,
              storyContext: story.id,
              createdAt: comment.timestamp,
            });
          }
          story.updatedAt = new Date().toISOString();
        }

        sprint.stories[i] = story;
      }

      sprint.updatedAt = new Date().toISOString();

      // Check if sprint is complete
      const allDone = sprint.stories.every((s) => s.status === "done");
      if (allDone && sprint.status === "active") {
        sprint.status = "completed";
      }

      sprintsData.sprints[sprintIndex] = sprint;
      await saveSprints(sprintsData);
      await saveMemories(memories);

      return NextResponse.json({
        ok: true,
        sprint,
        cycleResults,
        storiesCompleted: storiesDone.length,
        sprintComplete: sprint.status === "completed",
        summary: {
          total: sprint.stories.length,
          done: sprint.stories.filter((s) => s.status === "done").length,
          inProgress: sprint.stories.filter((s) => s.status === "in_progress")
            .length,
          review: sprint.stories.filter((s) => s.status === "review").length,
          todo: sprint.stories.filter((s) => s.status === "todo").length,
          backlog: sprint.stories.filter((s) => s.status === "backlog").length,
          blocked: sprint.stories.filter((s) => s.status === "blocked").length,
        },
      });
    }

    case "unblock": {
      // Human intervention to unblock a story
      const story = sprint.stories.find((s) => s.id === storyId);
      if (!story) {
        return NextResponse.json({ error: "Story not found" }, { status: 404 });
      }

      if (story.status !== "blocked") {
        return NextResponse.json(
          { error: "Story is not blocked" },
          { status: 400 }
        );
      }

      const { resolution, moveToStatus = "todo" } = payload as {
        resolution: string;
        moveToStatus?: "backlog" | "todo" | "in_progress";
      };

      // Reset story status
      story.status = moveToStatus;
      (story as Story & { reviewAttempts?: number }).reviewAttempts = 0;
      (story as Story & { blockedReason?: string }).blockedReason = undefined;
      (story as Story & { unblockedAt?: string }).unblockedAt =
        new Date().toISOString();
      (story as Story & { unblockedBy?: string }).unblockedBy =
        "human_reviewer";
      (story as Story & { unblockResolution?: string }).unblockResolution =
        resolution;
      story.updatedAt = new Date().toISOString();

      // Add memory of human intervention
      memories.push({
        id: `mem_unblock_${story.id}_${Date.now()}`,
        crewId: "captain_picard",
        content: `Human review resolved blocking issue for "${story.title}". Resolution: ${resolution}. Story moved to ${moveToStatus}.`,
        type: "event",
        projectContext: sprint.projectId,
        storyContext: story.id,
        createdAt: new Date().toISOString(),
      });

      sprintsData.sprints[sprintIndex] = sprint;
      await saveSprints(sprintsData);
      await saveMemories(memories);

      return NextResponse.json({
        ok: true,
        story,
        message: `Story unblocked and moved to ${moveToStatus}`,
        resolution,
      });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

/**
 * Generate tasks for a story based on type
 */
function generateStoryTasks(story: Story): SprintTask[] {
  const tasks: SprintTask[] = [];
  const crewIds = story.assignedCrew.map((c) => c.memberId || "");
  const now = new Date().toISOString();

  const taskTemplates = getTaskTemplatesForStoryType(story.type);

  taskTemplates.forEach((template, i) => {
    const assignedTo = crewIds[i % crewIds.length] || story.leadCrew;
    tasks.push({
      id: `task_${story.id}_${i}_${Date.now()}`,
      storyId: story.id,
      title: template.title,
      description: `${template.title} for "${story.title}"`,
      assignedTo,
      assignedBy: "commander_riker",
      estimatedHours: template.hours,
      status: "pending",
      memoriesApplied: [],
      createdAt: now,
      updatedAt: now,
    });
  });

  return tasks;
}

function getTaskTemplatesForStoryType(
  type: Story["type"]
): { title: string; hours: number }[] {
  switch (type) {
    case "feature":
      return [
        { title: "Design & Planning", hours: 2 },
        { title: "Implementation", hours: 6 },
        { title: "Testing", hours: 2 },
        { title: "Documentation", hours: 1 },
      ];
    case "bug":
      return [
        { title: "Reproduce & Analyze", hours: 1 },
        { title: "Fix Implementation", hours: 3 },
        { title: "Regression Testing", hours: 1 },
      ];
    case "spike":
      return [
        { title: "Research", hours: 3 },
        { title: "Prototype", hours: 2 },
        { title: "Document Findings", hours: 1 },
      ];
    case "tech_debt":
      return [
        { title: "Analysis", hours: 1 },
        { title: "Refactoring", hours: 4 },
        { title: "Verify No Regressions", hours: 1 },
      ];
    case "documentation":
      return [
        { title: "Outline & Structure", hours: 1 },
        { title: "Write Content", hours: 3 },
        { title: "Review & Polish", hours: 1 },
      ];
    default:
      return [
        { title: "Implementation", hours: 4 },
        { title: "Testing", hours: 2 },
      ];
  }
}

/**
 * Simulate crew working on story tasks
 */
function simulateCrewWork(
  story: Story,
  memories: Memory[]
): {
  taskUpdates: Array<{
    taskId: string;
    newStatus: SprintTask["status"];
    actualHours: number;
    memoriesApplied: string[];
    lessonLearned?: string;
  }>;
  newMemories: Memory[];
  crewActivity: Array<{ crewId: string; crewName: string; action: string }>;
} {
  const taskUpdates: ReturnType<typeof simulateCrewWork>["taskUpdates"] = [];
  const newMemories: Memory[] = [];
  const crewActivity: ReturnType<typeof simulateCrewWork>["crewActivity"] = [];

  // Find pending tasks to work on
  const pendingTasks = story.tasks.filter((t) => t.status === "pending");
  const inProgressTasks = story.tasks.filter((t) => t.status === "in_progress");

  // Work on in-progress tasks first
  for (const task of inProgressTasks) {
    const crewMember = getCrewMember(task.assignedTo);

    // Find relevant memories for this task
    const relevantMemories = memories
      .filter(
        (m) =>
          m.crewId === task.assignedTo || m.projectContext === story.projectId
      )
      .slice(0, 3);

    // Complete the task
    const efficiencyBonus = relevantMemories.length * 0.1;
    const actualHours = Math.max(
      1,
      task.estimatedHours * (1 - efficiencyBonus)
    );

    // Generate lesson learned
    const lessonLearned = generateLessonLearned(
      task,
      crewMember?.name || task.assignedTo
    );

    taskUpdates.push({
      taskId: task.id,
      newStatus: "completed",
      actualHours,
      memoriesApplied: relevantMemories.map((m) => m.id),
      lessonLearned,
    });

    crewActivity.push({
      crewId: task.assignedTo,
      crewName: crewMember?.name || task.assignedTo,
      action: `Completed "${task.title}" in ${actualHours.toFixed(1)} hours`,
    });

    // Add work memory
    if (lessonLearned) {
      newMemories.push({
        id: `mem_${task.assignedTo}_work_${Date.now()}`,
        crewId: task.assignedTo,
        content: lessonLearned,
        type: "lesson",
        projectContext: story.projectId,
        storyContext: story.id,
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Start work on pending tasks (up to 2 at a time per story)
  const tasksToStart = pendingTasks.slice(
    0,
    Math.max(0, 2 - inProgressTasks.length)
  );
  for (const task of tasksToStart) {
    const crewMember = getCrewMember(task.assignedTo);

    taskUpdates.push({
      taskId: task.id,
      newStatus: "in_progress",
      actualHours: 0,
      memoriesApplied: [],
    });

    crewActivity.push({
      crewId: task.assignedTo,
      crewName: crewMember?.name || task.assignedTo,
      action: `Started working on "${task.title}"`,
    });
  }

  return { taskUpdates, newMemories, crewActivity };
}

/**
 * Generate lesson learned from task completion
 */
function generateLessonLearned(task: SprintTask, crewName: string): string {
  const lessons = [
    `${task.title} completed efficiently by applying prior learnings.`,
    `${crewName} optimized the ${task.title.toLowerCase()} process through collaboration.`,
    `Systematic approach to ${task.title.toLowerCase()} yielded quality results.`,
    `Cross-referencing documentation accelerated ${task.title.toLowerCase()}.`,
  ];
  return lessons[Math.floor(Math.random() * lessons.length)];
}

/**
 * Conduct crew review session with communal conversation
 */
function conductCrewReview(
  story: Story,
  sprint: Sprint,
  memories: Memory[]
): ReviewSession {
  const comments: ReviewComment[] = [];
  const now = new Date().toISOString();

  // Get all crew members involved in the sprint
  const reviewers = [
    ...new Set([
      ...story.assignedCrew.map((c) => c.memberId || ""),
      ...sprint.activeCrewMembers,
    ]),
  ].filter(Boolean);

  // Each crew member reviews from their perspective
  for (const crewId of reviewers.slice(0, 6)) {
    const crewMember = getCrewMember(crewId);
    if (!crewMember) continue;

    // Get crew's relevant memories
    const crewMemories = memories
      .filter(
        (m) =>
          m.crewId === crewId &&
          (m.projectContext === sprint.projectId || m.storyContext === story.id)
      )
      .slice(0, 3);

    // Generate review comment based on crew perspective
    const { comment, approval } = generateCrewReviewComment(
      crewMember,
      story,
      crewMemories
    );

    comments.push({
      crewId,
      crewName: crewMember.name,
      comment,
      timestamp: now,
      memoriesReferenced: crewMemories.map((m) => m.id),
      approval,
    });
  }

  // Check for consensus
  const approvals = comments.filter((c) => c.approval).length;
  const consensus = approvals >= Math.ceil(comments.length * 0.7); // 70% approval

  // Check Definition of Done
  const definitionOfDoneMet = checkDefinitionOfDone(story);

  // Generate summary
  const summary =
    consensus && definitionOfDoneMet
      ? `✅ Story "${story.title}" passed review! ${approvals}/${comments.length} approvals. Definition of Done met.`
      : consensus
      ? `⚠️ Story "${story.title}" has consensus but Definition of Done not fully met.`
      : `🔄 Story "${story.title}" needs more work. ${approvals}/${comments.length} approvals (need 70%).`;

  return {
    storyId: story.id,
    storyTitle: story.title,
    comments,
    consensus,
    definitionOfDoneMet,
    summary,
  };
}

/**
 * Generate crew review comment based on their specialization
 */
function generateCrewReviewComment(
  crewMember: NonNullable<ReturnType<typeof getCrewMember>>,
  story: Story,
  crewMemories: Memory[]
): { comment: string; approval: boolean } {
  const memoryContext =
    crewMemories.length > 0
      ? ` Based on my experience: "${crewMemories[0].content.slice(0, 50)}..."`
      : "";

  // Reviews based on crew role
  const reviewTemplates: Record<
    string,
    { positive: string; negative: string }
  > = {
    captain_picard: {
      positive: `The strategic direction is sound. This aligns with our mission objectives.${memoryContext}`,
      negative: `I have concerns about strategic alignment. Let's discuss the approach further.${memoryContext}`,
    },
    commander_riker: {
      positive: `Team execution was excellent. The coordination shows in the quality.${memoryContext}`,
      negative: `The execution could be tightened. I recommend additional coordination.${memoryContext}`,
    },
    commander_data: {
      positive: `Technical implementation is logical and efficient. Algorithms perform within parameters.${memoryContext}`,
      negative: `I detect potential optimizations. Technical debt should be addressed.${memoryContext}`,
    },
    geordi_la_forge: {
      positive: `Infrastructure is solid. Deployment and performance look good.${memoryContext}`,
      negative: `Infrastructure needs hardening. I recommend additional testing.${memoryContext}`,
    },
    lieutenant_worf: {
      positive: `Security measures are adequate. The implementation meets security standards.${memoryContext}`,
      negative: `Security posture needs strengthening. I cannot approve without additional safeguards.${memoryContext}`,
    },
    counselor_troi: {
      positive: `The user experience is well-considered. Users will find this intuitive.${memoryContext}`,
      negative: `I sense user friction points. The experience needs refinement.${memoryContext}`,
    },
    chief_obrien: {
      positive: `It works. Practical implementation is solid and maintainable.${memoryContext}`,
      negative: `Found some issues that need fixing before we ship.${memoryContext}`,
    },
    quark: {
      positive: `The ROI looks promising. Good value for the investment.${memoryContext}`,
      negative: `Cost concerns - let's ensure we're getting proper return on this.${memoryContext}`,
    },
    dr_crusher: {
      positive: `System health looks good. Documentation is adequate.${memoryContext}`,
      negative: `Health checks reveal issues. Documentation needs improvement.${memoryContext}`,
    },
    lieutenant_uhura: {
      positive: `API design is clear and integrations are well-documented.${memoryContext}`,
      negative: `Communication protocols need clarification.${memoryContext}`,
    },
  };

  // Determine approval based on story completion and random factor
  const completionFactor = story.progress / 100;
  const tasksComplete =
    story.tasks.filter((t) => t.status === "completed").length /
    Math.max(story.tasks.length, 1);
  const approval =
    completionFactor >= 0.9 && tasksComplete >= 0.9 && Math.random() > 0.2;

  const templates = reviewTemplates[crewMember.id] || {
    positive: `Good work on this story.${memoryContext}`,
    negative: `Needs additional work.${memoryContext}`,
  };

  const comment = approval ? templates.positive : templates.negative;

  return { comment, approval };
}

/**
 * Check if Definition of Done is met
 */
function checkDefinitionOfDone(story: Story): boolean {
  // Definition of Done criteria
  const criteria = {
    allTasksComplete: story.tasks.every((t) => t.status === "completed"),
    acceptanceCriteriaDefined: story.acceptanceCriteria.length > 0,
    progressComplete: story.progress >= 100,
    hasAssignedCrew: story.assignedCrew.length > 0,
  };

  return Object.values(criteria).every(Boolean);
}
