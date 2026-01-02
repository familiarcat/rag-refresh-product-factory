/**
 * StoryDurationBar - Adapted for VSCode Webview
 *
 * Multi-day story duration visualization with:
 * - Drag to move entire duration
 * - Resize handles to stretch/contract duration
 * - Visual feedback for status and priority
 * - Effort/cost metrics display
 */

import React, { useState } from 'react';
import type { StoryWithDetails } from '../../../types/sprint';
import { estimateCost, CREW_HOURLY_RATES } from '../../../utils/story-estimation';
import { CREW_MEMBERS } from '../../../types/sprint';
import '../../../components/StoryDurationBar.module.css';

export interface StoryDurationBarProps {
  story: StoryWithDetails;
  sprintStartDate: string;
  dayWidth: number;
  yOffset: number;
  onDurationChange: (storyId: string, newStartDate: string, newEndDate: string) => void;
  onClick: () => void;
}

export default function StoryDurationBarAdapted({
  story,
  sprintStartDate,
  dayWidth,
  yOffset,
  onDurationChange,
  onClick
}: StoryDurationBarProps) {
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeStartX, setResizeStartX] = useState<number>(0);
  const [resizeStartDates, setResizeStartDates] = useState<{ start: string; end: string } | null>(null);

  // Calculate position and duration
  const getBarMetrics = () => {
    const sprintStart = new Date(sprintStartDate);
    const storyStart = story.start_date ? new Date(story.start_date) : null;
    const storyEnd = story.estimated_completion ? new Date(story.estimated_completion) : null;

    if (!storyStart && !storyEnd) {
      return { startDay: 1, durationDays: 1, leftOffset: 0, width: dayWidth };
    }

    if (!storyStart && storyEnd) {
      const durationDays = story.estimated_hours ? Math.max(1, Math.ceil(story.estimated_hours / 8)) : 1;
      const calculatedStart = new Date(storyEnd);
      calculatedStart.setDate(calculatedStart.getDate() - durationDays + 1);

      const startDay = Math.floor((calculatedStart.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const leftOffset = (startDay - 1) * dayWidth;
      const width = durationDays * dayWidth;

      return { startDay: Math.max(1, startDay), durationDays, leftOffset, width };
    }

    if (storyStart && !storyEnd) {
      const durationDays = story.estimated_hours ? Math.max(1, Math.ceil(story.estimated_hours / 8)) : 1;
      const startDay = Math.floor((storyStart.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const leftOffset = (startDay - 1) * dayWidth;
      const width = durationDays * dayWidth;

      return { startDay: Math.max(1, startDay), durationDays, leftOffset, width };
    }

    const startDay = Math.floor((storyStart!.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const endDay = Math.floor((storyEnd!.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const durationDays = Math.max(1, endDay - startDay + 1);
    const leftOffset = (startDay - 1) * dayWidth;
    const width = durationDays * dayWidth;

    return { startDay: Math.max(1, startDay), durationDays, leftOffset, width };
  };

  const { startDay, durationDays, leftOffset, width } = getBarMetrics();

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.stopPropagation();
    e.preventDefault();

    setIsResizing(side);
    setResizeStartX(e.clientX);

    const storyStart = story.start_date ? story.start_date : sprintStartDate;
    const storyEnd = story.estimated_completion ? story.estimated_completion : sprintStartDate;

    setResizeStartDates({ start: storyStart, end: storyEnd });
  };

  // Handle mouse move during resize
  React.useEffect(() => {
    if (!isResizing || !resizeStartDates) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartX;
      const daysDelta = Math.round(deltaX / dayWidth);

      if (daysDelta === 0) return;

      const currentStart = new Date(resizeStartDates.start);
      const currentEnd = new Date(resizeStartDates.end);

      if (isResizing === 'left') {
        const newStart = new Date(currentStart);
        newStart.setDate(newStart.getDate() + daysDelta);

        if (newStart < currentEnd) {
          const newStartStr = newStart.toISOString().split('T')[0];
          story.start_date = newStartStr;
        }
      } else if (isResizing === 'right') {
        const newEnd = new Date(currentEnd);
        newEnd.setDate(newEnd.getDate() + daysDelta);

        if (newEnd > currentStart) {
          const newEndStr = newEnd.toISOString().split('T')[0];
          story.estimated_completion = newEndStr;
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isResizing && resizeStartDates) {
        const deltaX = e.clientX - resizeStartX;
        const daysDelta = Math.round(deltaX / dayWidth);

        if (daysDelta !== 0) {
          const currentStart = new Date(resizeStartDates.start);
          const currentEnd = new Date(resizeStartDates.end);

          let newStart = resizeStartDates.start;
          let newEnd = resizeStartDates.end;

          if (isResizing === 'left') {
            const adjusted = new Date(currentStart);
            adjusted.setDate(adjusted.getDate() + daysDelta);
            if (adjusted < currentEnd) {
              newStart = adjusted.toISOString().split('T')[0];
            }
          } else if (isResizing === 'right') {
            const adjusted = new Date(currentEnd);
            adjusted.setDate(adjusted.getDate() + daysDelta);
            if (adjusted > currentStart) {
              newEnd = adjusted.toISOString().split('T')[0];
            }
          }

          onDurationChange(story.id, newStart, newEnd);
        }
      }

      setIsResizing(null);
      setResizeStartX(0);
      setResizeStartDates(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStartX, resizeStartDates, dayWidth, sprintStartDate, story, onDurationChange]);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent) => {
    if (isResizing) {
      e.preventDefault();
      return;
    }

    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('storyId', story.id);
    e.dataTransfer.setData('storyData', JSON.stringify(story));
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Calculate criteria progress
  const completedCriteria = story.acceptance_criteria?.filter(ac => ac.is_completed).length || 0;
  const totalCriteria = story.acceptance_criteria?.length || 0;
  const criteriaProgress = totalCriteria > 0 ? Math.round((completedCriteria / totalCriteria) * 100) : 0;

  // Calculate effort and cost metrics
  const estimatedHours = story.estimated_hours || 0;
  const cost = estimateCost(estimatedHours, story.assigned_crew_member as any);
  const crewRate = story.assigned_crew_member ? CREW_HOURLY_RATES[story.assigned_crew_member as keyof typeof CREW_HOURLY_RATES] : 0;

  // Calculate velocity (story points per day)
  const velocity = durationDays > 0 ? (story.story_points || 0) / durationDays : 0;

  // Calculate efficiency score (0-100)
  const hoursPerPoint = (story.story_points || 0) > 0 ? estimatedHours / (story.story_points || 1) : 0;
  const efficiencyScore = Math.max(0, Math.min(100, 100 - (hoursPerPoint * 5)));

  // Status colors
  const statusClass = `status-${story.status}`;

  return (
    <div
      draggable={!isResizing}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={(e) => {
        if (!isResizing) {
          onClick();
        }
      }}
      className={`duration-bar ${statusClass} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      style={{
        left: `${leftOffset}px`,
        top: `${yOffset}px`,
        width: `${width}px`,
        minWidth: `${dayWidth}px`,
        cursor: isResizing ? 'ew-resize' : 'grab'
      }}
    >
      {/* Left Resize Handle */}
      <div
        className="resize-handle left"
        onMouseDown={(e) => handleResizeStart(e, 'left')}
        title="Drag to adjust start date"
      >
        <div className="resize-grip"></div>
      </div>

      {/* Bar Content */}
      <div className="bar-content">
        {/* Story Points Badge */}
        {story.story_points && (
          <div className="story-points">{story.story_points}</div>
        )}

        {/* Priority Star */}
        {story.priority && story.priority <= 2 && (
          <div className="priority-star">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" />
            </svg>
          </div>
        )}

        {/* Story Info */}
        <div className="story-info">
          <div className="story-title">{story.title}</div>
          <div className="story-meta">
            <span className="story-type">{story.story_type.replace('_', ' ')}</span>
            <span className="duration">{durationDays}d</span>
            {estimatedHours > 0 && (
              <span className="hours" title="Estimated Hours">⏱️ {estimatedHours}h</span>
            )}
            {velocity > 0 && (
              <span className="velocity" title="Velocity (pts/day)">⚡ {velocity.toFixed(1)} pt/d</span>
            )}
          </div>
          <div className="metrics">
            {cost > 0 && (
              <span className="cost" title={`Cost: ${crewRate} GPL/h × ${estimatedHours}h`}>
                💰 {cost.toLocaleString()} GPL
              </span>
            )}
            {efficiencyScore > 0 && (
              <span
                className="efficiency"
                style={{ color: efficiencyScore >= 80 ? '#28d99a' : efficiencyScore >= 60 ? '#ffd166' : '#ff5c93' }}
                title={`Efficiency: ${hoursPerPoint.toFixed(1)}h per story point`}
              >
                📊 {efficiencyScore.toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        {/* Criteria Progress */}
        {totalCriteria > 0 && (
          <div className="criteria-progress">
            <div className="criteria-bar">
              <div className="criteria-fill" style={{ width: `${criteriaProgress}%` }} />
            </div>
            <div className="criteria-text">{completedCriteria}/{totalCriteria}</div>
          </div>
        )}
      </div>

      {/* Right Resize Handle */}
      <div
        className="resize-handle right"
        onMouseDown={(e) => handleResizeStart(e, 'right')}
        title="Drag to adjust end date"
      >
        <div className="resize-grip"></div>
      </div>

      {/* Hover Tooltip */}
      <div className="tooltip">
        <div><strong>{story.title}</strong></div>
        <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
          {story.story_points || 0} pts • {durationDays} days • {velocity.toFixed(1)} pt/day
        </div>
        {story.start_date && story.estimated_completion && (
          <div style={{ fontSize: '11px', marginTop: '4px' }}>
            📅 {new Date(story.start_date).toLocaleDateString()} → {new Date(story.estimated_completion).toLocaleDateString()}
          </div>
        )}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', marginTop: '6px', paddingTop: '6px', fontSize: '11px' }}>
          <div>⏱️ Effort: {estimatedHours}h ({hoursPerPoint.toFixed(1)}h per point)</div>
          {cost > 0 && (
            <div>💰 Cost: {cost.toLocaleString()} GPL ({crewRate} GPL/h)</div>
          )}
          <div>📊 Efficiency: {efficiencyScore.toFixed(0)}%</div>
          {story.assigned_crew_member && (
            <div style={{ marginTop: '4px', fontWeight: 'bold' }}>
              👤 {CREW_MEMBERS[story.assigned_crew_member as keyof typeof CREW_MEMBERS]?.name}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .duration-bar {
          position: absolute;
          top: 8px;
          height: 76px;
          border: 2px solid;
          border-radius: 8px;
          padding: 8px 24px;
          cursor: grab;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          overflow: visible;
          z-index: 1;
        }

        .duration-bar:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
          z-index: 10;
        }

        .duration-bar.dragging {
          opacity: 0.6;
          cursor: grabbing;
          z-index: 100;
        }

        .duration-bar.resizing {
          cursor: ew-resize;
          z-index: 100;
          box-shadow: 0 8px 20px rgba(124, 92, 255, 0.4);
        }

        /* Status Colors */
        .duration-bar.status-planned {
          background: linear-gradient(135deg, rgba(90, 230, 255, 0.15), rgba(90, 230, 255, 0.25));
          border-color: #5ae6ff;
          color: #5ae6ff;
        }

        .duration-bar.status-in_progress {
          background: linear-gradient(135deg, rgba(255, 209, 102, 0.15), rgba(255, 209, 102, 0.25));
          border-color: #ffd166;
          color: #ffd166;
        }

        .duration-bar.status-in_review {
          background: linear-gradient(135deg, rgba(124, 92, 255, 0.15), rgba(124, 92, 255, 0.25));
          border-color: #7c5cff;
          color: #7c5cff;
        }

        .duration-bar.status-completed {
          background: linear-gradient(135deg, rgba(40, 217, 154, 0.15), rgba(40, 217, 154, 0.25));
          border-color: #28d99a;
          color: #28d99a;
        }

        .duration-bar.status-blocked {
          background: linear-gradient(135deg, rgba(255, 92, 147, 0.15), rgba(255, 92, 147, 0.25));
          border-color: #ff5c93;
          color: #ff5c93;
        }

        .duration-bar.status-backlog {
          background: linear-gradient(135deg, rgba(128, 128, 128, 0.1), rgba(128, 128, 128, 0.2));
          border-color: #808080;
          color: #808080;
        }

        /* Resize Handles */
        .resize-handle {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: ew-resize;
          z-index: 2;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .duration-bar:hover .resize-handle {
          opacity: 1;
        }

        .resize-handle.left {
          left: 0;
          border-right: 2px solid currentColor;
          background: linear-gradient(90deg, currentColor, transparent);
        }

        .resize-handle.right {
          right: 0;
          border-left: 2px solid currentColor;
          background: linear-gradient(-90deg, currentColor, transparent);
        }

        .resize-grip {
          width: 4px;
          height: 40px;
          background: currentColor;
          border-radius: 2px;
          opacity: 0.7;
        }

        .resize-handle:hover .resize-grip {
          opacity: 1;
          height: 50px;
        }

        /* Bar Content */
        .bar-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
          position: relative;
        }

        .story-points {
          position: absolute;
          top: -12px;
          right: -8px;
          width: 28px;
          height: 28px;
          background: var(--vscode-editor-background);
          border: 2px solid currentColor;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          z-index: 3;
        }

        .priority-star {
          position: absolute;
          top: -8px;
          left: -8px;
          color: #ff5c93;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
          z-index: 3;
        }

        .story-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .story-title {
          font-size: 13px;
          font-weight: bold;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: var(--vscode-foreground);
        }

        .story-meta {
          display: flex;
          gap: 8px;
          font-size: 11px;
          opacity: 0.8;
        }

        .story-type {
          text-transform: capitalize;
        }

        .duration {
          font-weight: bold;
        }

        .hours {
          opacity: 0.8;
        }

        .velocity {
          font-weight: bold;
          opacity: 0.9;
        }

        .metrics {
          display: flex;
          gap: 10px;
          font-size: 10px;
          margin-top: 4px;
          font-weight: 600;
        }

        .cost {
          color: #ffd166;
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .efficiency {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .criteria-progress {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 60px;
        }

        .criteria-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
          overflow: hidden;
        }

        .criteria-fill {
          height: 100%;
          background: currentColor;
          border-radius: 2px;
          transition: width 0.3s;
        }

        .criteria-text {
          font-size: 10px;
          text-align: center;
          opacity: 0.8;
        }

        /* Tooltip */
        .tooltip {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: var(--vscode-editor-background);
          border: 1px solid var(--vscode-panel-border);
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 12px;
          color: var(--vscode-foreground);
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .duration-bar:hover .tooltip {
          opacity: 1;
        }

        .tooltip div {
          margin: 2px 0;
        }
      `}</style>
    </div>
  );
}
