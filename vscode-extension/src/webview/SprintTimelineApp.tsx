/**
 * Sprint Timeline App - Wrapper for VSCode Webview
 *
 * Manages state and message passing between extension host and React components.
 * Uses the advanced HorizontalSprintTimeline with all features from web dashboard.
 */

import React, { useEffect, useState, useCallback } from 'react';
import HorizontalSprintTimelineAdapted from './HorizontalSprintTimelineAdapted';

interface VSCodeAPI {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
}

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

interface StoryWithDetails {
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
  start_date?: string;
  estimated_completion?: string;
  estimated_hours?: number;
  cost_estimate?: number;
  acceptance_criteria?: any[];
  tasks?: any[];
  comments?: any[];
}

interface SprintWithStories extends Sprint {
  stories: StoryWithDetails[];
}

interface Props {
  vscode: VSCodeAPI;
  projectId?: string;
  apiBaseUrl?: string;
}

export default function SprintTimelineApp({ vscode, projectId, apiBaseUrl }: Props) {
  const [sprints, setSprints] = useState<SprintWithStories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Request sprint data from extension host
  const fetchSprints = useCallback(() => {
    setLoading(true);
    setError(null);
    vscode.postMessage({
      command: 'fetchSprints',
      filters: {
        project_id: projectId,
        status: 'active',
        include_stories: true
      }
    });
  }, [vscode, projectId]);

  // Listen for messages from extension host
  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;

      switch (message.command) {
        case 'sprintsData':
          console.log('[SprintTimelineApp] Received sprints data:', message.sprints);
          setSprints(message.sprints || []);
          setLoading(false);
          setError(null);
          break;

        case 'error':
          console.error('[SprintTimelineApp] Error:', message.error);
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

  // Handle story update
  const handleStoryUpdate = (storyId: string, updates: any) => {
    vscode.postMessage({
      command: 'updateStory',
      storyId,
      updates
    });
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        flexDirection: 'column',
        gap: '16px',
        color: 'var(--vscode-foreground)'
      }}>
        <div className="spinner" style={{
          border: '3px solid var(--vscode-panel-border)',
          borderTopColor: '#7c5cff',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ color: 'var(--vscode-descriptionForeground)' }}>
          Loading sprint timeline...
        </span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        backgroundColor: 'var(--vscode-editor-background)',
        borderRadius: '12px',
        border: '1px solid var(--vscode-panel-border)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'var(--vscode-foreground)',
            marginBottom: '8px'
          }}>
            Error loading sprints
          </div>
          <div style={{
            color: 'var(--vscode-errorForeground)',
            marginBottom: '16px'
          }}>
            {error}
          </div>
          <button
            onClick={fetchSprints}
            style={{
              padding: '10px 20px',
              background: 'var(--vscode-button-background)',
              color: 'var(--vscode-button-foreground)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (sprints.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'var(--vscode-foreground)',
            marginBottom: '8px'
          }}>
            No active sprints found
          </div>
          <div style={{
            color: 'var(--vscode-descriptionForeground)',
            marginBottom: '24px'
          }}>
            Create a sprint in the web dashboard to get started
          </div>
          <button
            onClick={() => {
              vscode.postMessage({
                command: 'openUrl',
                url: `${apiBaseUrl}/sprints`
              });
            }}
            style={{
              padding: '12px 24px',
              background: '#7c5cff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Open Sprint Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--vscode-editor-background)',
      color: 'var(--vscode-foreground)',
      minHeight: '100vh',
      padding: '16px'
    }}>
      {sprints.map(sprint => (
        <div key={sprint.id} style={{ marginBottom: '32px' }}>
          <HorizontalSprintTimelineAdapted
            sprint={sprint}
            vscode={vscode}
            onStoryUpdate={handleStoryUpdate}
          />
        </div>
      ))}
    </div>
  );
}
