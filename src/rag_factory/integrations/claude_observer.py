"""
ClaudeCodeObserver - Captures Claude Code's actions and stores them in Alex AI's RAG

This module enables Claude Code to log its decisions, implementations, and reasoning
to the Alex AI crew's shared knowledge base, creating a bidirectional learning system.
"""

from typing import Dict, Any, Optional, List, Literal
from datetime import datetime
import numpy as np
from ..memory.storage import MemoryStore
from .crew_mapper import CrewAnalogMapper


ActionType = Literal[
    "code_modification",
    "decision",
    "analysis",
    "bug_fix",
    "refactoring",
    "feature_implementation",
    "debugging",
    "optimization",
    "architecture_design",
    "security_fix"
]

Outcome = Literal["success", "failure", "partial", "pending"]


class ClaudeCodeAction:
    """Represents a single action taken by Claude Code"""

    def __init__(
        self,
        action_type: ActionType,
        summary: str,
        detailed_content: Dict[str, Any],
        reasoning: str,
        outcome: Outcome = "success",
        confidence: float = 1.0,
        files_affected: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
        alternatives_considered: Optional[List[str]] = None,
        user_request: Optional[str] = None
    ):
        self.action_type = action_type
        self.summary = summary
        self.detailed_content = detailed_content
        self.reasoning = reasoning
        self.outcome = outcome
        self.confidence = confidence
        self.files_affected = files_affected or []
        self.tags = tags or []
        self.alternatives_considered = alternatives_considered or []
        self.user_request = user_request
        self.timestamp = datetime.now().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        """Convert action to dictionary for storage"""
        return {
            'action_type': self.action_type,
            'summary': self.summary,
            'detailed_content': self.detailed_content,
            'reasoning': self.reasoning,
            'outcome': self.outcome,
            'confidence': self.confidence,
            'files_affected': self.files_affected,
            'tags': self.tags,
            'alternatives_considered': self.alternatives_considered,
            'user_request': self.user_request,
            'timestamp': self.timestamp
        }


