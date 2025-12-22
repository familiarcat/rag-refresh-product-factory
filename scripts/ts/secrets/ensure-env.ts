import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const envLocal = path.join(root, ".env.local");
const secretsEnv = path.join(root, ".secrets", ".env.local");

function exists(p: string) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function copy(src: string, dst: string) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

function runSyncFromShell(): string | null {
  // Try pnpm/tsx first; fallback to node if user compiled
  const cmdCandidates = [
    "pnpm -s script:secrets:sync",
    "npx -y tsx scripts/ts/secrets/sync-from-shell.ts",
  ];
  for (const cmd of cmdCandidates) {
    try {
      const out = execSync(cmd, { stdio: ["ignore", "pipe", "ignore"], env: process.env }).toString().trim();
      return out || null;
    } catch {
      // continue
    }
  }
  return null;
}

function main() {
  if (exists(envLocal)) {
    process.stdout.write(envLocal);
    return;
  }

  if (exists(secretsEnv)) {
    copy(secretsEnv, envLocal);
    process.stdout.write(envLocal);
    return;
  }

  const generated = runSyncFromShell();
  if (generated && exists(secretsEnv)) {
    copy(secretsEnv, envLocal);
    process.stdout.write(envLocal);
    return;
  }

  // Nothing we can do; keep stdout empty
  process.stdout.write("");
}

main();
