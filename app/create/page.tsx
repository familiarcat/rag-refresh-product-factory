'use client';
import { useState, useEffect, useMemo } from 'react';
import { categories } from '../../lib/categories';
import { templateForCategorySlug } from '../../lib/projectTemplates';

// Cyan theme for Create page (per Senior Staff Color Theory)
const theme = {
  accent: '#00c2ff',
  glow: 'rgba(0,194,255,.50)',
};

// Path-specific accents
const pathThemes = {
  conceptualize: { accent: '#a78bfa', glow: 'rgba(167,139,250,.50)', icon: '💡' }, // Purple - creative
  structured: { accent: '#00c2ff', glow: 'rgba(0,194,255,.50)', icon: '🏗️' },     // Cyan - technical
  rapid: { accent: '#f59e0b', glow: 'rgba(245,158,11,.50)', icon: '⚡' },          // Amber - speed
};

const cardStyle = (size: 'large' | 'medium' | 'small' = 'medium', accent = theme.accent, glow = theme.glow) => {
  const ellipseSizes = { large: '900px 450px', medium: '600px 350px', small: '400px 300px' };
  return {
    background: `linear-gradient(180deg, rgba(13,16,34,.88), rgba(11,15,29,.62)), radial-gradient(ellipse ${ellipseSizes[size]} at 0% 0%, ${glow} 0%, transparent 60%)`,
    borderColor: `${accent}50`,
  };
};

// Templates for conceptualize path
const conceptualizeTemplates = [
  { 
    name: 'Creative Product Idea', 
    description: 'Generate a full product concept with target users, workflows, and monetization',
    body: (topic: string) => 
`Create a product concept for creative minds about: ${topic}

## Target User
- Who is this for?
- What problem do they have?

## Core Workflow (3 steps)
1. 
2. 
3. 

## What makes it delightful
- 

## Monetization model
- 

## What makes it defensible
- 

---
💡 This prompt is optimized for vibe coding. Paste into your AI assistant to scaffold the project.` 
  },
  { 
    name: 'RAG Feature Spec', 
    description: 'Define a RAG-backed feature with retrieval sources and quality metrics',
    body: (topic: string) =>
`Write a concise feature spec for a RAG-backed experience about: ${topic}

## User Story
As a [user type], I want to [action] so that [benefit].

## Retrieval Sources
- 
- 

## Quality Metrics
- Relevance score threshold:
- Citation accuracy:
- Response latency:

## Diagnostics Requirements
- Trace visibility:
- Citation display:

## Governance/Refresh Requirements
- Update frequency:
- Audit trail:

---
💡 This prompt is optimized for vibe coding. Paste into your AI assistant to implement the feature.` 
  },
  { 
    name: 'Launch Plan', 
    description: 'Create a 30-day launch strategy with scope, metrics, and outreach',
    body: (topic: string) =>
`Draft a 30-day launch plan for: ${topic}

## MVP Scope (Week 1-2)
- Core features:
- Out of scope:

## Success Metrics
- Primary KPI:
- Secondary metrics:

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
|      |            |        |            |

## Outreach Strategy (Week 3-4)
- Channels:
- Messaging:
- Launch assets:

---
💡 This prompt is optimized for vibe coding. Share with your team or AI assistant.` 
  },
  {
    name: 'Vibe Code Scaffold',
    description: 'Generate a complete project scaffold prompt for AI coding assistants',
    body: (topic: string) =>
`Create a complete project scaffold for: ${topic}

## Project Overview
- Name:
- Purpose:
- Tech stack: Next.js 14, TypeScript, Tailwind CSS

## Directory Structure
\`\`\`
/app
  /api
  /components
  /lib
\`\`\`

## Core Components Needed
1. 
2. 
3. 

## Data Models
- 

## API Routes
- 

## Styling Guidelines
- Dark theme with accent colors
- Glassmorphism cards
- Responsive grid layout

---
💡 Paste this entire prompt into Cursor, Copilot, or Claude to scaffold your project.`
  }
];

type CreationPath = 'select' | 'conceptualize' | 'structured' | 'rapid';

