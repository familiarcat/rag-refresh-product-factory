#!/usr/bin/env node
import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

function getArg(flag) {
    const idx = process.argv.indexOf(flag);
    return idx >= 0 ? process.argv[idx + 1] : undefined;
}

const title = getArg("--title") || "AlexAI memory note";
const pmRoot = getArg("--pmRoot") || "./projects";
const importZip = getArg("--importZip") || "";

function safeSlug(s) {
    return s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function git(cmd, fallback = "") {
    try {
        return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    } catch {
        return fallback;
    }
}

const branch = git("git rev-parse --abbrev-ref HEAD", "unknown-branch");
const sha = git("git rev-parse HEAD", "unknown-sha");
const author =
    process.env.GIT_AUTHOR_NAME ||
    process.env.USER ||
    process.env.USERNAME ||
    "unknown";

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const slug = safeSlug(title);
const filename = `${stamp}-memory-note-${slug || "note"}.md`;

const outDir = path.join(process.cwd(), "milestones");
fs.mkdirSync(outDir, { recursive: true });

const mdPathRel = `milestones/${filename}`;
const mdPathAbs = path.join(process.cwd(), mdPathRel);

const importedSection = importZip
    ? `- Source zip: \`${importZip}\`\n- Imported under: \`${pmRoot}\`\n`
    : "- (none)\n";

const md = `# Memory Note: ${title}

- Timestamp: ${new Date().toISOString()}
- Branch: ${branch}
- Commit: ${sha}
- Author: ${author}

## Goal
AlexAI should be **provider-agnostic** and **bill only through OpenRouter**.
All LLM calls route through **n8n crew orchestration** so each prompt/query is attributed to:
- crew member / workflow
- token usage + cost (cost center)

## Enhancements applied
- Unified docs into coherent README + doc index
- Added OpenRouter-first billing posture to docs
- Added patch tooling (safe overlay + backups)
- Added UTF-8 safe base64 hardening to prevent VS Code WebView ByteString crashes (emoji-safe)
- Optional project import flow into PM system: \`${pmRoot}\`

## Imported project
${importedSection}
## RAG / memory ingestion
This note is intended for ingestion into Supabase RAG so the crew can recall:
- why OpenRouter-only billing matters
- how we prevent VS Code WebView encoding crashes
- how to import external codebases into PM structure

## Next actions
- Refactor any direct vendor SDK usage to OpenRouter via n8n
- Ensure VS Code + web dashboard share TypeScript contracts (one source of truth)
`;

fs.writeFileSync(mdPathAbs, md, "utf8");

// Meta json expected by your uploader
const meta = {
    title,
    slug: slug || "memory-note",
    path: mdPathRel,
    branch,
    commit_sha: sha,
    author,
    created_at: new Date().toISOString(),
    project: process.env.MILESTONE_PROJECT || "rag-refresh-product-factory",
    repo: process.env.MILESTONE_REPO || "familiarcat/rag-refresh-product-factory",
};

const metaPath = path.join(os.tmpdir(), "milestone_meta.json");
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf8");

// Upload using existing uploader
execSync(`node scripts/milestone/upload_to_supabase.mjs "${metaPath}"`, {
    stdio: "inherit",
});

console.log("✅ Memory note created + ingested:", mdPathRel);
if (importZip) {
    console.log("📦 Imported zip recorded:", importZip);
}
