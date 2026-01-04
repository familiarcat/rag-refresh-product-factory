#!/usr/bin/env node
import fs from "node:fs";

const txt = fs.readFileSync("package.json", "utf8");

// naive-but-effective scan of the scripts object for duplicate keys
const m = txt.match(/"scripts"\s*:\s*\{([\s\S]*?)\}\s*,?/);
if (!m) {
  console.error("❌ No scripts block found in package.json");
  process.exit(1);
}

const body = m[1];
const keys = [...body.matchAll(/"([^"]+)"\s*:/g)].map((x) => x[1]);

const seen = new Set();
const dup = new Set();
for (const k of keys) {
  if (seen.has(k)) dup.add(k);
  else seen.add(k);
}

if (dup.size) {
  console.error("❌ Duplicate script keys found:", [...dup]);
  process.exit(1);
}

console.log("✅ package.json scripts: no duplicate keys detected");
