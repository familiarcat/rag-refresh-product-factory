import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import {
  Sprint,
  Story,
  SprintTask,
  createSprint,
  createStory,
  createTask,
  calculateSprintMetrics,
  calculateStoryProgress,
  estimateStoryCost,
  calculateSprintROI,
} from "../../../lib/sprints";
import { appendEvent } from "../../../lib/store";

const SPRINTS_FILE = path.join(process.cwd(), "data/sprints.json");

interface SprintsData {
  sprints: Sprint[];
  meta: {
    version: string;
    createdAt: string;
    description: string;
  };
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
        description: "Sprint data for agile project management",
      },
    };
  }
}

async function saveSprints(data: SprintsData): Promise<void> {
  await fs.writeFile(SPRINTS_FILE, JSON.stringify(data, null, 2));
}

/**
 * GET /api/sprints - List sprints
 * GET /api/sprints?projectId=xxx - Filter by project
 * GET /api/sprints?id=xxx - Get single sprint with metrics
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const projectId = searchParams.get("projectId");
  const includeMetrics = searchParams.get("metrics") === "true";

  const data = await loadSprints();

  // Get single sprint by ID
  if (id) {
    const sprint = data.sprints.find((s) => s.id === id);
    if (!sprint) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    // Calculate metrics if requested
    let metrics = null;
    if (includeMetrics) {
      const projectSprints = data.sprints.filter(
        (s) => s.projectId === sprint.projectId && s.status === "completed"
      );
      metrics = calculateSprintMetrics(sprint, projectSprints);
    }

    return NextResponse.json({ sprint, metrics });
  }

  // Filter by project
  let sprints = data.sprints;
  if (projectId) {
    sprints = sprints.filter((s) => s.projectId === projectId);
  }

  // Sort by sprint number descending
  sprints.sort((a, b) => b.sprintNumber - a.sprintNumber);

  return NextResponse.json({
    sprints,
    total: sprints.length,
  });
}

/**
 * POST /api/sprints - Create new sprint
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { projectId, sprintNumber, ...options } = body;

  if (!projectId) {
    return NextResponse.json(
      { error: "Project ID is required" },
      { status: 400 }
    );
  }

  const data = await loadSprints();

  // Determine sprint number if not provided
  const existingSprints = data.sprints.filter((s) => s.projectId === projectId);
  const actualSprintNumber =
    sprintNumber ||
    Math.max(0, ...existingSprints.map((s) => s.sprintNumber)) + 1;

  // Create sprint
  const sprint = createSprint(projectId, actualSprintNumber, options);
  data.sprints.push(sprint);
  await saveSprints(data);

  // Log event
  await appendEvent({
    type: "sprint-created",
    at: new Date().toISOString(),
    sprintId: sprint.id,
    projectId,
    sprintNumber: actualSprintNumber,
  });

  return NextResponse.json({
    ok: true,
    sprint,
  });
}

/**
 * PUT /api/sprints - Update sprint or add/update stories
 */
