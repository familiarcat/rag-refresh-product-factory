'use client';

/**
 * HorizontalSprintTimeline - Interactive horizontal timeline view
 *
 * Features a time-based horizontal layout showing:
 * - Story cards positioned by estimated completion date
 * - Crew member swim lanes
 * - Task dependencies as connecting lines
 * - Interactive drag-and-drop (future)
 * - Real-time progress tracking
 */

import React, { useEffect, useState } from 'react';
import type { Sprint, Story, StoryWithDetails, CrewMember } from '@/types/sprint';
import { CREW_MEMBERS } from '@/types/sprint';

export interface HorizontalSprintTimelineProps {
  projectId?: string;
  sprintId?: string; // Show specific sprint or current active sprint
}

interface SprintWithStories extends Sprint {
  stories: StoryWithDetails[];
}

interface TimelineDay {
  date: Date;
  dayNumber: number;
  isToday: boolean;
  isWeekend: boolean;
}

export default function HorizontalSprintTimeline({
  projectId,
  sprintId
}: HorizontalSprintTimelineProps) {
  const [sprint, setSprint] = useState<SprintWithStories | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredStory, setHoveredStory] = useState<string | null>(null);

  // Internal click handlers
  const handleStoryClick = (story: StoryWithDetails) => {
    // Open story in new tab or show modal
    console.log('Story clicked:', story.id);
    // TODO: Implement story detail view
  };

  const handleCrewClick = (crew: CrewMember) => {
    // Filter or show crew details
    console.log('Crew clicked:', crew);
    // TODO: Implement crew filtering
  };

  // Fetch sprint data
  useEffect(() => {
    fetchSprint();
  }, [projectId, sprintId]);

  const fetchSprint = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (projectId) params.append('project_id', projectId);
      if (sprintId) params.append('sprint_id', sprintId);
      params.append('status', 'active');
      params.append('include_stories', 'true');

      const response = await fetch(`/api/sprints?${params}`);
      if (!response.ok) throw new Error('Failed to fetch sprint');

      const data = await response.json();
      const sprints = data.sprints || [];

      if (sprints.length > 0) {
        setSprint(sprints[0]); // Use first active sprint
      } else {
        setSprint(null);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching sprint:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate timeline days
  const getTimelineDays = (): TimelineDay[] => {
    if (!sprint) return [];

    const days: TimelineDay[] = [];
    const startDate = new Date(sprint.start_date);
    const endDate = new Date(sprint.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentDate = new Date(startDate);
    let dayNumber = 1;

    while (currentDate <= endDate) {
      const isToday = currentDate.getTime() === today.getTime();
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;

      days.push({
        date: new Date(currentDate),
        dayNumber,
        isToday,
        isWeekend
      });

      currentDate.setDate(currentDate.getDate() + 1);
      dayNumber++;
    }

    return days;
  };

  // Get estimated completion day for a story
  const getStoryCompletionDay = (story: StoryWithDetails, sprintDays: number): number => {
    // If story has estimated_completion, calculate day from sprint start
    if (story.estimated_completion) {
      const completionDate = new Date(story.estimated_completion);
      const startDate = new Date(sprint!.start_date);
      const daysDiff = Math.ceil((completionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(1, Math.min(daysDiff, sprintDays));
    }

    // Otherwise, estimate based on status and story points
    const pointsPerDay = (sprint!.velocity_target || 20) / sprintDays;
    const daysNeeded = (story.story_points || 3) / pointsPerDay;

    switch (story.status) {
      case 'completed':
        return Math.floor(sprintDays * 0.3); // Early in sprint
      case 'in_review':
        return Math.floor(sprintDays * 0.7); // Late in sprint
      case 'in_progress':
        return Math.floor(sprintDays * 0.5); // Mid sprint
      case 'planned':
        return Math.floor(sprintDays * 0.6);
      default:
        return Math.floor(sprintDays * 0.8); // Later in sprint
    }
  };

  // Group stories by crew and position on timeline
  const getStoriesByCrewAndDay = (): Record<string, Record<number, StoryWithDetails[]>> => {
    if (!sprint) return {};

    const grouped: Record<string, Record<number, StoryWithDetails[]>> = {};
    const days = getTimelineDays();

    // Initialize all crew members
    [...Object.keys(CREW_MEMBERS), 'unassigned'].forEach(crew => {
      grouped[crew] = {};
    });

    // Group stories by crew and day
    sprint.stories?.forEach(story => {
      const crew = story.assigned_crew_member || 'unassigned';
      const day = getStoryCompletionDay(story, days.length);

      if (!grouped[crew][day]) {
        grouped[crew][day] = [];
      }
      grouped[crew][day].push(story);
    });

    return grouped;
  };

  // Get visible crew members (those with assigned stories)
  const getVisibleCrew = (): string[] => {
    if (!sprint) return [];

    const crewWithStories = new Set<string>();
    sprint.stories?.forEach(story => {
      crewWithStories.add(story.assigned_crew_member || 'unassigned');
    });

    return [...crewWithStories];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-lg border border-gray-200">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading sprint timeline...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 font-semibold mb-2">Error loading sprint</p>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={fetchSprint}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className="text-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-6xl mb-4">📅</div>
        <p className="text-gray-700 font-semibold text-lg mb-2">No active sprints found</p>
        <p className="text-gray-500 text-sm mb-6">
          Create a sprint to get started with your project timeline
        </p>
        {projectId && (
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Create Sprint
          </button>
        )}
      </div>
    );
  }

  const timelineDays = getTimelineDays();
  const storiesByCrewAndDay = getStoriesByCrewAndDay();
  const visibleCrew = getVisibleCrew();

  // Calculate sprint metrics
  const totalStories = sprint.stories?.length || 0;
  const completedStories = sprint.stories?.filter(s => s.status === 'completed').length || 0;
  const completionPercentage = totalStories > 0 ? Math.round((completedStories / totalStories) * 100) : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Sprint Header with Metrics */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">{sprint.name}</h2>
            <p className="text-blue-100 text-sm">
              {new Date(sprint.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(sprint.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              <span className="mx-2">•</span>
              {timelineDays.length} days
            </p>
          </div>

          <div className="flex gap-6">
            <div className="text-right">
              <div className="text-3xl font-bold">{sprint.velocity_actual || 0}/{sprint.velocity_target || 0}</div>
              <div className="text-xs text-blue-100">Story Points</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{completedStories}/{totalStories}</div>
              <div className="text-xs text-blue-100">Stories Complete</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold">{completionPercentage}% Complete</span>
            <span className="text-blue-100">
              {timelineDays.filter(d => d.isToday).length > 0 ? 'Sprint in progress' : 'Not started'}
            </span>
          </div>
          <div className="w-full bg-blue-500 rounded-full h-3">
            <div
              className="bg-white rounded-full h-3 transition-all duration-500 shadow-sm"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Sprint Goals */}
        {sprint.goals && sprint.goals.length > 0 && (
          <div className="mt-4 pt-4 border-t border-blue-400">
            <div className="text-xs font-semibold text-blue-100 mb-2">SPRINT GOALS</div>
            <ul className="space-y-1">
              {sprint.goals.map((goal, idx) => (
                <li key={idx} className="text-sm flex items-start">
                  <span className="mr-2">🎯</span>
                  {goal}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Horizontal Timeline */}
      <div className="p-6 bg-gray-50">
        <div className="overflow-x-auto">
          {/* Timeline Container */}
          <div className="inline-block min-w-full">
            {/* Timeline Header (Days) */}
            <div className="flex mb-4 sticky top-0 bg-gray-50 z-10 pb-2 border-b-2 border-gray-300">
              <div className="w-40 flex-shrink-0 font-semibold text-sm text-gray-700 flex items-center">
                Crew Member
              </div>
              {timelineDays.map((day) => (
                <div
                  key={day.dayNumber}
                  className={`
                    flex-shrink-0 w-32 text-center border-l border-gray-200
                    ${day.isToday ? 'bg-blue-100 border-blue-400 border-2' : ''}
                    ${day.isWeekend ? 'bg-gray-100' : 'bg-white'}
                  `}
                >
                  <div className={`text-xs font-semibold ${day.isToday ? 'text-blue-700' : 'text-gray-600'}`}>
                    Day {day.dayNumber}
                  </div>
                  <div className={`text-xs ${day.isToday ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                    {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  {day.isToday && (
                    <div className="text-xs text-blue-600 font-bold mt-1">TODAY</div>
                  )}
                </div>
              ))}
            </div>

            {/* Crew Swimlanes */}
            <div className="space-y-2">
              {visibleCrew.map((crewKey) => {
                const crewInfo = crewKey === 'unassigned'
                  ? { id: 'unassigned' as CrewMember, name: 'Unassigned', role: 'Backlog', specialty: 'No crew assigned' }
                  : CREW_MEMBERS[crewKey as CrewMember];

                const crewStories = storiesByCrewAndDay[crewKey] || {};
                const totalCrewPoints = Object.values(crewStories)
                  .flat()
                  .reduce((sum, s) => sum + (s.story_points || 0), 0);

                return (
                  <div key={crewKey} className="flex border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
                    {/* Crew Info Column */}
                    <div
                      className="w-40 flex-shrink-0 p-3 bg-gradient-to-r from-gray-50 to-white border-r border-gray-200 cursor-pointer hover:from-blue-50 hover:to-blue-50"
                      onClick={() => crewKey !== 'unassigned' && handleCrewClick(crewKey as CrewMember)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                          {crewInfo.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{crewInfo.name}</div>
                          <div className="text-xs text-gray-600 truncate">{crewInfo.specialty}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 mt-2">
                        <div className="font-semibold text-blue-600">{totalCrewPoints} pts</div>
                        <div className="text-gray-500">
                          {Object.values(crewStories).flat().length} stories
                        </div>
                      </div>
                    </div>

                    {/* Timeline Days with Story Cards */}
                    {timelineDays.map((day) => {
                      const dayStories = crewStories[day.dayNumber] || [];

                      return (
                        <div
                          key={day.dayNumber}
                          className={`
                            flex-shrink-0 w-32 p-2 border-l border-gray-200 min-h-[120px]
                            ${day.isToday ? 'bg-blue-50 border-blue-300' : ''}
                            ${day.isWeekend ? 'bg-gray-50' : ''}
                          `}
                        >
                          {/* Story Cards */}
                          <div className="space-y-2">
                            {dayStories.map((story) => (
                              <StoryTimelineCard
                                key={story.id}
                                story={story}
                                isHovered={hoveredStory === story.id}
                                onHover={() => setHoveredStory(story.id)}
                                onLeave={() => setHoveredStory(null)}
                                onClick={() => handleStoryClick(story)}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-200 border border-green-400 rounded"></div>
                  <span className="text-gray-600">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded"></div>
                  <span className="text-gray-600">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-200 border border-purple-400 rounded"></div>
                  <span className="text-gray-600">In Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded"></div>
                  <span className="text-gray-600">Planned</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-200 border border-red-400 rounded"></div>
                  <span className="text-gray-600">Blocked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 border-2 border-blue-400 rounded"></div>
                  <span className="text-gray-600 font-semibold">Today</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Story Timeline Card Component
interface StoryTimelineCardProps {
  story: StoryWithDetails;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

function StoryTimelineCard({ story, isHovered, onHover, onLeave, onClick }: StoryTimelineCardProps) {
  const statusColors: Record<string, string> = {
    backlog: 'bg-gray-200 border-gray-400 text-gray-700',
    planned: 'bg-blue-200 border-blue-400 text-blue-800',
    in_progress: 'bg-yellow-200 border-yellow-400 text-yellow-900',
    in_review: 'bg-purple-200 border-purple-400 text-purple-800',
    completed: 'bg-green-200 border-green-400 text-green-800',
    blocked: 'bg-red-200 border-red-400 text-red-800'
  };

  const statusColor = statusColors[story.status] || statusColors.backlog;

  const completedCriteria = story.acceptance_criteria?.filter(ac => ac.is_completed).length || 0;
  const totalCriteria = story.acceptance_criteria?.length || 0;
  const criteriaProgress = totalCriteria > 0 ? Math.round((completedCriteria / totalCriteria) * 100) : 0;

  return (
    <div
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`
        ${statusColor} border-2 rounded-lg p-2 cursor-pointer transition-all duration-200
        ${isHovered ? 'shadow-lg scale-105 z-10' : 'shadow-sm'}
        relative
      `}
    >
      {/* Story Points Badge */}
      {story.story_points && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-current rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
          {story.story_points}
        </div>
      )}

      {/* Priority Indicator */}
      {story.priority && story.priority <= 2 && (
        <div className="absolute -top-1 -left-1 text-red-500">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" />
          </svg>
        </div>
      )}

      {/* Story Title */}
      <div className="text-xs font-semibold line-clamp-2 mb-1">
        {story.title}
      </div>

      {/* Story Type */}
      <div className="text-xs opacity-75 truncate">
        {story.story_type.replace('_', ' ')}
      </div>

      {/* Acceptance Criteria Progress Bar */}
      {totalCriteria > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs mb-1 opacity-75">
            <span>{completedCriteria}/{totalCriteria}</span>
            <span>{criteriaProgress}%</span>
          </div>
          <div className="w-full bg-white bg-opacity-50 rounded-full h-1">
            <div
              className="bg-current rounded-full h-1 transition-all"
              style={{ width: `${criteriaProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
