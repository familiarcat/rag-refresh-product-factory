/**
 * Individual Story API Endpoints
 *
 * GET /api/stories/[id] - Get story by ID
 * PATCH /api/stories/[id] - Update story
 * DELETE /api/stories/[id] - Delete story
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { UpdateStoryRequest, StoryStatus } from '@/types/sprint';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/stories/[id]
 *
 * Get a single story with all details
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = params;

    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        persona:personas (*),
        acceptance_criteria (*),
        tasks (*),
        comments (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Story not found' },
          { status: 404 }
        );
      }

      console.error('Error fetching story:', error);
      return NextResponse.json(
        { error: 'Failed to fetch story', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Unexpected error in GET /api/stories/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/stories/[id]
 *
 * Update a story
 *
 * Request body (all fields optional):
 * {
 *   "title": "Updated title",
 *   "description": "Updated description",
 *   "status": "in_progress",
 *   "assigned_crew_member": "data",
 *   "story_points": 8,
 *   "priority": 1,
 *   "sprint_id": "uuid" // or null to move to backlog
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = params;
    const body: UpdateStoryRequest = await request.json();

    // Build update object
    const updates: Partial<any> = {};

    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;

    if (body.status !== undefined) {
      const validStatuses: StoryStatus[] = [
        'backlog', 'planned', 'in_progress', 'review', 'testing', 'done', 'blocked'
      ];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    if (body.assigned_crew_member !== undefined) {
      updates.assigned_crew_member = body.assigned_crew_member;
    }

    if (body.story_points !== undefined) {
      if (body.story_points < 0 || body.story_points > 100) {
        return NextResponse.json(
          { error: 'story_points must be between 0 and 100' },
          { status: 400 }
        );
      }
      updates.story_points = body.story_points;
    }

    if (body.priority !== undefined) {
      if (body.priority < 1 || body.priority > 5) {
        return NextResponse.json(
          { error: 'priority must be between 1 and 5' },
          { status: 400 }
        );
      }
      updates.priority = body.priority;
    }

    if (body.sprint_id !== undefined) {
      updates.sprint_id = body.sprint_id;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Perform update
    const { data, error } = await supabase
      .from('stories')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        persona:personas (*),
        acceptance_criteria (*),
        tasks (*),
        comments (*)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Story not found' },
          { status: 404 }
        );
      }

      console.error('Error updating story:', error);
      return NextResponse.json(
        { error: 'Failed to update story', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Unexpected error in PATCH /api/stories/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/stories/[id]
 *
 * Delete a story
 * WARNING: This will cascade delete acceptance criteria, tasks, and comments
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = params;

    // Check if story exists
    const { data: story } = await supabase
      .from('stories')
      .select('id, title')
      .eq('id', id)
      .single();

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Delete story
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting story:', error);
      return NextResponse.json(
        { error: 'Failed to delete story', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Story deleted successfully',
      deleted: story
    });

  } catch (error: any) {
    console.error('Unexpected error in DELETE /api/stories/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