class ClaudeCodeObserver:
    """
    Observes and logs Claude Code's actions to Alex AI's RAG system.

    This creates a bidirectional learning path where:
    - Claude Code's decisions inform the crew's future recommendations
    - The crew can reference Claude's past solutions
    - Both systems learn from successes and failures
    """

    def __init__(self, memory_store: Optional[MemoryStore] = None):
        self.memory_store = memory_store or MemoryStore()
        self.crew_mapper = CrewAnalogMapper()
        self.action_log = []

    def log_action(
        self,
        action: ClaudeCodeAction,
        vector: Optional[np.ndarray] = None
    ) -> str:
        """
        Log a Claude Code action to the RAG system.

        Args:
            action: The action to log
            vector: Optional pre-computed embedding vector

        Returns:
            memory_id: The ID of the stored memory
        """
        # Map action to crew member expertise
        crew_analog = self.crew_mapper.map_action_to_crew(action)
        relevant_specialties = self.crew_mapper.get_relevant_specialties(action)

        # Create unified memory entry
        memory_entry = {
            'source': 'claude_code',
            'agent_identity': 'claude_code',
            'crew_analog': crew_analog,
            'relevant_specialties': relevant_specialties,
            'content_type': action.action_type,
            'summary': action.summary,
            'detailed_content': action.detailed_content,
            'reasoning': action.reasoning,
            'outcome': action.outcome,
            'confidence': action.confidence,
            'alternatives_considered': action.alternatives_considered,
            'metadata': {
                'files_affected': action.files_affected,
                'tags': action.tags,
                'user_request': action.user_request,
                'crew_analog': crew_analog,
                'specialties': relevant_specialties
            },
            'timestamp': action.timestamp,
            'type': 'claude_action'
        }

        # Store in memory with optional vector
        memory_id = self.memory_store.store(memory_entry, vector)

        # Keep local log for session analysis
        self.action_log.append({
            'memory_id': memory_id,
            'action': action,
            'crew_analog': crew_analog
        })

        return memory_id

    def log_code_modification(
        self,
        files_modified: List[str],
        summary: str,
        reasoning: str,
        diff_summary: Optional[str] = None,
        outcome: Outcome = "success",
        user_request: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> str:
        """Convenience method for logging code modifications"""
        action = ClaudeCodeAction(
            action_type="code_modification",
            summary=summary,
            detailed_content={
                'files_modified': files_modified,
                'diff_summary': diff_summary
            },
            reasoning=reasoning,
            outcome=outcome,
            files_affected=files_modified,
            tags=tags or ['code_change'],
            user_request=user_request
        )
        return self.log_action(action)

    def log_decision(
        self,
        decision: str,
        reasoning: str,
        alternatives: List[str],
        context: Dict[str, Any],
        confidence: float = 0.8,
        user_request: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> str:
        """Convenience method for logging architectural/strategic decisions"""
        action = ClaudeCodeAction(
            action_type="decision",
            summary=decision,
            detailed_content=context,
            reasoning=reasoning,
            alternatives_considered=alternatives,
            confidence=confidence,
            tags=tags or ['decision'],
            user_request=user_request
        )
        return self.log_action(action)

    def log_bug_fix(
        self,
        bug_description: str,
        root_cause: str,
        solution: str,
        files_affected: List[str],
        outcome: Outcome = "success",
        user_request: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> str:
        """Convenience method for logging bug fixes"""
        action = ClaudeCodeAction(
            action_type="bug_fix",
            summary=f"Fixed: {bug_description}",
            detailed_content={
                'bug_description': bug_description,
                'root_cause': root_cause,
                'solution': solution
            },
            reasoning=f"Root cause: {root_cause}. Solution: {solution}",
            files_affected=files_affected,
            outcome=outcome,
            tags=(tags or []) + ['bug_fix', 'debugging'],
            user_request=user_request
        )
        return self.log_action(action)

    def log_analysis(
        self,
        topic: str,
        findings: Dict[str, Any],
        recommendations: List[str],
        confidence: float = 0.9,
        user_request: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> str:
        """Convenience method for logging code/system analysis"""
        action = ClaudeCodeAction(
            action_type="analysis",
            summary=f"Analysis: {topic}",
            detailed_content={
                'findings': findings,
                'recommendations': recommendations
            },
            reasoning="Comprehensive analysis of codebase/system",
            confidence=confidence,
            tags=(tags or []) + ['analysis'],
            user_request=user_request
        )
        return self.log_action(action)

    def get_session_summary(self) -> Dict[str, Any]:
        """Get a summary of all actions logged in this session"""
        return {
            'total_actions': len(self.action_log),
            'actions_by_type': self._count_by_type(),
            'actions_by_crew_analog': self._count_by_crew(),
            'outcome_distribution': self._count_by_outcome(),
            'recent_actions': [
                {
                    'memory_id': log['memory_id'],
                    'summary': log['action'].summary,
                    'crew_analog': log['crew_analog'],
                    'outcome': log['action'].outcome
                }
                for log in self.action_log[-10:]
            ]
        }

    def _count_by_type(self) -> Dict[str, int]:
        counts = {}
        for log in self.action_log:
            action_type = log['action'].action_type
            counts[action_type] = counts.get(action_type, 0) + 1
        return counts

    def _count_by_crew(self) -> Dict[str, int]:
        counts = {}
        for log in self.action_log:
            crew = log['crew_analog']
            counts[crew] = counts.get(crew, 0) + 1
        return counts

    def _count_by_outcome(self) -> Dict[str, int]:
        counts = {}
        for log in self.action_log:
            outcome = log['action'].outcome
            counts[outcome] = counts.get(outcome, 0) + 1
        return counts

    def search_past_actions(
        self,
        query_vector: np.ndarray,
        action_type: Optional[ActionType] = None,
        min_confidence: float = 0.0,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for similar past actions using vector similarity.

        Args:
            query_vector: Embedding vector for the query
            action_type: Optional filter by action type
            min_confidence: Minimum confidence threshold
            limit: Maximum number of results

        Returns:
            List of matching actions with metadata
        """
        results = self.memory_store.search_memories(query_vector, k=limit * 2)

        filtered_results = []
        for result in results:
            memory = result['memory']

            # Filter by source (only Claude Code actions)
            if memory.get('content', {}).get('source') != 'claude_code':
                continue

            # Filter by action type if specified
            if action_type and memory.get('content', {}).get('content_type') != action_type:
                continue

            # Filter by confidence
            if memory.get('content', {}).get('confidence', 0) < min_confidence:
                continue

            filtered_results.append({
                'memory_id': memory['id'],
                'summary': memory['content'].get('summary'),
                'reasoning': memory['content'].get('reasoning'),
                'outcome': memory['content'].get('outcome'),
                'confidence': memory['content'].get('confidence'),
                'crew_analog': memory['content'].get('crew_analog'),
                'timestamp': memory['timestamp'],
                'distance': result['distance']
            })

            if len(filtered_results) >= limit:
                break

        return filtered_results
