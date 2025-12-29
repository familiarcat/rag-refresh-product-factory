/**
 * Story Estimation Utilities
 *
 * Crew-based automatic estimation for effort and cost
 * - Data (Commander): AI-powered effort calculation
 * - Quark: Cost analysis and ROI optimization
 */

import type { CrewMember, StoryType } from '@/types/sprint';

/**
 * Crew member hourly rates in Gold-Pressed Latinum (GPL)
 * Based on crew member expertise and specialty
 */
export const CREW_HOURLY_RATES: Record<CrewMember, number> = {
  picard: 150,    // Strategic leadership
  riker: 125,     // Execution coordination
  data: 175,      // AI/ML expertise (highest rate)
  la_forge: 140,  // Infrastructure/DevOps
  troi: 110,      // UX/UI design
  worf: 120,      // Security/Testing
  crusher: 130,   // Performance optimization
  uhura: 115,     // API/Integration
  quark: 100,     // Business analysis (lowest overhead)
  obrien: 105     // Implementation/Maintenance
};

/**
 * Story point to hours conversion
 * Industry standard: 1 point ≈ 2-6 hours (we use 4 hours as baseline)
 *
 * Data's AI Analysis:
 * - Complexity multipliers based on story type
 * - Historical velocity patterns
 */
export function estimateHoursFromPoints(
  storyPoints: number,
  storyType: StoryType,
  assignedCrew?: CrewMember
): number {
  if (!storyPoints || storyPoints === 0) return 0;

  // Base conversion: 1 point = 4 hours
  let baseHours = storyPoints * 4;

  // Type-based complexity multipliers (Data's analysis)
  const typeMultipliers: Record<StoryType, number> = {
    'user_story': 1.0,        // Standard complexity
    'developer_story': 1.2,   // More technical, +20%
    'technical_task': 0.8,    // More straightforward, -20%
    'bug_fix': 0.6            // Usually faster, -40%
  };

  baseHours *= typeMultipliers[storyType];

  // Crew efficiency factors (some crew work faster in their specialty)
  if (assignedCrew) {
    const crewEfficiency: Partial<Record<CrewMember, number>> = {
      data: 0.85,      // AI-enhanced efficiency (-15%)
      la_forge: 0.9,   // Engineering optimization (-10%)
      obrien: 1.0,     // Baseline
      quark: 1.1       // Business analysis takes slightly longer (+10%)
    };

    baseHours *= (crewEfficiency[assignedCrew] || 1.0);
  }

  // Round to nearest 0.5 hour
  return Math.round(baseHours * 2) / 2;
}

/**
 * Calculate cost based on hours and crew member
 * Quark's business optimization logic
 */
export function estimateCost(
  estimatedHours: number,
  assignedCrew?: CrewMember
): number {
  if (!estimatedHours || estimatedHours === 0) return 0;
  if (!assignedCrew) return estimatedHours * 100; // Average rate if no crew assigned

  const hourlyRate = CREW_HOURLY_RATES[assignedCrew];
  return Math.round(estimatedHours * hourlyRate);
}

/**
 * Calculate ROI score
 * Quark's formula: Higher priority + lower cost = better ROI
 */
export function calculateROI(
  priority: number,      // 1-5 (1 = highest priority)
  storyPoints: number,
  cost: number
): number {
  if (cost === 0 || storyPoints === 0) return 0;

  // Invert priority (5 - priority) so higher priority = higher score
  const priorityScore = (6 - priority) * 20; // Max 100 points

  // Cost per story point (lower is better)
  const costPerPoint = cost / storyPoints;
  const efficiencyScore = Math.max(0, 100 - costPerPoint); // Lower cost = higher score

  // Weighted average (60% priority, 40% efficiency)
  return Math.round(priorityScore * 0.6 + efficiencyScore * 0.4);
}

/**
 * Get estimation recommendation from crew members
 */
export function getEstimationRecommendation(
  storyPoints: number,
  storyType: StoryType,
  priority: number,
  assignedCrew?: CrewMember
): {
  estimatedHours: number;
  estimatedCost: number;
  roiScore: number;
  recommendation: string;
  estimatedBy: string;
} {
  const estimatedHours = estimateHoursFromPoints(storyPoints, storyType, assignedCrew);
  const estimatedCost = estimateCost(estimatedHours, assignedCrew);
  const roiScore = calculateROI(priority, storyPoints, estimatedCost);

  // Generate recommendation based on ROI
  let recommendation = '';
  let estimatedBy = 'Commander Data & Quark';

  if (roiScore >= 80) {
    recommendation = 'Excellent ROI - High priority, efficient implementation. Recommend immediate scheduling.';
  } else if (roiScore >= 60) {
    recommendation = 'Good ROI - Balanced value delivery. Proceed as planned.';
  } else if (roiScore >= 40) {
    recommendation = 'Moderate ROI - Consider optimization opportunities or priority adjustment.';
  } else if (roiScore >= 20) {
    recommendation = 'Low ROI - High cost or low priority. Review scope or defer if possible.';
  } else {
    recommendation = 'Poor ROI - Recommend scope reduction, priority increase, or alternative approach.';
  }

  return {
    estimatedHours,
    estimatedCost,
    roiScore,
    recommendation,
    estimatedBy
  };
}

/**
 * Calculate duration in days from hours
 * Assumes 8-hour work days, accounting for weekends
 */
export function calculateDurationDays(estimatedHours: number): number {
  if (!estimatedHours || estimatedHours === 0) return 1;

  // Standard 8-hour work day
  const workDaysNeeded = Math.ceil(estimatedHours / 8);

  // Add buffer for weekends (rough approximation)
  // For every 5 work days, add 2 calendar days
  const weeksNeeded = Math.ceil(workDaysNeeded / 5);
  const calendarDays = workDaysNeeded + (weeksNeeded - 1) * 2;

  return Math.max(1, calendarDays);
}
