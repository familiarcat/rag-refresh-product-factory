# Unified Memory Schema - Alex AI & Claude Code Integration

## Overview

This document defines the unified memory schema that enables bidirectional learning between Alex AI crew members and Claude Code. The schema provides a common format for storing, retrieving, and cross-referencing knowledge from both systems.

## Core Memory Entry Structure

```python
class UnifiedMemoryEntry:
    """
    Unified memory format for both Alex AI crew and Claude Code

    This schema enables:
    - Cross-system knowledge sharing
    - Crew member attribution
    - Semantic search and retrieval
    - Outcome tracking and learning
    """

    # Identity
    id: str                    # Unique identifier (e.g., "mem_2025-12-19_1234")
    source: Literal[
        "alex_ai_crew",        # From Alex AI crew member
        "claude_code",         # From Claude Code
        "user_input",          # Direct user input
        "observation_lounge",  # Crew deliberation
        "collaborative"        # Joint Claude + Crew
    ]
    agent_identity: str        # "captain_picard", "claude_code", etc.
    timestamp: str             # ISO 8601 format

    # Crew Mapping
    crew_analog: str           # Which crew member's expertise this relates to
    relevant_specialties: List[str]  # ["security", "infrastructure", etc.]

    # Content
    content_type: Literal[
        "decision",            # Strategic/architectural decision
        "implementation",      # Code implementation
        "analysis",           # System/code analysis
        "bug_fix",            # Bug resolution
        "lesson",             # Lesson learned
        "warning",            # Warning/caveat
        "pattern",            # Reusable pattern
        "refactoring",        # Code refactoring
        "optimization",       # Performance optimization
        "security_fix",       # Security issue resolution
        "feature",            # New feature implementation
        "crew_input",         # Crew member contribution
        "claude_action"       # Claude Code action
    ]
    summary: str              # Brief description (1-2 sentences)
    detailed_content: dict    # Full context and details
    reasoning: str            # Why this approach was chosen

    # Learning Metadata
    outcome: Literal[
        "success",            # Worked as intended
        "failure",            # Did not work
        "partial",            # Partially successful
        "pending"             # Not yet determined
    ]
    confidence: float         # 0.0-1.0 confidence in this solution
    alternatives_considered: List[str]  # Other approaches considered

    # Relationships
    related_memories: List[str]  # IDs of related memories
    supersedes: Optional[str]    # ID of memory this obsoletes
    tags: List[str]              # Categorization tags

    # Vector Embedding
    embedding: np.ndarray     # 768-dim vector for semantic search

    # Metadata
    metadata: dict            # Additional context-specific data
```

## Memory Types by Source

### Alex AI Crew Memories

```python
{
    "source": "alex_ai_crew",
    "agent_identity": "commander_data",
    "crew_analog": "commander_data",
    "content_type": "analysis",
    "summary": "RAG system performance analysis and optimization recommendations",
    "detailed_content": {
        "analysis": "FAISS IndexFlatL2 currently performs well but...",
        "recommendations": [
            "Consider IndexIVFFlat for datasets > 10k vectors",
            "Implement PCA reduction for 384-dim embeddings"
        ],
        "metrics": {
            "current_latency": "45ms",
            "projected_latency": "12ms"
        }
    },
    "reasoning": "Based on profiling data and computational analysis...",
    "outcome": "pending",
    "confidence": 0.92,
    "relevant_specialties": ["ai", "ml", "optimization", "analysis"],
    "tags": ["rag", "performance", "faiss", "optimization"]
}
```

### Claude Code Memories

```python
{
    "source": "claude_code",
    "agent_identity": "claude_code",
    "crew_analog": "chief_obrien",  # Auto-mapped based on action
    "content_type": "bug_fix",
    "summary": "Fixed session token expiration causing auth loops",
    "detailed_content": {
        "bug_description": "Users experiencing infinite redirect loops",
        "root_cause": "Session TTL was 1 hour, refresh token check after 2 hours",
        "solution": "Extended session TTL to 24h, added refresh token rotation",
        "files_modified": [
            "src/auth/session.ts",
            "src/middleware/auth.ts"
        ]
    },
    "reasoning": "Mismatch between session lifetime and refresh check interval",
    "outcome": "success",
    "confidence": 1.0,
    "alternatives_considered": [
        "Reduce refresh check interval (rejected: too frequent)",
        "Remove session expiration (rejected: security risk)"
    ],
    "relevant_specialties": ["authentication", "debugging", "implementation"],
    "tags": ["bug_fix", "authentication", "session", "security"]
}
```

### Collaborative Memories

