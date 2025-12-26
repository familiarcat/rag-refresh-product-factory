#!/usr/bin/env node
/**
 * DDD Next.js Project Scaffolding Script
 *
 * Generates a complete Domain-Driven Design project structure for Next.js applications.
 *
 * Usage:
 *   node scripts/scaffold-ddd-project.mjs <project-name> [bounded-contexts...]
 *
 * Examples:
 *   node scripts/scaffold-ddd-project.mjs my-ecommerce order product cart user
 *   node scripts/scaffold-ddd-project.mjs sitemap-viz graph ingestion visualization
 *
 * Features:
 *   - Creates full directory structure (domain, application, infrastructure, presentation)
 *   - Generates stub files for entities, value objects, repositories, services
 *   - Sets up Next.js app router with API routes
 *   - Configures TypeScript, ESLint, testing
 *   - Initializes package.json with dependencies
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Configuration
// ============================================================================

const TEMPLATE_VERSION = '1.0.0';

const DEFAULT_BOUNDED_CONTEXTS = ['core'];

const DEPENDENCIES = {
  dependencies: {
    'next': '^14.2.0',
    'react': '^18.2.0',
    'react-dom': '^18.2.0'
  },
  devDependencies: {
    '@types/node': '^20',
    '@types/react': '^18',
    '@types/react-dom': '^18',
    'typescript': '^5',
    'eslint': '^8',
    'eslint-config-next': '^14',
    'jest': '^29',
    '@testing-library/react': '^14',
    '@testing-library/jest-dom': '^6',
    'playwright': '^1'
  }
};

// ============================================================================
// Main Function
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const projectName = args[0];
  const boundedContexts = args.slice(1).length > 0 ? args.slice(1) : DEFAULT_BOUNDED_CONTEXTS;

  console.log('📦 DDD Next.js Project Scaffolder');
  console.log('==================================\n');
  console.log(`Project: ${projectName}`);
  console.log(`Bounded Contexts: ${boundedContexts.join(', ')}`);
  console.log(`Template Version: ${TEMPLATE_VERSION}\n`);

  const projectPath = path.join(process.cwd(), projectName);

  // Check if project already exists
  try {
    await fs.access(projectPath);
    console.error(`❌ Error: Directory "${projectName}" already exists.`);
    process.exit(1);
  } catch {
    // Directory doesn't exist, proceed
  }

  try {
    await scaffoldProject(projectPath, projectName, boundedContexts);
    printSuccess(projectName);
  } catch (error) {
    console.error('❌ Error during scaffolding:', error.message);
    process.exit(1);
  }
}

// ============================================================================
// Scaffolding Functions
// ============================================================================

async function scaffoldProject(projectPath, projectName, boundedContexts) {
  console.log('🏗️  Creating directory structure...\n');

  // Create root directory
  await fs.mkdir(projectPath, { recursive: true });

  // Create all directories
  await createDirectoryStructure(projectPath, boundedContexts);

  // Generate configuration files
  await createConfigFiles(projectPath, projectName);

  // Generate domain layer files
  for (const context of boundedContexts) {
    await createDomainFiles(projectPath, context);
  }

  // Generate application layer files
  await createApplicationFiles(projectPath, boundedContexts);

  // Generate infrastructure files
  await createInfrastructureFiles(projectPath, boundedContexts);

  // Generate Next.js presentation layer
  await createPresentationFiles(projectPath);

  // Create README
  await createReadme(projectPath, projectName, boundedContexts);

  console.log('\n✅ Directory structure created successfully!\n');
}

async function createDirectoryStructure(projectPath, boundedContexts) {
  const directories = [
    // Root
    'app',
    'app/api',
    'app/_components',
    'app/_components/shared',

    // Source
    'src',
    'src/application/queries',
    'src/application/commands',
    'src/application/services',
    'src/application/dtos',
    'src/infrastructure/persistence',
    'src/infrastructure/persistence/mappers',
    'src/infrastructure/http',
    'src/infrastructure/rendering',
    'src/infrastructure/cache',
    'src/shared/types',
    'src/shared/utils',

    // Tests
    'tests/unit',
    'tests/integration',
    'tests/e2e',

    // Other
    'public',
    'scripts',
    'docs',
    'data'
  ];

  // Add bounded context directories
  for (const context of boundedContexts) {
    directories.push(`src/domain/${context}`);
    directories.push(`src/domain/${context}/entities`);
    directories.push(`src/domain/${context}/value-objects`);
    directories.push(`src/domain/${context}/repositories`);
    directories.push(`src/domain/${context}/services`);
    directories.push(`src/domain/${context}/errors`);
  }

  for (const dir of directories) {
    const fullPath = path.join(projectPath, dir);
    await fs.mkdir(fullPath, { recursive: true });
    console.log(`  📁 ${dir}`);
  }
}

async function createConfigFiles(projectPath, projectName) {
  console.log('\n📝 Creating configuration files...\n');

  // package.json
  const packageJson = {
    name: projectName,
    version: '0.1.0',
    description: `DDD Next.js application - ${projectName}`,
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
      test: 'jest',
      'test:unit': 'jest tests/unit',
      'test:integration': 'jest tests/integration',
      'test:e2e': 'playwright test',
      'type-check': 'tsc --noEmit'
    },
    ...DEPENDENCIES
  };

  await writeFile(projectPath, 'package.json', JSON.stringify(packageJson, null, 2));

  // tsconfig.json
  const tsconfig = {
    compilerOptions: {
      lib: ['dom', 'dom.iterable', 'esnext'],
      module: 'esnext',
      moduleResolution: 'node',
      jsx: 'preserve',
      target: 'ES2017',
      baseUrl: '.',
      paths: {
        '@/*': ['./*'],
        '@/domain/*': ['./src/domain/*'],
        '@/application/*': ['./src/application/*'],
        '@/infrastructure/*': ['./src/infrastructure/*'],
        '@/shared/*': ['./src/shared/*']
      },
      strict: true,
      noEmit: true,
      incremental: true,
      esModuleInterop: true,
      resolveJsonModule: true,
      isolatedModules: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      plugins: [{ name: 'next' }]
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules']
  };

  await writeFile(projectPath, 'tsconfig.json', JSON.stringify(tsconfig, null, 2));

  // next.config.js
  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // For Docker deployment
  experimental: {
    typedRoutes: true
  }
};

export default nextConfig;
`;

  await writeFile(projectPath, 'next.config.js', nextConfig);

  // .env.local.example
  const envExample = `# Application
NEXT_PUBLIC_APP_NAME=${projectName}
NEXT_PUBLIC_API_URL=http://localhost:3000

# Database (future)
# DATABASE_URL=postgresql://user:pass@localhost:5432/db

# External Services
# EXTERNAL_API_KEY=xxx
`;

  await writeFile(projectPath, '.env.local.example', envExample);

  // .gitignore
  const gitignore = `# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/
*.tsbuildinfo

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo

# Data
/data/*.json
!/data/.gitkeep
`;

  await writeFile(projectPath, '.gitignore', gitignore);

  console.log('  ✓ package.json');
  console.log('  ✓ tsconfig.json');
  console.log('  ✓ next.config.js');
  console.log('  ✓ .env.local.example');
  console.log('  ✓ .gitignore');
}

async function createDomainFiles(projectPath, context) {
  console.log(`\n🏛️  Creating domain files for "${context}" context...\n`);

  const contextTitle = toTitleCase(context);

  // Entity example
  const entityTemplate = `/**
 * ${contextTitle} Entity
 *
 * Represents a ${context} in the domain.
 * Entities have identity and lifecycle.
 */

