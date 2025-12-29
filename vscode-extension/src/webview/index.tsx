/**
 * Sprint Timeline Webview Entry Point
 *
 * Bootstraps React application in VSCode webview context.
 * Handles message passing between webview and extension host.
 */

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SprintTimelineWebview from './SprintTimelineWebview';
import './vscode-theme.css';

// VSCode API is injected by the webview
declare global {
  interface Window {
    acquireVsCodeApi: () => VSCodeAPI;
  }
}

interface VSCodeAPI {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
}

// Acquire VSCode API (only available in webview context)
const vscode = window.acquireVsCodeApi();

// Parse initial state from script tag
function getInitialState() {
  try {
    const stateElement = document.getElementById('initial-state');
    if (stateElement && stateElement.textContent) {
      return JSON.parse(stateElement.textContent);
    }
  } catch (error) {
    console.error('Failed to parse initial state:', error);
  }
  return {};
}

const initialState = getInitialState();

// Render React application
function render() {
  const container = document.getElementById('root');
  if (!container) {
    console.error('Root element not found');
    return;
  }

  const root = createRoot(container);
  root.render(
    <StrictMode>
      <SprintTimelineWebview
        vscode={vscode}
        projectId={initialState.projectId}
        apiBaseUrl={initialState.apiBaseUrl}
      />
    </StrictMode>
  );
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', render);
} else {
  render();
}

// Export for hot reload (development)
if (process.env.NODE_ENV === 'development') {
  (window as any).rerenderApp = render;
}
