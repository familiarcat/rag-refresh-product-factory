import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import {
  Sprint,
  Story,
  createStory,
  StoryPoints,
  StoryType,
  Priority,
  estimateStoryCost,
} from "../../../../lib/sprints";
import {
  crewRoster,
  findOptimalTeam,
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
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  domains: Array<{
    slug: string;
    name: string;
    description: string;
    features: string[];
    status: string;
    progress: number;
  }>;
}

// Crew member perspectives for sprint planning
const crewPerspectives: Record<string, {
  focus: string;
  storyTypes: StoryType[];
  keywords: string[];
  questionPrompt: string;
}> = {
  captain_picard: {
    focus: "Strategic vision and architecture",
    storyTypes: ["feature", "spike"],
    keywords: ["strategy", "architecture", "vision", "leadership", "decision"],
    questionPrompt: "What strategic objectives should guide this sprint?",
  },
  commander_riker: {
    focus: "Tactical execution and team coordination",
    storyTypes: ["feature", "tech_debt"],
    keywords: ["coordinate", "execute", "team", "velocity", "delivery"],
    questionPrompt: "How should we organize the team for maximum velocity?",
  },
  commander_data: {
    focus: "Technical analysis and AI/ML systems",
    storyTypes: ["feature", "spike", "tech_debt"],
    keywords: ["ai", "algorithm", "analysis", "data", "optimization", "rag", "llm"],
    questionPrompt: "What technical implementations are needed?",
  },
  geordi_la_forge: {
    focus: "Infrastructure and DevOps",
    storyTypes: ["feature", "tech_debt", "bug"],
    keywords: ["infrastructure", "deploy", "docker", "ci", "cd", "aws", "performance"],
    questionPrompt: "What infrastructure work is required?",
  },
  lieutenant_worf: {
    focus: "Security and testing",
    storyTypes: ["feature", "bug", "tech_debt"],
    keywords: ["security", "auth", "test", "validation", "protection"],
    questionPrompt: "What security and testing stories are needed?",
  },
  counselor_troi: {
    focus: "User experience and design",
    storyTypes: ["feature", "documentation"],
    keywords: ["ux", "ui", "user", "experience", "design", "accessibility"],
    questionPrompt: "How can we improve the user experience?",
  },
  chief_obrien: {
    focus: "Implementation and debugging",
    storyTypes: ["bug", "tech_debt", "feature"],
    keywords: ["implement", "fix", "debug", "practical", "working"],
    questionPrompt: "What practical implementation work is needed?",
  },
  quark: {
    focus: "Business value and ROI",
    storyTypes: ["feature", "spike"],
    keywords: ["revenue", "cost", "value", "monetization", "profit", "roi"],
    questionPrompt: "What will deliver the most business value?",
  },
  dr_crusher: {
    focus: "System health and documentation",
    storyTypes: ["documentation", "bug", "tech_debt"],
    keywords: ["health", "monitor", "document", "quality", "diagnostic"],
    questionPrompt: "What documentation and health checks are needed?",
  },
  lieutenant_uhura: {
    focus: "APIs and integrations",
    storyTypes: ["feature", "tech_debt"],
    keywords: ["api", "integration", "communication", "protocol", "webhook"],
    questionPrompt: "What API and integration work is required?",
  },
};

