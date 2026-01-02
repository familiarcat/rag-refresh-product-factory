/**
 * HorizontalSprintTimeline - Adapted for VSCode Webview
 *
 * Interactive horizontal timeline view with:
 * - Multi-day story duration bars
 * - Drag-and-drop positioning
 * - Vertical stacking for overlapping stories
 * - Workload overlap detection
 * - Effort/cost metrics visualization
 */

import React, { useState, useCallback } from 'react';
import type { StoryWithDetails, CrewMember, Sprint } from '../../../types/sprint';
import { CREW_MEMBERS } from '../../../types/sprint';
import StoryDurationBarAdapted from './StoryDurationBarAdapted';
import '../../../components/HorizontalSprintTimeline.module.css';

interface SprintWithStories extends Sprint {
  stories: StoryWithDetails[];
}

interface TimelineDay {
  date: string;
  dayNumber: number;
  isToday: boolean;
  isWeekend: boolean;
}

interface Props {
  sprint: SprintWithStories;
  vscode: any;
  onStoryUpdate: (storyId: string, updates: any) => void;
}

export default function HorizontalSprintTimelineAdapted({ sprint, vscode, onStoryUpdate }: Props) {
  const [selectedStory, setSelectedStory] = useState<StoryWithDetails | null>(null);
  const [dropTargetCrew, setDropTargetCrew] = useState<string | null>(null);

  const dayWidth = 120; // pixels per day

  // Generate timeline days
  const getTimelineDays = (): TimelineDay[] => {
    const start = new Date(sprint.start_date);
    const end = new Date(sprint.end_date);
    const days: TimelineDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let current = new Date(start);
    current.setHours(0, 0, 0, 0);
    let dayNum = 1;

    while (current <= end) {
      days.push({
        date: current.toISOString().split('T')[0],
        dayNumber: dayNum++,
        isToday: current.getTime() === today.getTime(),
        isWeekend: current.getDay() === 0 || current.getDay() === 6
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const timelineDays = getTimelineDays();

  // Calculate story positions to prevent overlap (vertical stacking)
  const calculateStoryPositions = (stories: StoryWithDetails[]): Map<string, { yOffset: number; rowIndex: number }> => {
    const positions = new Map<string, { yOffset: number; rowIndex: number }>();
    const rows: Array<{ endDay: number }> = [];

    const sortedStories = [...stories].sort((a, b) => {
      const aStart = a.start_date || a.estimated_completion || sprint.start_date;
      const bStart = b.start_date || b.estimated_completion || sprint.start_date;
      return new Date(aStart).getTime() - new Date(bStart).getTime();
    });

    sortedStories.forEach(story => {
      const sprintStart = new Date(sprint.start_date);
      const storyStart = story.start_date
        ? new Date(story.start_date)
        : story.estimated_completion
        ? new Date(story.estimated_completion)
        : sprintStart;
      const storyEnd = story.estimated_completion
        ? new Date(story.estimated_completion)
        : storyStart;

      const startDay = Math.floor((storyStart.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const endDay = Math.floor((storyEnd.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Find first available row
      let rowIndex = 0;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].endDay < startDay) {
          rowIndex = i;
          rows[i].endDay = endDay;
          break;
        }
      }

      // If no available row found, create new row
      if (rowIndex === 0 && rows.length > 0 && rows[0].endDay >= startDay) {
        rowIndex = rows.length;
        rows.push({ endDay });
      } else if (rows.length === 0) {
        rows.push({ endDay });
      }

      const storyHeight = 92; // Height + margin
      positions.set(story.id, { yOffset: rowIndex * storyHeight, rowIndex });
    });

    return positions;
  };

  // Update story function
  const updateStory = async (storyId: string, updates: any) => {
    try {
      onStoryUpdate(storyId, updates);
    } catch (error) {
      console.error('Error updating story:', error);
    }
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, story: StoryWithDetails) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('storyId', story.id);
    e.dataTransfer.setData('storyData', JSON.stringify(story));
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, targetCrew: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetCrew(targetCrew);
  };

  // Handle drop
  const handleDrop = async (e: React.DragEvent, targetCrew: string) => {
    e.preventDefault();
    setDropTargetCrew(null);

    const storyId = e.dataTransfer.getData('storyId');
    const storyDataStr = e.dataTransfer.getData('storyData');

    if (!storyId) return;

    try {
      const storyData = JSON.parse(storyDataStr);

      // Calculate which day was dropped on
      const rect = e.currentTarget.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const droppedDay = Math.floor(relativeX / dayWidth) + 1;

      if (droppedDay >= 1 && droppedDay <= timelineDays.length) {
        const targetDate = timelineDays[droppedDay - 1].date;

        // Calculate story duration
        let durationDays = 1;
        if (storyData.start_date && storyData.estimated_completion) {
          const start = new Date(storyData.start_date);
          const end = new Date(storyData.estimated_completion);
          durationDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        } else if (storyData.estimated_hours) {
          durationDays = Math.max(1, Math.ceil(storyData.estimated_hours / 8));
        }

        const newStartDate = new Date(targetDate);
        const newEndDate = new Date(targetDate);
        newEndDate.setDate(newEndDate.getDate() + durationDays - 1);

        await updateStory(storyId, {
          assigned_crew_member: targetCrew === 'unassigned' ? undefined : targetCrew as CrewMember,
          start_date: newStartDate.toISOString().split('T')[0],
          estimated_completion: newEndDate.toISOString().split('T')[0]
        });
      }
    } catch (error) {
      console.error('Drop error:', error);
    }
  };

  // Handle duration change from StoryDurationBar resize
  const handleDurationChange = async (storyId: string, newStartDate: string, newEndDate: string) => {
    await updateStory(storyId, {
      start_date: newStartDate,
      estimated_completion: newEndDate
    });
  };

  // Group stories by crew
  const getCrewStories = (crewId: string): StoryWithDetails[] => {
    return sprint.stories.filter(story =>
      crewId === 'unassigned'
        ? !story.assigned_crew_member
        : story.assigned_crew_member === crewId
    );
  };

  const allCrew = Object.keys(CREW_MEMBERS) as CrewMember[];

  return (
    <div>
      <div className="sprint-timeline-container">
        {/* Sprint Header */}
        <div className="sprint-header">
          <div className="sprint-header-top">
            <div>
              <div className="sprint-title">{sprint.name}</div>
              <div className="sprint-subtitle">
                {new Date(sprint.start_date).toLocaleDateString()} → {new Date(sprint.end_date).toLocaleDateString()}
              </div>
            </div>
            <div className="sprint-metrics">
              <div className="sprint-metric">
                <div className="metric-value">{sprint.velocity_actual || 0}</div>
                <div className="metric-label">Points Done</div>
              </div>
              <div className="sprint-metric">
                <div className="metric-value">{sprint.velocity_target || 0}</div>
                <div className="metric-label">Points Target</div>
              </div>
            </div>
          </div>

          {sprint.velocity_target > 0 && (
            <div className="sprint-progress">
              <div className="progress-bar-header">
                <span>Progress</span>
                <span>{Math.round((sprint.velocity_actual / sprint.velocity_target) * 100)}%</span>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.min((sprint.velocity_actual / sprint.velocity_target) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {sprint.goals && sprint.goals.length > 0 && (
            <div className="sprint-goals">
              <div className="goals-header">Sprint Goals</div>
              <ul className="goals-list">
                {sprint.goals.map((goal, i) => (
                  <li key={i} className="goal-item">• {goal}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="timeline-area">
          <div className="timeline">
            {/* Timeline Header (Days) */}
            <div className="timeline-header">
              <div className="crew-label">Crew Member</div>
              {timelineDays.map(day => (
                <div
                  key={day.dayNumber}
                  className={`day-column ${day.isToday ? 'today' : ''} ${day.isWeekend ? 'weekend' : ''}`}
                >
                  <div className="day-number">Day {day.dayNumber}</div>
                  <div className="day-date">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  {day.isToday && <div className="today-label">TODAY</div>}
                </div>
              ))}
            </div>

            {/* Crew Swimlanes */}
            <div className="swimlanes">
              {allCrew.map(crewId => {
                const crewStories = getCrewStories(crewId);
                const crewInfo = CREW_MEMBERS[crewId];
                const storyPositions = calculateStoryPositions(crewStories);
                const maxRows = Math.max(...Array.from(storyPositions.values()).map(p => p.rowIndex + 1), 0);
                const trackHeight = Math.max(120, maxRows * 92);

                // Calculate overlap and overload indicators
                const hasOverlaps = maxRows > 1;
                const totalHours = crewStories.reduce((sum, s) => sum + (s.estimated_hours || 0), 0);
                const sprintDays = timelineDays.length;
                const avgHoursPerDay = sprintDays > 0 ? totalHours / sprintDays : 0;
                const isOverloaded = avgHoursPerDay > 8;

                return (
                  <div key={crewId} className="swimlane">
                    {/* Crew Info */}
                    <div className="crew-info">
                      <div className="crew-header">
                        <div className="crew-avatar">
                          <img
                            src={crewInfo.avatarUrl || '/default-avatar.png'}
                            alt={crewInfo.name}
                            width={40}
                            height={40}
                            className="avatarImage"
                          />
                        </div>
                        <div className="crew-details">
                          <div className="crew-name">{crewInfo.name}</div>
                          <div className="crew-specialty">{crewInfo.specialty}</div>
                        </div>
                      </div>
                      <div className="crew-stats">
                        <div className="crew-points">
                          {crewStories.reduce((sum, s) => sum + (s.story_points || 0), 0)} pts
                        </div>
                        {hasOverlaps && (
                          <div className="overlap-indicator" title={`${maxRows} concurrent stories - workload overlap detected`}>
                            ⚠️ {maxRows} rows
                          </div>
                        )}
                        {isOverloaded && (
                          <div className="overload-indicator" title={`Avg ${avgHoursPerDay.toFixed(1)}h/day - exceeds capacity`}>
                            🔴 Overloaded
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timeline Track */}
                    <div
                      className={`timeline-track ${dropTargetCrew === crewId ? 'dropTarget' : ''}`}
                      style={{ minHeight: `${trackHeight}px` }}
                      onDragOver={(e) => handleDragOver(e, crewId)}
                      onDrop={(e) => handleDrop(e, crewId)}
                      onDragLeave={() => setDropTargetCrew(null)}
                    >
                      {/* Day Cells */}
                      {timelineDays.map(day => (
                        <div
                          key={day.dayNumber}
                          className={`day-cell ${day.isToday ? 'today' : ''} ${day.isWeekend ? 'weekend' : ''}`}
                          style={{ width: `${dayWidth}px` }}
                        />
                      ))}

                      {/* Story Duration Bars (Absolutely Positioned) */}
                      <div className="stories-layer">
                        {crewStories.map(story => {
                          const position = storyPositions.get(story.id);
                          if (!position) return null;

                          return (
                            <StoryDurationBarAdapted
                              key={story.id}
                              story={story}
                              sprintStartDate={sprint.start_date}
                              dayWidth={dayWidth}
                              yOffset={position.yOffset}
                              onDurationChange={handleDurationChange}
                              onClick={() => {
                                vscode.postMessage({ command: 'openStory', storyId: story.id });
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Unassigned Lane */}
              {getCrewStories('unassigned').length > 0 && (
                <div className="swimlane">
                  <div className="crew-info">
                    <div className="crew-header">
                      <div className="crew-avatar">
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          ❓
                        </div>
                      </div>
                      <div className="crew-details">
                        <div className="crew-name">Unassigned</div>
                        <div className="crew-specialty">No crew member assigned</div>
                      </div>
                    </div>
                    <div className="crew-stats">
                      <div className="crew-points">
                        {getCrewStories('unassigned').reduce((sum, s) => sum + (s.story_points || 0), 0)} pts
                      </div>
                    </div>
                  </div>

                  <div
                    className={`timeline-track ${dropTargetCrew === 'unassigned' ? 'dropTarget' : ''}`}
                    onDragOver={(e) => handleDragOver(e, 'unassigned')}
                    onDrop={(e) => handleDrop(e, 'unassigned')}
                    onDragLeave={() => setDropTargetCrew(null)}
                  >
                    {timelineDays.map(day => (
                      <div
                        key={day.dayNumber}
                        className={`day-cell ${day.isToday ? 'today' : ''} ${day.isWeekend ? 'weekend' : ''}`}
                        style={{ width: `${dayWidth}px` }}
                      />
                    ))}

                    <div className="stories-layer">
                      {getCrewStories('unassigned').map((story, index) => {
                        const yOffset = index * 92;

                        return (
                          <StoryDurationBarAdapted
                            key={story.id}
                            story={story}
                            sprintStartDate={sprint.start_date}
                            dayWidth={dayWidth}
                            yOffset={yOffset}
                            onDurationChange={handleDurationChange}
                            onClick={() => {
                              vscode.postMessage({ command: 'openStory', storyId: story.id });
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .sprint-timeline-container {
          background: var(--vscode-editor-background);
          color: var(--vscode-foreground);
          font-family: var(--vscode-font-family);
        }

        .sprint-header {
          background: linear-gradient(135deg, #7c5cff, #00d4ff);
          padding: 24px;
          color: white;
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .sprint-header-top {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 16px;
        }

        .sprint-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .sprint-subtitle {
          font-size: 14px;
          opacity: 0.9;
        }

        .sprint-metrics {
          display: flex;
          gap: 24px;
        }

        .sprint-metric {
          text-align: right;
        }

        .metric-value {
          font-size: 28px;
          font-weight: bold;
        }

        .metric-label {
          font-size: 11px;
          opacity: 0.8;
          text-transform: uppercase;
        }

        .sprint-progress {
          margin-top: 16px;
        }

        .progress-bar-header {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 8px;
        }

        .progress-bar-track {
          width: 100%;
          height: 12px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: white;
          border-radius: 6px;
          transition: width 0.5s ease;
        }

        .sprint-goals {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .goals-header {
          font-size: 11px;
          font-weight: bold;
          opacity: 0.8;
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .goals-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .goal-item {
          font-size: 14px;
          margin-bottom: 4px;
        }

        .timeline-area {
          padding: 24px;
          background: var(--vscode-panel-background);
          overflow-x: auto;
        }

        .timeline {
          display: inline-block;
          min-width: 100%;
        }

        .timeline-header {
          display: flex;
          position: sticky;
          top: 0;
          background: var(--vscode-panel-background);
          z-index: 10;
          padding-bottom: 8px;
          border-bottom: 2px solid var(--vscode-panel-border);
          margin-bottom: 16px;
        }

        .crew-label {
          width: 180px;
          flex-shrink: 0;
          font-weight: bold;
          font-size: 14px;
          color: var(--vscode-descriptionForeground);
          display: flex;
          align-items: center;
        }

        .day-column {
          width: 120px;
          flex-shrink: 0;
          text-align: center;
          border-left: 1px solid var(--vscode-panel-border);
          padding: 8px 4px;
        }

        .day-column.today {
          background: rgba(124, 92, 255, 0.1);
          border-left: 2px solid #7c5cff;
          border-right: 2px solid #7c5cff;
        }

        .day-column.weekend {
          background: rgba(0, 0, 0, 0.1);
        }

        .day-number {
          font-size: 12px;
          font-weight: bold;
          color: var(--vscode-foreground);
        }

        .day-column.today .day-number {
          color: #7c5cff;
        }

        .day-date {
          font-size: 11px;
          color: var(--vscode-descriptionForeground);
        }

        .today-label {
          font-size: 10px;
          font-weight: bold;
          color: #7c5cff;
          margin-top: 4px;
        }

        .swimlanes {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .swimlane {
          display: flex;
          border: 1px solid var(--vscode-panel-border);
          border-radius: 8px;
          background: var(--vscode-editor-background);
          overflow: hidden;
        }

        .swimlane:hover {
          box-shadow: 0 4px 12px rgba(124, 92, 255, 0.2);
        }

        .crew-info {
          width: 180px;
          flex-shrink: 0;
          padding: 12px;
          background: var(--vscode-panel-background);
          border-right: 1px solid var(--vscode-panel-border);
        }

        .crew-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .crew-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid var(--vscode-panel-border);
        }

        .avatarImage {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .crew-details {
          flex: 1;
          min-width: 0;
        }

        .crew-name {
          font-weight: bold;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .crew-specialty {
          font-size: 11px;
          color: var(--vscode-descriptionForeground);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .crew-stats {
          font-size: 11px;
          color: var(--vscode-descriptionForeground);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .crew-points {
          font-weight: bold;
          color: #00d4ff;
          font-size: 12px;
        }

        .overlap-indicator {
          font-size: 10px;
          color: #ffd166;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .overload-indicator {
          font-size: 10px;
          color: #ff5c93;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 2px;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .timeline-track {
          flex: 1;
          display: flex;
          position: relative;
          min-height: 120px;
        }

        .timeline-track.dropTarget {
          background: rgba(124, 92, 255, 0.1);
          box-shadow: inset 0 0 0 2px rgba(124, 92, 255, 0.3);
        }

        .day-cell {
          flex-shrink: 0;
          border-left: 1px solid var(--vscode-panel-border);
        }

        .day-cell.today {
          background: rgba(124, 92, 255, 0.05);
        }

        .day-cell.weekend {
          background: rgba(0, 0, 0, 0.05);
        }

        .stories-layer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        .stories-layer > * {
          pointer-events: auto;
        }
      `}</style>
    </div>
  );
}
