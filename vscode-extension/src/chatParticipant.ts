import * as vscode from "vscode";
import { AlexAiService } from "./alexAiService";

/**
 * Register Alex AI as a Chat Participant in VS Code's native Chat panel.
 * Users can invoke with @alex in the chat.
 */
export function registerChatParticipant(
  context: vscode.ExtensionContext,
  alexAiService: AlexAiService
) {
  // Check if the Chat API is available (VS Code 1.90+)
  if (!vscode.chat || !vscode.chat.createChatParticipant) {
    console.log(
      "VS Code Chat API not available - skipping chat participant registration"
    );
    return;
  }

  const PARTICIPANT_ID = "alex-ai.crew";

  // Create the chat participant
  const participant = vscode.chat.createChatParticipant(
    PARTICIPANT_ID,
    async (
      request: vscode.ChatRequest,
      context: vscode.ChatContext,
      stream: vscode.ChatResponseStream,
      token: vscode.CancellationToken
    ) => {
      // Determine which crew member to use based on command or default
      let crewMember = "riker"; // Default - Riker coordinates the crew

      // Check for crew-specific commands like /picard, /worf, etc.
      if (request.command) {
        const validCrew = [
          "picard",
          "riker",
          "data",
          "geordi",
          "troi",
          "worf",
          "obrien",
          "quark",
        ];
        if (validCrew.includes(request.command)) {
          crewMember = request.command;
        }
      }

      // Get crew info for display
      const crewInfo = alexAiService.getCrewInfo(crewMember);

      // Show which crew member is responding
      stream.markdown(
        `${crewInfo.emoji} **${crewInfo.name}** analyzing...\n\n`
      );

      // Build context from chat history
      let contextString = "";

      // Include any referenced files/selections
      if (request.references && request.references.length > 0) {
        for (const ref of request.references) {
          if (ref.id === "vscode.file" && ref.value instanceof vscode.Uri) {
            try {
              const doc = await vscode.workspace.openTextDocument(ref.value);
              contextString += `\n\nFile: ${ref.value.fsPath}\n\`\`\`${
                doc.languageId
              }\n${doc.getText()}\n\`\`\``;
            } catch {
              // File couldn't be read
            }
          } else if (
            ref.id === "vscode.selection" &&
            typeof ref.value === "string"
          ) {
            contextString += `\n\nSelected code:\n\`\`\`\n${ref.value}\n\`\`\``;
          }
        }
      }

      // Get AI response
      try {
        const prompt = contextString
          ? `${request.prompt}\n\nContext:${contextString}`
          : request.prompt;

        const response = await alexAiService.chat(crewMember, prompt);

        // Stream the response
        stream.markdown(response);
      } catch (error) {
        stream.markdown(
          `❌ Error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }

      return;
    }
  );

  // Set participant properties
  participant.iconPath = vscode.Uri.joinPath(
    context.extensionUri,
    "media",
    "starfleet.svg"
  );

  // Register slash commands for different crew members
  participant.followupProvider = {
    provideFollowups(
      result: vscode.ChatResult,
      context: vscode.ChatContext,
      token: vscode.CancellationToken
    ) {
      return [
        {
          prompt: "Coordinate crew response",
          command: "riker",
          label: "⚡ Riker (Coordinator)",
        },
        {
          prompt: "Ask Picard for strategic advice",
          command: "picard",
          label: "🎖️ Ask Picard",
        },
        {
          prompt: "Have Data analyze technically",
          command: "data",
          label: "🤖 Ask Data",
        },
        {
          prompt: "Get Worf's security review",
          command: "worf",
          label: "⚔️ Ask Worf",
        },
        {
          prompt: "Get Quark's cost analysis",
          command: "quark",
          label: "💰 Ask Quark",
        },
      ];
    },
  };

  context.subscriptions.push(participant);

  console.log(
    "🖖 Alex AI Chat Participant registered - use @alex in VS Code Chat"
  );
}
