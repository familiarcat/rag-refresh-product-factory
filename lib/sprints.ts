/**
 * Sprint Management System
 *
 * Agile project management with crew collaboration.
 * Riker coordinates assignments, Quark tracks costs/ROI.
 *
 * "A good plan today is better than a perfect plan tomorrow." - Riker
 */

import { CrewAssignment } from "./projects";

// Story point scale (Fibonacci-ish)
export type StoryPoints = 1 | 2 | 3 | 5 | 8 | 13 | 21;

// Story status for Kanban board
export type StoryStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "review"
  | "done"
  | "blocked";

// Story type categorization
export type StoryType =
  | "feature"
  | "bug"
  | "tech_debt"
  | "spike"
  | "documentation";

// Priority levels
export type Priority = "critical" | "high" | "medium" | "low";

/**
 * Individual task within a story
 * Assigned to crew members for execution
 */
export interface SprintTask {
  id: string;
  storyId: string;
  title: string;
  description: string;

  // Assignment
  assignedTo: string; // crew member ID
  assignedBy: string; // usually 'riker'

  // Estimation
  estimatedHours: number;
  actualHours?: number;

  // Status
  status: "pending" | "in_progress" | "completed";
  completedAt?: string;

  // RAG integration
  memoriesApplied: string[]; // memory IDs used
  lessonsLearned?: string; // becomes new memory

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * User Story
 * Core unit of work in a sprint
 */
export interface Story {
  id: string;
  sprintId: string;
  projectId: string;
  domainSlug?: string; // Links to project domain

  // Story content
  title: string;
  description: string;
  acceptanceCriteria: string[];

  // Classification
  type: StoryType;
  priority: Priority;
  tags: string[];

  // Estimation (Quark + Riker collaboration)
  storyPoints: StoryPoints;
  estimatedCost: number; // $ estimate by Quark
  actualCost?: number;

  // Time tracking
  estimatedHours: number;
  actualHours: number;

  // Assignment (Riker coordination)
  assignedCrew: CrewAssignment[];
  leadCrew: string; // Primary responsible crew member ID

  // Status
  status: StoryStatus;
  blockedReason?: string;

  // Tasks breakdown
  tasks: SprintTask[];

  // Dependencies
  dependsOn: string[]; // Story IDs this depends on
  blocks: string[]; // Story IDs blocked by this

  // Progress
  progress: number; // 0-100 calculated from tasks

