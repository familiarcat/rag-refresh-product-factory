import { readFile } from 'fs/promises';
import path from 'path';

async function loadJSON(name: string) {
  const p = path.join(process.cwd(), 'data', name);
  try {
    const t = await readFile(p, 'utf-8');
    return JSON.parse(t);
  } catch {
    return [];
  }
}

export default async function Diagnostics() {
  const events = await loadJSON('events.json');
  const feedback = await loadJSON('feedback.json');
  return (
    <div className="grid">
      <div className="card span-12">
        <h1 style={{marginTop:0}}>Diagnostics</h1>
        <p className="small">Local JSON “event store” for demo purposes (upgrade to Postgres later).</p>
      </div>

      <div className="card span-6">
        <h2 style={{marginTop:0}}>Recent events</h2>
        <pre className="small">{JSON.stringify(events.slice(-25).reverse(), null, 2)}</pre>
      </div>

      <div className="card span-6">
        <h2 style={{marginTop:0}}>Recent feedback</h2>
        <pre className="small">{JSON.stringify(feedback.slice(-25).reverse(), null, 2)}</pre>
      </div>
    </div>
  );
}
