'use client';

/**
 * StoryDurationBar - Multi-day story duration visualization
 *
 * Renders stories as horizontal bars spanning multiple days with:
 * - Drag to move entire duration
 * - Resize handles to stretch/contract duration
 * - Visual feedback for status and priority
 */

import React, { useState } from 'react';
import type { StoryWithDetails } from '@/types/sprint';
import styles from './StoryDurationBar.module.css';

export interface StoryDurationBarProps {
  story: StoryWithDetails;
  sprintStartDate: string;
  dayWidth: number; // Width of each day column in pixels
  onDurationChange: (storyId: string, newStartDate: string, newEndDate: string) => void;
  onClick: () => void;
}

export default function StoryDurationBar({
  story,
  sprintStartDate,
  dayWidth,
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
      // No dates set - default to 1 day at day 1
      return { startDay: 1, durationDays: 1, leftOffset: 0, width: dayWidth };
    }

    if (!storyStart && storyEnd) {
      // Only end date set - calculate start from estimated_hours or default to 1 day
      const durationDays = story.estimated_hours ? Math.max(1, Math.ceil(story.estimated_hours / 8)) : 1;
      const calculatedStart = new Date(storyEnd);
      calculatedStart.setDate(calculatedStart.getDate() - durationDays + 1);

      const startDay = Math.floor((calculatedStart.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const leftOffset = (startDay - 1) * dayWidth;
      const width = durationDays * dayWidth;

      return { startDay: Math.max(1, startDay), durationDays, leftOffset, width };
    }

    if (storyStart && !storyEnd) {
      // Only start date set - default to estimated_hours or 1 day
      const durationDays = story.estimated_hours ? Math.max(1, Math.ceil(story.estimated_hours / 8)) : 1;
      const startDay = Math.floor((storyStart.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const leftOffset = (startDay - 1) * dayWidth;
      const width = durationDays * dayWidth;

      return { startDay: Math.max(1, startDay), durationDays, leftOffset, width };
    }

    // Both dates set - calculate actual duration
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

    // Store initial dates
    const sprintStart = new Date(sprintStartDate);
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

      const sprintStart = new Date(sprintStartDate);
      const currentStart = new Date(resizeStartDates.start);
      const currentEnd = new Date(resizeStartDates.end);

      if (isResizing === 'left') {
        // Adjust start date
        const newStart = new Date(currentStart);
        newStart.setDate(newStart.getDate() + daysDelta);

        // Don't let start go past end
        if (newStart < currentEnd) {
          const newStartStr = newStart.toISOString().split('T')[0];
          const tempEndStr = currentEnd.toISOString().split('T')[0];

          // Update temporarily (visual feedback)
          story.start_date = newStartStr;
        }
      } else if (isResizing === 'right') {
        // Adjust end date
        const newEnd = new Date(currentEnd);
        newEnd.setDate(newEnd.getDate() + daysDelta);

        // Don't let end go before start
        if (newEnd > currentStart) {
          const tempStartStr = currentStart.toISOString().split('T')[0];
          const newEndStr = newEnd.toISOString().split('T')[0];

          // Update temporarily (visual feedback)
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

          // Call the update callback
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
      className={`${styles.durationBar} ${styles[`status-${story.status}`]} ${isDragging ? styles.dragging : ''} ${isResizing ? styles.resizing : ''}`}
      style={{
        left: `${leftOffset}px`,
        width: `${width}px`,
        minWidth: `${dayWidth}px`,
        cursor: isResizing ? 'ew-resize' : 'grab'
      }}
    >
      {/* Left Resize Handle */}
      <div
        className={`${styles.resizeHandle} ${styles.left}`}
        onMouseDown={(e) => handleResizeStart(e, 'left')}
        title="Drag to adjust start date"
      >
        <div className={styles.resizeGrip}></div>
      </div>

      {/* Bar Content */}
      <div className={styles.barContent}>
        {/* Story Points Badge */}
        {story.story_points && (
          <div className={styles.storyPoints}>{story.story_points}</div>
        )}

        {/* Priority Star */}
        {story.priority && story.priority <= 2 && (
          <div className={styles.priorityStar}>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" />
            </svg>
          </div>
        )}

        {/* Story Info */}
        <div className={styles.storyInfo}>
          <div className={styles.storyTitle}>{story.title}</div>
          <div className={styles.storyMeta}>
            <span className={styles.storyType}>{story.story_type.replace('_', ' ')}</span>
            <span className={styles.duration}>{durationDays}d</span>
            {story.estimated_hours && (
              <span className={styles.hours}>{story.estimated_hours}h</span>
            )}
          </div>
        </div>

        {/* Criteria Progress */}
        {totalCriteria > 0 && (
          <div className={styles.criteriaProgress}>
            <div className={styles.criteriaBar}>
              <div className={styles.criteriaFill} style={{ width: `${criteriaProgress}%` }} />
            </div>
            <div className={styles.criteriaText}>{completedCriteria}/{totalCriteria}</div>
          </div>
        )}
      </div>

      {/* Right Resize Handle */}
      <div
        className={`${styles.resizeHandle} ${styles.right}`}
        onMouseDown={(e) => handleResizeStart(e, 'right')}
        title="Drag to adjust end date"
      >
        <div className={styles.resizeGrip}></div>
      </div>

      {/* Hover Tooltip */}
      <div className={styles.tooltip}>
        <div><strong>{story.title}</strong></div>
        <div>{durationDays} days • {story.story_points || 0} pts</div>
        {story.start_date && story.estimated_completion && (
          <div>
            {new Date(story.start_date).toLocaleDateString()} → {new Date(story.estimated_completion).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}
