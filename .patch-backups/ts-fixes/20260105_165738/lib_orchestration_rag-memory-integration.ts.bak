/**
 * RAG Memory Integration for Crew Collaboration
 *
 * Integrates with the RAG system to:
 * 1. Query crew member expertise and memories
 * 2. Store sprint planning decisions for future reference
 * 3. Enhance crew assignments with historical performance
 * 4. Build institutional knowledge across projects
 */

import { supabase } from '@/lib/supabase';
import { CrewMember } from '@/types/sprint';

/**
 * Crew memory from RAG system
 */
export interface CrewMemory {
  crewMember: CrewMember;
  actionType: string;
  description: string;
  outcome: string;
  context: Record<string, any>;
  timestamp: string;
  successScore: number; // 0-100
}

/**
 * Sprint planning memory
 */
export interface SprintPlanningMemory {
  sprintId: string;
  projectId: string;
  projectName: string;
  goals: string[];
  crewAssignments: Record<string, string[]>;
  velocityTarget: number;
  velocityActual?: number;
  picardAnalysis: string;
  rikerOrganization: string;
  quarkOptimization: string;
  timestamp: string;
}

/**
 * Query RAG for crew member expertise relevant to project goals
 */
export async function queryCrewExpertise(
  goals: string[],
  limit: number = 10
): Promise<CrewMemory[]> {
  // Using global supabase client

  try {
    // Combine goals into search query
    const searchQuery = goals.join(' ');

    // Query crew_actions table for relevant memories
    // This requires the RAG system to have logged crew actions
    const { data, error } = await supabase
      .from('crew_actions')
      .select('*')
      .textSearch('description', searchQuery)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error querying crew expertise:', error);
      return [];
    }

    // Transform to CrewMemory format
    const memories: CrewMemory[] = (data || []).map((action: any) => ({
      crewMember: action.crew_member as CrewMember,
      actionType: action.action_type || 'unknown',
      description: action.description || '',
      outcome: action.outcome || '',
      context: action.context || {},
      timestamp: action.created_at,
      successScore: action.success_score || 50
    }));

    console.log(`📚 Retrieved ${memories.length} crew memories from RAG`);
    return memories;

  } catch (error) {
    console.error('Error querying crew expertise:', error);
    return [];
  }
}

/**
 * Query RAG for similar sprint planning examples
 */
export async function querySimilarSprints(
  projectGoals: string[],
  limit: number = 5
): Promise<SprintPlanningMemory[]> {
  // Using global supabase client

  try {
    const searchQuery = projectGoals.join(' ');

    // Query sprint_planning_memories table
    const { data, error } = await supabase
      .from('sprint_planning_memories')
      .select('*')
      .textSearch('goals', searchQuery)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error querying similar sprints:', error);
      return [];
    }

    console.log(`📊 Retrieved ${data?.length || 0} similar sprint planning examples`);
    return (data || []) as SprintPlanningMemory[];

  } catch (error) {
    console.error('Error querying similar sprints:', error);
    return [];
  }
}

/**
 * Get crew member success rate for specific expertise areas
 */
export async function getCrewSuccessRate(
  crewMember: CrewMember,
  expertiseArea: string
): Promise<number> {
  // Using global supabase client

  try {
    // Query crew actions filtered by crew member and expertise
    const { data, error } = await supabase
      .from('crew_actions')
      .select('success_score')
      .eq('crew_member', crewMember)
      .textSearch('description', expertiseArea)
      .order('created_at', { ascending: false })
      .limit(20); // Last 20 actions

    if (error || !data || data.length === 0) {
      return 50; // Default score
    }

    // Calculate average success score
    const avgScore = data.reduce((sum, action) => sum + (action.success_score || 50), 0) / data.length;

    return avgScore;

  } catch (error) {
    console.error('Error getting crew success rate:', error);
    return 50; // Default score
  }
}

/**
 * Store sprint planning decision as a memory
 */