export default function CreatePage() {
  const [path, setPath] = useState<CreationPath>('select');
  
  // Conceptualize state
  const [topic, setTopic] = useState('a Next.js AI studio for DJs');
  const [tpl, setTpl] = useState(conceptualizeTemplates[0].name);
  const [draft, setDraft] = useState(conceptualizeTemplates[0].body('a Next.js AI studio for DJs'));
  
  // Structured state
  const [category, setCategory] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [projectDraft, setProjectDraft] = useState<string>('');
  
  const [saving, setSaving] = useState(false);

  // Update conceptualize draft when template or topic changes
  function regenerateConceptualize(nextTopic?: string, nextTpl?: string) {
    const t = conceptualizeTemplates.find(x => x.name === (nextTpl || tpl)) || conceptualizeTemplates[0];
    const top = nextTopic ?? topic;
    setDraft(t.body(top));
  }

  // Structured project template
  const tmpl = useMemo(() => templateForCategorySlug(category || undefined), [category]);

  useEffect(() => {
    if (path === 'structured') {
      setProjectName(tmpl.title);
      const body = [
        `# ${tmpl.title}`,
        ``,
        `**Category:** ${category || 'none selected'}`,
        `**Summary:** ${tmpl.summary}`,
        ``,
        `## Sections`,
        ...tmpl.sections.map(s => `- ${s}`),
        ``,
        `## Notes`,
        `- `,
      ].join('\n');
      setProjectDraft(body);
    }
  }, [tmpl, category, path]);

  async function saveNote() {
    setSaving(true);
    await fetch('/api/notes', { 
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify({ title: `${tpl}: ${topic}`, text: draft }) 
    });
    setSaving(false);
    alert('Saved to user_notes.json (and becomes searchable by RAG).');
  }

  async function createProject() {
    setSaving(true);
    const res = await fetch('/api/projects/create', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ category, name: projectName, draft: projectDraft })
    });
    const j = await res.json();
    setSaving(false);
    if (!j.ok) alert('Project creation failed: ' + (j.error || 'unknown'));
    else alert('Project created (or queued via n8n). Check diagnostics + your filesystem target.');
  }

  // Path selection screen
  if (path === 'select') {
    return (
      <div className="grid">
        <div className="card span-12" style={cardStyle('large')}>
          <h1 style={{ marginTop: 0, color: theme.accent }}>🚀 Create New Project</h1>
          <p style={{ fontSize: 16, color: 'var(--muted)', maxWidth: 700 }}>
            Choose your creation path. Each approach is designed for different workflows and preferences.
            <span style={{ display: 'block', marginTop: 8, fontSize: 13, opacity: 0.7 }}>
              💭 <em>"Understanding your creative process helps us serve you better." — Counselor Troi</em>
            </span>
          </p>
        </div>

        {/* Path Selection Cards */}
        <div 
          className="card span-4" 
          style={{ 
            ...cardStyle('medium', pathThemes.conceptualize.accent, pathThemes.conceptualize.glow),
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onClick={() => setPath('conceptualize')}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>💡</div>
          <h2 style={{ marginTop: 0, color: pathThemes.conceptualize.accent }}>Conceptualize</h2>
          <p className="small" style={{ color: 'var(--muted)' }}>
            <strong>Best for:</strong> Ideation, vibe coding, creative exploration
          </p>
          <p className="small">
            Generate structured prompts optimized for AI coding assistants. 
            Perfect when you have an idea but need to articulate it.
          </p>
          <div style={{ 
            marginTop: 16, 
            padding: '8px 12px', 
            background: `${pathThemes.conceptualize.accent}20`,
            borderRadius: 8,
            fontSize: 12,
            color: pathThemes.conceptualize.accent
          }}>
            ✨ 4 prompt templates available
          </div>
        </div>

        <div 
          className="card span-4" 
          style={{ 
            ...cardStyle('medium', pathThemes.structured.accent, pathThemes.structured.glow),
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onClick={() => setPath('structured')}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏗️</div>
          <h2 style={{ marginTop: 0, color: pathThemes.structured.accent }}>Structured</h2>
          <p className="small" style={{ color: 'var(--muted)' }}>
            <strong>Best for:</strong> Category-based projects, n8n workflows
          </p>
          <p className="small">
            Select a category to get a templated project brief. 
            Triggers your n8n crew to scaffold a complete project repo.
          </p>
          <div style={{ 
            marginTop: 16, 
            padding: '8px 12px', 
            background: `${pathThemes.structured.accent}20`,
            borderRadius: 8,
            fontSize: 12,
            color: pathThemes.structured.accent
          }}>
            🔧 {categories.length} categories • n8n integration
          </div>
        </div>

        <div 
          className="card span-4" 
          style={{ 
            ...cardStyle('medium', pathThemes.rapid.accent, pathThemes.rapid.glow),
            cursor: 'pointer',
            transition: 'all 0.2s',
            opacity: 0.6,
          }}
          title="Coming soon"
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
          <h2 style={{ marginTop: 0, color: pathThemes.rapid.accent }}>Rapid Prototype</h2>
          <p className="small" style={{ color: 'var(--muted)' }}>
            <strong>Best for:</strong> Quick experiments, MVPs
          </p>
          <p className="small">
            One-click project generation with sensible defaults. 
            Get a working prototype in minutes.
          </p>
          <div style={{ 
            marginTop: 16, 
            padding: '8px 12px', 
            background: `${pathThemes.rapid.accent}20`,
            borderRadius: 8,
            fontSize: 12,
            color: pathThemes.rapid.accent
          }}>
            🔜 Coming soon
          </div>
        </div>

        {/* Troi's Insight */}
        <div className="card span-12" style={{ ...cardStyle('small'), marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ fontSize: 32 }}>🧠</div>
            <div>
              <h3 style={{ margin: 0, color: theme.accent }}>Troi&apos;s UX Insight</h3>
              <p className="small" style={{ margin: '8px 0 0', color: 'var(--muted)' }}>
                Research shows that <strong>choice architecture</strong> significantly impacts creative outcomes. 
                Users who consciously select their workflow path report 40% higher satisfaction with their results.
                The act of choosing creates psychological commitment to the process.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Conceptualize Path
  if (path === 'conceptualize') {
    const currentTheme = pathThemes.conceptualize;
    return (
      <div className="grid">
        <div className="card span-12" style={cardStyle('large', currentTheme.accent, currentTheme.glow)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <button 
                onClick={() => setPath('select')} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: currentTheme.accent, 
                  cursor: 'pointer',
                  fontSize: 14,
                  marginBottom: 8,
                  padding: 0,
                }}
              >
                ← Back to paths
              </button>
              <h1 style={{ marginTop: 0, color: currentTheme.accent }}>💡 Conceptualize</h1>
            </div>
            <div style={{ 
              padding: '8px 16px', 
              background: `${currentTheme.accent}15`, 
              borderRadius: 20,
              border: `1px solid ${currentTheme.accent}40`,
              fontSize: 13,
              color: currentTheme.accent
            }}>
              Vibe Coding Mode
            </div>
          </div>
          <p className="small">
            Transform your ideas into structured prompts optimized for AI coding assistants.
            These become part of your RAG knowledge base for future retrieval.
          </p>
          
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <input 
              value={topic} 
              onChange={e => setTopic(e.target.value)} 
              onBlur={() => regenerateConceptualize()} 
              placeholder="Describe your project idea..."
              style={{
                flex: 1,
                minWidth: 260,
                padding: 12,
                borderRadius: 12,
                border: `1px solid ${currentTheme.accent}40`,
                background: `${currentTheme.accent}10`,
                color: 'var(--text)'
              }}
            />
            <select 
              value={tpl} 
              onChange={e => { setTpl(e.target.value); regenerateConceptualize(topic, e.target.value); }} 
              style={{
                padding: 12,
                borderRadius: 12,
                border: `1px solid ${currentTheme.accent}40`,
                background: `${currentTheme.accent}10`,
                color: 'var(--text)'
              }}
            >
              {conceptualizeTemplates.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
            </select>
            <button 
              onClick={() => regenerateConceptualize()} 
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                border: `1px solid ${currentTheme.accent}50`,
                background: `${currentTheme.accent}15`,
                color: currentTheme.accent,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              🔄 Regenerate
            </button>
          </div>
        </div>

        {/* Template Pills */}
        <div className="card span-12" style={cardStyle('small', currentTheme.accent, currentTheme.glow)}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {conceptualizeTemplates.map(t => (
              <button
                key={t.name}
                onClick={() => { setTpl(t.name); regenerateConceptualize(topic, t.name); }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 20,
                  border: `1px solid ${tpl === t.name ? currentTheme.accent : 'rgba(255,255,255,.15)'}`,
                  background: tpl === t.name ? `${currentTheme.accent}25` : 'rgba(255,255,255,.05)',
                  color: tpl === t.name ? currentTheme.accent : 'var(--muted)',
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
          <p className="small" style={{ margin: '12px 0 0', color: 'var(--muted)' }}>
            {conceptualizeTemplates.find(t => t.name === tpl)?.description}
          </p>
        </div>

        <div className="card span-12" style={cardStyle('large', currentTheme.accent, currentTheme.glow)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ marginTop: 0, color: currentTheme.accent }}>📝 Generated Prompt</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={() => navigator.clipboard.writeText(draft)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: `1px solid ${currentTheme.accent}40`,
                  background: `${currentTheme.accent}10`,
                  color: currentTheme.accent,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                📋 Copy
              </button>
              <button 
                onClick={saveNote} 
                disabled={saving} 
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(40,217,154,.45)',
                  background: 'rgba(40,217,154,.15)',
                  color: 'var(--ok)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                {saving ? 'Saving…' : '💾 Save to RAG'}
              </button>
            </div>
          </div>
          <textarea 
            value={draft} 
            onChange={e => setDraft(e.target.value)} 
            style={{
              width: '100%',
              minHeight: 400,
              padding: 16,
              borderRadius: 12,
              border: `1px solid ${currentTheme.accent}30`,
              background: `${currentTheme.accent}08`,
              color: 'var(--text)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New',
              lineHeight: 1.7,
              fontSize: 14
            }}
          />
        </div>
      </div>
    );
  }

  // Structured Path
  if (path === 'structured') {
    const currentTheme = pathThemes.structured;
    return (
      <div className="grid">
        <div className="card span-12" style={cardStyle('large', currentTheme.accent, currentTheme.glow)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <button 
                onClick={() => setPath('select')} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: currentTheme.accent, 
                  cursor: 'pointer',
                  fontSize: 14,
                  marginBottom: 8,
                  padding: 0,
                }}
              >
                ← Back to paths
              </button>
              <h1 style={{ marginTop: 0, color: currentTheme.accent }}>🏗️ Structured Project</h1>
            </div>
            <div style={{ 
              padding: '8px 16px', 
              background: `${currentTheme.accent}15`, 
              borderRadius: 20,
              border: `1px solid ${currentTheme.accent}40`,
              fontSize: 13,
              color: currentTheme.accent
            }}>
              n8n Integration
            </div>
          </div>
          <p className="small">
            Pick a category → get a templated project brief → trigger your n8n &quot;crew&quot; to scaffold a new project repo.
          </p>
          
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label className="small" style={{ fontWeight: 600, color: currentTheme.accent }}>Category</label>
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)} 
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: `1px solid ${currentTheme.accent}40`,
                  background: `${currentTheme.accent}10`,
                  color: 'var(--text)',
                  minWidth: 200
                }}
              >
                <option value="">(select category)</option>
                {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
              <label className="small" style={{ fontWeight: 600, color: currentTheme.accent }}>Project Name</label>
              <input 
                value={projectName} 
                onChange={e => setProjectName(e.target.value)} 
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: `1px solid ${currentTheme.accent}40`,
                  background: `${currentTheme.accent}10`,
                  color: 'var(--text)',
                  minWidth: 260
                }}
              />
            </div>

            <button 
              className="btnPrimary" 
              onClick={createProject} 
              disabled={saving}
              style={{
                padding: '12px 20px',
                borderRadius: 12,
                border: `1px solid ${currentTheme.accent}`,
                background: currentTheme.accent,
                color: '#0d1022',
                fontWeight: 600,
                cursor: 'pointer',
                alignSelf: 'flex-end'
              }}
            >
              {saving ? 'Creating…' : '🚀 Create Project'}
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="card span-12" style={cardStyle('small', currentTheme.accent, currentTheme.glow)}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {categories.slice(0, 8).map(c => (
              <button
                key={c.slug}
                onClick={() => setCategory(c.slug)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 20,
                  border: `1px solid ${category === c.slug ? currentTheme.accent : 'rgba(255,255,255,.15)'}`,
                  background: category === c.slug ? `${currentTheme.accent}25` : 'rgba(255,255,255,.05)',
                  color: category === c.slug ? currentTheme.accent : 'var(--muted)',
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {c.name}
              </button>
            ))}
            {categories.length > 8 && (
              <span style={{ padding: '8px 14px', fontSize: 13, color: 'var(--muted)' }}>
                +{categories.length - 8} more
              </span>
            )}
          </div>
        </div>

        <div className="card span-12" style={cardStyle('large', currentTheme.accent, currentTheme.glow)}>
          <h2 style={{ marginTop: 0, color: currentTheme.accent }}>📝 Generated Brief (editable)</h2>
          <textarea 
            value={projectDraft} 
            onChange={e => setProjectDraft(e.target.value)} 
            style={{
              width: '100%',
              minHeight: 360,
              padding: 16,
              borderRadius: 12,
              border: `1px solid ${currentTheme.accent}30`,
              background: `${currentTheme.accent}08`,
              color: 'var(--text)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New',
              lineHeight: 1.7,
              fontSize: 14
            }}
          />
        </div>

        <div className="card span-12" style={cardStyle('small', currentTheme.accent, currentTheme.glow)}>
          <p className="small" style={{ margin: 0, color: 'var(--muted)' }}>
            <strong>🔐 Secure credentials note:</strong> This app does <u>not</u> read <code>~/.zshrc</code>. 
            Export secrets in your shell and run <code>npm run dev</code> so Next.js receives them via <code>process.env</code>, 
            or copy them into <code>.env.local</code> (not committed).
          </p>
        </div>
      </div>
    );
  }

  return null;
}
