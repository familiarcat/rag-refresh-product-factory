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
import styles from './HorizontalSprintTimeline.module.css';

export interface HorizontalSprintTimelineProps {
  projectId?: string;
  sprintId?: string;
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

  const handleStoryClick = (story: StoryWithDetails) => {
    console.log('Story clicked:', story.id);
    // TODO: Implement story detail modal
  };

  const handleCrewClick = (crew: CrewMember) => {
    console.log('Crew clicked:', crew);
    // TODO: Implement crew filtering
  };

  const fetchSprint = async () => {
    console.log('[HorizontalSprintTimeline] Fetching sprint...', { projectId, sprintId });
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (projectId) params.append('project_id', projectId);
      if (sprintId) params.append('sprint_id', sprintId);
      params.append('status', 'active');
      params.append('include_stories', 'true');

      const url = `/api/sprints?${params}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch sprint');

      const data = await response.json();
      const sprints = data.sprints || [];

      if (sprints.length > 0) {
        console.log('[HorizontalSprintTimeline] Sprint loaded:', sprints[0].id);
        setSprint(sprints[0]);
      } else {
        setSprint(null);
      }
    } catch (err: any) {
      console.error('[HorizontalSprintTimeline] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSprint();
  }, [projectId, sprintId]);

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
      const isToday = currentDate.toDateString() === today.toDateString();
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

  const getStoryCompletionDay = (story: StoryWithDetails, sprintDays: number): number => {
    if (story.estimated_completion) {
      const completionDate = new Date(story.estimated_completion);
      const startDate = new Date(sprint!.start_date);
      const daysDiff = Math.ceil((completionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return Math.max(1, Math.min(daysDiff, sprintDays));
    }

    switch (story.status) {
      case 'completed':
        return Math.floor(sprintDays * 0.3);
      case 'in_review':
        return Math.floor(sprintDays * 0.7);
      case 'in_progress':
        return Math.floor(sprintDays * 0.5);
      case 'planned':
        return Math.floor(sprintDays * 0.6);
      default:
        return Math.floor(sprintDays * 0.8);
    }
  };

  const getStoriesByCrewAndDay = (): Record<string, Record<number, StoryWithDetails[]>> => {
    if (!sprint) return {};

    const grouped: Record<string, Record<number, StoryWithDetails[]>> = {};
    const days = getTimelineDays();

    [...Object.keys(CREW_MEMBERS), 'unassigned'].forEach(crew => {
      grouped[crew] = {};
    });

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
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <span style={{ color: 'var(--muted)' }}>Loading sprint timeline...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <div className={styles.errorContent}>
          <div className={styles.errorIcon}>⚠️</div>
          <div className={styles.errorTitle}>Error loading sprint</div>
          <div className={styles.errorMessage}>{error}</div>
          <button className={styles.errorButton} onClick={fetchSprint}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyContent}>
          <div className={styles.emptyIcon}>📅</div>
          <div className={styles.emptyTitle}>No active sprints found</div>
          <div className={styles.emptyMessage}>
            Create a sprint to get started with your project timeline
          </div>
          {projectId && (
            <button className={styles.emptyButton}>Create Sprint</button>
          )}
        </div>
      </div>
    );
  }

  const timelineDays = getTimelineDays();
  const storiesByCrewAndDay = getStoriesByCrewAndDay();
  const visibleCrew = getVisibleCrew();

  const totalStories = sprint.stories?.length || 0;
  const completedStories = sprint.stories?.filter(s => s.status === 'completed').length || 0;
  const completionPercentage = totalStories > 0 ? Math.round((completedStories / totalStories) * 100) : 0;

  return (
    <div className={styles.container}>
      {/* Sprint Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.headerTitle}>{sprint.name}</div>
            <div className={styles.headerSubtitle}>
              {new Date(sprint.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(sprint.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              <span style={{ margin: '0 8px' }}>•</span>
              {timelineDays.length} days
            </div>
          </div>

          <div className={styles.metrics}>
            <div className={styles.metric}>
              <div className={styles.metricValue}>{sprint.velocity_actual || 0}/{sprint.velocity_target || 0}</div>
              <div className={styles.metricLabel}>Story Points</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricValue}>{completedStories}/{totalStories}</div>
              <div className={styles.metricLabel}>Stories Complete</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressBar}>
          <div className={styles.progressBarHeader}>
            <span style={{ fontWeight: 'bold' }}>{completionPercentage}% Complete</span>
            <span style={{ opacity: 0.8 }}>
              {timelineDays.some(d => d.isToday) ? 'Sprint in progress' : 'Not started'}
            </span>
          </div>
          <div className={styles.progressBarTrack}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Sprint Goals */}
        {sprint.goals && sprint.goals.length > 0 && (
          <div className={styles.goals}>
            <div className={styles.goalsHeader}>Sprint Goals</div>
            <ul className={styles.goalsList}>
              {sprint.goals.map((goal, idx) => (
                <li key={idx} className={styles.goalItem}>
                  <span style={{ marginRight: '8px' }}>🎯</span>
                  {goal}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Horizontal Timeline */}
      <div className={styles.timelineArea}>
        <div className={styles.timeline}>
          {/* Timeline Header (Days) */}
          <div className={styles.timelineHeader}>
            <div className={styles.crewLabel}>Crew Member</div>
            {timelineDays.map((day) => (
              <div
                key={day.dayNumber}
                className={`${styles.dayColumn} ${day.isToday ? styles.today : ''} ${day.isWeekend ? styles.weekend : ''}`}
              >
                <div className={styles.dayNumber}>Day {day.dayNumber}</div>
                <div className={styles.dayDate}>
                  {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                {day.isToday && <div className={styles.todayLabel}>TODAY</div>}
              </div>
            ))}
          </div>

          {/* Crew Swimlanes */}
          <div className={styles.swimlanes}>
            {visibleCrew.map((crewKey) => {
              const crewInfo = crewKey === 'unassigned'
                ? { id: 'unassigned' as CrewMember, name: 'Unassigned', role: 'Backlog', specialty: 'No crew assigned' }
                : CREW_MEMBERS[crewKey as CrewMember];

              const crewStories = storiesByCrewAndDay[crewKey] || {};
              const totalCrewPoints = Object.values(crewStories)
                .flat()
                .reduce((sum, s) => sum + (s.story_points || 0), 0);

              return (
                <div key={crewKey} className={styles.swimlane}>
                  {/* Crew Info Column */}
                  <div
                    className={styles.crewInfo}
                    onClick={() => crewKey !== 'unassigned' && handleCrewClick(crewKey as CrewMember)}
                  >
                    <div className={styles.crewHeader}>
                      <div className={styles.crewAvatar}>
                        {crewInfo.name.charAt(0)}
                      </div>
                      <div className={styles.crewDetails}>
                        <div className={styles.crewName}>{crewInfo.name}</div>
                        <div className={styles.crewSpecialty}>{crewInfo.specialty}</div>
                      </div>
                    </div>
                    <div className={styles.crewStats}>
                      <div className={styles.crewPoints}>{totalCrewPoints} pts</div>
                      <div>{Object.values(crewStories).flat().length} stories</div>
                    </div>
                  </div>

                  {/* Timeline Days with Story Cards */}
                  {timelineDays.map((day) => {
                    const dayStories = crewStories[day.dayNumber] || [];

                    return (
                      <div
                        key={day.dayNumber}
                        className={`${styles.dayCell} ${day.isToday ? styles.today : ''} ${day.isWeekend ? styles.weekend : ''}`}
                      >
                        <div className={styles.storyCards}>
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
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ borderColor: 'var(--ok)', background: 'rgba(40, 217, 154, 0.15)' }}></div>
              <span>Completed</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ borderColor: 'var(--warn)', background: 'rgba(255, 209, 102, 0.15)' }}></div>
              <span>In Progress</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ borderColor: 'var(--accent1)', background: 'rgba(124, 92, 255, 0.15)' }}></div>
              <span>In Review</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ borderColor: 'var(--good)', background: 'rgba(90, 230, 255, 0.15)' }}></div>
              <span>Planned</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ borderColor: 'var(--risk)', background: 'rgba(255, 92, 147, 0.15)' }}></div>
              <span>Blocked</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendColor} style={{ borderColor: 'var(--accent1)', background: 'rgba(124, 92, 255, 0.1)', borderWidth: '2px' }}></div>
              <span style={{ fontWeight: 'bold' }}>Today</span>
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
  const completedCriteria = story.acceptance_criteria?.filter(ac => ac.is_completed).length || 0;
  const totalCriteria = story.acceptance_criteria?.length || 0;
  const criteriaProgress = totalCriteria > 0 ? Math.round((completedCriteria / totalCriteria) * 100) : 0;

  return (
    <div
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`${styles.storyCard} ${styles[`status-${story.status}`]}`}
      style={{
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        zIndex: isHovered ? 10 : 1
      }}
    >
      {story.story_points && (
        <div className={styles.storyPoints}>{story.story_points}</div>
      )}

      {story.priority && story.priority <= 2 && (
        <div className={styles.priorityStar}>
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" />
          </svg>
        </div>
      )}

      <div className={styles.storyTitle}>{story.title}</div>
      <div className={styles.storyType}>{story.story_type.replace('_', ' ')}</div>

      {totalCriteria > 0 && (
        <div className={styles.criteriaProgress}>
          <div className={styles.criteriaHeader}>
            <span>{completedCriteria}/{totalCriteria}</span>
            <span>{criteriaProgress}%</span>
          </div>
          <div className={styles.criteriaBar}>
            <div className={styles.criteriaFill} style={{ width: `${criteriaProgress}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
