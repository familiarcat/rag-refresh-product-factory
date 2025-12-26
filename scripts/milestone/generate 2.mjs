import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const title = process.argv.slice(2).join(" ").trim();
if (!title) throw new Error("Missing title");

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const outDir = path.join(process.cwd(), "milestones");
fs.mkdirSync(outDir, { recursive: true });

const branch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
const sha = execSync("git rev-parse HEAD").toString().trim();
const author = process.env.GIT_AUTHOR_NAME || process.env.USER || process.env.USERNAME || "unknown";

const status = execSync("git status --porcelain=v1").toString();
const diffstat = execSync("git diff --stat").toString();
const diffstatStaged = execSync("git diff --cached --stat").toString();

const md = `# Milestone: ${title}

- Timestamp: ${new Date().toISOString()}
- Branch: ${branch}
- Commit (pre-push): ${sha}
- Author: ${author}

## Status
\`\`\`
${status || "clean"}
\`\`\`

## Diffstat (staged)
\`\`\`
${diffstatStaged || "none"}
\`\`\`

## Diffstat (unstaged)
\`\`\`
${diffstat || "none"}
\`\`\`

## Notes
- What did we achieve?
- What is in progress?
- What’s next?
- Risks / unknowns?
`;

const filename = `${stamp}__${slug}.md`;
const filePath = path.join(outDir, filename);
fs.writeFileSync(filePath, md, "utf8");

const meta = {
  title,
  slug,
  path: `milestones/${filename}`,
  branch,
  commit_sha: sha,
  author,
  created_at: new Date().toISOString(),
  project: process.env.MILESTONE_PROJECT || "rag-refresh-product-factory",
  repo: process.env.MILESTONE_REPO || "familiarcat/rag-refresh-product-factory"
};

process.stdout.write(JSON.stringify(meta, null, 2));