```python
{
    "source": "collaborative",
    "agent_identity": "claude_code_and_crew",
    "crew_analog": "multiple",
    "content_type": "decision",
    "summary": "Architecture decision: Microservices vs Monolith",
    "detailed_content": {
        "problem": "Determine architecture for new inventory system",
        "claude_analysis": "Current scale doesn't justify microservices complexity...",
        "picard_perspective": "Strategic flexibility matters more than initial architecture...",
        "data_perspective": "Computational overhead of distributed systems is 3.2x...",
        "quark_perspective": "Microservices would cost $12k/month vs $2k for monolith...",
        "final_decision": "Start with modular monolith, plan migration path"
    },
    "reasoning": "Collective analysis weighted current needs against future flexibility",
    "outcome": "success",
    "confidence": 0.85,
    "relevant_specialties": ["strategy", "architecture", "business", "analysis"],
    "tags": ["architecture", "decision", "collaborative", "monolith"]
}
```

## Database Tables (Supabase Schema)

### Table: `unified_memories`

```sql
CREATE TABLE unified_memories (
    -- Identity
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    agent_identity TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Crew Mapping
    crew_analog TEXT NOT NULL,
    relevant_specialties TEXT[] NOT NULL,

    -- Content
    content_type TEXT NOT NULL,
    summary TEXT NOT NULL,
    detailed_content JSONB NOT NULL,
    reasoning TEXT NOT NULL,

    -- Learning
    outcome TEXT NOT NULL,
    confidence FLOAT NOT NULL DEFAULT 1.0,
    alternatives_considered TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Relationships
    related_memories TEXT[] DEFAULT ARRAY[]::TEXT[],
    supersedes TEXT,
    tags TEXT[] NOT NULL,

    -- Vector (stored separately in vector table)
    embedding_id TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}'::JSONB,

    -- Indexes
    CONSTRAINT unified_memories_source_check CHECK (source IN (
        'alex_ai_crew', 'claude_code', 'user_input', 'observation_lounge', 'collaborative'
    )),
    CONSTRAINT unified_memories_outcome_check CHECK (outcome IN (
        'success', 'failure', 'partial', 'pending'
    ))
);

-- Indexes for performance
CREATE INDEX idx_memories_source ON unified_memories(source);
CREATE INDEX idx_memories_agent_identity ON unified_memories(agent_identity);
CREATE INDEX idx_memories_crew_analog ON unified_memories(crew_analog);
CREATE INDEX idx_memories_content_type ON unified_memories(content_type);
CREATE INDEX idx_memories_outcome ON unified_memories(outcome);
CREATE INDEX idx_memories_timestamp ON unified_memories(timestamp DESC);
CREATE INDEX idx_memories_tags ON unified_memories USING GIN(tags);
CREATE INDEX idx_memories_specialties ON unified_memories USING GIN(relevant_specialties);

-- Full-text search
CREATE INDEX idx_memories_summary_fts ON unified_memories USING GIN(to_tsvector('english', summary));
CREATE INDEX idx_memories_reasoning_fts ON unified_memories USING GIN(to_tsvector('english', reasoning));
```

### Table: `memory_embeddings`

```sql
CREATE TABLE memory_embeddings (
    id TEXT PRIMARY KEY,
    memory_id TEXT NOT NULL REFERENCES unified_memories(id) ON DELETE CASCADE,
    embedding vector(768) NOT NULL,  -- pgvector extension
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(memory_id)
);

-- Vector similarity index (HNSW for fast approximate search)
CREATE INDEX idx_embeddings_vector ON memory_embeddings
    USING hnsw (embedding vector_cosine_ops);
```

### Table: `memory_relationships`

```sql
CREATE TABLE memory_relationships (
    id SERIAL PRIMARY KEY,
    from_memory_id TEXT NOT NULL REFERENCES unified_memories(id) ON DELETE CASCADE,
    to_memory_id TEXT NOT NULL REFERENCES unified_memories(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL,  -- 'builds_on', 'conflicts_with', 'supersedes', 'relates_to'
    confidence FLOAT DEFAULT 1.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(from_memory_id, to_memory_id, relationship_type)
);

CREATE INDEX idx_relationships_from ON memory_relationships(from_memory_id);
CREATE INDEX idx_relationships_to ON memory_relationships(to_memory_id);
```

### Table: `crew_learning_stats`

```sql
CREATE TABLE crew_learning_stats (
    id SERIAL PRIMARY KEY,
    crew_member TEXT NOT NULL,
    learned_from_source TEXT NOT NULL,  -- 'claude_code', 'crew', 'collaborative'
    memory_id TEXT NOT NULL REFERENCES unified_memories(id),
    applied_at TIMESTAMPTZ,
    effectiveness_rating FLOAT,  -- User feedback on how helpful this knowledge was
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_learning_crew ON crew_learning_stats(crew_member);
CREATE INDEX idx_learning_source ON crew_learning_stats(learned_from_source);
```

## Query Patterns

### 1. Find Similar Past Solutions

