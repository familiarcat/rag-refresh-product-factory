#!/bin/zsh
# scripts/setup-alex-fs-integration.sh

set -e # Exit on error

echo "🖖 Starting Alex AI File System Integration Setup..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check dependencies
check_dependencies() {
    echo "📝 Checking required dependencies..."
    
    local deps=(node npm)
    for dep in "${deps[@]}"; do
        if ! command -v $dep >/dev/null 2>&1; then
            echo "${RED}❌ $dep is required but not installed.${NC}"
            exit 1
        fi
    done
}

# Function to setup project structure
setup_project_structure() {
    echo "🏗️  Creating project structure..."
    
    # Create necessary directories
    mkdir -p src/{utils,lib,types,services}
    mkdir -p scripts
    mkdir -p config
    
    echo "${GREEN}✅ Project structure created${NC}"
}

# Function to install required packages
install_dependencies() {
    echo "📦 Installing required packages..."
    
    # Create package.json if it doesn't exist
    if [ ! -f package.json ]; then
        npm init -y
    fi

    # Install required packages
    npm install --save \
        chokidar \
        fs-extra \
        @types/fs-extra \
        typescript \
        @types/node

    echo "${GREEN}✅ Dependencies installed${NC}"
}

# Function to create integration files
create_integration_files() {
    echo "📄 Creating integration files..."

    # Create Alex AI File System Service
    cat > src/services/alexFileSystem.ts << 'EOL'
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
EOL

    # Create types file
    cat > src/types/fileSystem.ts << 'EOL'
export interface FileSystemOperation {
    success: boolean;
    error?: string;
    data?: any;
}

export interface FileWatchEvent {
    type: 'add' | 'change' | 'unlink';
    path: string;
    timestamp: number;
}
EOL

    echo "${GREEN}✅ Integration files created${NC}"
}

# Function to setup configuration
setup_configuration() {
    echo "⚙️  Setting up configuration..."

    # Create tsconfig.json if it doesn't exist
    if [ ! -f tsconfig.json ]; then
        cat > tsconfig.json << 'EOL'
{
    "compilerOptions": {
        "target": "es2018",
        "module": "commonjs",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "outDir": "./dist",
        "rootDir": "./src",
        "baseUrl": ".",
        "paths": {
            "@/*": ["src/*"]
        }
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules"]
}
EOL
    fi

    echo "${GREEN}✅ Configuration complete${NC}"
}

# Main execution
main() {
    echo "${BLUE}🚀 Starting Alex AI File System Integration...${NC}"
    
    check_dependencies
    setup_project_structure
    install_dependencies
    create_integration_files
    setup_configuration

    echo "${GREEN}🎉 Alex AI File System Integration setup complete!${NC}"
    echo "${BLUE}To use the integration, import AlexFileSystemService from src/services/alexFileSystem.ts${NC}"
}

# Run main function
main