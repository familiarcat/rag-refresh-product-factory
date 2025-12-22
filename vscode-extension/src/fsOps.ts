import * as vscode from "vscode";
import { AlexFileSystemService } from "./alexFileSystem";

export type FsEdit = { startLine: number; endLine: number; text: string };

export type FsOp =
  | { op: "readFile"; filePath: string }
  | { op: "listDir"; dirPath: string }
  | { op: "deleteFile"; filePath: string }
  | { op: "writeFile"; filePath: string; content: string; createDirs?: boolean }
  | { op: "applyPatch"; filePath: string; edits: FsEdit[] }
  | { op: "replaceSnippet"; filePath: string; oldText: string; newText: string };

type ParsedOps = { ops: FsOp[]; cleanText: string };

function norm(p: string) {
  return p.replace(/^\/+/, "").replace(/\\/g, "/");
}

function topRoot(p: string) {
  const n = norm(p);
  return n.split("/")[0] || "";
}

function isPathAllowed(p: string, writableRoots: string[]) {
  const root = topRoot(p);
  return writableRoots.includes(root);
}

function summarizeOps(ops: FsOp[]) {
  return ops
    .map((op, i) => {
      switch (op.op) {
        case "readFile":
          return `${i + 1}. readFile ${op.filePath}`;
        case "listDir":
          return `${i + 1}. listDir ${op.dirPath}`;
        case "deleteFile":
          return `${i + 1}. deleteFile ${op.filePath}`;
        case "writeFile":
          return `${i + 1}. writeFile ${op.filePath}`;
        case "applyPatch":
          return `${i + 1}. applyPatch ${op.filePath} (${op.edits.length} edit(s))`;
        case "replaceSnippet":
          return `${i + 1}. replaceSnippet ${op.filePath}`;
        default:
          return `${i + 1}. unknown`;
      }
    })
    .join("\n");
}

export function extractAlexFsOps(text: string): ParsedOps {
  const fence = /```alexfs\s*([\s\S]*?)```/gm;
  const ops: FsOp[] = [];
  let cleanText = text;

  let match: RegExpExecArray | null;
  while ((match = fence.exec(text)) !== null) {
    const raw = match[1]?.trim();
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && typeof item === "object" && typeof item.op === "string") {
              ops.push(item as FsOp);
            }
          }
        }
      } catch {
        // ignore bad JSON
      }
    }
    cleanText = cleanText.replace(match[0], "").trim();
  }

  return { ops, cleanText };
}

async function showDiffPreview(title: string, beforeText: string, afterText: string) {
  const leftDoc = await vscode.workspace.openTextDocument({ content: beforeText });
  const rightDoc = await vscode.workspace.openTextDocument({ content: afterText });
  await vscode.commands.executeCommand("vscode.diff", leftDoc.uri, rightDoc.uri, title);
}

