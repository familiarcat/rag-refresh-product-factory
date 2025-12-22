import fs from "node:fs";
import path from "node:path";

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

export function selectModel({ crewMember = "", complexity = 3, needsRag = false, needsTools = true, minContext = 0 } = {}) {
  const root = process.cwd();
  const policy = readJson(path.join(root, "data", "model-policy.json"));
  const costDb = readJson(path.join(root, "data", "llm-cost-database.json"));
  const crew = String(crewMember).toLowerCase();
  const c = Math.max(1, Math.min(10, Number(complexity) || 3));

  const tier =
    c <= policy.tiers.cheap.max_complexity ? "cheap" :
    c <= policy.tiers.standard.max_complexity ? "standard" : "premium";

  const tierMinContext = Math.max(minContext, policy.tiers[tier].min_context || 0);
  const tierNeedsTools = needsTools ?? policy.tiers[tier].requires_tools;

  const candidates = policy.fallback_models
    .map(id => costDb.models.find(m => m.id === id) || { id })
    .filter(m => !tierNeedsTools || m.supports_tools !== false)
    .filter(m => !needsRag || m.supports_rag !== false)
    .filter(m => (m.context || 0) >= tierMinContext);

  const scored = candidates.map(m => {
    const inCost = m.input_per_million ?? 9999;
    const outCost = m.output_per_million ?? 9999;
    return { id: m.id, score: inCost * 0.6 + outCost * 0.4 };
  }).sort((a,b) => a.score - b.score);

  return { model: (scored[0]?.id) || policy.fallback_models[0], tier };
}
