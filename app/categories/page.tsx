import Link from 'next/link';
import { categories } from '../../lib/categories';
import { CategoryBars } from '../../components/CategoryBars';

export default function CategoriesPage() {
  return (
    <div className="grid">
      <div className="card span-12">
        <h1 style={{marginTop:0}}>Categories</h1>
        <p className="small">
          Each category is a monetization lane with a cost/benefit profile. Use <b>New project</b> to generate a category-templated project scaffold.
        </p>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          <Link className="btnPrimary" href="/projects/new">Create a new project →</Link>
          <a className="btn" href="/api/sync-categories" title="Calls n8n webhook if configured">Sync categories (n8n) →</a>
        </div>
        <p className="small" style={{marginTop:10}}>
          <b>Real-time updates:</b> Configure <code>N8N_WEBHOOK_URL</code> in <code>.env.local</code> and wire your n8n crew to return updated category scoring and descriptions.
          This UI is ready to consume that API.
        </p>
      </div>

      <div className="span-12">
        {categories.map(c => (
          <div key={c.slug} style={{marginBottom:14}}>
            <CategoryBars c={c} />
          </div>
        ))}
      </div>
    </div>
  );
}
