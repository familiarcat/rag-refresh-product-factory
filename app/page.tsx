import Link from 'next/link';
import { ScorecardBars } from '../components/Charts';
import { categories } from '../lib/categories';

export default function Home() {
  return (
    <div className="grid">
      <div className="card span-12">
        <h1 style={{marginTop:0}}>Home</h1>
        <p className="small">
          This app is the “product spine”: a review-pack you can read, plus a working RAG endpoint and a safe self-learning loop
          (save structured notes → notes become searchable).
        </p>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <span className="badge good">Opportunity</span>
          <span className="badge warn">Tradeoffs</span>
          <span className="badge risk">Risk</span>
        </div>
      </div>

      <div className="card span-8">
        <div className="small" style={{marginBottom:8}}>Infographic</div>
        <h2 style={{marginTop:0}}>Category Scorecard</h2>
        <div className="card" style={{padding:12, background:'rgba(0,0,0,.15)'}}>
          <ScorecardBars />
        </div>
      </div>

      <div className="card span-4">
        <div className="small" style={{marginBottom:8}}>CTAs</div>
        <h2 style={{marginTop:0}}>Start here</h2>
        <p className="small"><b>1) Browse Categories</b><br/>Pick a monetization lane and see the cost/benefit analysis.</p>
        <p><Link href="/categories">Open Categories →</Link></p>
        <p className="small"><b>2) Try Ask</b><br/>See citations + trace.</p>
        <p><Link href="/ask">Go to Ask →</Link></p>
        <p className="small"><b>3) Generate & Save</b><br/>Create structured artifacts and save them as notes.</p>
        <p><Link href="/create">Go to Create →</Link></p>
        <p className="small"><b>4) Read the overview</b></p>
        <p><Link href="/docs/overview">Open Overview →</Link></p>
      </div>

      <div className="card span-12">
        <h2 style={{marginTop:0}}>All categories</h2>
        <div className="grid">
          {categories.map(c => (
            <div key={c.slug} className="card span-6">
              <h3 style={{marginTop:0}}>{c.name}</h3>
              <p className="small">{c.tagline}</p>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <span className="badge good">Demand {c.scores.demand}/10</span>
                <span className="badge warn">Effort {c.scores.effort}/10</span>
                <span className="badge risk">Risk {c.scores.risk}/10</span>
              </div>
              <div style={{marginTop:10}}>
                <Link href={`/categories/${c.slug}`}>Open analysis →</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
