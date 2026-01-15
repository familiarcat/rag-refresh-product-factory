#!/usr/bin/env node
import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const zipPath = process.argv[2];
const pmRoot = process.argv[3] || "./projects";
if (!zipPath) throw new Error("Usage: node scripts/alex-ai/import_project_from_zip.mjs <zipPath> <pmRoot>");
if (!fs.existsSync(zipPath)) throw new Error(`Zip not found: ${zipPath}`);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "alexai-import-"));
execSync(`unzip -q "${zipPath}" -d "${tmp}"`);

function findPackageJson(dir) {
    const stack = [dir];
    while (stack.length) {
        const d = stack.pop();
        const entries = fs.readdirSync(d, { withFileTypes: true });
        for (const e of entries) {
            if (e.isDirectory()) {
                if ([".git", "__MACOSX", "node_modules", "dist", "build", ".next"].includes(e.name)) continue;
                stack.push(path.join(d, e.name));
            } else if (e.isFile() && e.name === "package.json") {
                return path.join(d, e.name);
            }
        }
    }
    return null;
}

const pkgPath = findPackageJson(tmp);
if (!pkgPath) throw new Error("Could not locate package.json inside zip.");

const srcRoot = path.dirname(pkgPath);
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const slug = (pkg.name || "imported-project").replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
const outRoot = path.join(pmRoot, slug);

fs.mkdirSync(outRoot, { recursive: true });

function copyDirClean(src, dest) {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    fs.mkdirSync(dest, { recursive: true });
    for (const e of entries) {
        if ([".git", "__MACOSX", "node_modules", "dist", "build", ".next"].includes(e.name)) continue;
        if (e.name === ".DS_Store") continue;
        const a = path.join(src, e.name);
        const b = path.join(dest, e.name);
        if (e.isDirectory()) copyDirClean(a, b);
        else fs.copyFileSync(a, b);
    }
}

const wrapper = path.join(outRoot, "source");
copyDirClean(srcRoot, wrapper);

// Write PM wrapper metadata + crew + n8n stub
fs.mkdirSync(path.join(outRoot, "docs"), { recursive: true });
fs.mkdirSync(path.join(outRoot, "crew"), { recursive: true });
fs.mkdirSync(path.join(outRoot, "n8n-workflows"), { recursive: true });
fs.mkdirSync(path.join(outRoot, "pm"), { recursive: true });

const projectJson = {
    schema_version: "1.0",
    project: {
        slug,
        name: pkg.name || slug,
        summary: "Imported project wrapped for AlexAI PM system (OpenRouter-first via n8n).",
        language: "TypeScript/Node",
        billing_posture: "OpenRouter-only; route all model calls through n8n crew workflows.",
        tags: ["import", "alexai", "pm", "openrouter", "n8n"]
    }
};
fs.writeFileSync(path.join(outRoot, "project.json"), JSON.stringify(projectJson, null, 2));

const crewJson = {
    schema_version: "1.0",
    crew: [
        { name: "Picard", role: "Product lead", responsibilities: ["Milestones", "OpenRouter-only posture"] },
        { name: "Data", role: "TypeScript systems", responsibilities: ["Strict TS", "Shared contracts"] },
        { name: "Scotty", role: "Tooling/Build", responsibilities: ["CI/scripts", "patching"] },
        { name: "Troi", role: "UX/Design", responsibilities: ["WebView UX", "navigation"] }
    ],
    policies: {
        llm_billing: "Route all model calls through OpenRouter via n8n workflows.",
        secrets: "No secrets in repo; use env/secret storage."
    }
};
fs.writeFileSync(path.join(outRoot, "crew/crew.json"), JSON.stringify(crewJson, null, 2));

const workflowStub = {
    name: `${slug}: OpenRouter crew action (stub)`,
    env: { OPENROUTER_API_KEY: "required", COST_CENTER: slug },
    notes: "Replace with your real n8n workflow JSON that calls OpenRouter + records usage/cost."
};
fs.writeFileSync(path.join(outRoot, "n8n-workflows/workflow_stub.json"), JSON.stringify(workflowStub, null, 2));

fs.writeFileSync(
    path.join(outRoot, "pm/MILESTONES.md"),
    `# Milestones (starter)\n\n- M1 Import + baseline run\n- M2 Strict TypeScript + shared contracts\n- M3 VS Code + Web parity\n- M4 n8n crew automation via OpenRouter\n`
);

console.log(`✅ Imported project into: ${outRoot}`);
