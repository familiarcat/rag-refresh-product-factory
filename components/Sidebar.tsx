import Link from 'next/link';
import { docsNav } from '../lib/nav';

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo" aria-hidden="true" />
        <div>
          <div className="title">RAG Refresh Product Factory</div>
          <div className="subtitle">Alex AI Crew + RAG + DDD</div>
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
        <div className="navHeader">🖖 Alex AI Crew</div>
        <Link className="navItem navCrew" href="/crew">
          <span className="crewIcon">👥</span> Crew Roster
        </Link>
        <Link className="navItem navCrew" href="/observation-lounge">
          <span className="crewIcon">🖖</span> Observation Lounge
        </Link>
      </div>

      <div className="navBlock">
        <div className="navHeader">Docs</div>
        {docsNav.map(it => (
          <Link key={it.route} className="navItem" href={it.route}>{it.label}</Link>
        ))}
      </div>

      <div className="crewQuickStatus">
        <div className="quickStatusHeader">Crew Status</div>
        <div className="quickStatusRow">
          <span title="Captain Picard">👨‍✈️</span>
          <span title="Commander Data">🤖</span>
          <span title="Commander Riker">🎺</span>
          <span title="Geordi La Forge">🔧</span>
          <span title="Lieutenant Worf">⚔️</span>
        </div>
        <div className="quickStatusRow">
          <span title="Dr. Crusher">👩‍⚕️</span>
          <span title="Counselor Troi">💜</span>
          <span title="Chief O'Brien">🛠️</span>
          <span title="Lieutenant Uhura">📡</span>
          <span title="Quark">💰</span>
        </div>
      </div>

      <div className="hint">
        <span className="pill good">Opportunity</span>
        <span className="pill warn">Tradeoffs</span>
        <span className="pill risk">Risk</span>
      </div>
    </aside>
  );
}
