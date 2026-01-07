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
