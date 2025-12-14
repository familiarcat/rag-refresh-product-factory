export default function EnvPage() {
  const keys = ['N8N_WEBHOOK_URL','N8N_PROJECT_WEBHOOK_URL'] as const;
  return (
    <div className="grid">
      <div className="card span-12">
        <h1 style={{marginTop:0}}>Environment</h1>
        <p className="small">
          Next.js reads <code>.env.local</code> at startup. If you change env vars, you must restart <code>npm run dev</code>.
        </p>
        <div className="card" style={{padding:12, background:'rgba(0,0,0,.15)'}}>
          {keys.map(k => (
            <div key={k} style={{display:'flex',justifyContent:'space-between',gap:12,padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
              <div style={{fontFamily:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New'}}>{k}</div>
              <div className={process.env[k] ? 'badge good' : 'badge risk'}>{process.env[k] ? 'set' : 'missing'}</div>
            </div>
          ))}
          <div className="small" style={{marginTop:10}}>
            Tip: create <code>.env.local</code> from <code>.env.local.example</code>.
          </div>
        </div>
      </div>
    </div>
  );
}
