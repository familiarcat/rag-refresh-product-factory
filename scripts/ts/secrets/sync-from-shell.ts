import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const allowlistPath = path.join(root, "scripts", "secrets", "allowlist.env");
const outPath = path.join(root, ".secrets", ".env.local");

function readAllowlist(filePath: string): string[] {
  if (!fs.existsSync(filePath)) return [];
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("#"));
}

function dotenvQuote(val: string): string {
  // single-quote dotenv values; escape single quotes safely
  return `'${val.replace(/'/g, `'\\''`)}'`;
}

function main() {
  const keys = readAllowlist(allowlistPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const lines: string[] = [];
  for (const k of keys) {
    const v = process.env[k];
    if (!v) continue;
    lines.push(`${k}=${dotenvQuote(v)}`);
  }

  fs.writeFileSync(outPath, lines.join("\n") + (lines.length ? "\n" : ""), {
    mode: 0o600,
  });

  // minimal stdout for scripts to consume
  process.stdout.write(outPath);
}

main();
