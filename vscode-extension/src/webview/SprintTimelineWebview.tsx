/**
 * Sprint Timeline Webview Component
 *
 * Adapts the web SprintTimeline component for VSCode webview.
 * Replaces fetch() with message passing and uses VSCode theme CSS.
 */

import React, { useEffect, useState, useCallback } from 'react';

// Import types from shared types (we'll need to copy these or reference them)
interface Sprint {
  id: string;
  project_id: string;
  name: string;
  sprint_number: number;
  start_date: string;
  end_date: string;
  goals: string[];
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  velocity_target: number;
  velocity_actual: number;
}

interface Story {
  id: string;
  sprint_id?: string;
  project_id: string;
  title: string;
  description?: string;
  story_type: 'user_story' | 'developer_story' | 'technical_task' | 'bug_fix';
  status: 'backlog' | 'planned' | 'in_progress' | 'in_review' | 'completed' | 'blocked';
  persona_id?: string;
  assigned_crew_member?: string;
  story_points?: number;
  priority: number;
}

interface AcceptanceCriterion {
  id: string;
  story_id: string;
  given_clause: string;
  when_clause: string;
  then_clause: string;
  display_order: number;
  is_completed: boolean;
}

interface Task {
  id: string;
  story_id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'completed' | 'blocked';
  assigned_crew_member?: string;
}

interface Comment {
  id: string;
  story_id: string;
  content: string;
  author: string;
}

interface StoryWithDetails extends Story {
  acceptance_criteria: AcceptanceCriterion[];
  tasks: Task[];
  comments: Comment[];
}

interface SprintWithStories extends Sprint {
  stories: StoryWithDetails[];
}

interface VSCodeAPI {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
}

interface Props {
  vscode: VSCodeAPI;
  projectId?: string;
  apiBaseUrl?: string;
}

const CREW_MEMBERS = {
  picard: { id: 'picard' as const, name: 'Captain Picard', specialty: 'Strategy & Leadership' },
  riker: { id: 'riker' as const, name: 'Commander Riker', specialty: 'Execution & Coordination' },
  data: { id: 'data' as const, name: 'Commander Data', specialty: 'AI/ML & Data Science' },
  la_forge: { id: 'la_forge' as const, name: 'Geordi La Forge', specialty: 'Infrastructure & DevOps' },
  troi: { id: 'troi' as const, name: 'Counselor Troi', specialty: 'UX/UI & User Experience' },
  worf: { id: 'worf' as const, name: 'Lieutenant Worf', specialty: 'Security & Testing' },
  crusher: { id: 'crusher' as const, name: 'Doctor Crusher', specialty: 'Performance & Health' },
  uhura: { id: 'uhura' as const, name: 'Lieutenant Uhura', specialty: 'APIs & Integration' },
  quark: { id: 'quark' as const, name: 'Quark', specialty: 'Business & ROI' },
  obrien: { id: 'obrien' as const, name: "Chief O'Brien", specialty: 'Implementation & Maintenance' }
};

