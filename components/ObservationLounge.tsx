'use client';

import { useState } from 'react';
import type { CrewMemberData } from './CrewCard';

interface Discussion {
  id: string;
  topic: string;
  urgency: 'low' | 'normal' | 'high' | 'critical';
  attendees: string[];
  status: 'pending' | 'in_progress' | 'completed';
  contributions: {
    crewId: string;
    crewName: string;
    emoji: string;
    recommendation: string;
  }[];
  consensus?: string;
  actionItems: {
    task: string;
    assignee: string;
    priority: string;
  }[];
  timestamp: string;
}

interface ObservationLoungeProps {
  crew: CrewMemberData[];
  discussions?: Discussion[];
}

export function ObservationLounge({ crew, discussions = [] }: ObservationLoungeProps) {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedCrew, setSelectedCrew] = useState<string[]>([]);

  const urgencyColors = {
    low: 'var(--muted)',
    normal: 'var(--good)',
    high: 'var(--warn)',
    critical: 'var(--risk)',
  };

  return (
    <div className="observationLounge">
      <div className="loungeHeader">
        <div className="loungeTitle">
          <span className="loungeIcon">🖖</span>
          <h2>Observation Lounge</h2>
        </div>
        <p className="loungeSubtitle">
          Collaborative crew discussions for complex problem-solving
        </p>
      </div>

      <div className="loungeContent">
        <div className="loungeMain">
          {/* Convene New Discussion */}
          <div className="card conveneCard">
            <h3>Convene Discussion</h3>
            <div className="conveneForm">
              <input
                type="text"
                placeholder="Enter discussion topic..."
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="topicInput"
              />
              <div className="crewSelector">
                <div className="selectorLabel">Select Attendees:</div>
                <div className="crewCheckboxes">
                  {crew.map(c => (
                    <label key={c.id} className="crewCheckbox">
                      <input
                        type="checkbox"
                        checked={selectedCrew.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCrew([...selectedCrew, c.id]);
                          } else {
                            setSelectedCrew(selectedCrew.filter(id => id !== c.id));
                          }
                        }}
                      />
                      <span className="checkboxEmoji">{c.emoji}</span>
                      <span className="checkboxName">{c.name.split(' ').pop()}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button 
                className="btnPrimary conveneBtn"
                disabled={!selectedTopic || selectedCrew.length === 0}
              >
                🖖 Convene Senior Staff
              </button>
            </div>
          </div>

          {/* Active Discussions */}
          {discussions.length > 0 && (
            <div className="discussionsList">
              <h3>Recent Discussions</h3>
              {discussions.map(d => (
                <div key={d.id} className="discussionCard">
                  <div className="discussionHeader">
                    <div 
                      className="urgencyBadge"
                      style={{ 
                        background: `${urgencyColors[d.urgency]}20`,
                        color: urgencyColors[d.urgency]
                      }}
                    >
                      {d.urgency}
                    </div>
                    <div className="discussionTopic">{d.topic}</div>
                    <div className="discussionTime">
                      {new Date(d.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="discussionAttendees">
                    {d.attendees.map(id => {
                      const member = crew.find(c => c.id === id);
                      return member ? (
                        <span key={id} className="attendeeChip" title={member.name}>
                          {member.emoji}
                        </span>
                      ) : null;
                    })}
                  </div>

                  {d.contributions.length > 0 && (
                    <div className="contributions">
                      {d.contributions.slice(0, 3).map((c, i) => (
                        <div key={i} className="contribution">
                          <span className="contribEmoji">{c.emoji}</span>
                          <span className="contribText">{c.recommendation}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {d.consensus && (
                    <div className="consensus">
                      <div className="consensusLabel">✅ Consensus:</div>
                      <div className="consensusText">{d.consensus}</div>
                    </div>
                  )}

                  {d.actionItems.length > 0 && (
                    <div className="actionItems">
                      <div className="actionLabel">Action Items:</div>
                      {d.actionItems.map((a, i) => (
                        <div key={i} className="actionItem">
                          <span className="actionTask">{a.task}</span>
                          <span className="actionAssignee">→ {a.assignee}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Crew Status Sidebar */}
        <div className="loungeSidebar">
          <div className="card">
            <h4>Crew Status</h4>
            <div className="crewStatusList">
              {crew.map(c => (
                <div key={c.id} className="crewStatusRow">
                  <span className="statusEmoji">{c.emoji}</span>
                  <span className="statusName">{c.name.split(' ').pop()}</span>
                  <span 
                    className="statusDot"
                    style={{ 
                      background: c.status === 'active' ? 'var(--good)' : 
                                 c.status === 'busy' ? 'var(--warn)' : 'var(--muted)'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h4>Discussion Protocol</h4>
            <ol className="protocolList">
              <li>Captain chairs the meeting</li>
              <li>Topic experts speak first</li>
              <li>Each crew contributes expertise</li>
              <li>Counselor monitors dynamics</li>
              <li>Riker summarizes actions</li>
              <li>Captain makes final decision</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
