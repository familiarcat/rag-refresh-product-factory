import * as vscode from "vscode";
import { AlexAiService } from "./alexAiService";

/**
 * Register commands for executing crew recommendations and plans
 */
export function registerExecutionCommands(
  context: vscode.ExtensionContext,
  alexAiService: AlexAiService
) {
  /**
   * Command: Save a crew recommendation
   * Usage: alexAi.saveRecommendation
   */
  
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "alexAi.saveRecommendation",
      async (
        crewMember: string,
        title: string,
        content: string,
        actionJson?: string
      ) => {
        try {
          const filename = await alexAiService.saveRecommendation(crewMember, {
            title,
            content,
            action: actionJson ? JSON.parse(actionJson) : undefined,
          });

          vscode.window.showInformationMessage(
            `✅ Recommendation saved: ${filename}`
          );
          return filename;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          vscode.window.showErrorMessage(
            `Failed to save recommendation: ${message}`
          );
        }
      }
    )
  );

  /**
   * Command: Save an execution plan
   * Usage: alexAi.savePlan
   */
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "alexAi.savePlan",
      async (planJson: string) => {
        try {
          const plan = JSON.parse(planJson);
          const filename = await alexAiService.savePlan(plan);
          vscode.window.showInformationMessage(`✅ Plan saved: ${filename}`);
          return filename;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          vscode.window.showErrorMessage(`Failed to save plan: ${message}`);
        }
      }
    )
  );

  /**
   * Command: Execute a code recommendation
   * Usage: alexAi.executeRecommendation
   */
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "alexAi.executeRecommendation",
      async (file: string, oldCode: string, newCode: string) => {
        try {
          const success = await alexAiService.executeCodeRecommendation(
            file,
            oldCode,
            newCode
          );
          return success;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          vscode.window.showErrorMessage(
            `Failed to execute recommendation: ${message}`
          );
          return false;
        }
      }
    )
  );

  /**
   * Command: View recent recommendations
   * Usage: alexAi.viewRecommendations
   */
  context.subscriptions.push(
    vscode.commands.registerCommand("alexAi.viewRecommendations", async () => {
      try {
        const recommendations = await alexAiService.getRecentRecommendations(
          10
        );

        if (recommendations.length === 0) {
          vscode.window.showInformationMessage(
            "No recommendations yet. Ask the crew for analysis first!"
          );
          return;
        }

        const items = recommendations.map((rec) => ({
          label: `${rec.data.crewMember.toUpperCase()}: ${rec.data.title}`,
          description: new Date(rec.data.timestamp).toLocaleString(),
          filename: rec.filename,
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: "Select a recommendation to view",
        });

        if (selected) {
          const rec = recommendations.find(
            (r) => r.filename === selected.filename
          );
          if (rec) {
            const message = `
**${rec.data.crewMember.toUpperCase()}: ${rec.data.title}**

${rec.data.content}

${
  rec.data.action
    ? `**Action:**\n${JSON.stringify(rec.data.action, null, 2)}`
    : ""
}
              `;
            vscode.window.showInformationMessage(message);
          }
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        vscode.window.showErrorMessage(
          `Failed to view recommendations: ${message}`
        );
      }
    })
  );

  /**
   * Command: View recent plans
   * Usage: alexAi.viewPlans
   */
  context.subscriptions.push(
    vscode.commands.registerCommand("alexAi.viewPlans", async () => {
      try {
        const plans = await alexAiService.getRecentPlans(10);

        if (plans.length === 0) {
          vscode.window.showInformationMessage(
            "No plans yet. Ask the crew to create a plan!"
          );
          return;
        }

        const items = plans.map((plan) => ({
          label: plan.data.name,
          description: `${plan.data.steps?.length || 0} steps - ${new Date(
            plan.data.timestamp
          ).toLocaleString()}`,
          id: plan.data.id,
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: "Select a plan to view",
        });

        if (selected) {
          const plan = plans.find((p) => p.data.id === selected.id);
          if (plan) {
            const stepsText = plan.data.steps
              .map(
                (s: any) =>
                  `${s.step}. ${s.task}${
                    s.assignedTo ? ` (${s.assignedTo})` : ""
                  }`
              )
              .join("\n");

            const message = `${plan.data.name}\n\n${
              plan.data.description
            }\n\nObjectives:\n${plan.data.objectives
              .map((o: string) => `- ${o}`)
              .join("\n")}\n\nSteps:\n${stepsText}\n${
              plan.data.estimatedTime
                ? `\nEstimated Time: ${plan.data.estimatedTime}`
                : ""
            }`;
            vscode.window.showInformationMessage(message);
          }
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        vscode.window.showErrorMessage(`Failed to view plans: ${message}`);
      }
    })
  );

  /**
   * Command: Export recommendations as markdown
   * Usage: alexAi.exportRecommendations
   */
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "alexAi.exportRecommendations",
      async () => {
        try {
          const recommendations = await alexAiService.getRecentRecommendations(
            50
          );

          if (recommendations.length === 0) {
            vscode.window.showWarningMessage("No recommendations to export");
            return;
          }

          let markdown = "# Crew Recommendations\n\n";
          markdown += `Generated: ${new Date().toISOString()}\n\n`;

          for (const rec of recommendations) {
            markdown += `## ${rec.data.crewMember.toUpperCase()}: ${
              rec.data.title
            }\n\n`;
            markdown += `**Date:** ${new Date(
              rec.data.timestamp
            ).toLocaleString()}\n`;
            markdown += `**Priority:** ${rec.data.priority || "normal"}\n\n`;
            markdown += `${rec.data.content}\n\n`;

            if (rec.data.action) {
              markdown += `**Action:**\n\`\`\`json\n${JSON.stringify(
                rec.data.action,
                null,
                2
              )}\n\`\`\`\n\n`;
            }

            markdown += "---\n\n";
          }

          const fsManager = alexAiService.getFileSystemManager();
          if (!fsManager) {
            vscode.window.showErrorMessage("File system manager not initialized. Run the 'alexAi.refreshFileSystem' command first.");
            return;
          }
          await fsManager.writeFile("data/CREW_RECOMMENDATIONS.md", markdown);

          vscode.window.showInformationMessage(
            "✅ Recommendations exported to data/CREW_RECOMMENDATIONS.md"
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          vscode.window.showErrorMessage(
            `Failed to export recommendations: ${message}`
          );
        }
      }
    )
  );

  /**
   * Command: Export plans as markdown
   * Usage: alexAi.exportPlans
   */
  context.subscriptions.push(
    vscode.commands.registerCommand("alexAi.exportPlans", async () => {
      try {
        const plans = await alexAiService.getRecentPlans(50);

        if (plans.length === 0) {
          vscode.window.showWarningMessage("No plans to export");
          return;
        }

        let markdown = "# Crew Execution Plans\n\n";
        markdown += `Generated: ${new Date().toISOString()}\n\n`;

        for (const plan of plans) {
          markdown += `## ${plan.data.name}\n\n`;
          markdown += `${plan.data.description}\n\n`;
          markdown += `**Date:** ${new Date(
            plan.data.timestamp
          ).toLocaleString()}\n`;

          if (plan.data.estimatedTime) {
            markdown += `**Estimated Time:** ${plan.data.estimatedTime}\n`;
          }

          markdown += "\n### Objectives\n";
          for (const obj of plan.data.objectives) {
            markdown += `- ${obj}\n`;
          }

          markdown += "\n### Steps\n";
          for (const step of plan.data.steps) {
            markdown += `${step.step}. ${step.task}`;
            if (step.assignedTo) {
              markdown += ` (${step.assignedTo})`;
            }
            if (step.priority) {
              markdown += ` [${step.priority}]`;
            }
            markdown += "\n";
          }

          markdown += "\n---\n\n";
        }

        const fsManager = alexAiService.getFileSystemManager();
        if (!fsManager) {
          vscode.window.showErrorMessage("File system manager not initialized. Run the 'alexAi.refreshFileSystem' command first.");
          return;
        }
        await fsManager.writeFile("data/CREW_PLANS.md", markdown);

        vscode.window.showInformationMessage(
          "✅ Plans exported to data/CREW_PLANS.md"
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        vscode.window.showErrorMessage(`Failed to export plans: ${message}`);
      }
    })
  );

  /**
   * FS Commands for chat-driven implementation (manual + safe)
   * These commands let you paste structured JSON ops from chat and apply them to the workspace.
   */
  context.subscriptions.push(
    vscode.commands.registerCommand("alexAi.fs.readFile", async () => {
      const filePath = await vscode.window.showInputBox({ prompt: "Read file (relative path)" });
      if (!filePath) return;
      const fsManager = alexAiService.getFileSystemManager();
      if (!fsManager) {
        vscode.window.showErrorMessage("File system manager is not initialized. Run 'alexAi.refreshFileSystem' first.");
        return;
      }
      const result = await fsManager.readFile(filePath);
      if (!result.success) {
        vscode.window.showErrorMessage(result.message || "Failed to read file");
        return;
      }
      const content = result.content ?? "";
      const doc = await vscode.workspace.openTextDocument({ content });
      await vscode.languages.setTextDocumentLanguage(doc, "plaintext");
      await vscode.window.showTextDocument(doc, { preview: true });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("alexAi.fs.writeFile", async () => {
      const filePath = await vscode.window.showInputBox({ prompt: "Write file (relative path)" });
      if (!filePath) return;
      const content = await vscode.window.showInputBox({ prompt: "Content (single line; for large content use applyPatch or replaceSnippet)" });
      if (content === undefined) return;

      const fsManager = alexAiService.getFileSystemManager();
      if (!fsManager) {
        vscode.window.showErrorMessage("File system manager is not initialized. Run 'alexAi.refreshFileSystem' first.");
        return;
      }
      await fsManager.writeFile(filePath, content);
      vscode.window.showInformationMessage(`✅ Wrote ${filePath}`);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("alexAi.fs.replaceSnippet", async () => {
      const filePath = await vscode.window.showInputBox({ prompt: "File (relative path)" });
      if (!filePath) return;
      const oldCode = await vscode.window.showInputBox({ prompt: "Old snippet (exact match)" });
      if (!oldCode) return;
      const newCode = await vscode.window.showInputBox({ prompt: "New snippet" });
      if (newCode === undefined) return;

      const fsManager = alexAiService.getFileSystemManager();
      if (!fsManager) {
        vscode.window.showErrorMessage("File system manager is not initialized. Run 'alexAi.refreshFileSystem' first.");
        return;
      }
      const result = await fsManager.replaceSnippet(filePath, oldCode, newCode);
      const ok = result.success;
      if (ok) vscode.window.showInformationMessage(`✅ Updated ${filePath}`);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("alexAi.fs.applyPatch", async () => {
      const filePath = await vscode.window.showInputBox({ prompt: "File (relative path)" });
      if (!filePath) return;

      const patchJson = await vscode.window.showInputBox({
        prompt: "Paste patch JSON: [{startLine,endLine,text}, ...] (1-indexed)"
      });
      if (!patchJson) return;

      let edits: Array<{ startLine: number; endLine: number; text: string }>;
      try {
        edits = JSON.parse(patchJson);
      } catch (e) {
        vscode.window.showErrorMessage("Invalid JSON.");
        return;
      }

      const fsManager = alexAiService.getFileSystemManager();
      if (!fsManager) {
        vscode.window.showErrorMessage("File system manager is not initialized. Run 'alexAi.refreshFileSystem' first.");
        return;
      }
      // @ts-ignore - method added in v3.1
      await fsManager.applyPatch(filePath, edits);
      vscode.window.showInformationMessage(`✅ Patched ${filePath}`);
    })
  );
}