export async function storeSprint0Memory(
  sprintId: string,
  projectId: string,
  projectName: string,
  goals: string[],
  crewAssignments: Record<string, string[]>,
  velocityTarget: number,
  picardAnalysis: string,
  rikerOrganization: string,
  quarkOptimization: string
): Promise<boolean> {
  // Using global supabase client

  try {
    const memory: Omit<SprintPlanningMemory, 'timestamp'> = {
      sprintId,
      projectId,
      projectName,
      goals,
      crewAssignments,
      velocityTarget,
      picardAnalysis,
      rikerOrganization,
      quarkOptimization
    };

    // Store in sprint_planning_memories table
    const { error } = await supabase
      .from('sprint_planning_memories')
      .insert({
        sprint_id: sprintId,
        project_id: projectId,
        project_name: projectName,
        goals: goals,
        crew_assignments: crewAssignments,
        velocity_target: velocityTarget,
        picard_analysis: picardAnalysis,
        riker_organization: rikerOrganization,
        quark_optimization: quarkOptimization
      });

    if (error) {
      console.error('Error storing sprint planning memory:', error);
      return false;
    }

    console.log(`💾 Stored Sprint 0 planning memory for ${projectName}`);
    return true;

  } catch (error) {
    console.error('Error storing sprint planning memory:', error);
    return false;
  }
}

/**
 * Enhance crew assignments with RAG memory insights
 */
export async function enhanceCrewAssignments(
  initialAssignments: Record<string, string[]>,
  goals: string[]
): Promise<{
  enhancedAssignments: Record<string, string[]>;
  insights: string[];
}> {
  const insights: string[] = [];

  try {
    // Query crew expertise for each goal area
    const crewMemories = await queryCrewExpertise(goals, 20);

    // Group memories by crew member
    const crewPerformance: Record<string, { count: number; avgScore: number }> = {};

    crewMemories.forEach(memory => {
      if (!crewPerformance[memory.crewMember]) {
        crewPerformance[memory.crewMember] = { count: 0, avgScore: 0 };
      }
      crewPerformance[memory.crewMember].count++;
      crewPerformance[memory.crewMember].avgScore += memory.successScore;
    });

    // Calculate average scores
    Object.keys(crewPerformance).forEach(crew => {
      const perf = crewPerformance[crew];
      perf.avgScore = perf.avgScore / perf.count;

      if (perf.avgScore > 80) {
        insights.push(`${crew} has exceptional performance (${perf.avgScore.toFixed(1)}%) in similar tasks`);
      } else if (perf.avgScore < 40) {
        insights.push(`${crew} may need support for this type of work (${perf.avgScore.toFixed(1)}% success rate)`);
      }
    });

    // For now, return initial assignments
    // Future enhancement: Adjust assignments based on performance data
    return {
      enhancedAssignments: initialAssignments,
      insights
    };

  } catch (error) {
    console.error('Error enhancing crew assignments:', error);
    return {
      enhancedAssignments: initialAssignments,
      insights: ['Unable to retrieve crew performance data']
    };
  }
}

/**
 * Get recommended crew for new project based on similar projects
 */
export async function getRecommendedCrewForNewProject(
  projectGoals: string[]
): Promise<{
  recommendedCrew: CrewMember[];
  reasoning: string;
}> {
  try {
    // Query similar sprint planning memories
    const similarSprints = await querySimilarSprints(projectGoals, 5);

    if (similarSprints.length === 0) {
      return {
        recommendedCrew: [],
        reasoning: 'No similar projects found in memory. Using default crew analysis.'
      };
    }

    // Count crew member appearances across similar sprints
    const crewCounts: Record<string, number> = {};

    similarSprints.forEach(sprint => {
      Object.keys(sprint.crewAssignments).forEach(crew => {
        crewCounts[crew] = (crewCounts[crew] || 0) + 1;
      });
    });

    // Sort by frequency
    const recommendedCrew = Object.entries(crewCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([crew, _]) => crew as CrewMember);

    const reasoning = `Based on ${similarSprints.length} similar projects, ` +
      `the following crew members were most frequently assigned: ${recommendedCrew.join(', ')}`;

    return {
      recommendedCrew,
      reasoning
    };

  } catch (error) {
    console.error('Error getting recommended crew:', error);
    return {
      recommendedCrew: [],
      reasoning: 'Error retrieving crew recommendations from memory.'
    };
  }
}
