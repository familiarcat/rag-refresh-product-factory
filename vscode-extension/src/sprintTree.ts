import * as vscode from "vscode";
import { AlexAiService } from "./alexAiService";

const STATUS_ICONS: Record<string, string> = {
  backlog: "📋",
  todo: "📝",
  in_progress: "🚀",
  review: "👀",
  done: "✅",
  blocked: "🚫",
};

export class SprintTreeProvider implements vscode.TreeDataProvider<SprintItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    SprintItem | undefined | null | void
  > = new vscode.EventEmitter<SprintItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    SprintItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private alexAiService: AlexAiService;

  constructor(alexAiService: AlexAiService) {
    this.alexAiService = alexAiService;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SprintItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: SprintItem): Promise<SprintItem[]> {
    if (!element) {
      // Root level - show sprint info
      const sprint = await this.alexAiService.getSprintStatus();
      if (!sprint) {
        return [
          new SprintItem(
            "No active sprint",
            "",
            "info",
            vscode.TreeItemCollapsibleState.None
          ),
        ];
      }

      const progress =
        sprint.committedPoints > 0
          ? Math.round((sprint.completedPoints / sprint.committedPoints) * 100)
          : 0;

      return [
        new SprintItem(
          `🏃 ${sprint.name}`,
          sprint.status,
          "sprint",
          vscode.TreeItemCollapsibleState.Expanded
        ),
        new SprintItem(
          `📊 Progress: ${progress}%`,
          `${sprint.completedPoints}/${sprint.committedPoints} pts`,
          "progress",
          vscode.TreeItemCollapsibleState.None
        ),
        new SprintItem(
          "📋 Stories",
          `${sprint.stories.length} total`,
          "stories",
          vscode.TreeItemCollapsibleState.Collapsed,
          sprint.stories
        ),
      ];
    }

    if (element.contextValue === "stories" && element.stories) {
      // Show individual stories
      return element.stories.map(
        (story) =>
          new SprintItem(
            `${STATUS_ICONS[story.status] || "📄"} ${story.title.slice(
              0,
              40
            )}...`,
            story.status,
            "story",
            vscode.TreeItemCollapsibleState.None
          )
      );
    }

    return [];
  }
}

class SprintItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly contextValue: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly stories?: Array<{
      id: string;
      title: string;
      status: string;
    }>
  ) {
    super(label, collapsibleState);
    this.tooltip = `${label} - ${description}`;
  }
}


