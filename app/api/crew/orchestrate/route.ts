/**
 * Cost-Optimized Crew Orchestration API
 *
 * Endpoint: POST /api/crew/orchestrate
 *
 * Implements Picard → Riker + Quark workflow for minimal-cost crew activation
 */

import { NextRequest, NextResponse } from 'next/server';

interface OrchestrationRequest {
  task: string;
  context?: Record<string, any>;
  forceCrewMembers?: string[];
  maxCost?: number;
  preferredTier?: 'premium' | 'standard' | 'budget' | 'ultra_budget';
}

interface OrchestrationResponse {
  success: boolean;
  orchestration?: {
    activatedCrew: string[];
    llmAssignments: Record<string, string>;
    taskComplexity: string;
    estimatedCost: number;
    picardReasoning: string;
    quarkROI: {
      totalCostPremium: number;
      totalCostOptimized: number;
      costSavings: number;
      savingsPercentage: number;
      recommendation: string;
    };
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: OrchestrationRequest = await request.json();

    if (!body.task) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task description is required'
        } as OrchestrationResponse,
        { status: 400 }
      );
    }

    // Call Python orchestrator service
    const pythonServiceUrl = process.env.RAG_API_URL || 'http://localhost:8000';
    const response = await fetch(`${pythonServiceUrl}/crew/orchestrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: body.task,
        context: body.context,
        force_crew_members: body.forceCrewMembers,
        max_cost: body.maxCost,
        preferred_tier: body.preferredTier
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          error: errorData.detail || 'Orchestration service error'
        } as OrchestrationResponse,
        { status: response.status }
      );
    }

    const orchestrationData = await response.json();

    return NextResponse.json({
      success: true,
      orchestration: {
        activatedCrew: orchestrationData.activated_crew,
        llmAssignments: orchestrationData.llm_assignments,
        taskComplexity: orchestrationData.task_complexity,
        estimatedCost: orchestrationData.estimated_cost,
        picardReasoning: orchestrationData.picard_reasoning,
        quarkROI: {
          totalCostPremium: orchestrationData.quark_roi_analysis.total_cost_premium,
          totalCostOptimized: orchestrationData.quark_roi_analysis.total_cost_optimized,
          costSavings: orchestrationData.quark_roi_analysis.cost_savings,
          savingsPercentage: orchestrationData.quark_roi_analysis.savings_percentage,
          recommendation: orchestrationData.quark_roi_analysis.recommendation
        }
      }
    } as OrchestrationResponse);

  } catch (error) {
    console.error('Orchestration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      } as OrchestrationResponse,
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve orchestration cost estimates
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const complexity = searchParams.get('complexity') || 'routine';
    const crewSize = parseInt(searchParams.get('crewSize') || '3');

    // Calculate cost estimates based on complexity
    const costMap = {
      critical: { premium: 0.0135, standard: 0.01, budget: 0.001575 },
      important: { premium: 0.0135, standard: 0.01, budget: 0.001575 },
      routine: { premium: 0.0135, standard: 0.01, budget: 0.001575 },
      trivial: { premium: 0.0135, standard: 0.01, budget: 0.0003 }
    };

    const costs = costMap[complexity as keyof typeof costMap] || costMap.routine;

    return NextResponse.json({
      success: true,
      estimates: {
        complexity,
        crewSize,
        premiumCost: costs.premium * crewSize,
        standardCost: costs.standard * crewSize,
        budgetCost: costs.budget * crewSize,
        optimizedEstimate: complexity === 'critical'
          ? costs.premium + (costs.standard * (crewSize - 1))
          : costs.budget * crewSize
      }
    });

  } catch (error) {
    console.error('Cost estimation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
