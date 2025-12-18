import * as vscode from "vscode";

const CREW_MEMBERS = [
  {
    id: "picard",
    name: "Captain Picard",
    emoji: "🎖️",
    role: "Strategic Leadership",
  },
  {
    id: "riker",
    name: "Commander Riker",
    emoji: "⚡",
    role: "Tactical Coordination",
  },
  {
    id: "data",
    name: "Commander Data",
    emoji: "🤖",
    role: "Technical Analysis",
  },
  {
    id: "geordi",
    name: "Lt. Cmdr. La Forge",
    emoji: "🔧",
    role: "Infrastructure",
  },
  { id: "troi", name: "Counselor Troi", emoji: "💭", role: "UX Design" },
  { id: "worf", name: "Lt. Worf", emoji: "⚔️", role: "Security" },
  { id: "obrien", name: "Chief O'Brien", emoji: "🛠️", role: "Implementation" },
  { id: "quark", name: "Quark", emoji: "💰", role: "Business Analysis" },
  { id: "crusher", name: "Dr. Crusher", emoji: "💊", role: "Documentation" },
  { id: "uhura", name: "Lt. Uhura", emoji: "📻", role: "API Design" },
];

export class CrewTreeProvider
  implements vscode.TreeDataProvider<CrewMemberItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    CrewMemberItem | undefined | null | void
  > = new vscode.EventEmitter<CrewMemberItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    CrewMemberItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: CrewMemberItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<CrewMemberItem[]> {
    return Promise.resolve(
      CREW_MEMBERS.map(
        (crew) =>
          new CrewMemberItem(
            `${crew.emoji} ${crew.name}`,
            crew.role,
            crew.id,
            vscode.TreeItemCollapsibleState.None
          )
      )
    );
  }
}

class CrewMemberItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly description: string,
    public readonly crewId: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${label} - ${description}`;
    this.contextValue = "crewMember";
  }
}