```sql
SELECT
    um.*,
    1 - (me.embedding <=> $query_vector) AS similarity
FROM unified_memories um
JOIN memory_embeddings me ON um.id = me.memory_id
WHERE
    um.outcome = 'success'
    AND um.confidence > 0.7
    AND $crew_specialty = ANY(um.relevant_specialties)
ORDER BY me.embedding <=> $query_vector
LIMIT 5;
```

### 2. Get Claude's History for a Topic

```sql
SELECT *
FROM unified_memories
WHERE
    source = 'claude_code'
    AND tags && ARRAY['authentication', 'security']
    AND outcome IN ('success', 'partial')
ORDER BY timestamp DESC
LIMIT 10;
```

### 3. Find Collaborative Decisions

```sql
SELECT
    um.*,
    array_agg(DISTINCT mr.to_memory_id) AS related_memories
FROM unified_memories um
LEFT JOIN memory_relationships mr ON um.id = mr.from_memory_id
WHERE
    um.source = 'collaborative'
    AND um.content_type = 'decision'
GROUP BY um.id
ORDER BY um.timestamp DESC;
```

### 4. Track Crew Learning from Claude

```sql
SELECT
    crew_analog AS crew_member,
    COUNT(*) AS times_consulted,
    AVG(confidence) AS avg_confidence,
    COUNT(*) FILTER (WHERE outcome = 'success') AS successful_applications
FROM unified_memories
WHERE
    source = 'claude_code'
    AND timestamp > NOW() - INTERVAL '30 days'
GROUP BY crew_analog
ORDER BY times_consulted DESC;
```

## API Query Examples

### Python (FastAPI)

```python
# Query similar memories
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('sentence-transformers/all-mpnet-base-v2')
query_embedding = model.encode("How to handle authentication errors?")

results = await db.fetch("""
    SELECT um.*, 1 - (me.embedding <=> $1) AS similarity
    FROM unified_memories um
    JOIN memory_embeddings me ON um.id = me.memory_id
    WHERE um.relevant_specialties && $2
    ORDER BY me.embedding <=> $1
    LIMIT $3
""", query_embedding.tolist(), ["authentication", "security"], 5)
```

### JavaScript (MCP Server)

```javascript
// Query Claude's past actions
const result = await callRagAPI("/claude/query_history", "POST", {
    query: "authentication error handling",
    action_type: "bug_fix",
    limit: 5
});
```

## Migration Strategy

### Phase 1: Add New Fields to Existing Tables

```sql
ALTER TABLE memories ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'alex_ai_crew';
ALTER TABLE memories ADD COLUMN IF NOT EXISTS crew_analog TEXT;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS agent_identity TEXT;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS outcome TEXT DEFAULT 'success';
ALTER TABLE memories ADD COLUMN IF NOT EXISTS confidence FLOAT DEFAULT 1.0;
```

### Phase 2: Backfill Existing Data

```python
# Backfill crew memories with proper source and analog
for memory in existing_memories:
    crew_analog = map_content_to_crew(memory.content)
    memory.source = "alex_ai_crew"
    memory.agent_identity = memory.metadata.get('crew_member', 'unknown')
    memory.crew_analog = crew_analog
    memory.save()
```

### Phase 3: Create New Tables

Execute the SQL CREATE TABLE statements above.

### Phase 4: Data Validation

```sql
-- Ensure all memories have required fields
SELECT COUNT(*) FROM unified_memories WHERE crew_analog IS NULL;
SELECT COUNT(*) FROM unified_memories WHERE embedding_id IS NULL;

-- Check for orphaned embeddings
SELECT COUNT(*) FROM memory_embeddings me
LEFT JOIN unified_memories um ON me.memory_id = um.id
WHERE um.id IS NULL;
```

## Performance Considerations

1. **Vector Index**: Use HNSW for approximate nearest neighbor search (10-100x faster than exact search)
2. **Partitioning**: Partition by source and timestamp for large datasets
3. **Caching**: Cache frequently accessed memories in Redis
4. **Batch Operations**: Use bulk inserts for logging multiple actions
5. **Async Processing**: Generate embeddings asynchronously after initial save

## Security & Privacy

1. **Access Control**: Crew members can read all memories, only write to their own
2. **Audit Trail**: All memory modifications logged with timestamp and actor
3. **Sensitive Data**: Filter out credentials, PII before storing
4. **Retention**: Archive memories older than 1 year to cold storage

## Future Enhancements

1. **Knowledge Graph**: Build graph of memory relationships
2. **Temporal Queries**: "What did we know about X at time Y?"
3. **Confidence Decay**: Reduce confidence of old memories over time
4. **Conflict Resolution**: Automatic detection of contradictory memories
5. **Multi-modal**: Support image/diagram memories
6. **Federated Learning**: Share anonymized patterns across projects

---

**Document Version**: 1.0
**Last Updated**: 2025-12-19
**Owner**: Alex AI Integration Team
