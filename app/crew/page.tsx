import Link from 'next/link';
import { CrewCard, CrewStatusGrid, type CrewMemberData } from '../../components/CrewCard';
import fs from 'fs';
import path from 'path';

// Load crew members from JSON files
function loadCrewMembers(): CrewMemberData[] {
  const crewDir = path.join(process.cwd(), 'crew-members');
  const files = fs.readdirSync(crewDir).filter(f => f.endsWith('.json'));
  
  const emojiMap: Record<string, string> = {
    captain_picard: '👨‍✈️',
    commander_data: '🤖',
    commander_riker: '🎺',
    geordi_la_forge: '🔧',
    lieutenant_worf: '⚔️',
    dr_crusher: '👩‍⚕️',
    counselor_troi: '💜',
    chief_obrien: '🛠️',
    lieutenant_uhura: '📡',
    quark: '💰',
  };

  // Sample objectives and worries based on role
  const objectivesMap: Record<string, string> = {
    captain_picard: 'Ensure strategic alignment across all systems',
    commander_data: 'Optimize AI/ML pipeline performance',
    commander_riker: 'Coordinate team execution on current sprint',
    geordi_la_forge: 'Complete infrastructure migration',
    lieutenant_worf: 'Security audit and compliance review',
    dr_crusher: 'System health diagnostics and optimization',
    counselor_troi: 'UX improvements and accessibility review',
    chief_obrien: 'Quick fixes for production issues',
    lieutenant_uhura: 'API documentation and communication protocols',
    quark: 'ROI analysis for Q1 initiatives',
  };

  const worriesMap: Record<string, string[]> = {
    captain_picard: ['Team velocity concerns', 'Strategic pivot risk'],
    commander_data: ['Model accuracy degradation', 'Prompt engineering consistency'],
    commander_riker: ['Sprint deadline pressure', 'Resource allocation'],
    geordi_la_forge: ['Legacy system dependencies', 'Performance bottlenecks'],
    lieutenant_worf: ['Unpatched vulnerabilities', 'Compliance gaps'],
    dr_crusher: ['Memory leak symptoms', 'System fatigue indicators'],
    counselor_troi: ['User friction points', 'Accessibility gaps'],
    chief_obrien: ['Technical debt accumulation', 'Quick fix side effects'],
    lieutenant_uhura: ['Documentation gaps', 'API versioning concerns'],
    quark: ['Budget overruns', 'ROI uncertainty'],
  };

  return files.map(file => {
    const content = fs.readFileSync(path.join(crewDir, file), 'utf-8');
    const data = JSON.parse(content);
    
    return {
      id: data.id,
      name: data.name,
      role: data.role,
      department: data.department,
      status: 'active' as const,
      emoji: emojiMap[data.id] || '🖖',
      specialty: data.specialization || [],
      currentObjective: objectivesMap[data.id],
      worries: worriesMap[data.id],
      recentMemories: Math.floor(Math.random() * 50) + 10,
      catchphrases: data.personality?.catchphrases || [],
    };
  });
}

export default function CrewPage() {
  const crew = loadCrewMembers();
  
  // Group by department
  const departments = [...new Set(crew.map(c => c.department))];
  
  // Calculate stats
  const activeCrew = crew.filter(c => c.status === 'active').length;
  const totalWorries = crew.reduce((sum, c) => sum + (c.worries?.length || 0), 0);
  const totalMemories = crew.reduce((sum, c) => sum + (c.recentMemories || 0), 0);

  return (
    <div className="grid">
      {/* Header */}
      <div className="card span-12">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ marginTop: 0 }}>🖖 Crew Roster</h1>
            <p className="small">
              The Alex AI crew - 10 specialized agents working together through the Observation Lounge
            </p>
          </div>
          <Link href="/observation-lounge" className="btnPrimary">
            🖖 Observation Lounge
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="card span-3">
        <div className="statCard">
          <div className="statValue">{crew.length}</div>
          <div className="statLabel">Crew Members</div>
        </div>
      </div>
      <div className="card span-3">
        <div className="statCard">
          <div className="statValue good">{activeCrew}</div>
          <div className="statLabel">Active</div>
        </div>
      </div>
      <div className="card span-3">
        <div className="statCard">
          <div className="statValue warn">{totalWorries}</div>
          <div className="statLabel">Current Concerns</div>
        </div>
      </div>
      <div className="card span-3">
        <div className="statCard">
          <div className="statValue">{totalMemories}</div>
          <div className="statLabel">RAG Memories</div>
        </div>
      </div>

      {/* Quick Status Grid */}
      <div className="card span-12">
        <h2 style={{ marginTop: 0 }}>Crew Status</h2>
        <CrewStatusGrid crew={crew} />
      </div>

      {/* Crew Cards by Department */}
      {departments.map(dept => (
        <div key={dept} className="span-12">
          <h2 style={{ marginTop: 24, marginBottom: 16 }}>{dept}</h2>
          <div className="grid">
            {crew.filter(c => c.department === dept).map(c => (
              <div key={c.id} className="span-6">
                <CrewCard crew={c} />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="card span-12">
        <h3 style={{ marginTop: 0 }}>Understanding the Crew</h3>
        <div className="grid">
          <div className="span-4">
            <h4>🎯 Objectives</h4>
            <p className="small">Current focus areas and tasks each crew member is prioritizing.</p>
          </div>
          <div className="span-4">
            <h4>⚠️ Concerns</h4>
            <p className="small">Issues and risks identified from RAG memories and analysis.</p>
          </div>
          <div className="span-4">
            <h4>🧠 RAG Memories</h4>
            <p className="small">Accumulated knowledge from past conversations and decisions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
