import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const PROJECTS_FILE = path.join(process.cwd(), "data/projects.json");

interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  primaryCategory: string;
  techStack: {
    frontend: string[];
    backend: string[];
    infrastructure: string[];
    ai: string[];
    other: string[];
  };
  domains: Array<{
    slug: string;
    name: string;
    description: string;
  }>;
}

interface ScaffoldConfig {
  branch: string;
  subdomain: string;
  scaffoldPath: string;
  repoUrl: string;
}

/**
 * POST /api/projects/[id]/scaffold
 * 
 * Project isolation and deployment:
 * - create-branch: Create isolated GitHub branch for project
 * - scaffold: Generate standalone Next.js project
 * - deploy-subdomain: Create AWS subdomain deployment
 * - eject: Export project as independent repository
 * - status: Get project scaffold/deployment status
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const body = await req.json();
  const { action, ...payload } = body;

  // Load project
  const project = await loadProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Generate scaffold config
  const config = generateScaffoldConfig(project);

  switch (action) {
    case "create-branch": {
      // Create isolated GitHub branch for this project
      try {
        const branchResult = await createProjectBranch(project, config);
        return NextResponse.json({
          ok: true,
          branch: config.branch,
          ...branchResult,
        });
      } catch (error) {
        return NextResponse.json({
          ok: false,
          error: error instanceof Error ? error.message : "Branch creation failed",
        }, { status: 500 });
      }
    }

    case "scaffold": {
      // Generate standalone Next.js project scaffold
      try {
        const scaffoldResult = await generateProjectScaffold(project, config);
        return NextResponse.json({
          ok: true,
          ...scaffoldResult,
        });
      } catch (error) {
        return NextResponse.json({
          ok: false,
          error: error instanceof Error ? error.message : "Scaffold generation failed",
        }, { status: 500 });
      }
    }

    case "deploy-subdomain": {
      // Create AWS subdomain deployment
      try {
        const deployResult = await deployToSubdomain(project, config);
        return NextResponse.json({
          ok: true,
          ...deployResult,
        });
      } catch (error) {
        return NextResponse.json({
          ok: false,
          error: error instanceof Error ? error.message : "Deployment failed",
        }, { status: 500 });
      }
    }

    case "eject": {
      // Export project as independent repository
      try {
        const ejectResult = await ejectProject(project, config, payload.targetRepo);
        return NextResponse.json({
          ok: true,
          ...ejectResult,
        });
      } catch (error) {
        return NextResponse.json({
          ok: false,
          error: error instanceof Error ? error.message : "Eject failed",
        }, { status: 500 });
      }
    }

    case "status": {
      // Get project scaffold/deployment status
      const status = await getProjectScaffoldStatus(project, config);
      return NextResponse.json({
        ok: true,
        ...status,
      });
    }

    case "full-setup": {
      // Complete project setup: branch + scaffold + prepare deployment
      try {
        const results = {
          branch: await createProjectBranch(project, config),
          scaffold: await generateProjectScaffold(project, config),
          deployment: {
            subdomain: config.subdomain,
            status: "ready",
            url: `https://${config.subdomain}.alexai.dev`, // Placeholder domain
          },
        };

        return NextResponse.json({
          ok: true,
          project: {
            id: project.id,
            name: project.name,
          },
          config,
          results,
          nextSteps: [
            `Branch '${config.branch}' created`,
            `Scaffold generated at '${config.scaffoldPath}'`,
            `Ready for subdomain deployment at ${config.subdomain}`,
            "Run 'npm run deploy:subdomain' to deploy",
          ],
        });
      } catch (error) {
        return NextResponse.json({
          ok: false,
          error: error instanceof Error ? error.message : "Setup failed",
        }, { status: 500 });
      }
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}

async function loadProject(projectId: string): Promise<Project | null> {
  try {
    const data = await fs.readFile(PROJECTS_FILE, "utf-8");
    const { projects } = JSON.parse(data);
    return projects.find((p: Project) => p.id === projectId) || null;
  } catch {
    return null;
  }
}

function generateScaffoldConfig(project: Project): ScaffoldConfig {
  const slug = project.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);

  return {
    branch: `project/${slug}`,
    subdomain: slug,
    scaffoldPath: `projects/${slug}`,
    repoUrl: "https://github.com/familiarcat/rag-refresh-product-factory",
  };
}

async function createProjectBranch(
  project: Project,
  config: ScaffoldConfig
): Promise<{ created: boolean; message: string }> {
  const cwd = process.cwd();

  try {
    // Check if branch already exists
    const { stdout: branches } = await execAsync("git branch -a", { cwd });
    if (branches.includes(config.branch)) {
      return {
        created: false,
        message: `Branch '${config.branch}' already exists`,
      };
    }

    // Create new branch from main
    await execAsync(`git checkout -b ${config.branch}`, { cwd });

    // Create project-specific commit
    const commitMessage = `feat(${config.subdomain}): Initialize project scaffold

Project: ${project.name}
Description: ${project.tagline}
Category: ${project.primaryCategory}

This branch contains the isolated development environment for this project.
`;

    // Create a marker file for this project
    const markerContent = JSON.stringify({
      projectId: project.id,
      projectName: project.name,
      createdAt: new Date().toISOString(),
      branch: config.branch,
      subdomain: config.subdomain,
    }, null, 2);

    await fs.mkdir(config.scaffoldPath, { recursive: true });
    await fs.writeFile(
      path.join(config.scaffoldPath, "project.json"),
      markerContent
    );

    // Stage and commit
    await execAsync(`git add ${config.scaffoldPath}`, { cwd });
    await execAsync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { cwd });

    // Push branch
    await execAsync(`git push -u origin ${config.branch}`, { cwd });

    // Switch back to main
    await execAsync("git checkout main", { cwd });

    return {
      created: true,
      message: `Branch '${config.branch}' created and pushed to origin`,
    };
  } catch (error) {
    // Make sure we're back on main
    try {
      await execAsync("git checkout main", { cwd });
    } catch {
      // Ignore checkout errors
    }
    throw error;
  }
}

async function generateProjectScaffold(
  project: Project,
  config: ScaffoldConfig
): Promise<{
  scaffoldPath: string;
  files: string[];
  message: string;
}> {
  const scaffoldPath = path.join(process.cwd(), config.scaffoldPath);

  // Create scaffold directory
  await fs.mkdir(scaffoldPath, { recursive: true });

  const files: string[] = [];

  // Generate package.json
  const packageJson = {
    name: config.subdomain,
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "next lint",
    },
    dependencies: {
      next: "^15.0.0",
      react: "^19.0.0",
      "react-dom": "^19.0.0",
    },
    devDependencies: {
      "@types/node": "^20",
      "@types/react": "^19",
      "@types/react-dom": "^19",
      typescript: "^5",
    },
  };
  await fs.writeFile(
    path.join(scaffoldPath, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );
  files.push("package.json");

  // Generate tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: "ES2017",
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "preserve",
      incremental: true,
      plugins: [{ name: "next" }],
      paths: { "@/*": ["./*"] },
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"],
  };
  await fs.writeFile(
    path.join(scaffoldPath, "tsconfig.json"),
    JSON.stringify(tsConfig, null, 2)
  );
  files.push("tsconfig.json");

  // Generate next.config.ts
  const nextConfig = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
`;
  await fs.writeFile(path.join(scaffoldPath, "next.config.ts"), nextConfig);
  files.push("next.config.ts");

  // Create app directory structure
  await fs.mkdir(path.join(scaffoldPath, "app"), { recursive: true });

  // Generate app/layout.tsx
  const layoutTsx = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "${project.name}",
  description: "${project.tagline}",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;
  await fs.writeFile(path.join(scaffoldPath, "app/layout.tsx"), layoutTsx);
  files.push("app/layout.tsx");

  // Generate app/page.tsx
  const pageTsx = `export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d1022 0%, #1a1f35 100%)",
      color: "white",
      padding: 32,
    }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{ fontSize: 48, marginBottom: 16 }}>
          ${project.name}
        </h1>
        <p style={{ fontSize: 20, color: "#8b8fa3", marginBottom: 32 }}>
          ${project.tagline}
        </p>
        
        <div style={{
          background: "rgba(255,255,255,0.05)",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}>
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>About This Project</h2>
          <p style={{ color: "#8b8fa3", lineHeight: 1.6 }}>
            ${project.description || "Project description coming soon."}
          </p>
        </div>

        ${project.domains?.length > 0 ? `
        <div style={{
          background: "rgba(255,255,255,0.05)",
          borderRadius: 12,
          padding: 24,
        }}>
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>Domains</h2>
          <div style={{ display: "grid", gap: 12 }}>
            ${project.domains.map((d) => `
            <div style={{
              padding: 16,
              background: "rgba(255,255,255,0.03)",
              borderRadius: 8,
              borderLeft: "3px solid #3b82f6",
            }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>${d.name}</h3>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "#8b8fa3" }}>
                ${d.description}
              </p>
            </div>`).join("")}
          </div>
        </div>` : ""}

        <footer style={{
          marginTop: 48,
          paddingTop: 24,
          borderTop: "1px solid rgba(255,255,255,0.1)",
          fontSize: 12,
          color: "#6b7280",
          textAlign: "center",
        }}>
          <p>Generated by Alex AI Product Factory</p>
          <p>Project ID: ${project.id}</p>
        </footer>
      </div>
    </main>
  );
}
`;
  await fs.writeFile(path.join(scaffoldPath, "app/page.tsx"), pageTsx);
  files.push("app/page.tsx");

  // Generate app/globals.css
  const globalsCss = `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
`;
  await fs.writeFile(path.join(scaffoldPath, "app/globals.css"), globalsCss);
  files.push("app/globals.css");

  // Generate README.md
  const readme = `# ${project.name}

${project.tagline}

## About

${project.description || "Project description coming soon."}

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the project.

## Project Info

- **ID:** ${project.id}
- **Category:** ${project.primaryCategory}
- **Generated:** ${new Date().toISOString()}

## Tech Stack

${project.techStack?.frontend?.length ? `- **Frontend:** ${project.techStack.frontend.join(", ")}` : ""}
${project.techStack?.backend?.length ? `- **Backend:** ${project.techStack.backend.join(", ")}` : ""}
${project.techStack?.infrastructure?.length ? `- **Infrastructure:** ${project.techStack.infrastructure.join(", ")}` : ""}

---

Generated by [Alex AI Product Factory](https://github.com/familiarcat/rag-refresh-product-factory)
`;
  await fs.writeFile(path.join(scaffoldPath, "README.md"), readme);
  files.push("README.md");

  // Generate Dockerfile
  const dockerfile = `FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
`;
  await fs.writeFile(path.join(scaffoldPath, "Dockerfile"), dockerfile);
  files.push("Dockerfile");

  return {
    scaffoldPath: config.scaffoldPath,
    files,
    message: `Scaffold generated with ${files.length} files`,
  };
}

async function deployToSubdomain(
  project: Project,
  config: ScaffoldConfig
): Promise<{
  subdomain: string;
  url: string;
  status: string;
  instructions: string[];
}> {
  // This is a placeholder - actual deployment would integrate with AWS Route53, ALB, etc.
  const url = `https://${config.subdomain}.alexai.dev`;

  return {
    subdomain: config.subdomain,
    url,
    status: "pending",
    instructions: [
      `1. Build the project: cd ${config.scaffoldPath} && npm run build`,
      `2. Create Route53 subdomain record for ${config.subdomain}`,
      `3. Configure ALB target group for the subdomain`,
      `4. Deploy Docker container to ECS/EC2`,
      `5. Access at ${url}`,
    ],
  };
}

async function ejectProject(
  project: Project,
  config: ScaffoldConfig,
  targetRepo?: string
): Promise<{
  ejected: boolean;
  targetRepo: string;
  message: string;
  instructions: string[];
}> {
  const scaffoldPath = path.join(process.cwd(), config.scaffoldPath);
  const newRepoName = targetRepo || `${config.subdomain}-standalone`;

  return {
    ejected: true,
    targetRepo: newRepoName,
    message: `Project ready for ejection to ${newRepoName}`,
    instructions: [
      `1. Create new repository: gh repo create ${newRepoName} --private`,
      `2. Copy scaffold: cp -r ${scaffoldPath} /path/to/${newRepoName}`,
      `3. Initialize git: cd /path/to/${newRepoName} && git init`,
      `4. Add remote: git remote add origin git@github.com:yourorg/${newRepoName}.git`,
      `5. Push: git add . && git commit -m "Initial commit" && git push -u origin main`,
      "",
      "The project will be fully independent and can be developed outside Alex AI.",
    ],
  };
}

async function getProjectScaffoldStatus(
  project: Project,
  config: ScaffoldConfig
): Promise<{
  projectId: string;
  config: ScaffoldConfig;
  branchExists: boolean;
  scaffoldExists: boolean;
  deploymentStatus: string;
}> {
  const cwd = process.cwd();

  // Check if branch exists
  let branchExists = false;
  try {
    const { stdout } = await execAsync("git branch -a", { cwd });
    branchExists = stdout.includes(config.branch);
  } catch {
    // Ignore errors
  }

  // Check if scaffold exists
  let scaffoldExists = false;
  try {
    await fs.access(path.join(cwd, config.scaffoldPath));
    scaffoldExists = true;
  } catch {
    // Scaffold doesn't exist
  }

  return {
    projectId: project.id,
    config,
    branchExists,
    scaffoldExists,
    deploymentStatus: scaffoldExists ? "ready" : "not_scaffolded",
  };
}