  // RAG integration
  relatedMemories: string[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

/**
 * Sprint
 * Time-boxed iteration containing stories
 */
export interface Sprint {
  id: string;
  projectId: string;

  // Sprint info
  name: string;
  goal: string;
  sprintNumber: number;

  // Time box
  startDate: string;
  endDate: string;
  duration: number; // days

  // Capacity planning
  teamCapacity: number; // total story points team can handle
  committedPoints: number; // points committed to this sprint
  completedPoints: number; // points completed

  // Cost tracking (Quark's domain)
  budgetedCost: number; // $ allocated
  actualCost: number; // $ spent
  projectedROI: number; // expected return %

  // Velocity tracking
  velocity: number; // average points per sprint (rolling)

  // Status
  status: "planning" | "active" | "review" | "completed";

  // Stories
  stories: Story[];

  // Retrospective
  retrospective?: {
    whatWentWell: string[];
    whatToImprove: string[];
    actionItems: string[];
    crewFeedback: Record<string, string>; // crew ID -> feedback
  };

  // Crew participation
  activeCrewMembers: string[];

  // Metrics history for burndown
  dailyProgress: DailyProgress[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Daily progress snapshot for burndown chart
 */
export interface DailyProgress {
  date: string;
  remainingPoints: number;
  completedPoints: number;
  remainingHours: number;
  completedHours: number;
  blockedStories: number;
  activeCrew: number;
  dailyCost: number;
}

/**
 * Sprint metrics for infographics
 */
export interface SprintMetrics {
  // Velocity
  currentVelocity: number;
  averageVelocity: number;
  velocityTrend: "increasing" | "stable" | "decreasing";

  // Burndown
  idealBurndown: number[];
  actualBurndown: number[];
  projectedCompletion: string; // date

  // Cost efficiency (Quark metrics)
  costPerPoint: number;
  budgetUtilization: number; // %
  projectedOverUnder: number; // $ over/under budget
  roi: number; // projected ROI %

  // Team health
  crewUtilization: Record<string, number>; // crew ID -> % utilized
  blockerCount: number;
  cycleTime: number; // avg days per story

  // Quality
  defectsFound: number;
  storiesReopened: number;
  acceptanceCriteriaMet: number; // %
}

/**
 * Calculate story progress from tasks
 */
export function calculateStoryProgress(story: Story): number {
  if (story.tasks.length === 0) {
    return story.status === "done" ? 100 : 0;
  }

  const completedTasks = story.tasks.filter(
    (t) => t.status === "completed"
  ).length;
  return Math.round((completedTasks / story.tasks.length) * 100);
}

/**
 * Calculate sprint metrics
 */
export function calculateSprintMetrics(
  sprint: Sprint,
  historicalSprints: Sprint[] = []
): SprintMetrics {
  const stories = sprint.stories;
  const completedStories = stories.filter((s) => s.status === "done");
  const blockedStories = stories.filter((s) => s.status === "blocked");

  // Velocity calculations
  const completedPoints = completedStories.reduce(
    (sum, s) => sum + s.storyPoints,
    0
  );
  const avgVelocity =
    historicalSprints.length > 0
      ? historicalSprints.reduce((sum, s) => sum + s.completedPoints, 0) /
        historicalSprints.length
      : completedPoints;

  // Determine velocity trend
  let velocityTrend: "increasing" | "stable" | "decreasing" = "stable";
  if (historicalSprints.length >= 2) {
    const recent = historicalSprints.slice(-2);
    if (recent[1].completedPoints > recent[0].completedPoints * 1.1)
      velocityTrend = "increasing";
    if (recent[1].completedPoints < recent[0].completedPoints * 0.9)
      velocityTrend = "decreasing";
  }

  // Burndown calculations
  const totalPoints = sprint.committedPoints;
  const daysInSprint = sprint.duration;
  const idealBurndown = Array.from({ length: daysInSprint + 1 }, (_, i) =>
    Math.round(totalPoints * (1 - i / daysInSprint))
  );

  const actualBurndown = sprint.dailyProgress.map((d) => d.remainingPoints);

  // Cost metrics (Quark's analysis)
  const totalActualCost = stories.reduce(
    (sum, s) => sum + (s.actualCost || 0),
    0
  );
  const costPerPoint =
    completedPoints > 0 ? totalActualCost / completedPoints : 0;
  const budgetUtilization =
    sprint.budgetedCost > 0 ? (totalActualCost / sprint.budgetedCost) * 100 : 0;
  const projectedOverUnder = sprint.budgetedCost - totalActualCost;

  // Calculate projected completion
  const remainingPoints = totalPoints - completedPoints;
  const avgPointsPerDay =
    sprint.dailyProgress.length > 0
      ? sprint.dailyProgress.reduce(
          (sum, d) => sum + (d.completedPoints || 0),
          0
        ) / sprint.dailyProgress.length
      : 0;
  const daysRemaining =
    avgPointsPerDay > 0
      ? Math.ceil(remainingPoints / avgPointsPerDay)
      : daysInSprint;
  const projectedDate = new Date();
  projectedDate.setDate(projectedDate.getDate() + daysRemaining);

  // Crew utilization
  const crewUtilization: Record<string, number> = {};
  sprint.activeCrewMembers.forEach((crewId) => {
    const assignedStories = stories.filter((s) =>
      s.assignedCrew.some((c) => (c.memberId || c.crewMemberId) === crewId)
    );
    const totalAssignedPoints = assignedStories.reduce(
      (sum, s) => sum + s.storyPoints,
      0
    );
    crewUtilization[crewId] = Math.min(
      100,
      (totalAssignedPoints /
        (sprint.teamCapacity / sprint.activeCrewMembers.length)) *
        100
    );
  });

  // Cycle time
  const completedWithDates = completedStories.filter(
    (s) => s.startedAt && s.completedAt
  );
  const avgCycleTime =
    completedWithDates.length > 0
      ? completedWithDates.reduce((sum, s) => {
          const start = new Date(s.startedAt!);
          const end = new Date(s.completedAt!);
          return (
            sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
          );
        }, 0) / completedWithDates.length
      : 0;

  return {
    currentVelocity: completedPoints,
    averageVelocity: avgVelocity,
    velocityTrend,
    idealBurndown,
    actualBurndown,
    projectedCompletion: projectedDate.toISOString(),
    costPerPoint,
    budgetUtilization,
    projectedOverUnder,
    roi: sprint.projectedROI,
    crewUtilization,
    blockerCount: blockedStories.length,
    cycleTime: avgCycleTime,
    defectsFound: stories.filter((s) => s.type === "bug").length,
    storiesReopened: 0, // Would need tracking
    acceptanceCriteriaMet:
      completedStories.length > 0
        ? (completedStories.filter((s) => s.progress === 100).length /
            completedStories.length) *
          100
        : 0,
  };
}

/**
 * Create a new sprint
 */
export function createSprint(
  projectId: string,
  sprintNumber: number,
  options: Partial<Sprint> = {}
): Sprint {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + (options.duration || 14));

  return {
    id: `sprint_${projectId}_${sprintNumber}_${Date.now()}`,
    projectId,
    name: options.name || `Sprint ${sprintNumber}`,
    goal: options.goal || "",
    sprintNumber,
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    duration: options.duration || 14,
    teamCapacity: options.teamCapacity || 40, // default 40 points
    committedPoints: 0,
    completedPoints: 0,
    budgetedCost: options.budgetedCost || 0,
    actualCost: 0,
    projectedROI: options.projectedROI || 0,
    velocity: options.velocity || 0,
    status: "planning",
    stories: [],
    activeCrewMembers: options.activeCrewMembers || [],
    dailyProgress: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

/**
 * Create a new story
 */
export function createStory(
  sprintId: string,
  projectId: string,
  options: Partial<Story> = {}
): Story {
  const now = new Date().toISOString();

  return {
    id: `story_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sprintId,
    projectId,
    domainSlug: options.domainSlug,
    title: options.title || "New Story",
    description: options.description || "",
    acceptanceCriteria: options.acceptanceCriteria || [],
    type: options.type || "feature",
    priority: options.priority || "medium",
    tags: options.tags || [],
    storyPoints: options.storyPoints || 3,
    estimatedCost: options.estimatedCost || 0,
    estimatedHours: options.estimatedHours || 0,
    actualHours: 0,
    assignedCrew: options.assignedCrew || [],
    leadCrew: options.leadCrew || "",
    status: "backlog",
    tasks: [],
    dependsOn: options.dependsOn || [],
    blocks: [],
    progress: 0,
    relatedMemories: options.relatedMemories || [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create a task for a story
 */
export function createTask(
  storyId: string,
  assignedTo: string,
  options: Partial<SprintTask> = {}
): SprintTask {
  const now = new Date().toISOString();

  return {
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    storyId,
    title: options.title || "New Task",
    description: options.description || "",
    assignedTo,
    assignedBy: options.assignedBy || "commander_riker",
    estimatedHours: options.estimatedHours || 2,
    status: "pending",
    memoriesApplied: options.memoriesApplied || [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Estimate story cost (Quark's formula)
 * Based on story points, crew hourly rates, and complexity
 */
export function estimateStoryCost(
  storyPoints: StoryPoints,
  assignedCrew: string[],
  complexity: "low" | "medium" | "high" = "medium"
): number {
  // Base rate per story point (Quark's Rule of Acquisition #9: Opportunity plus instinct equals profit)
  const baseRatePerPoint = 150; // $150 per story point

  // Complexity multipliers
  const complexityMultiplier = {
    low: 0.8,
    medium: 1.0,
    high: 1.5,
  };

  // Crew size bonus (more crew = higher cost but faster delivery)
  const crewMultiplier = 1 + (assignedCrew.length - 1) * 0.15;

  return Math.round(
    storyPoints *
      baseRatePerPoint *
      complexityMultiplier[complexity] *
      crewMultiplier
  );
}

/**
 * Calculate ROI projection for sprint
 * (Quark's business analysis)
 */
export function calculateSprintROI(
  sprint: Sprint,
  projectedRevenue: number
): { roi: number; breakeven: number; recommendation: string } {
  const totalCost =
    sprint.budgetedCost ||
    sprint.stories.reduce((sum, s) => sum + s.estimatedCost, 0);
  const roi =
    totalCost > 0 ? ((projectedRevenue - totalCost) / totalCost) * 100 : 0;

  // Breakeven in sprints (how many sprints to pay off investment)
  const breakeven =
    projectedRevenue > 0 ? totalCost / projectedRevenue : Infinity;

  // Quark's recommendation
  let recommendation = "";
  if (roi > 200) {
    recommendation =
      "Excellent investment! As the 34th Rule of Acquisition states: 'War is good for business.' This sprint is a gold mine.";
  } else if (roi > 100) {
    recommendation =
      "Solid returns expected. Rule #57: 'Good customers are as rare as latinum - treasure them.'";
  } else if (roi > 50) {
    recommendation =
      "Acceptable profit margins. Consider reducing scope to improve efficiency.";
  } else if (roi > 0) {
    recommendation =
      "Marginal returns. Rule #3: 'Never spend more for an acquisition than you have to.'";
  } else {
    recommendation =
      "Warning: Negative ROI projected. Rule #62: 'The riskier the road, the greater the profit' - but this seems too risky.";
  }

  return { roi, breakeven, recommendation };
}

/**
 * Get status color for UI
 */
export function getStoryStatusColor(status: StoryStatus): string {
  const colors: Record<StoryStatus, string> = {
    backlog: "#6b7280",
    todo: "#8b5cf6",
    in_progress: "#3b82f6",
    review: "#f59e0b",
    done: "#10b981",
    blocked: "#ef4444",
  };
  return colors[status];
}

/**
 * Get priority color for UI
 */
export function getPriorityColor(priority: Priority): string {
  const colors: Record<Priority, string> = {
    critical: "#ef4444",
    high: "#f59e0b",
    medium: "#3b82f6",
    low: "#6b7280",
  };
  return colors[priority];
}

/**
 * Get story type icon
 */
export function getStoryTypeIcon(type: StoryType): string {
  const icons: Record<StoryType, string> = {
    feature: "✨",
    bug: "🐛",
    tech_debt: "🔧",
    spike: "🔬",
    documentation: "📚",
  };
  return icons[type];
}


