'use client';
import { useState } from 'react';

export default function AskPage() {
  const [q, setQ] = useState('What is the fastest path to monetization?');
  const [res, setRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function ask() {
    setLoading(true);
    setRes(null);
    const r = await fetch('/api/ask', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ question: q })});
    const j = await r.json();
    setRes(j);
    setLoading(false);
  }

  async function sendFeedback(helpful: boolean) {
    await fetch('/api/feedback', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ question:q, answer: res?.answer, helpful, citations: res?.citations })});
    alert('Saved feedback.');
  }

  return (
    <div className="grid">
      <div className="card span-12">
        <h1 style={{marginTop:0}}>Ask</h1>
        <p className="small">Uses local TF‑IDF retrieval against <code>content/</code> and user notes.</p>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <input value={q} onChange={e=>setQ(e.target.value)} style={{flex:1,minWidth:260,padding:10,borderRadius:12,border:'1px solid rgba(255,255,255,.18)',background:'rgba(255,255,255,.04)',color:'var(--text)'}}/>
          <button onClick={ask} disabled={loading} style={{padding:'10px 14px',borderRadius:12,border:'1px solid rgba(255,255,255,.18)',background:'rgba(255,255,255,.06)',color:'var(--text)'}}>
            {loading ? 'Asking…' : 'Ask'}
          </button>
        </div>
      </div>

      {res && (
        <>
          <div className="card span-8">
            <h2 style={{marginTop:0}}>Answer</h2>
            <p className="small">{res.answer}</p>
            <div style={{display:'flex',gap:10,marginTop:12}}>
              <button onClick={()=>sendFeedback(true)} style={{padding:'8px 12px',borderRadius:12,border:'1px solid rgba(40,217,154,.35)',background:'rgba(40,217,154,.08)',color:'var(--ok)'}}>Helpful</button>
              <button onClick={()=>sendFeedback(false)} style={{padding:'8px 12px',borderRadius:12,border:'1px solid rgba(255,92,147,.35)',background:'rgba(255,92,147,.08)',color:'var(--risk)'}}>Not helpful</button>
            </div>
          </div>
          <div className="card span-4">
            <h2 style={{marginTop:0}}>Citations</h2>
            <ol className="small">
              {(res.citations||[]).map((c:any, i:number)=> (
                <li key={i}><b>{c.source}</b><br/><span>{c.snippet}</span></li>
              ))}
            </ol>
          </div>
          <div className="card span-12">
            <h2 style={{marginTop:0}}>Trace</h2>
            <pre className="small">{JSON.stringify(res.trace, null, 2)}</pre>
          </div>
        </>
      )}
    </div>
  );
}
