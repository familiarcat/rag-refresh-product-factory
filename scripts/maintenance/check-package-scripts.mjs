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