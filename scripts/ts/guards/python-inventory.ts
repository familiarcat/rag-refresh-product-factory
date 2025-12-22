import fs from "node:fs";
import path from "node:path";

function walk(dir: string, out: string[] = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const root = process.cwd();
const py = walk(root)
  .filter(p => p.endsWith(".py"))
  .map(p => path.relative(root, p).replace(/\\/g, "/"))
  .sort();

process.stdout.write(py.join("\n") + (py.length ? "\n" : ""));
