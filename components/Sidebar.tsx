import Link from 'next/link';
import { docsNav } from '../lib/nav';

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo" aria-hidden="true" />
        <div>
          <div className="title">RAG Refresh Product Factory</div>
          <div className="subtitle">Review Pack + RAG + feedback loop</div>
        </div>
      </div>

      <div className="navBlock">
        <div className="navHeader">Core</div>
        <Link className="navItem" href="/">Home</Link>
        <Link className="navItem" href="/categories">Categories</Link>
        <Link className="navItem" href="/projects/new">New project</Link>
        <Link className="navItem" href="/ask">Ask</Link>
        <Link className="navItem" href="/create">Create</Link>
        <Link className="navItem" href="/diagnostics">Diagnostics</Link>
        <Link className="navItem" href="/env">Environment</Link>
      </div>

      <div className="navBlock">
        <div className="navHeader">Docs</div>
        {docsNav.map(it => (
          <Link key={it.route} className="navItem" href={it.route}>{it.label}</Link>
        ))}
      </div>

      <div className="hint">
        <span className="pill good">Opportunity</span>
        <span className="pill warn">Tradeoffs</span>
        <span className="pill risk">Risk</span>
      </div>
    </aside>
  );
}
