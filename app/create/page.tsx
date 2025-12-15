'use client';
import { useState } from 'react';

// Cyan theme for Create page (per Senior Staff Color Theory)
const theme = {
  accent: '#00c2ff',
  glow: 'rgba(0,194,255,.50)',
};

const cardStyle = (size: 'large' | 'medium' | 'small' = 'medium') => {
  const ellipseSizes = { large: '900px 450px', medium: '600px 350px', small: '400px 300px' };
  return {
    background: `linear-gradient(180deg, rgba(13,16,34,.88), rgba(11,15,29,.62)), radial-gradient(ellipse ${ellipseSizes[size]} at 0% 0%, ${theme.glow} 0%, transparent 60%)`,
    borderColor: `${theme.accent}50`,
  };
};

const templates = [
  { name: 'Creative Product Idea', body: (topic: string) => 
`Create a product concept for creative minds about: ${topic}
- Target user
- Core workflow (3 steps)
- What makes it delightful
- Monetization model
- What makes it defensible` },
  { name: 'RAG Feature Spec', body: (topic: string) =>
`Write a concise feature spec for a RAG-backed experience about: ${topic}
- User story
- Retrieval sources
- Quality metrics
- Diagnostics requirements (trace + citations)
- Governance/refresh requirements` },
  { name: 'Launch Plan', body: (topic: string) =>
`Draft a 30-day launch plan for: ${topic}
- MVP scope
- Metrics
- Risks & mitigations
- Outreach and packaging` },
];

export default function CreatePage() {
  const [topic, setTopic] = useState('a Next.js AI studio for DJs');
  const [tpl, setTpl] = useState(templates[0].name);
  const [draft, setDraft] = useState(templates[0].body('a Next.js AI studio for DJs'));
  const [saving, setSaving] = useState(false);

  function regenerate(nextTopic?: string, nextTpl?: string) {
    const t = templates.find(x => x.name === (nextTpl || tpl)) || templates[0];
    const top = nextTopic ?? topic;
    setDraft(t.body(top));
  }

  async function save() {
    setSaving(true);
    await fetch('/api/notes', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title: `${tpl}: ${topic}`, text: draft }) });
    setSaving(false);
    alert('Saved to user_notes.json (and becomes searchable by RAG).');
  }

  return (
    <div className="grid">
      <div className="card span-12" style={cardStyle('large')}>
        <h1 style={{ marginTop: 0, color: theme.accent }}>✨ Create</h1>
        <p className="small">
          This is a "self-learning" loop without risky autonomy: you generate structured artifacts, save them as notes,
          and they become part of future retrieval.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
          <input 
            value={topic} 
            onChange={e => setTopic(e.target.value)} 
            onBlur={() => regenerate()} 
            style={{
              flex: 1,
              minWidth: 260,
              padding: 12,
              borderRadius: 12,
              border: `1px solid ${theme.accent}40`,
              background: `${theme.accent}10`,
              color: 'var(--text)'
            }}
          />
          <select 
            value={tpl} 
            onChange={e => { setTpl(e.target.value); regenerate(topic, e.target.value); }} 
            style={{
              padding: 12,
              borderRadius: 12,
              border: `1px solid ${theme.accent}40`,
              background: `${theme.accent}10`,
              color: 'var(--text)'
            }}
          >
            {templates.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
          </select>
          <button 
            onClick={() => regenerate()} 
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              border: `1px solid ${theme.accent}50`,
              background: `${theme.accent}15`,
              color: theme.accent,
              fontWeight: 500
            }}
          >
            🔄 Regenerate
          </button>
          <button 
            onClick={save} 
            disabled={saving} 
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid rgba(40,217,154,.45)',
              background: 'rgba(40,217,154,.15)',
              color: 'var(--ok)',
              fontWeight: 600
            }}
          >
            {saving ? 'Saving…' : '💾 Save note'}
          </button>
        </div>
      </div>
      <div className="card span-12" style={cardStyle('large')}>
        <h2 style={{ marginTop: 0, color: theme.accent }}>📝 Draft</h2>
        <textarea 
          value={draft} 
          onChange={e => setDraft(e.target.value)} 
          style={{
            width: '100%',
            minHeight: 320,
            padding: 14,
            borderRadius: 12,
            border: `1px solid ${theme.accent}30`,
            background: `${theme.accent}08`,
            color: 'var(--text)',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New',
            lineHeight: 1.6
          }}
        />
      </div>
    </div>
  );
}
