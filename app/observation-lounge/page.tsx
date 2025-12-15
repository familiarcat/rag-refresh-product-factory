import fs from 'fs';
import path from 'path';
import { ObservationLounge } from '../../components/ObservationLounge';
import type { CrewMemberData } from '../../components/CrewCard';

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

function loadCrewMembers(): CrewMemberData[] {
  const crewDir = path.join(process.cwd(), 'crew-members');
  const files = fs.readdirSync(crewDir).filter(f => f.endsWith('.json'));
  
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
      catchphrases: data.personality?.catchphrases || [],
    };
  });
}

// Sample discussions for demonstration
const sampleDiscussions = [
  {
    id: 'obs-1',
    topic: 'RAG Memory Optimization Strategy',
    urgency: 'high' as const,
    attendees: ['captain_picard', 'commander_data', 'geordi_la_forge', 'commander_riker'],
    status: 'completed' as const,
    contributions: [
      { crewId: 'commander_data', crewName: 'Commander Data', emoji: '🤖', recommendation: 'Implement vector indexing for 40% faster retrieval' },
      { crewId: 'geordi_la_forge', crewName: 'Geordi La Forge', emoji: '🔧', recommendation: 'Upgrade to pgvector 0.6.0 for HNSW support' },
      { crewId: 'commander_riker', crewName: 'Commander Riker', emoji: '🎺', recommendation: 'Allocate 2 sprint points for migration' },
    ],
    consensus: 'Proceed with vector optimization in Q1, allocate dedicated sprint',
    actionItems: [
      { task: 'Benchmark current RAG performance', assignee: 'Data', priority: 'high' },
      { task: 'Prepare migration plan', assignee: 'Geordi', priority: 'high' },
      { task: 'Schedule team sync', assignee: 'Riker', priority: 'normal' },
    ],
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'obs-2',
    topic: 'Security Audit for API Endpoints',
    urgency: 'critical' as const,
    attendees: ['captain_picard', 'lieutenant_worf', 'commander_data', 'geordi_la_forge'],
    status: 'in_progress' as const,
    contributions: [
      { crewId: 'lieutenant_worf', crewName: 'Lieutenant Worf', emoji: '⚔️', recommendation: 'Immediate rate limiting required on /api/ask endpoint' },
      { crewId: 'commander_data', crewName: 'Commander Data', emoji: '🤖', recommendation: 'Log analysis shows 23% increase in suspicious requests' },
    ],
    consensus: undefined,
    actionItems: [],
    timestamp: new Date().toISOString(),
  },
  {
    id: 'obs-3',
    topic: 'User Experience Improvements',
    urgency: 'normal' as const,
    attendees: ['counselor_troi', 'dr_crusher', 'lieutenant_uhura', 'captain_picard'],
    status: 'completed' as const,
    contributions: [
      { crewId: 'counselor_troi', crewName: 'Counselor Troi', emoji: '💜', recommendation: 'Users feel overwhelmed by crew selection - simplify UI' },
      { crewId: 'dr_crusher', crewName: 'Dr. Crusher', emoji: '👩‍⚕️', recommendation: 'Response times causing user frustration - optimize' },
      { crewId: 'lieutenant_uhura', crewName: 'Lt. Uhura', emoji: '📡', recommendation: 'Add clearer documentation for API usage' },
    ],
    consensus: 'Implement progressive disclosure for crew selection, add loading states',
    actionItems: [
      { task: 'Design simplified crew selector', assignee: 'Troi', priority: 'high' },
      { task: 'Add loading indicators', assignee: 'Geordi', priority: 'normal' },
    ],
    timestamp: new Date(Date.now() - 172800000).toISOString(),
  },
];

export default function ObservationLoungePage() {
  const crew = loadCrewMembers();

  return (
    <div>
      <ObservationLounge crew={crew} discussions={sampleDiscussions} />
    </div>
  );
}
