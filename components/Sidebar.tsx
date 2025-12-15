import Link from 'next/link';
import Image from 'next/image';
import { docsNav } from '../lib/nav';

const crewIds = [
  { id: 'captain_picard', name: 'Captain Picard' },
  { id: 'commander_data', name: 'Commander Data' },
  { id: 'commander_riker', name: 'Commander Riker' },
  { id: 'geordi_la_forge', name: 'Geordi La Forge' },
  { id: 'lieutenant_worf', name: 'Lieutenant Worf' },
  { id: 'dr_crusher', name: 'Dr. Crusher' },
  { id: 'counselor_troi', name: 'Counselor Troi' },
  { id: 'chief_obrien', name: "Chief O'Brien" },
  { id: 'lieutenant_uhura', name: 'Lieutenant Uhura' },
  { id: 'quark', name: 'Quark' },
];

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
        <div className="quickStatusAvatars">
          {crewIds.map(crew => (
            <Link key={crew.id} href={`/crew/${crew.id}`} className="quickStatusAvatar" title={crew.name}>
              <Image 
                src={`/crew-avatars/${crew.id}.jpg`} 
                alt={crew.name}
                fill
                sizes="28px"
                className="avatarImage"
              />
            </Link>
          ))}
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
