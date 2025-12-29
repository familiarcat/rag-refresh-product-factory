/**
 * Sprint 0 Generation API
 *
 * Endpoint: POST /api/sprints/generate-sprint-zero
 *
 * Riker and Quark orchestrate Sprint 0 creation for projects.
 * Leverages RAG memories for crew expertise and collaboration.
 *
 * Workflow:
 * 1. Picard analyzes project goals
 * 2. Query RAG for relevant crew memories
 * 3. Riker organizes stories by crew
 * 4. Quark optimizes priorities
 * 5. Persist sprint + stories to database
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateSprint0 } from '@/lib/orchestration/sprint-zero-orchestrator';
import { supabase } from '@/lib/supabase';

interface Sprint0Request {
  projectId: string;
  projectName: string;
  goals: string[];
  context?: Record<string, any>;
  autoActivate?: boolean; // If true, set sprint status to 'active'
}

interface Sprint0Response {
  success: boolean;
  sprint?: {
    id: string;
    name: string;
    sprint_number: number;
    start_date: string;
    end_date: string;
    status: string;
    velocity_target: number;
  };
  stories?: Array<{
    id: string;
    title: string;
    assigned_crew_member: string;
    story_points: number;
    priority: number;
  }>;
  crewWorkload?: Array<{
    crewMember: string;
    totalPoints: number;
    assignedStories: number;
    capacityPercentage: number;
  }>;
  analysis?: {
    picardReasoning: string;
    rikerBalanceScore: number;
    quarkROI: number;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: Sprint0Request = await request.json();

    // Validate request
    if (!body.projectId) {
      return NextResponse.json(
        {
          success: false,
          error: 'projectId is required'
        } as Sprint0Response,
        { status: 400 }
      );
    }

    if (!body.projectName) {
      return NextResponse.json(
        {
          success: false,
          error: 'projectName is required'
        } as Sprint0Response,
        { status: 400 }
      );
    }

    if (!body.goals || body.goals.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one goal is required'
        } as Sprint0Response,
        { status: 400 }
      );
    }

    console.log(`🚀 Sprint 0 generation requested for project: ${body.projectId}`);

    // TODO: Query RAG for relevant crew memories
    // This will enhance crew assignments with historical performance data
    const ragMemories: any[] = [];
    // Example query:
    // const ragMemories = await queryCrewMemories(body.projectId, body.goals);

    // Generate Sprint 0
    const sprint0Result = await generateSprint0(
      body.projectId,
      body.projectName,
      body.goals,
      body.context,
      ragMemories
    );

    // Persist to database
    // Using global supabase client

    // 1. Create sprint
    const sprintData = {
      ...sprint0Result.sprint,
      status: body.autoActivate ? 'active' : 'planning'
    };

    const { data: createdSprint, error: sprintError } = await supabase
      .from('sprints')
      .insert(sprintData)
      .select()
      .single();

    if (sprintError) {
      console.error('Error creating sprint:', sprintError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create sprint: ${sprintError.message}`
        } as Sprint0Response,
        { status: 500 }
      );
    }

    console.log(`✅ Sprint created: ${createdSprint.id}`);

    // 2. Create stories
    const storiesWithSprintId = sprint0Result.stories.map(story => ({
      ...story,
      sprint_id: createdSprint.id,
      status: 'planned'
    }));

    const { data: createdStories, error: storiesError } = await supabase
      .from('stories')
      .insert(storiesWithSprintId)
      .select();

    if (storiesError) {
      console.error('Error creating stories:', storiesError);
      // Rollback sprint creation
      await supabase.from('sprints').delete().eq('id', createdSprint.id);

      return NextResponse.json(
        {
          success: false,
          error: `Failed to create stories: ${storiesError.message}`
        } as Sprint0Response,
        { status: 500 }
      );
    }

    console.log(`✅ Created ${createdStories.length} stories`);

    // 3. Create crew workload records
    const workloadRecords = sprint0Result.crewWorkload.map(workload => ({
      crew_member: workload.crewMember,
      sprint_id: createdSprint.id,
      total_story_points: workload.totalPoints,
      completed_story_points: 0,
      capacity_percentage: workload.capacityPercentage
    }));

    const { error: workloadError } = await supabase
      .from('crew_workload')
      .insert(workloadRecords);

    if (workloadError) {
      console.error('Error creating crew workload:', workloadError);
      // Non-critical error, continue
    }

    // 4. Log orchestration to RAG for future reference
    // TODO: Store Sprint 0 generation as a memory for crew to reference
    // This helps crew learn from successful sprint planning patterns

    // Return success response
    return NextResponse.json({
      success: true,
      sprint: {
        id: createdSprint.id,
        name: createdSprint.name,
        sprint_number: createdSprint.sprint_number,
        start_date: createdSprint.start_date,
        end_date: createdSprint.end_date,
        status: createdSprint.status,
        velocity_target: createdSprint.velocity_target
      },
      stories: createdStories.map(story => ({
        id: story.id,
        title: story.title,
        assigned_crew_member: story.assigned_crew_member,
        story_points: story.story_points,
        priority: story.priority
      })),
      crewWorkload: sprint0Result.crewWorkload.map(workload => ({
        crewMember: workload.crewMember,
        totalPoints: workload.totalPoints,
        assignedStories: workload.assignedStories.length,
        capacityPercentage: workload.capacityPercentage
      })),
      analysis: {
        picardReasoning: sprint0Result.picardAnalysis.reasoning,
        rikerBalanceScore: sprint0Result.rikerOrganization.balanceScore,
        quarkROI: sprint0Result.quarkOptimization.roi
      }
    } as Sprint0Response);

  } catch (error) {
    console.error('Sprint 0 generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      } as Sprint0Response,
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve Sprint 0 templates based on project type
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectType = searchParams.get('projectType') || 'web-app';

    // Return common Sprint 0 templates based on project type
    const templates: Record<string, { goals: string[]; estimatedStories: number }> = {
      'web-app': {
        goals: [
          'Set up development environment and CI/CD pipeline',
          'Implement authentication and authorization system',
          'Create core data models and database schema',
          'Build responsive UI component library',
          'Implement error handling and logging'
        ],
        estimatedStories: 5
      },
      'api': {
        goals: [
          'Design API architecture and endpoints',
          'Set up API gateway and rate limiting',
          'Implement authentication middleware',
          'Create comprehensive API documentation',
          'Build automated API testing suite'
        ],
        estimatedStories: 5
      },
      'mobile-app': {
        goals: [
          'Set up mobile development framework',
          'Implement app navigation structure',
          'Create design system and UI components',
          'Set up push notifications and analytics',
          'Implement offline data synchronization'
        ],
        estimatedStories: 5
      },
      'ai-ml': {
        goals: [
          'Set up ML infrastructure and data pipeline',
          'Implement model training and evaluation framework',
          'Create data preprocessing and feature engineering',
          'Build model deployment and monitoring system',
          'Implement A/B testing framework for models'
        ],
        estimatedStories: 5
      }
    };

    const template = templates[projectType] || templates['web-app'];

    return NextResponse.json({
      success: true,
      projectType,
      template
    });

  } catch (error) {
    console.error('Template retrieval error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
