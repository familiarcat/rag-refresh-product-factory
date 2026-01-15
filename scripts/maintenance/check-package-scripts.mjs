<<<<<<< HEAD
import fs from "node:fs";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const scripts = pkg.scripts ?? {};

const mustExist = [
  "build",
  "alexai:ts:heal",
];

const redFlags = [
  { name: "background ampersand", re: /(^|[^&])&(\s|$)/ },          // single &
  { name: "nohup", re: /\bnohup\b/ },
  { name: "disown", re: /\bdisown\b/ },
];

let ok = true;

for (const k of mustExist) {
  if (!scripts[k]) {
    console.error(`❌ Missing script: ${k}`);
    ok = false;
  }
}

for (const [name, cmd] of Object.entries(scripts)) {
  if (typeof cmd !== "string") continue;

  // Detect a “build called from multiple scripts” pattern
  if (name !== "build" && /\bnpm\s+run\s+-s\s+build\b|\bnpm\s+run\s+build\b|\bnext\s+build\b/.test(cmd)) {
    console.warn(`⚠️  Script "${name}" invokes build directly. Prefer calling build only from one orchestrator (alexai:ts:heal).`);
  }

  for (const rf of redFlags) {
    if (rf.re.test(cmd)) {
      console.warn(`⚠️  Script "${name}" contains possible async/background behavior (${rf.name}). cmd=${cmd}`);
    }
  }

  // Ensure script uses bash for bash scripts
  if (/scripts\/.*\.sh\b/.test(cmd) && !/bash\s+scripts\/.*\.sh/.test(cmd)) {
    console.warn(`⚠️  Script "${name}" calls a .sh without "bash". cmd=${cmd}`);
  }
}

if (!ok) process.exit(1);
console.log("✅ package.json scripts: basic sanity checks passed");
=======
import fs from 'fs';
import path from 'path';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

console.log(`${YELLOW}🔍 Verifying package.json script references...${RESET}`);

const rootDir = process.cwd();
const packageJsonPath = path.join(rootDir, 'package.json');

if (!fs.existsSync(packageJsonPath)) {
  console.error(`${RED}❌ package.json not found at ${packageJsonPath}${RESET}`);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const scripts = pkg.scripts || {};
let errorCount = 0;

// Regex to find script files executed by node, bash, sh, tsx, etc.
// Captures the first argument which is usually the script path.
const scriptRegex = /(?:node|bash|sh|tsx|ts-node)\s+([^\s&|;]+)/g;

for (const [name, cmd] of Object.entries(scripts)) {
  let match;
  while ((match = scriptRegex.exec(cmd)) !== null) {
    let scriptPath = match[1];

    // Ignore flags and variables
    if (scriptPath.startsWith('-') || scriptPath.startsWith('$')) continue;

    // Resolve path relative to root
    const fullPath = path.resolve(rootDir, scriptPath);

    if (!fs.existsSync(fullPath)) {
      console.error(`${RED}❌ [${name}] Script not found: ${scriptPath}${RESET}`);
      errorCount++;
    } else {
      // Optional: Check if file is empty
      const stats = fs.statSync(fullPath);
      if (stats.size === 0) {
        console.warn(`${YELLOW}⚠️  [${name}] Script is empty: ${scriptPath}${RESET}`);
      }
    }
  }
}

if (errorCount === 0) {
  console.log(`${GREEN}✅ All script references valid.${RESET}`);
} else {
  console.error(`${RED}❌ Found ${errorCount} broken script references.${RESET}`);
  process.exit(1);
}
>>>>>>> d1624f7 (build working 011525)
