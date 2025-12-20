import fs from 'fs-extra';
import path from 'path';
import chokidar from 'chokidar';

export class AlexFileSystemService {
    private watcher: chokidar.FSWatcher | null = null;
    private projectRoot: string;

    constructor(projectRoot: string = process.cwd()) {
        this.projectRoot = projectRoot;
        this.initializeWatcher();
    }

    private initializeWatcher() {
        this.watcher = chokidar.watch(this.projectRoot, {
            ignored: /(^|[\/\\])\../, // ignore dotfiles
            persistent: true
        });

        this.watcher
            .on('change', path => console.log(File ${path} has been changed))
            .on('add', path => console.log(File ${path} has been added))
            .on('unlink', path => console.log(File ${path} has been removed));
    }

    async readFile(filePath: string): Promise {
        const fullPath = path.join(this.projectRoot, filePath);
        return await fs.readFile(fullPath, 'utf-8');
    }

    async writeFile(filePath: string, content: string): Promise {
        const fullPath = path.join(this.projectRoot, filePath);
        await fs.outputFile(fullPath, content);
    }

    async updateFile(filePath: string, content: string): Promise {
        await this.writeFile(filePath, content);
    }

    async listFiles(directory: string = ''): Promise {
        const fullPath = path.join(this.projectRoot, directory);
        return await fs.readdir(fullPath);
    }

    dispose() {
        if (this.watcher) {
            this.watcher.close();
        }
    }
}
