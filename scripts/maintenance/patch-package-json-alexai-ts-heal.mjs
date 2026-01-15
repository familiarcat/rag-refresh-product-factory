#!/usr/bin/env node
/**
 * Add/repair the package.json script: alexai:ts:heal
 * Safe JSON parse/write, makes a timestamped backup.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pkgPath = path.join(root, "package.json");

if (!fs.existsSync(pkgPath)) {
  console.error("❌ package.json not found at repo root:", pkgPath);
  process.exit(1);
}

const raw = fs.readFileSync(pkgPath, "utf8");
let pkg;
try {
  pkg = JSON.parse(raw);
} catch (e) {
  console.error("❌ package.json is not valid JSON:", e?.message ?? e);
  process.exit(1);
}

pkg.scripts = pkg.scripts ?? {};

pkg.scripts["alexai:ts:heal"] =
  "bash scripts/maintenance/normalize-supabase-imports.sh && rm -rf .next || true && next build";

// backup
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const bak = path.join(root, `package.json.bak.${ts}`);
fs.writeFileSync(bak, raw, "utf8");

// write
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

console.log("✅ Added/updated script alexai:ts:heal in package.json");
console.log("🗄️ Backup written:", path.basename(bak));
