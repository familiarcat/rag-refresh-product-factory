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

// Sample worries/concerns for each crew member (would come from RAG memory in production)
const worriesMap: Record<string, string[]> = {
  captain_picard: [
    'Balancing diplomatic approaches with tactical requirements',
    'Long-term crew morale during extended missions',
  ],
  commander_riker: [
    'Resource allocation across multiple concurrent projects',
    'Timeline pressures affecting quality standards',
  ],
  commander_data: [
    'RAG retrieval latency exceeding 200ms threshold',
    'Inconsistent vector similarity scores across document types',
    'Memory fragmentation in long-running processes',
  ],
  geordi_la_forge: [
    'Technical debt accumulating in infrastructure layer',
    'Dependency updates blocking critical features',
    'Load balancer configuration needs optimization',
  ],
  lieutenant_worf: [
    'API endpoints lacking proper rate limiting',
    'Authentication tokens expiring too frequently',
    'Incomplete audit logging coverage',
  ],
  dr_crusher: [
    'User onboarding friction causing drop-offs',
    'Error messages not providing actionable guidance',
  ],
  counselor_troi: [
    'Team burnout indicators increasing',
    'Communication gaps between frontend and backend teams',
    'User frustration with response times',
  ],
  chief_obrien: [
    'Database connection pooling needs tuning',
    'Deployment pipeline taking too long',
    'Monitoring alerts creating noise',
  ],
  lieutenant_uhura: [
    'API documentation out of sync with implementation',
    'Webhook reliability issues with external services',
  ],
  quark: [
    'Cost optimization opportunities being missed',
    'Revenue attribution unclear for new features',
  ],
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
      callName: data.callName || data.name.split(' ').pop() || data.name,
      role: data.role,
      department: data.department,
      division: data.division || 'Operations',
      uniformColor: data.uniformColor || 'gold',
      status: 'active' as const,
      emoji: emojiMap[data.id] || '🖖',
      specialty: data.specialization || [],
      worries: worriesMap[data.id] || [],
      catchphrases: data.personality?.catchphrases || [],
    };
  }).sort((a, b) => {
    // Sort by division for grouping
    const divisionOrder = ['Command', 'Operations', 'Sciences', 'Civilian'];
    return divisionOrder.indexOf(a.division || 'Operations') - divisionOrder.indexOf(b.division || 'Operations');
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
      { task: 'Prepare migration plan', assignee: 'La Forge', priority: 'high' },
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
      { task: 'Add loading indicators', assignee: 'La Forge', priority: 'normal' },
    ],
    timestamp: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'obs-4',
    topic: 'Universal Color Theory Implementation',
    urgency: 'normal' as const,
    attendees: ['commander_riker', 'counselor_troi', 'commander_data', 'chief_obrien'],
    status: 'completed' as const,
    contributions: [
      { crewId: 'commander_riker', crewName: 'Commander Riker', emoji: '🎺', recommendation: 'User journey should feel cohesive across all pages' },
      { crewId: 'counselor_troi', crewName: 'Counselor Troi', emoji: '💜', recommendation: 'Color affects engagement - apply semantic meaning' },
      { crewId: 'commander_data', crewName: 'Commander Data', emoji: '🤖', recommendation: 'Systematic page-category color mapping with CSS variables' },
      { crewId: 'chief_obrien', crewName: 'Chief O\'Brien', emoji: '🛠️', recommendation: 'Centralized theme utility for maintainability' },
    ],
    consensus: 'Implement division-based color theory across all pages with centralized pageTheme utility',
    actionItems: [
      { task: 'Create pageTheme.ts utility', assignee: 'O\'Brien', priority: 'high' },
      { task: 'Apply themes to all pages', assignee: 'Data', priority: 'high' },
      { task: 'Document color theory', assignee: 'Riker', priority: 'normal' },
    ],
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
];

export default function ObservationLoungePage() {
  const crew = loadCrewMembers();

  return <ObservationLounge crew={crew} discussions={sampleDiscussions} />;
}
