'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { docsNav } from '../lib/nav';
import { ProjectSummary, getStatusIcon, getStatusColor } from '../lib/projects';

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

// Icon mapping for nav items
const navIcons: Record<string, string> = {
  '/': '🏠',
  '/categories': '📂',
  '/create': '🚀',
  '/ask': '💬',
  '/diagnostics': '⚙️',
  '/env': '🔧',
  '/crew': '👥',
  '/observation-lounge': '🖖',
  // Docs icons
  '/docs/overview': '📋',
  '/docs/timeline': '📅',
  '/docs/categories': '🏷️',
  '/docs/portfolio': '💼',
  '/docs/roadmap': '🗺️',
  '/docs/nextjs_product_factory_best_practices': '📘',
  '/docs/assumptions': '💡',
};

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const pathname = usePathname();

  // Fetch projects
  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch('/api/projects?status=active');
        const data = await res.json();
        setProjects(data.projects || []);
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    }
    loadProjects();
  }, [pathname]); // Refresh when navigating

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button 
        className="mobileMenuBtn"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
      >
        <span className={`hamburger ${isMobileOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="mobileOverlay" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobileOpen' : ''}`}>
        {/* Collapse Toggle (Desktop) */}
        <button 
          className="collapseBtn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? '→' : '←'}
        </button>

        {/* Brand */}
        <div className="brand">
          <div className="logo" aria-hidden="true" />
          {!isCollapsed && (
            <div className="brandText">
              <div className="title">RAG Refresh</div>
              <div className="subtitle">Alex AI Crew</div>
            </div>
          )}
        </div>

        {/* Core Navigation */}
        <div className="navBlock">
          {!isCollapsed && <div className="navHeader">Core</div>}
          <NavItem href="/" icon="🏠" label="Home" isCollapsed={isCollapsed} isActive={isActive('/')} />
          <NavItem href="/categories" icon="📂" label="Categories" isCollapsed={isCollapsed} isActive={isActive('/categories')} />
          <NavItem href="/create" icon="🚀" label="Create" isCollapsed={isCollapsed} isActive={isActive('/create')} />
          <NavItem href="/ask" icon="💬" label="Ask" isCollapsed={isCollapsed} isActive={isActive('/ask')} />
          <NavItem href="/deploy-metrics" icon="📊" label="Deploy Metrics" isCollapsed={isCollapsed} isActive={isActive('/deploy-metrics')} />
          <NavItem href="/diagnostics" icon="⚙️" label="Diagnostics" isCollapsed={isCollapsed} isActive={isActive('/diagnostics')} />
          <NavItem href="/env" icon="🔧" label="Environment" isCollapsed={isCollapsed} isActive={isActive('/env')} />
        </div>

        {/* Crew Navigation */}
        <div className="navBlock">
          {!isCollapsed && <div className="navHeader">🖖 Crew</div>}
          <NavItem href="/crew" icon="👥" label="Crew Roster" isCollapsed={isCollapsed} isActive={isActive('/crew')} />
          <NavItem href="/observation-lounge" icon="🖖" label="Observation Lounge" isCollapsed={isCollapsed} isActive={isActive('/observation-lounge')} />
        </div>

        {/* Factory Docs Navigation */}
        <div className="navBlock">
          {!isCollapsed && <div className="navHeader">🏭 Factory Docs</div>}
          {docsNav.map(it => (
            <NavItem 
              key={it.route} 
              href={it.route} 
              icon={(it as any).icon || navIcons[it.route] || '📄'} 
              label={it.label} 
              isCollapsed={isCollapsed} 
              isActive={isActive(it.route)} 
            />
          ))}
        </div>

        {/* Projects Section */}
        <div className="navBlock">
          {!isCollapsed && <div className="navHeader">📦 Projects</div>}
          <NavItem href="/projects" icon="📋" label="All Projects" isCollapsed={isCollapsed} isActive={isActive('/projects') && pathname === '/projects'} />
          
          {/* Active Projects List */}
          {!isCollapsed && projects.length > 0 && (
            <div style={{ marginTop: 4 }}>
              {projects.slice(0, 5).map(project => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className={`navItem ${isActive(`/projects/${project.id}`) ? 'active' : ''}`}
                  style={{ paddingLeft: 20 }}
                >
                  <span className="navIcon" style={{ fontSize: 12 }}>
                    {getStatusIcon(project.status)}
                  </span>
                  <span className="navLabel" style={{ 
                    fontSize: 12,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {project.name}
                  </span>
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: 10,
                    padding: '1px 4px',
                    background: `${getStatusColor(project.status)}20`,
                    color: getStatusColor(project.status),
                    borderRadius: 3,
                  }}>
                    {project.progress}%
                  </span>
                </Link>
              ))}
              {projects.length > 5 && (
                <Link 
                  href="/projects" 
                  style={{ 
                    display: 'block',
                    padding: '6px 14px 6px 20px',
                    fontSize: 11,
                    color: 'var(--muted)',
                    textDecoration: 'none',
                  }}
                >
                  +{projects.length - 5} more...
                </Link>
              )}
            </div>
          )}
          
          {/* Empty state */}
          {!isCollapsed && projects.length === 0 && (
            <div style={{ 
              padding: '8px 14px', 
              fontSize: 11, 
              color: 'var(--muted)',
              background: 'rgba(255,255,255,.02)',
              borderRadius: 6,
              border: '1px dashed rgba(255,255,255,.1)',
              marginTop: 4,
            }}>
              No active projects
            </div>
          )}
        </div>

        {/* Crew Quick Status - Only when expanded */}
        {!isCollapsed && (
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
        )}

        {/* Collapsed Crew Avatars */}
        {isCollapsed && (
          <div className="collapsedCrewAvatars">
            {crewIds.slice(0, 5).map(crew => (
              <Link key={crew.id} href={`/crew/${crew.id}`} className="collapsedAvatar" title={crew.name}>
                <Image 
                  src={`/crew-avatars/${crew.id}.jpg`} 
                  alt={crew.name}
                  fill
                  sizes="24px"
                  className="avatarImage"
                />
              </Link>
            ))}
            <Link href="/crew" className="collapsedAvatarMore" title="View all crew">
              +{crewIds.length - 5}
            </Link>
          </div>
        )}

        {/* Status Pills - Only when expanded */}
        {!isCollapsed && (
          <div className="hint">
            <span className="pill good">Opportunity</span>
            <span className="pill warn">Tradeoffs</span>
            <span className="pill risk">Risk</span>
          </div>
        )}
      </aside>
    </>
  );
}

// Nav Item Component
function NavItem({ 
  href, 
  icon, 
  label, 
  isCollapsed, 
  isActive 
}: { 
  href: string; 
  icon: string; 
  label: string; 
  isCollapsed: boolean; 
  isActive: boolean;
}) {
  return (
    <Link 
      href={href} 
      className={`navItem ${isActive ? 'active' : ''}`}
      title={isCollapsed ? label : undefined}
    >
      <span className="navIcon">{icon}</span>
      {!isCollapsed && <span className="navLabel">{label}</span>}
    </Link>
  );
}
