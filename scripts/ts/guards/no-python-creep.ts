import fs from "node:fs";
import path from "node:path";

type Allow = { allowlist: string[] };

function walk(dir: string, out: string[] = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function main() {
  const root = process.cwd();
  const allowPath = path.join(root, "data", "python-allowlist.json");
  if (!fs.existsSync(allowPath)) {
    console.error("python allowlist missing: data/python-allowlist.json");
    process.exit(1);
  }

  const allow = JSON.parse(fs.readFileSync(allowPath, "utf8")) as Allow;
  const allowed = new Set(allow.allowlist.map(p => p.replace(/\\/g, "/")));

  const files = walk(root)
    .filter(p => p.endsWith(".py"))
    .map(p => path.relative(root, p).replace(/\\/g, "/"));

  const unexpected = files.filter(p => !allowed.has(p));

  if (unexpected.length) {
    console.error("❌ Python creep detected. New .py files found (not in allowlist):");
    for (const p of unexpected) console.error(" - " + p);
    console.error("\nIf intentional, update data/python-allowlist.json after converting to TypeScript or explicitly approving legacy Python.");
    process.exit(1);
  }

  console.log("✅ No new Python files detected (allowlist enforced).");
}

main();