async function loadSprints(): Promise<SprintsData> {
  try {
    const data = await fs.readFile(SPRINTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return {
      sprints: [],
      meta: { version: "1.0", createdAt: new Date().toISOString(), description: "" },
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

async function loadProject(projectId: string): Promise<Project | null> {
  try {
    const data = await fs.readFile(PROJECTS_FILE, "utf-8");
    const { projects } = JSON.parse(data);
    return projects.find((p: Project) => p.id === projectId) || null;
  } catch {
    return null;
  }
}

/**
 * POST /api/sprints/plan
 * 
 * Convene the crew for sprint planning:
 * - analyze-goal: Crew analyzes sprint goal and suggests stories
 * - deliberate: Crew deliberates on story priorities and estimates
 * - assign-all: Riker assigns optimal crews to all stories
 * - full-planning: Complete planning session (all of the above)
 */
export async function POST(req: Request) {
  const body = await req.json();
  const { action, sprintId, ...payload } = body;

  const sprintsData = await loadSprints();
  const sprintIndex = sprintsData.sprints.findIndex((s) => s.id === sprintId);

  if (sprintIndex === -1) {
    return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
  }

  const sprint = sprintsData.sprints[sprintIndex];
  const memories = await loadMemories();
  const project = await loadProject(sprint.projectId);

  switch (action) {
    case "analyze-goal": {
      // Each crew member analyzes the sprint goal
      const crewAnalysis = analyzeSprintGoal(sprint.goal, project, memories);
      
      return NextResponse.json({
        ok: true,
        analysis: crewAnalysis,
        suggestedStoryCount: crewAnalysis.reduce((sum, a) => sum + a.suggestedStories.length, 0),
      });
    }

    case "generate-stories": {
      // Generate stories from crew analysis
      const crewAnalysis = analyzeSprintGoal(sprint.goal, project, memories);
      const generatedStories: Story[] = [];

      for (const analysis of crewAnalysis) {
        for (const suggestion of analysis.suggestedStories) {
          const story = createStory(sprint.id, sprint.projectId, {
            title: suggestion.title,
            description: suggestion.description,
            type: suggestion.type,
            priority: suggestion.priority,
            storyPoints: suggestion.points as StoryPoints,
            tags: [analysis.crewId, ...suggestion.tags],
            acceptanceCriteria: suggestion.acceptanceCriteria,
            estimatedHours: suggestion.points * 4,
          });

          // Find and assign optimal crew
          const { team } = findOptimalTeamForStory(story, suggestion.requiredSkills);
          story.assignedCrew = team.map((m) => ({
            memberId: m.id,
            role: m.specializations[0] || "contributor",
            assignment: story.title,
          }));
          story.leadCrew = team[0]?.id || analysis.crewId;

          // Estimate cost
          story.estimatedCost = estimateStoryCost(
            story.storyPoints,
            team.map((m) => m.id),
            story.priority === "critical" || story.priority === "high" ? "high" : "medium"
          );

          generatedStories.push(story);
        }
      }

      // Add stories to sprint
      sprint.stories.push(...generatedStories);
      sprint.committedPoints = sprint.stories.reduce((sum, s) => sum + s.storyPoints, 0);
      sprint.budgetedCost = sprint.stories.reduce((sum, s) => sum + s.estimatedCost, 0);
      sprint.activeCrewMembers = [...new Set(
        sprint.stories.flatMap((s) => s.assignedCrew.map((c) => c.memberId || ""))
      )].filter(Boolean);
      sprint.updatedAt = new Date().toISOString();

      sprintsData.sprints[sprintIndex] = sprint;
      await saveSprints(sprintsData);

      // Generate planning summary
      const summary = generatePlanningSession(sprint, generatedStories, memories);

      return NextResponse.json({
        ok: true,
        sprint,
        storiesGenerated: generatedStories.length,
        totalPoints: sprint.committedPoints,
        totalBudget: sprint.budgetedCost,
        planningSession: summary,
      });
    }

    case "deliberate": {
      // Crew deliberates on existing stories
      const deliberation = deliberateOnStories(sprint.stories, memories);

      return NextResponse.json({
        ok: true,
        deliberation,
      });
    }

    case "assign-all": {
      // Riker assigns optimal crews to all unassigned stories
      const unassigned = sprint.stories.filter((s) => s.assignedCrew.length === 0);
      const assignments: { storyId: string; team: string[]; synergy: number }[] = [];

      for (const story of unassigned) {
        const skills = inferSkillsFromStory(story);
        const { team, pairs } = findOptimalTeamForStory(story, skills);

        story.assignedCrew = team.map((m) => ({
          memberId: m.id,
          role: m.specializations[0] || "contributor",
          assignment: story.title,
        }));
        story.leadCrew = team[0]?.id || "";
        story.estimatedCost = estimateStoryCost(
          story.storyPoints,
          team.map((m) => m.id),
          story.priority === "critical" ? "high" : "medium"
        );

        assignments.push({
          storyId: story.id,
          team: team.map((m) => m.name),
          synergy: pairs.length > 0 ? Math.round(pairs.reduce((sum, p) => sum + p.synergy, 0) / pairs.length) : 75,
        });
      }

      // Update sprint metrics
      sprint.activeCrewMembers = [...new Set(
        sprint.stories.flatMap((s) => s.assignedCrew.map((c) => c.memberId || ""))
      )].filter(Boolean);
      sprint.budgetedCost = sprint.stories.reduce((sum, s) => sum + s.estimatedCost, 0);
      sprint.updatedAt = new Date().toISOString();

      sprintsData.sprints[sprintIndex] = sprint;
      await saveSprints(sprintsData);

      return NextResponse.json({
        ok: true,
        assignments,
        totalAssigned: assignments.length,
        rikerBriefing: generateRikerAssignmentBriefing(assignments),
      });
    }

    case "full-planning": {
      // Complete sprint planning session
      const crewAnalysis = analyzeSprintGoal(sprint.goal, project, memories);
      const generatedStories: Story[] = [];

      // Generate stories from each crew member's analysis
      for (const analysis of crewAnalysis) {
        for (const suggestion of analysis.suggestedStories) {
          const story = createStory(sprint.id, sprint.projectId, {
            title: suggestion.title,
            description: suggestion.description,
            type: suggestion.type,
            priority: suggestion.priority,
            storyPoints: suggestion.points as StoryPoints,
            tags: [analysis.crewId, ...suggestion.tags],
            acceptanceCriteria: suggestion.acceptanceCriteria,
            estimatedHours: suggestion.points * 4,
          });

          const { team } = findOptimalTeamForStory(story, suggestion.requiredSkills);
          story.assignedCrew = team.map((m) => ({
            memberId: m.id,
            role: m.specializations[0] || "contributor",
            assignment: story.title,
          }));
          story.leadCrew = team[0]?.id || analysis.crewId;
          story.estimatedCost = estimateStoryCost(
            story.storyPoints,
            team.map((m) => m.id),
            story.priority === "critical" || story.priority === "high" ? "high" : "medium"
          );

          generatedStories.push(story);
        }
      }

      // Deliberate on generated stories
      const deliberation = deliberateOnStories(generatedStories, memories);

      // Apply deliberation adjustments
      for (const story of generatedStories) {
        const adjustment = deliberation.adjustments.find((a) => a.storyId === story.id);
        if (adjustment) {
          if (adjustment.newPriority) story.priority = adjustment.newPriority;
          if (adjustment.newPoints) {
            story.storyPoints = adjustment.newPoints as StoryPoints;
            story.estimatedHours = adjustment.newPoints * 4;
            story.estimatedCost = estimateStoryCost(
              story.storyPoints,
              story.assignedCrew.map((c) => c.memberId || ""),
              story.priority === "critical" ? "high" : "medium"
            );
          }
        }
      }

      // Update sprint
      sprint.stories = generatedStories;
      sprint.committedPoints = sprint.stories.reduce((sum, s) => sum + s.storyPoints, 0);
      sprint.budgetedCost = sprint.stories.reduce((sum, s) => sum + s.estimatedCost, 0);
      sprint.activeCrewMembers = [...new Set(
        sprint.stories.flatMap((s) => s.assignedCrew.map((c) => c.memberId || ""))
      )].filter(Boolean);
      sprint.updatedAt = new Date().toISOString();

      sprintsData.sprints[sprintIndex] = sprint;
      await saveSprints(sprintsData);

      // Generate comprehensive planning summary
      const planningSession = generatePlanningSession(sprint, generatedStories, memories);

      return NextResponse.json({
        ok: true,
        sprint,
        planningSession,
        crewAnalysis: crewAnalysis.map((a) => ({
          crewMember: a.crewName,
          perspective: a.perspective,
          storiesSuggested: a.suggestedStories.length,
        })),
        deliberation: {
          consensus: deliberation.consensus,
          adjustmentsMade: deliberation.adjustments.length,
        },
        summary: {
          totalStories: sprint.stories.length,
          totalPoints: sprint.committedPoints,
          totalBudget: sprint.budgetedCost,
          crewInvolved: sprint.activeCrewMembers.length,
          estimatedROI: calculateEstimatedROI(sprint),
        },
      });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

/**
 * Analyze sprint goal from each crew member's perspective
 */
function analyzeSprintGoal(
  goal: string,
  project: Project | null,
  memories: Memory[]
): Array<{
  crewId: string;
  crewName: string;
  perspective: string;
  suggestedStories: Array<{
    title: string;
    description: string;
    type: StoryType;
    priority: Priority;
    points: number;
    tags: string[];
    acceptanceCriteria: string[];
    requiredSkills: string[];
  }>;
}> {
  const analysis: ReturnType<typeof analyzeSprintGoal> = [];
  const goalLower = goal.toLowerCase();
  const projectDomains = project?.domains || [];

  for (const [crewId, perspective] of Object.entries(crewPerspectives)) {
    const crewMember = getCrewMember(crewId);
    if (!crewMember) continue;

    // Check relevance of this crew member to the goal
    const relevanceScore = perspective.keywords.filter((k) => goalLower.includes(k)).length;
    const domainRelevance = projectDomains.some((d) =>
      perspective.keywords.some((k) => d.name.toLowerCase().includes(k) || d.description.toLowerCase().includes(k))
    );

    // Get crew memories for context
    const crewMemories = memories.filter((m) => m.crewId === crewId).slice(0, 3);

    // Generate stories based on crew expertise and goal analysis
    const suggestedStories = generateCrewStories(
      crewId,
      crewMember.name,
      perspective,
      goal,
      projectDomains,
      crewMemories,
      relevanceScore + (domainRelevance ? 2 : 0)
    );

    if (suggestedStories.length > 0) {
      analysis.push({
        crewId,
        crewName: crewMember.name,
        perspective: perspective.focus,
        suggestedStories,
      });
    }
  }

  return analysis;
}

/**
 * Generate stories from a crew member's perspective
 */
function generateCrewStories(
  crewId: string,
  crewName: string,
  perspective: typeof crewPerspectives[string],
  goal: string,
  domains: Project["domains"],
  memories: Memory[],
  relevanceScore: number
): Array<{
  title: string;
  description: string;
  type: StoryType;
  priority: Priority;
  points: number;
  tags: string[];
  acceptanceCriteria: string[];
  requiredSkills: string[];
}> {
  const stories: ReturnType<typeof generateCrewStories> = [];
  const goalWords = goal.toLowerCase().split(/\s+/);

  // Story templates per crew member
  const templates = getStoryTemplates(crewId, goal, domains);

  // Generate 1-3 stories based on relevance
  const storyCount = Math.min(3, Math.max(1, Math.ceil(relevanceScore / 2)));

  for (let i = 0; i < storyCount && i < templates.length; i++) {
    const template = templates[i];
    stories.push({
      ...template,
      tags: [crewId.replace("_", "-"), ...template.tags],
    });
  }

  return stories;
}

/**
 * Get story templates based on crew member and goal
 */
function getStoryTemplates(
  crewId: string,
  goal: string,
  domains: Project["domains"]
): Array<{
  title: string;
  description: string;
  type: StoryType;
  priority: Priority;
  points: number;
  tags: string[];
  acceptanceCriteria: string[];
  requiredSkills: string[];
}> {
  const goalLower = goal.toLowerCase();

  // Extract key concepts from goal
  const concepts = extractConcepts(goal);

  const templatesByCrewId: Record<string, ReturnType<typeof getStoryTemplates>> = {
    captain_picard: [
      {
        title: `Define strategic architecture for ${concepts.primary}`,
        description: `Establish the high-level architecture and strategic direction for ${goal}`,
        type: "spike",
        priority: "high",
        points: 5,
        tags: ["architecture", "strategy"],
        acceptanceCriteria: [
          "Architecture diagram created",
          "Key decisions documented",
          "Team alignment achieved",
        ],
        requiredSkills: ["architecture", "leadership"],
      },
      {
        title: `Create vision document for ${concepts.primary}`,
        description: `Document the strategic vision and success criteria`,
        type: "documentation",
        priority: "medium",
        points: 3,
        tags: ["documentation", "vision"],
        acceptanceCriteria: ["Vision document complete", "Stakeholder review done"],
        requiredSkills: ["documentation", "strategy"],
      },
    ],
    commander_riker: [
      {
        title: `Coordinate team workflow for ${concepts.primary}`,
        description: `Establish efficient team coordination and delivery pipeline`,
        type: "feature",
        priority: "high",
        points: 5,
        tags: ["coordination", "workflow"],
        acceptanceCriteria: [
          "Workflow documented",
          "Team assignments clear",
          "Communication channels established",
        ],
        requiredSkills: ["coordination", "project-management"],
      },
    ],
    commander_data: [
      {
        title: `Implement core ${concepts.technical} logic`,
        description: `Build the primary technical implementation for ${goal}`,
        type: "feature",
        priority: "critical",
        points: 8,
        tags: ["implementation", "core"],
        acceptanceCriteria: [
          "Core functionality implemented",
          "Unit tests passing",
          "Performance benchmarks met",
        ],
        requiredSkills: ["development", "ai-integration", "algorithm-design"],
      },
      {
        title: `Design data model for ${concepts.primary}`,
        description: `Create optimal data structures and models`,
        type: "spike",
        priority: "high",
        points: 5,
        tags: ["data-model", "design"],
        acceptanceCriteria: ["Data model documented", "Schema validated"],
        requiredSkills: ["database-design", "analysis"],
      },
    ],
    geordi_la_forge: [
      {
        title: `Set up infrastructure for ${concepts.primary}`,
        description: `Configure deployment and infrastructure requirements`,
        type: "feature",
        priority: "high",
        points: 5,
        tags: ["infrastructure", "devops"],
        acceptanceCriteria: [
          "Infrastructure provisioned",
          "CI/CD pipeline configured",
          "Deployment tested",
        ],
        requiredSkills: ["infrastructure", "ci-cd", "docker"],
      },
    ],
    lieutenant_worf: [
      {
        title: `Implement security measures for ${concepts.primary}`,
        description: `Add authentication, authorization, and security validation`,
        type: "feature",
        priority: "high",
        points: 5,
        tags: ["security", "auth"],
        acceptanceCriteria: [
          "Security controls implemented",
          "Vulnerability scan passed",
          "Access controls tested",
        ],
        requiredSkills: ["security", "auth-systems", "testing"],
      },
      {
        title: `Create test suite for ${concepts.primary}`,
        description: `Build comprehensive test coverage`,
        type: "tech_debt",
        priority: "medium",
        points: 3,
        tags: ["testing", "quality"],
        acceptanceCriteria: ["Test coverage > 80%", "All critical paths tested"],
        requiredSkills: ["testing", "quality-assurance"],
      },
    ],
    counselor_troi: [
      {
        title: `Design user experience for ${concepts.primary}`,
        description: `Create intuitive and accessible user interface`,
        type: "feature",
        priority: "high",
        points: 5,
        tags: ["ux", "design"],
        acceptanceCriteria: [
          "UI mockups approved",
          "Accessibility standards met",
          "User flow documented",
        ],
        requiredSkills: ["ux-design", "accessibility", "frontend"],
      },
    ],
    chief_obrien: [
      {
        title: `Implement ${concepts.action} functionality`,
        description: `Build the practical working implementation`,
        type: "feature",
        priority: "high",
        points: 8,
        tags: ["implementation", "practical"],
        acceptanceCriteria: [
          "Feature fully functional",
          "Edge cases handled",
          "Integration tested",
        ],
        requiredSkills: ["development", "debugging", "integration"],
      },
      {
        title: `Fix known issues in ${concepts.primary}`,
        description: `Address bugs and technical debt`,
        type: "bug",
        priority: "medium",
        points: 3,
        tags: ["bugfix", "maintenance"],
        acceptanceCriteria: ["All reported bugs fixed", "No regressions"],
        requiredSkills: ["debugging", "troubleshooting"],
      },
    ],
    quark: [
      {
        title: `Define monetization strategy for ${concepts.primary}`,
        description: `Establish revenue model and cost optimization`,
        type: "spike",
        priority: "high",
        points: 3,
        tags: ["business", "monetization"],
        acceptanceCriteria: [
          "Revenue model documented",
          "Cost projections complete",
          "ROI targets defined",
        ],
        requiredSkills: ["business-analysis", "pricing-strategy"],
      },
    ],
    dr_crusher: [
      {
        title: `Create documentation for ${concepts.primary}`,
        description: `Write comprehensive technical and user documentation`,
        type: "documentation",
        priority: "medium",
        points: 3,
        tags: ["documentation", "quality"],
        acceptanceCriteria: [
          "Technical docs complete",
          "User guide written",
          "API documented",
        ],
        requiredSkills: ["documentation", "communication"],
      },
      {
        title: `Set up monitoring for ${concepts.primary}`,
        description: `Implement health checks and monitoring`,
        type: "feature",
        priority: "medium",
        points: 3,
        tags: ["monitoring", "health"],
        acceptanceCriteria: ["Health endpoints live", "Alerts configured"],
        requiredSkills: ["monitoring", "diagnostics"],
      },
    ],
    lieutenant_uhura: [
      {
        title: `Design API for ${concepts.primary}`,
        description: `Create RESTful API and integration points`,
        type: "feature",
        priority: "high",
        points: 5,
        tags: ["api", "integration"],
        acceptanceCriteria: [
          "API spec documented",
          "Endpoints implemented",
          "Integration tests passing",
        ],
        requiredSkills: ["api-design", "integration", "communication"],
      },
    ],
  };

  return templatesByCrewId[crewId] || [];
}

/**
 * Extract key concepts from goal text
 */
function extractConcepts(goal: string): { primary: string; technical: string; action: string } {
  const words = goal.split(/\s+/);
  
  // Find key nouns and verbs
  const actionWords = ["organize", "create", "build", "implement", "design", "develop", "establish"];
  const action = words.find((w) => actionWords.some((a) => w.toLowerCase().includes(a))) || "implement";
  
  // Extract primary concept (longest meaningful phrase)
  const primary = goal.length > 50 ? goal.substring(0, 50) + "..." : goal;
  
  // Technical concept
  const techWords = ["system", "editor", "platform", "service", "api", "integration"];
  const technical = words.find((w) => techWords.some((t) => w.toLowerCase().includes(t))) || "system";

  return { primary, technical, action };
}

/**
 * Find optimal team for a story
 */
function findOptimalTeamForStory(
  story: Story,
  requiredSkills: string[]
): { team: typeof crewRoster; pairs: Array<{ leadId: string; supportId: string; synergy: number; reasoning: string }> } {
  const task = {
    id: story.id,
    projectId: story.projectId,
    domainSlug: story.domainSlug || "general",
    taskType: "development" as const,
    description: story.title,
    requiredSkills,
    estimatedHours: story.estimatedHours,
    priority: story.priority,
    status: "pending" as const,
  };

  return findOptimalTeam(task, 3);
}

/**
 * Infer skills from story content
 */
function inferSkillsFromStory(story: Story): string[] {
  const text = `${story.title} ${story.description} ${story.tags.join(" ")}`.toLowerCase();
  const skills: string[] = [];

  const skillMap: Record<string, string[]> = {
    "ai|llm|model": ["ai-integration", "prompt-engineering"],
    "api|endpoint": ["api-design", "backend"],
    "ui|frontend|ux": ["ux-design", "frontend"],
    "security|auth": ["security", "auth-systems"],
    "database|data": ["database-ops"],
    "deploy|docker|ci": ["ci-cd", "infrastructure"],
    "test": ["testing", "quality-assurance"],
  };

  for (const [pattern, mappedSkills] of Object.entries(skillMap)) {
    if (new RegExp(pattern).test(text)) {
      skills.push(...mappedSkills);
    }
  }

  return [...new Set(skills)];
}

/**
 * Crew deliberation on stories
 */
function deliberateOnStories(
  stories: Story[],
  memories: Memory[]
): {
  consensus: string;
  adjustments: Array<{
    storyId: string;
    storyTitle: string;
    newPriority?: Priority;
    newPoints?: number;
    reason: string;
    crewMember: string;
  }>;
  crewFeedback: Record<string, string>;
} {
  const adjustments: ReturnType<typeof deliberateOnStories>["adjustments"] = [];
  const crewFeedback: Record<string, string> = {};

  // Quark reviews costs
  const totalCost = stories.reduce((sum, s) => sum + s.estimatedCost, 0);
  const expensiveStories = stories.filter((s) => s.estimatedCost > 1000);

  if (expensiveStories.length > 0) {
    crewFeedback["quark"] = `I've identified ${expensiveStories.length} high-cost stories totaling $${totalCost}. ` +
      `Rule of Acquisition #3: "Never spend more for an acquisition than you have to." ` +
      `Consider reducing scope on: ${expensiveStories.map((s) => s.title).join(", ")}`;
  }

  // Worf reviews security
  const securityStories = stories.filter((s) =>
    s.tags.some((t) => ["security", "auth", "worf"].includes(t.toLowerCase()))
  );
  if (securityStories.length === 0 && stories.length > 3) {
    crewFeedback["lieutenant_worf"] = "I note a lack of security-focused stories. " +
      "Every sprint should include security validation. Recommend adding security review.";
  }

  // Data reviews technical complexity
  const highPointStories = stories.filter((s) => s.storyPoints >= 8);
  for (const story of highPointStories) {
    if (Math.random() > 0.5) {
      adjustments.push({
        storyId: story.id,
        storyTitle: story.title,
        newPoints: Math.max(5, story.storyPoints - 3) as number,
        reason: "Story can be decomposed into smaller units for better velocity",
        crewMember: "Commander Data",
      });
    }
  }

  // Troi reviews user impact
  const uxStories = stories.filter((s) => s.tags.some((t) => ["ux", "ui", "design"].includes(t)));
  if (uxStories.length > 0) {
    crewFeedback["counselor_troi"] = `I sense ${uxStories.length} stories with user experience impact. ` +
      `Users will appreciate the attention to their needs. Prioritize user-facing features.`;
  }

  // Riker's tactical assessment
  const criticalStories = stories.filter((s) => s.priority === "critical");
  crewFeedback["commander_riker"] = criticalStories.length > 2
    ? `We have ${criticalStories.length} critical stories - may need to reassess priorities for realistic delivery.`
    : `Team is well-positioned for this sprint. All hands ready.`;

  // Generate consensus
  const consensus = stories.length > 0
    ? `Sprint planning complete with ${stories.length} stories totaling ${stories.reduce((sum, s) => sum + s.storyPoints, 0)} points. ` +
      `The crew has reviewed and deliberated. ${adjustments.length} adjustments recommended. ` +
      `Budget projection: $${totalCost.toLocaleString()}. Ready to proceed.`
    : "No stories to deliberate. Generate stories first.";

  return { consensus, adjustments, crewFeedback };
}

/**
 * Generate Riker's assignment briefing
 */
function generateRikerAssignmentBriefing(
  assignments: Array<{ storyId: string; team: string[]; synergy: number }>
): string {
  let briefing = `Commander Riker's Team Assignment Briefing\n${"━".repeat(45)}\n\n`;

  briefing += `**Assignments Made:** ${assignments.length} stories\n`;
  briefing += `**Average Team Synergy:** ${Math.round(
    assignments.reduce((sum, a) => sum + a.synergy, 0) / Math.max(assignments.length, 1)
  )}%\n\n`;

  briefing += `**Team Compositions:**\n`;
  for (const assignment of assignments.slice(0, 5)) {
    briefing += `• ${assignment.team.join(" + ")} (${assignment.synergy}% synergy)\n`;
  }

  if (assignments.length > 5) {
    briefing += `• ...and ${assignments.length - 5} more assignments\n`;
  }

  briefing += `\n"The team is assembled. Let's make it happen." - Commander Riker`;

  return briefing;
}

/**
 * Generate comprehensive planning session summary
 */
function generatePlanningSession(
  sprint: Sprint,
  stories: Story[],
  memories: Memory[]
): {
  sessionId: string;
  timestamp: string;
  attendees: string[];
  summary: string;
  decisions: string[];
  quarkAnalysis: string;
  rikerPlan: string;
} {
  const attendees = [...new Set(stories.flatMap((s) => s.assignedCrew.map((c) => c.memberId)))].filter(Boolean);
  const totalPoints = stories.reduce((sum, s) => sum + s.storyPoints, 0);
  const totalCost = stories.reduce((sum, s) => sum + s.estimatedCost, 0);

  const decisions = [
    `Sprint goal: "${sprint.goal}"`,
    `${stories.length} stories committed with ${totalPoints} total points`,
    `Team capacity: ${sprint.teamCapacity} points - Commitment ratio: ${Math.round((totalPoints / sprint.teamCapacity) * 100)}%`,
    `Budget allocation: $${totalCost.toLocaleString()}`,
    `${attendees.length} crew members assigned`,
  ];

  // Quark's analysis
  const costPerPoint = totalCost / Math.max(totalPoints, 1);
  const quarkAnalysis = `💰 Financial Assessment:\n` +
    `Cost per point: $${costPerPoint.toFixed(0)}\n` +
    `Total investment: $${totalCost.toLocaleString()}\n` +
    (costPerPoint < 150
      ? `Rule #9: "Opportunity plus instinct equals profit." Excellent efficiency!`
      : costPerPoint < 250
      ? `Acceptable investment. Watch for scope creep.`
      : `Rule #3 warning: Consider reducing scope to improve ROI.`);

  // Riker's plan
  const rikerPlan = `⚡ Execution Plan:\n` +
    `Sprint Duration: ${sprint.duration} days\n` +
    `Velocity Target: ${Math.round(totalPoints / (sprint.duration / 7))} points/week\n` +
    `Team ready for sprint start.\n` +
    `"Number One, make it so." - Picard`;

  return {
    sessionId: `plan_${sprint.id}_${Date.now()}`,
    timestamp: new Date().toISOString(),
    attendees: attendees.map((id) => getCrewMember(id)?.name || id),
    summary: `Sprint planning session for "${sprint.name}" complete. ${stories.length} stories planned, ${attendees.length} crew assigned, $${totalCost.toLocaleString()} budgeted.`,
    decisions,
    quarkAnalysis,
    rikerPlan,
  };
}

/**
 * Calculate estimated ROI
 */
function calculateEstimatedROI(sprint: Sprint): number {
  // Simple ROI estimation based on story types and points
  const featureValue = sprint.stories
    .filter((s) => s.type === "feature")
    .reduce((sum, s) => sum + s.storyPoints * 500, 0); // $500 value per feature point

  const bugValue = sprint.stories
    .filter((s) => s.type === "bug")
    .reduce((sum, s) => sum + s.storyPoints * 200, 0); // $200 value per bug fix point

  const totalValue = featureValue + bugValue;
  const totalCost = sprint.budgetedCost || 1;

  return Math.round(((totalValue - totalCost) / totalCost) * 100);
}