export default function SprintTimelineWebview({ vscode, projectId, apiBaseUrl }: Props) {
  const [sprints, setSprints] = useState<SprintWithStories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [selectedCrew, setSelectedCrew] = useState<string | null>(null);
  const [selectedStoryType, setSelectedStoryType] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [editingStory, setEditingStory] = useState<string | null>(null);

  // Request sprint data from extension host
  const fetchSprints = useCallback(() => {
    setLoading(true);
    vscode.postMessage({
      command: 'fetchSprints',
      filters: {
        project_id: projectId,
        status: selectedStatus,
        include_stories: true
      }
    });
  }, [vscode, projectId, selectedStatus]);

  // Filter stories client-side for advanced filters
  const filterStories = (stories: StoryWithDetails[]): StoryWithDetails[] => {
    return stories.filter(story => {
      if (selectedStoryType && story.story_type !== selectedStoryType) return false;
      if (selectedPriority && story.priority !== parseInt(selectedPriority)) return false;
      return true;
    });
  };

  // Listen for messages from extension host
  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;

      switch (message.command) {
        case 'sprintsData':
          setSprints(message.sprints || []);
          setLoading(false);
          setError(null);
          break;

        case 'error':
          setError(message.error);
          setLoading(false);
          break;

        case 'refresh':
          fetchSprints();
          break;
      }
    };

    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, [fetchSprints]);

  // Initial load
  useEffect(() => {
    fetchSprints();
  }, [fetchSprints]);

  // Handle story click (double-click to edit)
  const handleStoryClick = (story: StoryWithDetails, event: React.MouseEvent) => {
    if (event.detail === 2) {
      // Double-click to edit
      setEditingStory(story.id);
    } else {
      // Single click to open in browser
      vscode.postMessage({
        command: 'openStory',
        storyId: story.id
      });
    }
  };

  // Handle story update
  const handleStoryUpdate = (storyId: string, updates: Partial<Story>) => {
    vscode.postMessage({
      command: 'updateStory',
      storyId,
      updates
    });
    setEditingStory(null);
  };

  // Handle sprint click
  const handleSprintClick = (sprint: Sprint) => {
    vscode.postMessage({
      command: 'openSprint',
      sprintId: sprint.id
    });
  };

  // Group stories by crew member
  const getStoriesByCrew = (sprint: SprintWithStories): Record<string, StoryWithDetails[]> => {
    const grouped: Record<string, StoryWithDetails[]> = {};

    Object.keys(CREW_MEMBERS).forEach(crew => {
      grouped[crew] = [];
    });
    grouped['unassigned'] = [];

    sprint.stories?.forEach(story => {
      const crew = story.assigned_crew_member || 'unassigned';
      if (!grouped[crew]) grouped[crew] = [];
      grouped[crew].push(story);
    });

    return grouped;
  };

  // Get visible crew members (hide empty in compact mode)
  const getVisibleCrewMembers = (sprint: SprintWithStories): string[] => {
    const storiesByCrew = getStoriesByCrew(sprint);
    const allCrew = Object.keys(CREW_MEMBERS);

    // Filter by selected crew
    if (selectedCrew && selectedCrew !== 'all') {
      return allCrew.filter(crew => crew === selectedCrew);
    }

    // Show all crew with stories
    return allCrew.filter(crew => storiesByCrew[crew].length > 0);
  };

  // Status colors
  const statusColors: Record<string, string> = {
    backlog: 'bg-gray-200 text-gray-700',
    planned: 'bg-blue-200 text-blue-700',
    in_progress: 'bg-yellow-200 text-yellow-800',
    in_review: 'bg-purple-200 text-purple-700',
    completed: 'bg-green-200 text-green-800',
    blocked: 'bg-red-200 text-red-700'
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-600">Loading sprints...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-200 text-red-700 p-4 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
        <button onClick={fetchSprints} className="mt-4">Retry</button>
      </div>
    );
  }

  if (sprints.length === 0) {
    return (
      <div className="p-6">
        <div className="text-gray-600">No sprints found.</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Filter Controls */}
      <div className="mb-4">
        <div className="flex gap-3 items-center flex-wrap mb-2">
          <div>
            <label className="text-sm text-gray-600 mr-2">Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1 rounded border border-gray-300"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600 mr-2">Crew:</label>
            <select
              value={selectedCrew || 'all'}
              onChange={(e) => setSelectedCrew(e.target.value === 'all' ? null : e.target.value)}
              className="px-3 py-1 rounded border border-gray-300"
            >
              <option value="all">All Crew</option>
              {Object.entries(CREW_MEMBERS).map(([id, info]) => (
                <option key={id} value={id}>{info.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm px-2 py-1"
          >
            {showFilters ? '▼' : '▶'} Advanced Filters
          </button>

          <button onClick={fetchSprints} className="ml-auto">
            ↻ Refresh
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="flex gap-3 items-center flex-wrap p-3 bg-gray-50 rounded border border-gray-200">
            <div>
              <label className="text-sm text-gray-600 mr-2">Story Type:</label>
              <select
                value={selectedStoryType || 'all'}
                onChange={(e) => setSelectedStoryType(e.target.value === 'all' ? null : e.target.value)}
                className="px-3 py-1 rounded border border-gray-300"
              >
                <option value="all">All Types</option>
                <option value="user_story">User Story</option>
                <option value="developer_story">Developer Story</option>
                <option value="technical_task">Technical Task</option>
                <option value="bug_fix">Bug Fix</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600 mr-2">Priority:</label>
              <select
                value={selectedPriority || 'all'}
                onChange={(e) => setSelectedPriority(e.target.value === 'all' ? null : e.target.value)}
                className="px-3 py-1 rounded border border-gray-300"
              >
                <option value="all">All Priorities</option>
                <option value="1">P1 - Highest</option>
                <option value="2">P2 - High</option>
                <option value="3">P3 - Medium</option>
                <option value="4">P4 - Low</option>
                <option value="5">P5 - Lowest</option>
              </select>
            </div>

            <button
              onClick={() => {
                setSelectedStoryType(null);
                setSelectedPriority(null);
              }}
              className="text-sm px-2 py-1"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Sprint Timeline */}
      <div className="grid grid-cols-1 gap-6">
        {sprints.map((sprint) => {
          // Apply advanced filters to stories
          const filteredSprint = {
            ...sprint,
            stories: filterStories(sprint.stories || [])
          };
          const visibleCrew = getVisibleCrewMembers(filteredSprint);
          const storiesByCrew = getStoriesByCrew(filteredSprint);
          const totalStories = sprint.stories?.length || 0;
          const completedStories = sprint.stories?.filter(s => s.status === 'completed').length || 0;
          const progressPercent = totalStories > 0 ? Math.round((sprint.velocity_actual / sprint.velocity_target) * 100) : 0;

          return (
            <div key={sprint.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              {/* Sprint Header */}
              <div
                className="sprint-card p-4 rounded-lg mb-3 cursor-pointer"
                onClick={() => handleSprintClick(sprint)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white">{sprint.name}</h3>
                  <span className="text-xs text-white px-2 py-1 bg-white bg-opacity-20 rounded">
                    {new Date(sprint.start_date).toLocaleDateString()} - {new Date(sprint.end_date).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-sm text-white mb-2">
                  {sprint.velocity_actual} / {sprint.velocity_target} story points ({progressPercent}%)
                </div>

                <div className="progress-bar-bg rounded-full h-2 mb-2">
                  <div
                    className="progress-bar-fill rounded-full h-2 transition-all"
                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                  />
                </div>

                {sprint.goals && sprint.goals.length > 0 && (
                  <ul className="text-xs text-white list-disc list-inside">
                    {sprint.goals.map((goal, i) => (
                      <li key={i}>{goal}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Crew Swimlanes */}
              {visibleCrew.map(crewId => {
                const crewInfo = CREW_MEMBERS[crewId as keyof typeof CREW_MEMBERS];
                const stories = storiesByCrew[crewId];

                return (
                  <div key={crewId} className="border border-gray-200 rounded-lg p-3 bg-gray-50 mb-2">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <div className="font-medium text-sm">{crewInfo.name}</div>
                        <div className="text-xs text-gray-600">{crewInfo.specialty}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {stories.reduce((sum, s) => sum + (s.story_points || 0), 0)} pts
                        </div>
                        <div className="text-xs text-gray-600">
                          {stories.filter(s => s.status === 'completed').length}/{stories.length} completed
                        </div>
                      </div>
                    </div>

                    {/* Story Cards */}
                    <div className="flex gap-2 overflow-x-auto">
                      {stories.map(story => {
                        const isEditing = editingStory === story.id;

                        return isEditing ? (
                          // Editable Story Card
                          <div
                            key={story.id}
                            className="border border-blue-500 rounded p-2.5 bg-white shadow-md min-w-[200px]"
                          >
                            <div className="mb-2">
                              <label className="text-xs text-gray-600">Status:</label>
                              <select
                                className="w-full text-xs px-1 py-1 border rounded"
                                defaultValue={story.status}
                                onChange={(e) => handleStoryUpdate(story.id, { status: e.target.value as any })}
                              >
                                <option value="backlog">Backlog</option>
                                <option value="planned">Planned</option>
                                <option value="in_progress">In Progress</option>
                                <option value="in_review">In Review</option>
                                <option value="completed">Completed</option>
                                <option value="blocked">Blocked</option>
                              </select>
                            </div>
                            <div className="text-sm font-medium mb-2">{story.title}</div>
                            <div className="mb-2">
                              <label className="text-xs text-gray-600">Crew:</label>
                              <select
                                className="w-full text-xs px-1 py-1 border rounded"
                                defaultValue={story.assigned_crew_member || 'unassigned'}
                                onChange={(e) => handleStoryUpdate(story.id, { assigned_crew_member: e.target.value === 'unassigned' ? undefined : e.target.value })}
                              >
                                <option value="unassigned">Unassigned</option>
                                {Object.entries(CREW_MEMBERS).map(([id, info]) => (
                                  <option key={id} value={id}>{info.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="mb-2">
                              <label className="text-xs text-gray-600">Points:</label>
                              <input
                                type="number"
                                className="w-full text-xs px-1 py-1 border rounded"
                                defaultValue={story.story_points || 0}
                                min="0"
                                max="100"
                                onBlur={(e) => handleStoryUpdate(story.id, { story_points: parseInt(e.target.value) || 0 })}
                              />
                            </div>
                            <button
                              onClick={() => setEditingStory(null)}
                              className="text-xs px-2 py-1 w-full"
                            >
                              Close
                            </button>
                          </div>
                        ) : (
                          // Regular Story Card
                          <div
                            key={story.id}
                            className="border border-gray-300 rounded p-2.5 bg-white shadow-sm hover:shadow-md hover:border-blue-500 cursor-pointer transition-all min-w-[180px]"
                            onClick={(e) => handleStoryClick(story, e)}
                            title="Double-click to edit, single-click to view"
                          >
                            <div className={`text-xs px-2 py-1 rounded mb-2 inline-block ${statusColors[story.status]}`}>
                              {story.status.replace(/_/g, ' ')}
                            </div>
                            <div className="text-sm font-medium mb-1">{story.title}</div>
                            <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                              <span>{story.story_type.replace(/_/g, ' ')}</span>
                              <span className="font-semibold">{story.story_points || 0} pts</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {story.assigned_crew_member ? CREW_MEMBERS[story.assigned_crew_member as keyof typeof CREW_MEMBERS]?.name.split(' ')[1] : 'Unassigned'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