export async function applyFsOpsWithApproval(params: {
  ops: FsOp[];
  fs: AlexFileSystemService;
  autoApprove: boolean;
}): Promise<{ applied: number; failed: number; errors: string[]; results?: any[] }> {
  const { ops, fs, autoApprove } = params;

  let applied = 0;
  let failed = 0;
  const errors: string[] = [];
  const results: any[] = [];

  if (ops.length === 0) return { applied, failed, errors, results };

  const cfg = vscode.workspace.getConfiguration("alexAi");
  const alwaysShowDiff = cfg.get<boolean>("alwaysShowDiffPreview", false);
  const writableRoots = cfg.get<string[]>("fsWritableRoots", ["src", "app", "lib", "vscode-extension"]);
  const allowDeletes = cfg.get<boolean>("allowChatDeletes", false);

  // Sandbox validation
  for (const op of ops) {
    const pathKey =
      op.op === "listDir" ? op.dirPath :
      "filePath" in op ? op.filePath :
      "";

    if (pathKey && !isPathAllowed(pathKey, writableRoots)) {
      return { applied: 0, failed: 0, errors: [`Path not allowed by fsWritableRoots: ${pathKey}`], results };
    }
    if (op.op === "deleteFile" && !allowDeletes) {
      return { applied: 0, failed: 0, errors: ["Delete operations are disabled (alexAi.allowChatDeletes=false)."], results };
    }
  }

  if (!autoApprove) {
    const choice = await vscode.window.showWarningMessage(
      `Alex AI wants to apply ${ops.length} file operation(s).`,
      { modal: true, detail: summarizeOps(ops) },
      "Apply",
      "Cancel"
    );
    if (choice !== "Apply") return { applied: 0, failed: 0, errors: ["User cancelled"], results };
  }

  for (const op of ops) {
    try {
      switch (op.op) {
        case "readFile": {
          const r = await fs.readFile(op.filePath);
          results.push({ op: "readFile", filePath: op.filePath, ...r });
          if (!r.success) throw r.error ?? new Error(r.message);
          applied++;
          break;
        }
        case "listDir": {
          const r = await fs.listDir(op.dirPath);
          results.push({ op: "listDir", dirPath: op.dirPath, ...r });
          if (!r.success) throw r.error ?? new Error(r.message);
          applied++;
          break;
        }
        case "deleteFile": {
          if (alwaysShowDiff) {
            const before = await fs.readFile(op.filePath);
            const beforeText = before.success ? (before.content ?? "") : "";
            await showDiffPreview(`Delete: ${op.filePath}`, beforeText, "");
          }
          const r = await fs.deleteFile(op.filePath);
          if (!r.success) throw r.error ?? new Error(r.message);
          applied++;
          break;
        }
        case "writeFile": {
          if (alwaysShowDiff) {
            const before = await fs.readFile(op.filePath);
            const beforeText = before.success ? (before.content ?? "") : "";
            await showDiffPreview(`Write: ${op.filePath}`, beforeText, op.content);
          }
          const r = await fs.writeFile(op.filePath, op.content, op.createDirs);
          if (!r.success) throw r.error ?? new Error(r.message);
          applied++;
          break;
        }
        case "applyPatch": {
          if (alwaysShowDiff) {
            const before = await fs.readFile(op.filePath);
            const beforeText = before.success ? (before.content ?? "") : "";
            const lines = beforeText.split(/\r?\n/);
            const sorted = [...op.edits].sort((a, b) => b.startLine - a.startLine);
            for (const e of sorted) {
              const s = Math.max(1, e.startLine);
              const t = Math.max(s, e.endLine);
              lines.splice(s - 1, t - (s - 1), ...String(e.text).split(/\r?\n/));
            }
            const afterText = lines.join("\n");
            await showDiffPreview(`Patch: ${op.filePath}`, beforeText, afterText);
          }
          const r = await fs.applyPatch(op.filePath, op.edits);
          if (!r.success) throw r.error ?? new Error(r.message);
          applied++;
          break;
        }
        case "replaceSnippet": {
          if (alwaysShowDiff) {
            const before = await fs.readFile(op.filePath);
            const beforeText = before.success ? (before.content ?? "") : "";
            const afterText = beforeText.includes(op.oldText) ? beforeText.replace(op.oldText, op.newText) : beforeText;
            await showDiffPreview(`Replace: ${op.filePath}`, beforeText, afterText);
          }
          const r = await fs.replaceSnippet(op.filePath, op.oldText, op.newText);
          if (!r.success) throw r.error ?? new Error(r.message);
          applied++;
          break;
        }
        default:
          throw new Error(`Unsupported op: ${(op as any).op}`);
      }
    } catch (e: any) {
      failed++;
      const key = (op as any).filePath ?? (op as any).dirPath ?? "";
      errors.push(`${(op as any).op} ${key}: ${e?.message ?? e}`);
    }
  }

  if (failed === 0) {
    vscode.window.showInformationMessage(`✅ Completed ${applied} operation(s).`);
  } else {
    vscode.window.showWarningMessage(`⚠️ Completed ${applied}, failed ${failed}.`);
  }

  return { applied, failed, errors, results };
}
