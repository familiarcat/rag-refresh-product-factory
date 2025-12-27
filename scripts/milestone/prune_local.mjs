import fs from "fs";
import path from "path";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

const retentionDays = Number(process.env.MILESTONE_RETENTION_DAYS || 14);
const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

async function sbGet(table, query) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
  });
  if (!res.ok) throw new Error(`Get ${table} failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function sbInsert(table, row) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`
    },
    body: JSON.stringify(row)
  });
  if (!res.ok) throw new Error(`Insert ${table} failed: ${res.status} ${await res.text()}`);
}

async function sbPatch(table, match, patch) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${match}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`
    },
    body: JSON.stringify(patch)
  });
  if (!res.ok) throw new Error(`Patch ${table} failed: ${res.status} ${await res.text()}`);
}

const dir = path.join(process.cwd(), "milestones");
if (!fs.existsSync(dir)) {
  console.log("No milestones/ directory. Nothing to prune.");
  process.exit(0);
}

const files = fs.readdirSync(dir).filter(f => f.endsWith(".md"));
let pruned = 0;

for (const f of files) {
  const fp = path.join(dir, f);
  const st = fs.statSync(fp);
  if (st.mtimeMs > cutoff) continue;

  const relPath = `milestones/${f}`;

  const ms = await sbGet("milestones", `select=id,status,ingested_at&local_path=eq.${encodeURIComponent(relPath)}`);
  if (!ms.length) continue;
  const m = ms[0];
  if (m.status !== "ingested") continue;

  const chunks = await sbGet("milestone_chunks", `select=id&milestone_id=eq.${m.id}&limit=1`);
  if (!chunks.length) continue;

  fs.unlinkSync(fp);
  pruned++;

  await sbPatch("milestones", `id=eq.${m.id}`, {
    pruned_at: new Date().toISOString(),
    status: "pruned"
  });

  await sbInsert("milestone_events", {
    milestone_id: m.id,
    type: "pruned",
    message: `Deleted local artifact ${relPath} after ${retentionDays} days.`
  });

  console.log(`🧹 Pruned ${relPath}`);
}

console.log(`✅ Prune complete. Removed ${pruned} files.`);