export class ${contextTitle} {
  private constructor(
    private readonly _id: ${contextTitle}Id,
    private _name: string
  ) {
    this.validate();
  }

  static create(id: ${contextTitle}Id, name: string): ${contextTitle} {
    return new ${contextTitle}(id, name);
  }

  // Getters
  get id(): ${contextTitle}Id { return this._id; }
  get name(): string { return this._name; }

  // Commands
  updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new ${contextTitle}Error('Name cannot be empty');
    }
    this._name = newName;
  }

  // Validation
  private validate(): void {
    if (!this._name || this._name.trim().length === 0) {
      throw new ${contextTitle}Error('${contextTitle} name is required');
    }
  }

  // Serialization
  toDTO(): ${contextTitle}DTO {
    return {
      id: this._id.value,
      name: this._name
    };
  }
}

// DTO
export interface ${contextTitle}DTO {
  id: string;
  name: string;
}
`;

  await writeFile(projectPath, `src/domain/${context}/entities/${contextTitle}.ts`, entityTemplate);

  // Value Object example
  const valueObjectTemplate = `/**
 * ${contextTitle}Id Value Object
 *
 * Unique identifier for ${contextTitle} entities.
 * Value objects are immutable and have no identity.
 */

export class ${contextTitle}Id {
  private constructor(private readonly _value: string) {
    if (!_value || _value.length === 0) {
      throw new Error('${contextTitle}Id cannot be empty');
    }
  }

