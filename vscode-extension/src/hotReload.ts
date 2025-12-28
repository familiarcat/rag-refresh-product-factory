/**
 * Hot Reload System
 *
 * Provides real-time synchronization between VSCode extension and web dashboard:
 * - WebSocket connection to web server for live updates
 * - Automatic UI refresh when data changes
 * - Development mode with auto-reconnection
 */

import * as vscode from 'vscode';

export interface HotReloadMessage {
  type: 'projects_updated' | 'crew_updated' | 'metrics_updated' | 'ping' | 'reload';
  data?: any;
  timestamp: number;
}

export class HotReloadManager {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private isEnabled: boolean = false;
  private baseUrl: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private readonly reconnectDelay: number = 3000; // 3 seconds

  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(private context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('alexAi');
    this.baseUrl = config.get<string>('baseUrl') || 'https://rag.pbradygeorgen.com';

    // Enable hot reload in development mode
    const isDevelopment = config.get<boolean>('enableHotReload', false);
    if (isDevelopment) {
      this.enable();
    }

    // Watch for configuration changes
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('alexAi.baseUrl')) {
          const newBaseUrl = vscode.workspace.getConfiguration('alexAi').get<string>('baseUrl');
          if (newBaseUrl && newBaseUrl !== this.baseUrl) {
            this.baseUrl = newBaseUrl;
            this.reconnect();
          }
        }
        if (e.affectsConfiguration('alexAi.enableHotReload')) {
          const newEnabled = vscode.workspace.getConfiguration('alexAi').get<boolean>('enableHotReload', false);
          if (newEnabled && !this.isEnabled) {
            this.enable();
          } else if (!newEnabled && this.isEnabled) {
            this.disable();
          }
        }
      })
    );
  }

  /**
   * Enable hot reload connection
   */
  public enable(): void {
    if (this.isEnabled) return;
    this.isEnabled = true;
    this.connect();
    console.log('[HotReload] Enabled');
  }

  /**
   * Disable hot reload connection
   */
  public disable(): void {
    if (!this.isEnabled) return;
    this.isEnabled = false;
    this.disconnect();
    console.log('[HotReload] Disabled');
  }

  /**
   * Connect to WebSocket server
   */
  private connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      // Convert HTTP(S) URL to WS(S) URL
      const wsUrl = this.baseUrl.replace(/^http/, 'ws') + '/api/ws';

      console.log(`[HotReload] Connecting to ${wsUrl}`);

      // Note: Browser WebSocket API
      // In Node.js environment, you'd need 'ws' package
      // For VS Code extension, we'll use HTTP polling instead
      this.startPolling();

    } catch (error) {
      console.error('[HotReload] Connection error:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Polling-based fallback (more reliable in VS Code extensions)
   */
  private pollingTimer: NodeJS.Timeout | null = null;
  private lastETag: string | null = null;

  private startPolling(): void {
    if (this.pollingTimer) return;

    const poll = async () => {
      if (!this.isEnabled) return;

      try {
        // Poll for updates every 5 seconds
        const response = await fetch(`${this.baseUrl}/api/updates`, {
          headers: this.lastETag ? { 'If-None-Match': this.lastETag } : {},
        });

        if (response.status === 304) {
          // No changes
          return;
        }

        if (response.ok) {
          const etag = response.headers.get('etag');
          if (etag) {
            this.lastETag = etag;
          }

          const updates = await response.json();
          this.handleUpdates(updates);
        }
      } catch (error) {
        console.error('[HotReload] Polling error:', error);
      }
    };

    // Poll immediately, then every 5 seconds
    poll();
    this.pollingTimer = setInterval(poll, 5000);
    console.log('[HotReload] Polling started');
  }

  private stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
      console.log('[HotReload] Polling stopped');
    }
  }

  /**
   * Handle incoming updates
   */
  private handleUpdates(updates: any): void {
    if (!updates || !Array.isArray(updates.changes)) return;

    for (const change of updates.changes) {
      const { type, data } = change;

      console.log(`[HotReload] Received update: ${type}`);

      // Notify listeners
      const listeners = this.listeners.get(type);
      if (listeners) {
        listeners.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`[HotReload] Listener error for ${type}:`, error);
          }
        });
      }

      // Trigger global refresh event
      this.notifyListeners('*', { type, data });
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  private disconnect(): void {
    this.stopPolling();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.reconnectAttempts = 0;
  }

  /**
   * Reconnect to server
   */
  private reconnect(): void {
    this.disconnect();
    if (this.isEnabled) {
      this.connect();
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer || !this.isEnabled) return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[HotReload] Max reconnection attempts reached');
      vscode.window.showWarningMessage(
        'Alex AI: Lost connection to web dashboard. Hot reload disabled.',
        'Retry'
      ).then(action => {
        if (action === 'Retry') {
          this.reconnectAttempts = 0;
          this.reconnect();
        }
      });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 5);

    console.log(`[HotReload] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /**
   * Subscribe to updates of a specific type
   */
  public on(type: string, callback: (data: any) => void): vscode.Disposable {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    console.log(`[HotReload] Listener registered for: ${type}`);

    // Return disposable to unsubscribe
    return {
      dispose: () => {
        const listeners = this.listeners.get(type);
        if (listeners) {
          listeners.delete(callback);
          if (listeners.size === 0) {
            this.listeners.delete(type);
          }
        }
      }
    };
  }

  /**
   * Notify all listeners of a type
   */
  private notifyListeners(type: string, data: any): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Manually trigger a refresh from the web dashboard
   */
  public async refreshNow(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/updates?force=true`);
      if (response.ok) {
        const updates = await response.json();
        this.handleUpdates(updates);
        vscode.window.showInformationMessage('Alex AI: Refreshed from web dashboard');
      }
    } catch (error) {
      console.error('[HotReload] Manual refresh error:', error);
      vscode.window.showErrorMessage('Alex AI: Failed to refresh from web dashboard');
    }
  }

  /**
   * Get connection status
   */
  public getStatus(): {
    enabled: boolean;
    connected: boolean;
    method: 'polling' | 'websocket' | 'disconnected';
    reconnectAttempts: number;
  } {
    return {
      enabled: this.isEnabled,
      connected: this.pollingTimer !== null || (this.ws !== null && this.ws.readyState === WebSocket.OPEN),
      method: this.pollingTimer ? 'polling' : this.ws ? 'websocket' : 'disconnected',
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Cleanup resources
   */
  public dispose(): void {
    this.disable();
    this.listeners.clear();
  }
}
