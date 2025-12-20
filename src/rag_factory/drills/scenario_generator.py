"""Scenario generator for crew drill system

Generates and loads test scenarios from multiple sources:
- Synthetic scenarios based on crew specializations
- Real-world scenarios from historical crew_memories
- Benchmark scenarios from database
"""

import os
import json
import random
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging

from .models import DrillScenario, ScenarioType, ComplexityLevel

logger = logging.getLogger(__name__)


class ScenarioGenerator:
    """Generates test scenarios for crew drills"""

    def __init__(self, supabase_client=None, crew_members_dir: str = None):
        """
        Initialize scenario generator

        Args:
            supabase_client: Supabase client for database access
            crew_members_dir: Path to crew member JSON configs
        """
        self.db = supabase_client

        if crew_members_dir is None:
            # Default to project crew-members directory
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
            crew_members_dir = os.path.join(project_root, "crew-members")

        self.crew_members_dir = crew_members_dir
        self.crew_specializations = self._load_crew_specializations()

    def _load_crew_specializations(self) -> Dict[str, List[str]]:
        """Load crew member specializations from JSON configs"""
        specializations = {}

        if not os.path.exists(self.crew_members_dir):
            logger.warning(f"Crew members directory not found: {self.crew_members_dir}")
            return self._get_default_specializations()

        try:
            for filename in os.listdir(self.crew_members_dir):
                if not filename.endswith('.json'):
                    continue

                filepath = os.path.join(self.crew_members_dir, filename)
                with open(filepath, 'r') as f:
                    crew_data = json.load(f)
                    crew_id = crew_data.get('id')
                    specs = crew_data.get('specialization', [])

                    if crew_id and specs:
                        # Convert to lowercase for matching
                        specializations[crew_id] = [s.lower() for s in specs]

            logger.info(f"Loaded specializations for {len(specializations)} crew members")
            return specializations

        except Exception as e:
            logger.error(f"Error loading crew specializations: {e}")
            return self._get_default_specializations()

    def _get_default_specializations(self) -> Dict[str, List[str]]:
        """Fallback default specializations"""
        return {
            'captain_picard': ['strategic leadership', 'mission planning', 'decision making'],
            'commander_riker': ['tactical', 'execution', 'coordination'],
            'commander_data': ['ai_ml', 'analytics', 'algorithms'],
            'geordi_la_forge': ['infrastructure', 'devops', 'cloud'],
            'counselor_troi': ['ux', 'accessibility', 'design'],
            'lieutenant_worf': ['security', 'testing', 'reliability'],
            'chief_obrien': ['implementation', 'debugging', 'coding'],
            'quark': ['business', 'roi', 'cost'],
            'dr_crusher': ['performance', 'diagnostics', 'health'],
            'lieutenant_uhura': ['apis', 'integration', 'documentation']
        }

    def generate_synthetic_scenarios(
        self,
        count: int = 15,
        diversity_weight: float = 0.7
    ) -> List[DrillScenario]:
        """
        Generate synthetic scenarios based on crew specializations

        Args:
            count: Number of scenarios to generate
            diversity_weight: Weight for diversity vs. common patterns (0-1)

        Returns:
            List of generated scenarios
        """
        scenarios = []

        # Scenario templates by complexity
        templates = {
            ComplexityLevel.CRITICAL: [
                {
                    'category': 'architecture',
                    'title_template': 'Design {system} architecture for {scale}',
                    'desc_template': 'Strategic architectural decision requiring {expertise}.',
                    'systems': ['microservices', 'event-driven', 'distributed', 'serverless'],
                    'scales': ['global scale', 'high availability', 'multi-region deployment'],
                    'min_crew': 4, 'max_crew': 7
                },
                {
                    'category': 'security',
                    'title_template': 'Respond to {incident} security incident',
                    'desc_template': 'Critical security issue requiring immediate {action}.',
                    'incidents': ['data breach', 'unauthorized access', 'DDoS attack', 'ransomware'],
                    'actions': ['containment and investigation', 'incident response', 'recovery planning'],
                    'min_crew': 3, 'max_crew': 6
                }
            ],
            ComplexityLevel.IMPORTANT: [
                {
                    'category': 'feature',
                    'title_template': 'Implement {feature} feature',
                    'desc_template': 'Build {feature} with {requirements}.',
                    'features': ['real-time collaboration', 'payment processing', 'video streaming', 'search'],
                    'requirements': ['scalability requirements', 'high performance', 'excellent UX'],
                    'min_crew': 3, 'max_crew': 5
                },
                {
                    'category': 'performance',
                    'title_template': 'Optimize {component} performance',
                    'desc_template': 'Improve {component} to meet {target} performance targets.',
                    'components': ['database queries', 'API latency', 'page load time', 'background jobs'],
                    'targets': ['sub-100ms', 'sub-second', '10x throughput'],
                    'min_crew': 2, 'max_crew': 4
                }
            ],
            ComplexityLevel.ROUTINE: [
                {
                    'category': 'bug_fix',
                    'title_template': 'Fix {bug} bug in {module}',
                    'desc_template': 'Debug and fix {bug} affecting {impact}.',
                    'bugs': ['validation', 'authentication', 'calculation', 'rendering'],
                    'modules': ['user signup', 'checkout flow', 'dashboard', 'settings'],
                    'impacts': ['user experience', 'data accuracy', '10% of users'],
                    'min_crew': 1, 'max_crew': 3
                },
                {
                    'category': 'implementation',
                    'title_template': 'Add {feature} to {component}',
                    'desc_template': 'Implement {feature} for {component}.',
                    'features': ['pagination', 'filtering', 'export', 'notifications'],
                    'components': ['API endpoint', 'admin panel', 'user dashboard', 'reports'],
                    'min_crew': 2, 'max_crew': 3
                }
            ],
            ComplexityLevel.TRIVIAL: [
                {
                    'category': 'documentation',
                    'title_template': 'Update {doc_type} documentation',
                    'desc_template': 'Add documentation for {topic}.',
                    'doc_types': ['API', 'README', 'deployment', 'configuration'],
                    'topics': ['new features', 'environment variables', 'setup instructions'],
                    'min_crew': 1, 'max_crew': 2
                },
                {
                    'category': 'formatting',
                    'title_template': 'Fix {issue} in {module}',
                    'desc_template': 'Apply {fix} to {module}.',
                    'issues': ['code formatting', 'linting errors', 'style guide violations'],
                    'modules': ['authentication module', 'API handlers', 'util functions'],
                    'fixes': ['prettier formatting', 'ESLint rules', 'style fixes'],
                    'min_crew': 1, 'max_crew': 2
                }
            ]
        }

        # Distribute scenarios across complexity levels
        complexity_distribution = {
            ComplexityLevel.CRITICAL: max(2, int(count * 0.15)),
            ComplexityLevel.IMPORTANT: max(4, int(count * 0.35)),
            ComplexityLevel.ROUTINE: max(5, int(count * 0.35)),
            ComplexityLevel.TRIVIAL: max(2, int(count * 0.15))
        }

        scenario_id = 0
        for complexity, template_count in complexity_distribution.items():
            template_list = templates[complexity]

            for _ in range(template_count):
                template = random.choice(template_list)
                scenario = self._generate_from_template(template, complexity, scenario_id)
                scenarios.append(scenario)
                scenario_id += 1

        logger.info(f"Generated {len(scenarios)} synthetic scenarios")
        return scenarios[:count]

    def _generate_from_template(
        self,
        template: Dict[str, Any],
        complexity: ComplexityLevel,
        scenario_id: int
    ) -> DrillScenario:
        """Generate a scenario from a template"""

        # Fill template with random choices
        title = template['title_template']
        description = template['desc_template']

        for key, values in template.items():
            if key.endswith('_template') or key in ['category', 'min_crew', 'max_crew']:
                continue

            if isinstance(values, list):
                chosen = random.choice(values)
                placeholder = f"{{{key[:-1]}}}"  # Remove 's' from plural
                title = title.replace(placeholder, chosen)
                description = description.replace(placeholder, chosen)

        # Determine required expertise based on category
        expertise = self._get_expertise_for_category(template['category'])

        # Build user request
        user_request = f"{title}. {description}"

        # Success criteria
        success_criteria = {
            'required_crew_min': template.get('min_crew', 1),
            'required_crew_max': template.get('max_crew', 3),
            'expected_expertise': expertise,
            'complexity': complexity.value
        }

        return DrillScenario(
            id=f"synthetic_{scenario_id}_{int(datetime.now().timestamp())}",
            scenario_type=ScenarioType.SYNTHETIC,
            category=template['category'],
            complexity_level=complexity,
            title=title,
            description=description,
            user_request=user_request,
            expected_expertise=expertise,
            success_criteria=success_criteria,
            tags=['synthetic', template['category'], complexity.value],
            created_at=datetime.now()
        )

    def _get_expertise_for_category(self, category: str) -> List[str]:
        """Map category to required expertise"""
        category_expertise_map = {
            'architecture': ['strategy', 'architecture', 'infrastructure'],
            'security': ['security', 'testing', 'reliability'],
            'feature': ['implementation', 'coding', 'ux'],
            'performance': ['performance', 'diagnostics', 'optimization'],
            'bug_fix': ['debugging', 'implementation', 'testing'],
            'implementation': ['implementation', 'coding'],
            'documentation': ['documentation', 'communication'],
            'formatting': ['implementation', 'coding'],
            'integration': ['apis', 'integration'],
            'ai_ml': ['ai_ml', 'analytics', 'algorithms']
        }

        return category_expertise_map.get(category, ['implementation', 'coordination'])

    def generate_from_crew_history(
        self,
        lookback_days: int = 30,
        limit: int = 10
    ) -> List[DrillScenario]:
        """
        Generate scenarios from historical crew_memories

        Args:
            lookback_days: How many days back to look
            limit: Maximum scenarios to generate

        Returns:
            List of scenarios based on real crew history
        """
        if not self.db:
            logger.warning("No Supabase client provided, skipping history-based scenarios")
            return []

        try:
            cutoff_date = datetime.now() - timedelta(days=lookback_days)

            # Query crew_memories for interesting entries
            response = self.db.table('crew_memories').select('*').gte(
                'created_at', cutoff_date.isoformat()
            ).limit(limit * 2).execute()  # Get extra to filter

            if not response.data:
                logger.info("No recent crew memories found")
                return []

            scenarios = []
            for idx, memory in enumerate(response.data[:limit]):
                scenario = self._memory_to_scenario(memory, idx)
                if scenario:
                    scenarios.append(scenario)

            logger.info(f"Generated {len(scenarios)} history-based scenarios")
            return scenarios

        except Exception as e:
            logger.error(f"Error generating history-based scenarios: {e}")
            return []

    def _memory_to_scenario(self, memory: Dict[str, Any], idx: int) -> Optional[DrillScenario]:
        """Convert a crew memory to a drill scenario"""
        try:
            title = memory.get('title', 'Historical scenario')
            summary = memory.get('summary', '')

            # Infer complexity from memory metadata
            complexity = self._infer_complexity_from_memory(memory)

            # Build scenario
            return DrillScenario(
                id=f"history_{idx}_{int(datetime.now().timestamp())}",
                scenario_type=ScenarioType.REAL_WORLD,
                category='historical',
                complexity_level=complexity,
                title=f"Replicate: {title}",
                description=summary[:500],  # Truncate long summaries
                user_request=summary,
                expected_expertise=memory.get('tags', [])[:5],
                success_criteria={'source': 'crew_memory', 'memory_id': memory.get('id')},
                baseline_metrics={'original_crew': memory.get('crew_member')},
                tags=['real_world', 'historical'] + memory.get('tags', [])[:3],
                created_at=datetime.now()
            )
        except Exception as e:
            logger.error(f"Error converting memory to scenario: {e}")
            return None

    def _infer_complexity_from_memory(self, memory: Dict[str, Any]) -> ComplexityLevel:
        """Infer complexity level from memory metadata"""
        # Use priority field if available
        priority = memory.get('priority', 'medium')

        if priority == 'critical':
            return ComplexityLevel.CRITICAL
        elif priority == 'high':
            return ComplexityLevel.IMPORTANT
        elif priority == 'medium':
            return ComplexityLevel.ROUTINE
        else:
            return ComplexityLevel.TRIVIAL

    def load_active_scenarios(self) -> List[DrillScenario]:
        """
        Load active scenarios from database

        Returns:
            List of active scenarios
        """
        if not self.db:
            logger.warning("No Supabase client provided, cannot load scenarios")
            return []

        try:
            response = self.db.table('drill_scenarios').select('*').eq(
                'active', True
            ).order('created_at', desc=True).execute()

            scenarios = []
            for data in response.data:
                try:
                    scenario = DrillScenario.from_dict(data)
                    scenarios.append(scenario)
                except Exception as e:
                    logger.error(f"Error parsing scenario {data.get('id')}: {e}")
                    continue

            logger.info(f"Loaded {len(scenarios)} active scenarios from database")
            return scenarios

        except Exception as e:
            logger.error(f"Error loading scenarios from database: {e}")
            return []

    def create_benchmark_suite(self) -> List[DrillScenario]:
        """
        Create a standard benchmark suite for consistent testing

        Returns:
            List of benchmark scenarios
        """
        benchmarks = [
            # Critical benchmark
            DrillScenario(
                id=f"benchmark_critical_{int(datetime.now().timestamp())}",
                scenario_type=ScenarioType.BENCHMARK,
                category='architecture',
                complexity_level=ComplexityLevel.CRITICAL,
                title='Design multi-region disaster recovery architecture',
                description='Strategic architectural decision for mission-critical system.',
                user_request='Design a disaster recovery architecture for our payment processing system that can handle region-wide outages with RPO < 1 minute and RTO < 5 minutes.',
                expected_expertise=['strategy', 'architecture', 'infrastructure', 'security'],
                success_criteria={'required_crew_min': 4, 'required_crew_max': 7},
                tags=['benchmark', 'critical', 'architecture'],
                created_at=datetime.now()
            ),
            # Important benchmark
            DrillScenario(
                id=f"benchmark_important_{int(datetime.now().timestamp())}",
                scenario_type=ScenarioType.BENCHMARK,
                category='feature',
                complexity_level=ComplexityLevel.IMPORTANT,
                title='Implement OAuth2 social login integration',
                description='Add social login with Google, Facebook, and GitHub.',
                user_request='Implement OAuth2 social login supporting Google, Facebook, and GitHub. Should handle account linking, profile sync, and token refresh.',
                expected_expertise=['implementation', 'security', 'apis', 'integration'],
                success_criteria={'required_crew_min': 3, 'required_crew_max': 5},
                tags=['benchmark', 'important', 'feature'],
                created_at=datetime.now()
            ),
            # Routine benchmark
            DrillScenario(
                id=f"benchmark_routine_{int(datetime.now().timestamp())}",
                scenario_type=ScenarioType.BENCHMARK,
                category='bug_fix',
                complexity_level=ComplexityLevel.ROUTINE,
                title='Fix timezone handling in date picker',
                description='Date picker shows wrong dates for users in different timezones.',
                user_request='The date picker component doesn\'t correctly handle timezone conversions. Users in Asia/Tokyo see dates offset by one day.',
                expected_expertise=['implementation', 'debugging', 'ux'],
                success_criteria={'required_crew_min': 1, 'required_crew_max': 3},
                tags=['benchmark', 'routine', 'bug'],
                created_at=datetime.now()
            ),
            # Trivial benchmark
            DrillScenario(
                id=f"benchmark_trivial_{int(datetime.now().timestamp())}",
                scenario_type=ScenarioType.BENCHMARK,
                category='documentation',
                complexity_level=ComplexityLevel.TRIVIAL,
                title='Add API rate limiting documentation',
                description='Document rate limits for public API endpoints.',
                user_request='Add documentation explaining our API rate limits (100 requests/minute for authenticated, 20/minute for anonymous users) to the API docs.',
                expected_expertise=['documentation', 'communication'],
                success_criteria={'required_crew_min': 1, 'required_crew_max': 2},
                tags=['benchmark', 'trivial', 'docs'],
                created_at=datetime.now()
            )
        ]

        logger.info(f"Created {len(benchmarks)} benchmark scenarios")
        return benchmarks

    def get_diverse_scenario_set(
        self,
        total_count: int = 25,
        synthetic_ratio: float = 0.6,
        history_ratio: float = 0.25,
        benchmark_ratio: float = 0.15
    ) -> List[DrillScenario]:
        """
        Get a diverse set of scenarios from all sources

        Args:
            total_count: Total scenarios to return
            synthetic_ratio: Percentage of synthetic scenarios
            history_ratio: Percentage from history
            benchmark_ratio: Percentage benchmarks

        Returns:
            Diverse list of scenarios
        """
        scenarios = []

        # Calculate counts
        synthetic_count = int(total_count * synthetic_ratio)
        history_count = int(total_count * history_ratio)
        benchmark_count = int(total_count * benchmark_ratio)

        # Adjust for rounding
        remaining = total_count - (synthetic_count + history_count + benchmark_count)
        synthetic_count += remaining

        # Generate from each source
        scenarios.extend(self.generate_synthetic_scenarios(count=synthetic_count))
        scenarios.extend(self.generate_from_crew_history(limit=history_count))

        # Add benchmarks
        benchmarks = self.create_benchmark_suite()
        scenarios.extend(benchmarks[:benchmark_count])

        # If we don't have enough, add more synthetic
        if len(scenarios) < total_count:
            additional = total_count - len(scenarios)
            scenarios.extend(self.generate_synthetic_scenarios(count=additional))

        logger.info(
            f"Generated diverse scenario set: {len(scenarios)} total "
            f"({len([s for s in scenarios if s.scenario_type == ScenarioType.SYNTHETIC])} synthetic, "
            f"{len([s for s in scenarios if s.scenario_type == ScenarioType.REAL_WORLD])} history, "
            f"{len([s for s in scenarios if s.scenario_type == ScenarioType.BENCHMARK])} benchmark)"
        )

        return scenarios[:total_count]