export async function PUT(req: Request) {
  const body = await req.json();
  const { id, action, ...payload } = body;

  if (!id) {
    return NextResponse.json(
      { error: "Sprint ID is required" },
      { status: 400 }
    );
  }

  const data = await loadSprints();
  const sprintIndex = data.sprints.findIndex((s) => s.id === id);

  if (sprintIndex === -1) {
    return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
  }

  const sprint = data.sprints[sprintIndex];

  switch (action) {
    case "add-story": {
      // Add new story to sprint
      const { story: storyData } = payload;
      const story = createStory(id, sprint.projectId, storyData);

      // Auto-estimate cost if crew assigned
      if (story.assignedCrew.length > 0 && !story.estimatedCost) {
        story.estimatedCost = estimateStoryCost(
          story.storyPoints,
          story.assignedCrew.map((c) => c.memberId || c.crewMemberId || ""),
          story.priority === "critical" || story.priority === "high"
            ? "high"
            : "medium"
        );
      }

      sprint.stories.push(story);
      sprint.committedPoints += story.storyPoints;
      sprint.updatedAt = new Date().toISOString();

      await saveSprints(data);
      return NextResponse.json({ ok: true, story, sprint });
    }

    case "update-story": {
      // Update existing story
      const { storyId, updates } = payload;
      const storyIndex = sprint.stories.findIndex((s) => s.id === storyId);

      if (storyIndex === -1) {
        return NextResponse.json({ error: "Story not found" }, { status: 404 });
      }

      const oldStory = sprint.stories[storyIndex];
      const updatedStory: Story = {
        ...oldStory,
        ...updates,
        updatedAt: new Date().toISOString(),
        progress: calculateStoryProgress({ ...oldStory, ...updates }),
      };

      // Track status changes
      if (updates.status) {
        if (updates.status === "in_progress" && !oldStory.startedAt) {
          updatedStory.startedAt = new Date().toISOString();
        }
        if (updates.status === "done" && !oldStory.completedAt) {
          updatedStory.completedAt = new Date().toISOString();
          sprint.completedPoints += oldStory.storyPoints;
        }
      }

      // Recalculate committed points if story points changed
      if (updates.storyPoints && updates.storyPoints !== oldStory.storyPoints) {
        sprint.committedPoints =
          sprint.committedPoints - oldStory.storyPoints + updates.storyPoints;
      }

      sprint.stories[storyIndex] = updatedStory;
      sprint.updatedAt = new Date().toISOString();

      await saveSprints(data);
      return NextResponse.json({ ok: true, story: updatedStory, sprint });
    }

    case "add-task": {
      // Add task to story
      const { storyId, task: taskData, assignedTo } = payload;
      const storyIndex = sprint.stories.findIndex((s) => s.id === storyId);

      if (storyIndex === -1) {
        return NextResponse.json({ error: "Story not found" }, { status: 404 });
      }

      const task = createTask(storyId, assignedTo, taskData);
      sprint.stories[storyIndex].tasks.push(task);
      sprint.stories[storyIndex].progress = calculateStoryProgress(
        sprint.stories[storyIndex]
      );
      sprint.updatedAt = new Date().toISOString();

      await saveSprints(data);
      return NextResponse.json({
        ok: true,
        task,
        story: sprint.stories[storyIndex],
      });
    }

    case "update-task": {
      // Update task status
      const { storyId, taskId, updates } = payload;
      const storyIndex = sprint.stories.findIndex((s) => s.id === storyId);

      if (storyIndex === -1) {
        return NextResponse.json({ error: "Story not found" }, { status: 404 });
      }

      const taskIndex = sprint.stories[storyIndex].tasks.findIndex(
        (t) => t.id === taskId
      );
      if (taskIndex === -1) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      const task = sprint.stories[storyIndex].tasks[taskIndex];
      const updatedTask: SprintTask = {
        ...task,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      if (updates.status === "completed" && !task.completedAt) {
        updatedTask.completedAt = new Date().toISOString();
      }

      sprint.stories[storyIndex].tasks[taskIndex] = updatedTask;
      sprint.stories[storyIndex].progress = calculateStoryProgress(
        sprint.stories[storyIndex]
      );
      sprint.updatedAt = new Date().toISOString();

      await saveSprints(data);
      return NextResponse.json({
        ok: true,
        task: updatedTask,
        story: sprint.stories[storyIndex],
      });
    }

    case "start-sprint": {
      sprint.status = "active";
      sprint.startDate = new Date().toISOString();
      sprint.updatedAt = new Date().toISOString();
      await saveSprints(data);
      return NextResponse.json({ ok: true, sprint });
    }

    case "complete-sprint": {
      sprint.status = "completed";
      sprint.updatedAt = new Date().toISOString();

      // Calculate final metrics
      sprint.actualCost = sprint.stories.reduce(
        (sum, s) => sum + (s.actualCost || s.estimatedCost),
        0
      );

      // Add final daily progress entry
      const remainingPoints = sprint.committedPoints - sprint.completedPoints;
      sprint.dailyProgress.push({
        date: new Date().toISOString(),
        remainingPoints,
        completedPoints: sprint.completedPoints,
        remainingHours: sprint.stories.reduce(
          (sum, s) => sum + (s.estimatedHours - s.actualHours),
          0
        ),
        completedHours: sprint.stories.reduce(
          (sum, s) => sum + s.actualHours,
          0
        ),
        blockedStories: sprint.stories.filter((s) => s.status === "blocked")
          .length,
        activeCrew: sprint.activeCrewMembers.length,
        dailyCost: 0,
      });

      await saveSprints(data);
      return NextResponse.json({ ok: true, sprint });
    }

    case "record-progress": {
      // Record daily progress for burndown
      const progress = {
        date: new Date().toISOString(),
        remainingPoints:
          sprint.committedPoints -
          sprint.stories
            .filter((s) => s.status === "done")
            .reduce((sum, s) => sum + s.storyPoints, 0),
        completedPoints: sprint.stories
          .filter((s) => s.status === "done")
          .reduce((sum, s) => sum + s.storyPoints, 0),
        remainingHours: sprint.stories.reduce(
          (sum, s) => sum + (s.estimatedHours - s.actualHours),
          0
        ),
        completedHours: sprint.stories.reduce(
          (sum, s) => sum + s.actualHours,
          0
        ),
        blockedStories: sprint.stories.filter((s) => s.status === "blocked")
          .length,
        activeCrew: sprint.activeCrewMembers.length,
        dailyCost: payload.dailyCost || 0,
      };

      sprint.dailyProgress.push(progress);
      sprint.updatedAt = new Date().toISOString();

      await saveSprints(data);
      return NextResponse.json({ ok: true, progress, sprint });
    }

    case "add-retrospective": {
      sprint.retrospective = payload.retrospective;
      sprint.updatedAt = new Date().toISOString();
      await saveSprints(data);
      return NextResponse.json({ ok: true, sprint });
    }

    default: {
      // General sprint update
      const updatedSprint: Sprint = {
        ...sprint,
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      data.sprints[sprintIndex] = updatedSprint;
      await saveSprints(data);
      return NextResponse.json({ ok: true, sprint: updatedSprint });
    }
  }
}

/**
 * DELETE /api/sprints - Delete sprint
 */
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Sprint ID is required" },
      { status: 400 }
    );
  }

  const data = await loadSprints();
  const index = data.sprints.findIndex((s) => s.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
  }

  data.sprints.splice(index, 1);
  await saveSprints(data);

  await appendEvent({
    type: "sprint-deleted",
    at: new Date().toISOString(),
    sprintId: id,
  });

  return NextResponse.json({ ok: true });
}
