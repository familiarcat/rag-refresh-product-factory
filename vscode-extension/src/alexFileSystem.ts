import * as vscode from 'vscode';
import * as fs from 'fs';
import { join, dirname } from 'path';

export interface FileSystemOperationResult {
    success: boolean;
    message: string;
    error?: Error;
}

export class AlexFileSystemService {
    private workspacePath: string;
    private configPath: string;
    private cachePath: string;

    constructor(workspacePath: string) {
        this.workspacePath = workspacePath;
        this.configPath = join(workspacePath, '.alex-ai-config');
        this.cachePath = join(workspacePath, '.alex-ai', 'cache');
    }

    async initialize(): Promise<FileSystemOperationResult> {
        try {
            await fs.promises.mkdir(this.cachePath, { recursive: true });
            return {
                success: true,
                message: 'File system initialized successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to initialize file system',
                error: error instanceof Error ? error : new Error('Unknown error')
            };
        }
    }

    async writeConfig(config: Record<string, unknown>): Promise<FileSystemOperationResult> {
        try {
            await fs.promises.writeFile(
                this.configPath,
                JSON.stringify(config, null, 2),
                'utf8'
            );
            return {
                success: true,
                message: 'Configuration written successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to write configuration',
                error: error instanceof Error ? error : new Error('Unknown error')
            };
        }
    }

    async readConfig(): Promise<FileSystemOperationResult & { config?: Record<string, unknown> }> {
        try {
            const data = await fs.promises.readFile(this.configPath, 'utf8');
            return {
                success: true,
                message: 'Configuration read successfully',
                config: JSON.parse(data)
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to read configuration',
                error: error instanceof Error ? error : new Error('Unknown error')
            };
        }
    }

    async writeFile(relativePath: string, content: string, createDirs?: boolean): Promise<FileSystemOperationResult> {
        try {
            const full = join(this.workspacePath, relativePath);
            await fs.promises.mkdir(dirname(full), { recursive: true });
            await fs.promises.writeFile(full, content, 'utf8');
            return { success: true, message: `Wrote ${relativePath}` };
        } catch (error) {
            return {
                success: false,
                message: `Failed to write ${relativePath}`,
                error: error instanceof Error ? error : new Error('Unknown error')
            };
        }
    }

    async readFile(relativePath: string): Promise<FileSystemOperationResult & { content?: string }> {
        try {
            const full = join(this.workspacePath, relativePath);
            const content = await fs.promises.readFile(full, 'utf8');
            return { success: true, message: `Read ${relativePath}`, content };
        } catch (error) {
            return {
                success: false,
                message: `Failed to read ${relativePath}`,
                error: error instanceof Error ? error : new Error('Unknown error')
            };
        }
    }

    async applyPatch(
        relativePath: string,
        edits: Array<{ startLine: number; endLine: number; text: string }>
    ): Promise<FileSystemOperationResult> {
        try {
            const full = join(this.workspacePath, relativePath);
            const original = await fs.promises.readFile(full, 'utf8');
            const lines = original.split(/\r?\n/);

            const sorted = [...edits].sort((a, b) => b.startLine - a.startLine);
            for (const e of sorted) {
                const start = Math.max(1, e.startLine);
                const end = Math.max(start, e.endLine);
                lines.splice(start - 1, end - (start - 1), ...String(e.text).split(/\r?\n/));
            }

            await fs.promises.writeFile(full, lines.join('\n'), 'utf8');
            return { success: true, message: `Patched ${relativePath}` };
        } catch (error) {
            return {
                success: false,
                message: `Failed to patch ${relativePath}`,
                error: error instanceof Error ? error : new Error('Unknown error')
            };
        }
    }

    async replaceSnippet(
        relativePath: string,
        oldText: string,
        newText: string
    ): Promise<FileSystemOperationResult> {
        try {
            const full = join(this.workspacePath, relativePath);
            const original = await fs.promises.readFile(full, 'utf8');
            if (!original.includes(oldText)) {
                return { success: false, message: `Snippet not found in ${relativePath}` };
            }
            const updated = original.replace(oldText, newText);
            await fs.promises.writeFile(full, updated, 'utf8');
            return { success: true, message: `Replaced snippet in ${relativePath}` };
        } catch (error) {
            return {
                success: false,
                message: `Failed to replace snippet in ${relativePath}`,
                error: error instanceof Error ? error : new Error('Unknown error')
            };
        }
    }

    async listDir(relativeDir: string): Promise<FileSystemOperationResult & { entries?: Array<{ name: string; type: "file" | "dir" }> }> {
        try {
            const full = join(this.workspacePath, relativeDir);
            const items = await fs.promises.readdir(full, { withFileTypes: true });
            const entries = items.map((d) => ({ name: d.name, type: d.isDirectory() ? "dir" as const : "file" as const }));
            return { success: true, message: `Listed ${relativeDir}`, entries };
        } catch (error) {
            return {
                success: false,
                message: `Failed to list ${relativeDir}`,
                error: error instanceof Error ? error : new Error('Unknown error')
            };
        }
    }

    async deleteFile(relativePath: string): Promise<FileSystemOperationResult> {
        try {
            const full = join(this.workspacePath, relativePath);
            await fs.promises.unlink(full);
            return { success: true, message: `Deleted ${relativePath}` };
        } catch (error) {
            return {
                success: false,
                message: `Failed to delete ${relativePath}`,
                error: error instanceof Error ? error : new Error('Unknown error')
            };
        }
    }
}
