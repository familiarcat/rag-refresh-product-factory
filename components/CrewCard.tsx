'use client';

import Link from 'next/link';
import Image from 'next/image';

export interface CrewMemberData {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'active' | 'inactive' | 'busy';
  emoji: string;
  specialty: string[];
  currentObjective?: string;
  worries?: string[];
  recentMemories?: number;
  catchphrases?: string[];
}

interface CrewCardProps {
  crew: CrewMemberData;
  compact?: boolean;
}

// Get avatar path for crew member
function getAvatarPath(crewId: string): string {
  return `/crew-avatars/${crewId}.jpg`;
}

export function CrewCard({ crew, compact = false }: CrewCardProps) {
  const statusColors = {
    active: 'var(--good)',
    inactive: 'var(--muted)',
    busy: 'var(--warn)',
  };

  if (compact) {
    return (
      <Link href={`/crew/${crew.id}`} className="crewCardCompact">
        <div className="crewAvatarSmall">
          <Image 
            src={getAvatarPath(crew.id)} 
            alt={crew.name}
            fill
            sizes="48px"
            className="avatarImage"
            priority
          />
        </div>
        <div className="crewInfo">
          <div className="crewName">{crew.name}</div>
          <div className="crewRole">{crew.role}</div>
        </div>
        <div 
          className="crewStatusDot" 
          style={{ background: statusColors[crew.status] }}
          title={crew.status}
        />
      </Link>
    );
  }

  return (
    <div className="crewCard">
      <div className="crewCardHeader">
        <div className="crewAvatarLarge">
          <Image 
            src={getAvatarPath(crew.id)} 
            alt={crew.name}
            fill
            sizes="72px"
            className="avatarImage"
            priority
          />
        </div>
        <div className="crewHeaderInfo">
          <h3 className="crewName">{crew.name}</h3>
          <div className="crewRole">{crew.role}</div>
          <div className="crewDept">{crew.department}</div>
        </div>
        <div 
          className="crewStatusBadge"
          style={{ 
            background: `${statusColors[crew.status]}20`,
            borderColor: `${statusColors[crew.status]}50`,
            color: statusColors[crew.status]
          }}
        >
          {crew.status}
        </div>
      </div>

      <div className="crewSpecialties">
        {crew.specialty.slice(0, 3).map((s, i) => (
          <span key={i} className="specialtyTag">{s}</span>
        ))}
        {crew.specialty.length > 3 && (
          <span className="specialtyTag more">+{crew.specialty.length - 3}</span>
        )}
      </div>

      {crew.currentObjective && (
        <div className="crewObjective">
          <div className="objectiveLabel">🎯 Current Objective</div>
          <div className="objectiveText">{crew.currentObjective}</div>
        </div>
      )}

      {crew.worries && crew.worries.length > 0 && (
        <div className="crewWorries">
          <div className="worriesLabel">⚠️ Concerns ({crew.worries.length})</div>
          <ul className="worriesList">
            {crew.worries.slice(0, 2).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
            {crew.worries.length > 2 && (
              <li className="moreWorries">+{crew.worries.length - 2} more...</li>
            )}
          </ul>
        </div>
      )}

      {crew.recentMemories !== undefined && (
        <div className="crewMemories">
          <span className="memoriesIcon">🧠</span>
          <span>{crew.recentMemories} RAG memories</span>
        </div>
      )}

      <div className="crewActions">
        <Link href={`/crew/${crew.id}`} className="btn">View Profile</Link>
        <Link href={`/ask?crew=${crew.id}`} className="btnPrimary">Ask {crew.name.split(' ')[0]}</Link>
      </div>
    </div>
  );
}

export function CrewRoster({ crew }: { crew: CrewMemberData[] }) {
  const departments = [...new Set(crew.map(c => c.department))];
  
  return (
    <div className="crewRoster">
      {departments.map(dept => (
        <div key={dept} className="deptSection">
          <div className="deptHeader">{dept}</div>
          <div className="deptCrew">
            {crew.filter(c => c.department === dept).map(c => (
              <CrewCard key={c.id} crew={c} compact />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CrewStatusGrid({ crew }: { crew: CrewMemberData[] }) {
  return (
    <div className="crewStatusGrid">
      {crew.map(c => (
        <Link key={c.id} href={`/crew/${c.id}`} className="crewStatusItem">
          <div className="statusAvatar">
            <Image 
              src={getAvatarPath(c.id)} 
              alt={c.name}
              fill
              sizes="40px"
              className="avatarImage"
            />
          </div>
          <div className="statusInfo">
            <div className="statusName">{c.name.split(' ').pop()}</div>
            <div className="statusRole">{c.role.split(' ')[0]}</div>
          </div>
          <div 
            className="statusIndicator"
            style={{ 
              background: c.status === 'active' ? 'var(--good)' : 
                         c.status === 'busy' ? 'var(--warn)' : 'var(--muted)'
            }}
          />
        </Link>
      ))}
    </div>
  );
}
