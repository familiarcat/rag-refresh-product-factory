import dotenv from "dotenv";
import path from "node:path";
import fs from "fs";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".secrets/.env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") }); // optional fallback

const metaPath = process.argv[2];
if (!metaPath) throw new Error("Pass /tmp/milestone_meta.json");

const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

const absMd = path.join(process.cwd(), meta.path);
const mdText = fs.readFileSync(absMd, "utf8");

function chunk(text, size = 900, overlap = 120) {
  const out = [];
  let i = 0;
  while (i < text.length) {
    out.push(text.slice(i, i + size));
    i += size - overlap;
  }
  return out;
}

// OpenAI embeddings (optional). If OPENAI_API_KEY missing, we still upload chunks without embeddings.
async function embedOpenAI(texts) {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";
  if (!key) return null;

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({ model, input: texts })
  });
  if (!res.ok) throw new Error(`Embeddings failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.data.map(d => d.embedding);
}

async function sbInsert(table, row) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`,
      "Prefer": "return=representation"
    },
    body: JSON.stringify(row)
  });
  if (!res.ok) throw new Error(`Insert ${table} failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function sbPatch(table, match, patch) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${match}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`,
      "Prefer": "return=representation"
    },
    body: JSON.stringify(patch)
  });
  if (!res.ok) throw new Error(`Patch ${table} failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

const [milestone] = await sbInsert("milestones", {
  project: meta.project,
  repo: meta.repo,
  branch: meta.branch,
  author: meta.author,
  commit_sha: meta.commit_sha,
  title: meta.title,
  slug: meta.slug,
  local_path: meta.path,
  local_retention_days: Number(process.env.MILESTONE_RETENTION_DAYS || 14),
  status: "created"
});

const chunks = chunk(mdText);
const embeddings = await embedOpenAI(chunks);

for (let i = 0; i < chunks.length; i++) {
  await sbInsert("milestone_chunks", {
    milestone_id: milestone.id,
    chunk_index: i,
    content: chunks[i],
    ...(embeddings ? { embedding: embeddings[i] } : {})
  });
}

await sbPatch("milestones", `id=eq.${milestone.id}`, {
  ingested_at: new Date().toISOString(),
  status: "ingested"
});

await sbInsert("milestone_events", {
  milestone_id: milestone.id,
  type: "ingested",
  message: embeddings
    ? `Ingested ${chunks.length} chunks with embeddings.`
    : `Ingested ${chunks.length} chunks (no embeddings; set OPENAI_API_KEY to embed).`
});

console.log(`✅ Uploaded milestone ${milestone.id} (${chunks.length} chunks)`);