  static generate(): ${contextTitle}Id {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return new ${contextTitle}Id(\`${context}_\${timestamp}_\${random}\`);
  }

  static fromString(value: string): ${contextTitle}Id {
    return new ${contextTitle}Id(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: ${contextTitle}Id): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
`;

  await writeFile(projectPath, `src/domain/${context}/value-objects/${contextTitle}Id.ts`, valueObjectTemplate);

  // Repository interface
  const repositoryTemplate = `import { ${contextTitle} } from '../entities/${contextTitle}';
import { ${contextTitle}Id } from '../value-objects/${contextTitle}Id';

/**
 * ${contextTitle} Repository Interface
 *
 * Defines data access operations for ${contextTitle} aggregate.
 * Implementation is in the infrastructure layer.
 */
export interface I${contextTitle}Repository {
  findById(id: ${contextTitle}Id): Promise<${contextTitle} | null>;
  findAll(): Promise<${contextTitle}[]>;
  save(${context}: ${contextTitle}): Promise<void>;
  delete(id: ${contextTitle}Id): Promise<void>;
}
`;

  await writeFile(projectPath, `src/domain/${context}/repositories/I${contextTitle}Repository.ts`, repositoryTemplate);

  // Domain service
  const serviceTemplate = `import { ${contextTitle} } from '../entities/${contextTitle}';

/**
 * ${contextTitle} Service
 *
 * Domain service for business logic that doesn't belong to a single entity.
 * Domain services are stateless.
 */
export class ${contextTitle}Service {
  /**
   * Example domain operation
   */
  static performDomainOperation(${context}: ${contextTitle}): void {
    // Business logic here
  }
}
`;

  await writeFile(projectPath, `src/domain/${context}/services/${contextTitle}Service.ts`, serviceTemplate);

  // Domain error
  const errorTemplate = `/**
 * ${contextTitle} Domain Error
 *
 * Base error class for ${context} domain exceptions.
 */
export class ${contextTitle}Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = '${contextTitle}Error';
  }
}
`;

  await writeFile(projectPath, `src/domain/${context}/errors/${contextTitle}Error.ts`, errorTemplate);

  console.log(`  ✓ entities/${contextTitle}.ts`);
  console.log(`  ✓ value-objects/${contextTitle}Id.ts`);
  console.log(`  ✓ repositories/I${contextTitle}Repository.ts`);
  console.log(`  ✓ services/${contextTitle}Service.ts`);
  console.log(`  ✓ errors/${contextTitle}Error.ts`);
}

async function createApplicationFiles(projectPath, boundedContexts) {
  console.log('\n⚙️  Creating application layer files...\n');

  const context = boundedContexts[0]; // Use first context as example
  const contextTitle = toTitleCase(context);

  // Query example
  const queryTemplate = `import { ${contextTitle} } from '@/domain/${context}/entities/${contextTitle}';
import { ${contextTitle}Id } from '@/domain/${context}/value-objects/${contextTitle}Id';
import { I${contextTitle}Repository } from '@/domain/${context}/repositories/I${contextTitle}Repository';
import { ${contextTitle}DTO } from '../dtos/${contextTitle}DTO';

/**
 * Get${contextTitle}Query
 *
 * Use case: Retrieve a single ${context} by ID.
 * Part of the CQRS read side.
 */
export class Get${contextTitle}Query {
  constructor(
    private readonly ${context}Repository: I${contextTitle}Repository
  ) {}

  async execute(id: string): Promise<${contextTitle}DTO> {
    const ${context}Id = ${contextTitle}Id.fromString(id);
    const ${context} = await this.${context}Repository.findById(${context}Id);

    if (!${context}) {
      throw new Error('${contextTitle} not found');
    }

    return ${context}.toDTO();
  }
}
`;

  await writeFile(projectPath, `src/application/queries/Get${contextTitle}Query.ts`, queryTemplate);

  // Command example
  const commandTemplate = `import { ${contextTitle} } from '@/domain/${context}/entities/${contextTitle}';
import { ${contextTitle}Id } from '@/domain/${context}/value-objects/${contextTitle}Id';
import { I${contextTitle}Repository } from '@/domain/${context}/repositories/I${contextTitle}Repository';

/**
 * Create${contextTitle}Command
 *
 * Use case: Create a new ${context}.
 * Part of the CQRS write side.
 */
export interface Create${contextTitle}Input {
  name: string;
}

export class Create${contextTitle}Command {
  constructor(
    private readonly ${context}Repository: I${contextTitle}Repository
  ) {}

  async execute(input: Create${contextTitle}Input): Promise<string> {
    const id = ${contextTitle}Id.generate();
    const ${context} = ${contextTitle}.create(id, input.name);

    await this.${context}Repository.save(${context});

    return id.value;
  }
}
`;

  await writeFile(projectPath, `src/application/commands/Create${contextTitle}Command.ts`, commandTemplate);

  // DTO
  const dtoTemplate = `/**
 * ${contextTitle} Data Transfer Object
 *
 * Used for transferring data between layers.
 * Should not contain business logic.
 */
export interface ${contextTitle}DTO {
  id: string;
  name: string;
}
`;

  await writeFile(projectPath, `src/application/dtos/${contextTitle}DTO.ts`, dtoTemplate);

  console.log(`  ✓ queries/Get${contextTitle}Query.ts`);
  console.log(`  ✓ commands/Create${contextTitle}Command.ts`);
  console.log(`  ✓ dtos/${contextTitle}DTO.ts`);
}

async function createInfrastructureFiles(projectPath, boundedContexts) {
  console.log('\n🔧 Creating infrastructure layer files...\n');

  const context = boundedContexts[0];
  const contextTitle = toTitleCase(context);

  // Repository implementation
  const repoImplTemplate = `import fs from 'fs/promises';
import path from 'path';
import { ${contextTitle} } from '@/domain/${context}/entities/${contextTitle}';
import { ${contextTitle}Id } from '@/domain/${context}/value-objects/${contextTitle}Id';
import { I${contextTitle}Repository } from '@/domain/${context}/repositories/I${contextTitle}Repository';
import { ${contextTitle}Mapper } from './mappers/${contextTitle}Mapper';

/**
 * FileSystem${contextTitle}Repository
 *
 * Implementation of I${contextTitle}Repository using JSON file storage.
 * For production, replace with Prisma/PostgreSQL implementation.
 */
export class FileSystem${contextTitle}Repository implements I${contextTitle}Repository {
  private readonly dataDir: string;

  constructor(dataDir: string = './data/${context}s') {
    this.dataDir = dataDir;
  }

  async findById(id: ${contextTitle}Id): Promise<${contextTitle} | null> {
    try {
      const filePath = path.join(this.dataDir, \`\${id.value}.json\`);
      const content = await fs.readFile(filePath, 'utf-8');
      const dto = JSON.parse(content);
      return ${contextTitle}Mapper.toDomain(dto);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async findAll(): Promise<${contextTitle}[]> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      const files = await fs.readdir(this.dataDir);
      const ${context}s: ${contextTitle}[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(this.dataDir, file), 'utf-8');
          const dto = JSON.parse(content);
          ${context}s.push(${contextTitle}Mapper.toDomain(dto));
        }
      }

      return ${context}s;
    } catch {
      return [];
    }
  }

  async save(${context}: ${contextTitle}): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
    const dto = ${context}.toDTO();
    const filePath = path.join(this.dataDir, \`\${${context}.id.value}.json\`);
    await fs.writeFile(filePath, JSON.stringify(dto, null, 2), 'utf-8');
  }

  async delete(id: ${contextTitle}Id): Promise<void> {
    const filePath = path.join(this.dataDir, \`\${id.value}.json\`);
    await fs.unlink(filePath);
  }
}
`;

  await writeFile(projectPath, `src/infrastructure/persistence/FileSystem${contextTitle}Repository.ts`, repoImplTemplate);

  // Mapper
  const mapperTemplate = `import { ${contextTitle} } from '@/domain/${context}/entities/${contextTitle}';
import { ${contextTitle}Id } from '@/domain/${context}/value-objects/${contextTitle}Id';
import { ${contextTitle}DTO } from '@/application/dtos/${contextTitle}DTO';

/**
 * ${contextTitle}Mapper
 *
 * Maps between DTOs and domain entities.
 */
export class ${contextTitle}Mapper {
  static toDomain(dto: ${contextTitle}DTO): ${contextTitle} {
    const id = ${contextTitle}Id.fromString(dto.id);
    return ${contextTitle}.create(id, dto.name);
  }

  static toDTO(${context}: ${contextTitle}): ${contextTitle}DTO {
    return ${context}.toDTO();
  }
}
`;

  await writeFile(projectPath, `src/infrastructure/persistence/mappers/${contextTitle}Mapper.ts`, mapperTemplate);

  console.log(`  ✓ persistence/FileSystem${contextTitle}Repository.ts`);
  console.log(`  ✓ persistence/mappers/${contextTitle}Mapper.ts`);
}

async function createPresentationFiles(projectPath) {
  console.log('\n🎨 Creating Next.js presentation layer...\n');

  // Root layout
  const layoutTemplate = `import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DDD Next.js App',
  description: 'Domain-Driven Design application built with Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;

  await writeFile(projectPath, 'app/layout.tsx', layoutTemplate);

  // Home page
  const pageTemplate = `export default function Home() {
  return (
    <main className="container">
      <h1>Welcome to Your DDD Next.js Project</h1>
      <p>This project follows Domain-Driven Design principles with Clean Architecture.</p>

      <h2>Architecture Layers</h2>
      <ul>
        <li><strong>Domain Layer</strong>: Pure business logic (src/domain/)</li>
        <li><strong>Application Layer</strong>: Use cases and DTOs (src/application/)</li>
        <li><strong>Infrastructure Layer</strong>: External adapters (src/infrastructure/)</li>
        <li><strong>Presentation Layer</strong>: Next.js UI and API routes (app/)</li>
      </ul>

      <h2>Next Steps</h2>
      <ol>
        <li>Run <code>npm install</code> to install dependencies</li>
        <li>Copy <code>.env.local.example</code> to <code>.env.local</code></li>
        <li>Review the generated domain model in <code>src/domain/</code></li>
        <li>Implement your use cases in <code>src/application/</code></li>
        <li>Create API routes in <code>app/api/</code></li>
        <li>Build your UI components in <code>app/_components/</code></li>
      </ol>
    </main>
  );
}
`;

  await writeFile(projectPath, 'app/page.tsx', pageTemplate);

  // Global CSS
  const cssTemplate = `:root {
  --max-width: 1200px;
  --font-mono: monospace;
}

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
}

body {
  color: #333;
  background: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  padding: 2rem;
}

.container {
  max-width: var(--max-width);
  margin: 0 auto;
}

h1 {
  margin-bottom: 1rem;
  font-size: 2.5rem;
}

h2 {
  margin-top: 2rem;
  margin-bottom: 0.5rem;
  font-size: 1.75rem;
}

code {
  background: #f4f4f4;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: var(--font-mono);
}

ul, ol {
  margin-left: 2rem;
  margin-top: 0.5rem;
}

li {
  margin-bottom: 0.5rem;
}
`;

  await writeFile(projectPath, 'app/globals.css', cssTemplate);

  console.log('  ✓ app/layout.tsx');
  console.log('  ✓ app/page.tsx');
  console.log('  ✓ app/globals.css');
}

async function createReadme(projectPath, projectName, boundedContexts) {
  const readme = `# ${projectName}

Domain-Driven Design (DDD) Next.js application with Clean Architecture.

## Project Structure

\`\`\`
${projectName}/
├── app/                    # Next.js App Router (Presentation Layer)
├── src/
│   ├── domain/             # Domain Layer (Core Business Logic)
${boundedContexts.map(c => `│   │   └── ${c}/           # ${toTitleCase(c)} bounded context`).join('\n')}
│   ├── application/        # Application Layer (Use Cases)
│   ├── infrastructure/     # Infrastructure Layer (External Adapters)
│   └── shared/             # Shared Kernel
├── tests/                  # Tests (unit, integration, e2e)
└── docs/                   # Documentation
\`\`\`

## Bounded Contexts

${boundedContexts.map(c => `- **${toTitleCase(c)}**: [TODO: Describe this bounded context]`).join('\n')}

## Getting Started

### Install Dependencies

\`\`\`bash
npm install
\`\`\`

### Set Up Environment

\`\`\`bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
\`\`\`

### Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Tests

\`\`\`bash
npm test              # All tests
npm run test:unit     # Unit tests only
npm run test:integration  # Integration tests
npm run test:e2e      # End-to-end tests
\`\`\`

## Architecture Principles

### Domain Layer

- **Pure TypeScript** (no framework dependencies)
- **Rich domain model** (not anemic)
- **Enforce invariants** in entities
- **Business logic** in domain services

### Application Layer

- **Use cases** (queries and commands)
- **CQRS pattern** (separate reads from writes)
- **Return DTOs** (not entities)
- **Orchestrate** domain objects

### Infrastructure Layer

- **Implement repositories** (data access)
- **Handle I/O** (file system, HTTP, database)
- **Map** between DTOs and domain entities
- **Framework-specific** code allowed

### Presentation Layer

- **Next.js App Router** (React Server Components)
- **API routes** call application services
- **Client components** for interactivity
- **Display DTOs** (not entities)

## Development Workflow

1. **Define domain model** in \`src/domain/\`
   - Create entities, value objects, aggregates
   - Define repository interfaces
   - Implement domain services

2. **Implement use cases** in \`src/application/\`
   - Create queries (read operations)
   - Create commands (write operations)
   - Define DTOs for data transfer

3. **Build infrastructure** in \`src/infrastructure/\`
   - Implement repositories
   - Create mappers (DTO ↔ Domain)
   - Add external service clients

4. **Create UI** in \`app/\`
   - Build pages and components
   - Create API routes
   - Wire up to application services

## Resources

- [Domain-Driven Design](https://www.domainlanguage.com/ddd/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Next.js Documentation](https://nextjs.org/docs)

## License

MIT
`;

  await writeFile(projectPath, 'README.md', readme);
  console.log('\n📚 Created README.md');
}

// ============================================================================
// Utility Functions
// ============================================================================

async function writeFile(basePath, filePath, content) {
  const fullPath = path.join(basePath, filePath);
  await fs.writeFile(fullPath, content, 'utf-8');
}

function toTitleCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function printHelp() {
  console.log(`
📦 DDD Next.js Project Scaffolder

Usage:
  node scripts/scaffold-ddd-project.mjs <project-name> [bounded-contexts...]

Arguments:
  project-name          Name of the project (directory will be created)
  bounded-contexts      Space-separated list of bounded contexts (default: core)

Examples:
  node scripts/scaffold-ddd-project.mjs my-ecommerce order product cart user
  node scripts/scaffold-ddd-project.mjs blog-platform content author comment
  node scripts/scaffold-ddd-project.mjs sitemap-viz graph ingestion visualization

What gets generated:
  ✓ Complete Next.js 14 project structure
  ✓ Domain layer with entities, value objects, repositories
  ✓ Application layer with queries, commands, DTOs
  ✓ Infrastructure layer with repository implementations
  ✓ Presentation layer with Next.js pages and API routes
  ✓ Configuration files (tsconfig, package.json, .env.example)
  ✓ Testing setup (Jest, Playwright)
  ✓ README with documentation

After scaffolding:
  1. cd <project-name>
  2. npm install
  3. cp .env.local.example .env.local
  4. npm run dev
`);
}

function printSuccess(projectName) {
  console.log(`
🎉 Success! Your DDD Next.js project has been scaffolded.

Next steps:
  1. cd ${projectName}
  2. npm install
  3. cp .env.local.example .env.local
  4. npm run dev

Your project structure follows Domain-Driven Design with Clean Architecture.

Happy coding! 🚀
`);
}

// ============================================================================
// Entry Point
// ============================================================================

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
