"""
CrewAnalogMapper - Maps Claude Code actions to Alex AI crew member expertise

This module determines which crew member's specialty area best matches
a given action, enabling proper knowledge attribution and retrieval.
"""

from typing import Dict, List, Set, Any
from dataclasses import dataclass


@dataclass
class CrewMemberProfile:
    """Profile of a crew member's expertise"""
    id: str
    name: str
    specialties: List[str]
    keywords: Set[str]  # Keywords that indicate this crew member's domain


class CrewAnalogMapper:
    """
    Maps actions and topics to the most appropriate crew member(s).

    This enables:
    - Proper attribution of knowledge to expertise areas
    - Efficient retrieval by crew specialty
    - Cross-referencing between Claude and crew knowledge
    """

    def __init__(self):
        self.crew_profiles = self._initialize_crew_profiles()

    def _initialize_crew_profiles(self) -> Dict[str, CrewMemberProfile]:
        """Initialize crew member profiles with their expertise areas"""
        return {
            'captain_picard': CrewMemberProfile(
                id='captain_picard',
                name='Captain Jean-Luc Picard',
                specialties=['strategy', 'leadership', 'architecture', 'decisions', 'vision'],
                keywords={
                    'strategic', 'architecture', 'high-level', 'vision', 'leadership',
                    'decision', 'direction', 'planning', 'roadmap', 'philosophy',
                    'ethical', 'diplomatic', 'coordination', 'mission'
                }
            ),
            'commander_riker': CrewMemberProfile(
                id='commander_riker',
                name='Commander William Riker',
                specialties=['execution', 'coordination', 'tactics', 'management', 'workflow'],
                keywords={
                    'tactical', 'execution', 'coordination', 'workflow', 'management',
                    'implementation', 'action', 'team', 'orchestration', 'deployment',
                    'ci-cd', 'pipeline', 'automation', 'process'
                }
            ),
            'commander_data': CrewMemberProfile(
                id='commander_data',
                name='Commander Data',
                specialties=['ai', 'ml', 'analysis', 'algorithms', 'rag', 'llm', 'optimization'],
                keywords={
                    'ai', 'ml', 'machine-learning', 'algorithm', 'analysis', 'rag',
                    'llm', 'embedding', 'vector', 'optimization', 'data-structure',
                    'computational', 'mathematical', 'analytical', 'model', 'training',
                    'inference', 'prompt', 'nlp', 'faiss', 'similarity'
                }
            ),
            'geordi_la_forge': CrewMemberProfile(
                id='geordi_la_forge',
                name='Lt. Commander Geordi La Forge',
                specialties=['infrastructure', 'engineering', 'devops', 'performance', 'systems'],
                keywords={
                    'infrastructure', 'devops', 'docker', 'kubernetes', 'aws', 'cloud',
                    'terraform', 'cicd', 'deployment', 'performance', 'optimization',
                    'scaling', 'load-balancing', 'monitoring', 'logging', 'metrics',
                    'observability', 'reliability', 'sre', 'engineering', 'system-design'
                }
            ),
            'counselor_troi': CrewMemberProfile(
                id='counselor_troi',
                name='Counselor Deanna Troi',
                specialties=['ux', 'user-experience', 'accessibility', 'design', 'usability'],
                keywords={
                    'ux', 'ui', 'user-experience', 'accessibility', 'design', 'interface',
                    'usability', 'user-research', 'empathy', 'user-flow', 'interaction',
                    'visual', 'frontend', 'component', 'responsive', 'mobile', 'desktop',
                    'a11y', 'wcag', 'aria', 'user-centered'
                }
            ),
            'lieutenant_worf': CrewMemberProfile(
                id='lieutenant_worf',
                name='Lieutenant Worf',
                specialties=['security', 'authentication', 'testing', 'reliability', 'compliance'],
                keywords={
                    'security', 'authentication', 'authorization', 'auth', 'oauth',
                    'jwt', 'encryption', 'hashing', 'vulnerability', 'penetration-testing',
                    'compliance', 'gdpr', 'hipaa', 'testing', 'qa', 'validation',
                    'error-handling', 'reliability', 'defensive', 'audit', 'logging'
                }
            ),
            'chief_obrien': CrewMemberProfile(
                id='chief_obrien',
                name='Chief Miles O\'Brien',
                specialties=['implementation', 'debugging', 'maintenance', 'practical', 'hands-on'],
                keywords={
                    'implementation', 'debugging', 'bug-fix', 'troubleshooting', 'maintenance',
                    'practical', 'hands-on', 'fix', 'patch', 'workaround', 'refactoring',
                    'code-cleanup', 'technical-debt', 'legacy', 'integration', 'migration'
                }
            ),
            'quark': CrewMemberProfile(
                id='quark',
                name='Quark',
                specialties=['business', 'monetization', 'roi', 'cost-analysis', 'pricing'],
                keywords={
                    'business', 'monetization', 'revenue', 'pricing', 'cost', 'roi',
                    'profit', 'budget', 'financial', 'economic', 'market', 'value',
                    'investment', 'resource', 'optimization', 'efficiency', 'waste'
                }
            ),
            'dr_crusher': CrewMemberProfile(
                id='dr_crusher',
                name='Dr. Beverly Crusher',
                specialties=['health', 'diagnostics', 'performance', 'monitoring', 'prevention'],
                keywords={
                    'health', 'diagnostics', 'performance', 'monitoring', 'metrics',
                    'profiling', 'bottleneck', 'memory-leak', 'cpu', 'latency',
                    'throughput', 'optimization', 'prevention', 'maintenance', 'analysis'
                }
            ),
            'lieutenant_uhura': CrewMemberProfile(
                id='lieutenant_uhura',
                name='Lieutenant Uhura',
                specialties=['communication', 'api', 'integration', 'documentation', 'messaging'],
                keywords={
                    'api', 'rest', 'graphql', 'communication', 'integration', 'webhook',
                    'messaging', 'protocol', 'documentation', 'openapi', 'swagger',
                    'endpoint', 'request', 'response', 'serialization', 'json', 'xml'
                }
            )
        }

    def map_action_to_crew(self, action: Any) -> str:
        """
        Map an action to the most appropriate crew member.

        Args:
            action: A ClaudeCodeAction instance or dict with action details

        Returns:
            crew_member_id: The ID of the most appropriate crew member
        """
        # Extract action details
        if hasattr(action, 'to_dict'):
            action_dict = action.to_dict()
        else:
            action_dict = action

        action_type = action_dict.get('action_type', '')
        summary = action_dict.get('summary', '').lower()
        reasoning = action_dict.get('reasoning', '').lower()
        tags = [tag.lower() for tag in action_dict.get('tags', [])]

        # Combine all text for keyword matching
        combined_text = f"{action_type} {summary} {reasoning} {' '.join(tags)}"

        # Score each crew member
        scores = {}
        for crew_id, profile in self.crew_profiles.items():
            score = 0

            # Check keyword matches
            for keyword in profile.keywords:
                if keyword in combined_text:
                    score += 2

            # Check specialty matches
            for specialty in profile.specialties:
                if specialty in combined_text:
                    score += 3

            scores[crew_id] = score

        # Return crew member with highest score (default to Data for analysis)
        if max(scores.values()) == 0:
            return 'commander_data'

        return max(scores, key=scores.get)

    def get_relevant_specialties(self, action: Any) -> List[str]:
        """
        Get all relevant crew specialties for an action.

        Args:
            action: A ClaudeCodeAction instance or dict

        Returns:
            List of relevant specialty strings
        """
        crew_id = self.map_action_to_crew(action)
        profile = self.crew_profiles.get(crew_id)
        return profile.specialties if profile else []

    def map_topic_to_crew(self, topic: str) -> str:
        """
        Map a topic/query to the most appropriate crew member.

        Args:
            topic: Natural language topic or question

        Returns:
            crew_member_id: The ID of the most appropriate crew member
        """
        topic_lower = topic.lower()

        scores = {}
        for crew_id, profile in self.crew_profiles.items():
            score = sum(1 for keyword in profile.keywords if keyword in topic_lower)
            scores[crew_id] = score

        if max(scores.values()) == 0:
            return 'captain_picard'  # Default to strategic overview

        return max(scores, key=scores.get)

    def get_crew_for_specialties(self, specialties: List[str]) -> List[str]:
        """
        Get crew members who have expertise in given specialties.

        Args:
            specialties: List of specialty areas

        Returns:
            List of crew_member_ids with matching expertise
        """
        matching_crew = []
        specialties_lower = [s.lower() for s in specialties]

        for crew_id, profile in self.crew_profiles.items():
            profile_specialties = [s.lower() for s in profile.specialties]
            if any(spec in profile_specialties for spec in specialties_lower):
                matching_crew.append(crew_id)

        return matching_crew

    def get_all_crew_profiles(self) -> Dict[str, CrewMemberProfile]:
        """Get all crew member profiles"""
        return self.crew_profiles

    def get_crew_profile(self, crew_id: str) -> CrewMemberProfile:
        """Get a specific crew member's profile"""
        return self.crew_profiles.get(crew_id)
