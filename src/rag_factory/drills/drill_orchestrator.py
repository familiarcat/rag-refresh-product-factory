"""Drill orchestrator - coordinates the complete drill cycle

Orchestrates scenario generation, execution, evaluation, and system updates.
"""

import uuid
import json
import os
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging

from ..orchestration.crew_orchestrator import CrewOrchestrator
from .scenario_generator import ScenarioGenerator
from .drill_executor import DrillExecutor
from .picard_evaluator import PicardEvaluator
from .system_updater import SystemUpdater
from .models import DrillRun, DrillRunResult, RunType, RunStatus

logger = logging.getLogger(__name__)


class DrillOrchestrator:
    """Coordinates complete crew drill and optimization cycle"""

    def __init__(
        self,
        project_root: str = None,
        supabase_client=None,
        memory_store=None,
        config: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize drill orchestrator

        Args:
            project_root: Project root directory
            supabase_client: Supabase client
            memory_store: MemoryStore instance
            config: Drill configuration dict
        """
        if project_root is None:
            # Try to detect project root
            current_file = os.path.abspath(__file__)
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(current_file))))

        self.project_root = project_root
        self.db = supabase_client
        self.memory = memory_store

        # Load configuration
        self.config = config or self._load_default_config()

        # Initialize components
        self.crew_orchestrator = CrewOrchestrator()

        self.scenario_generator = ScenarioGenerator(
            supabase_client=supabase_client,
            crew_members_dir=os.path.join(project_root, "crew-members")
        )

        self.drill_executor = DrillExecutor(
            orchestrator=self.crew_orchestrator,
            supabase_client=supabase_client,
            timeout_ms=self.config.get('execution_config', {}).get('timeout_ms', 30000)
        )

        cost_db_path = os.path.join(project_root, "data", "llm-cost-database.json")
        cost_db = self._load_cost_database(cost_db_path)

        self.picard_evaluator = PicardEvaluator(
            cost_database=cost_db,
            supabase_client=supabase_client
        )

        self.system_updater = SystemUpdater(
            project_root=project_root,
            supabase_client=supabase_client,
            memory_store=memory_store,
            dry_run=False
        )

        logger.info("DrillOrchestrator initialized")

    def _load_default_config(self) -> Dict[str, Any]:
        """Load default drill configuration"""
        return {
            'weekly_schedule': {
                'enabled': True,
                'scenarios_per_run': 25
            },
            'scenario_generation': {
                'synthetic_count': 15,
                'history_based_count': 10,
                'diversity_weight': 0.7
            },
            'execution_config': {
                'timeout_ms': 30000,
                'test_tier_combinations': ['current_default', 'all_premium', 'all_budget']
            },
            'evaluation_config': {
                'min_confidence_threshold': 75
            },
            'update_config': {
                'auto_apply_updates': True,
                'require_approval_above_score': 90
            }
        }

    def _load_cost_database(self, path: str) -> Dict[str, Any]:
        """Load LLM cost database"""
        try:
            with open(path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading cost database: {e}")
            return {}

    async def execute_drill_cycle(
        self,
        run_type: str = "manual",
        scenario_count: Optional[int] = None,
        complexity_filter: Optional[List[str]] = None,
        dry_run: bool = False
    ) -> DrillRunResult:
        """
        Execute complete drill cycle

        Args:
            run_type: Type of drill run ("weekly_auto", "manual", "on_demand")
            scenario_count: Number of scenarios (None = use config default)
            complexity_filter: Filter scenarios by complexity
            dry_run: If True, don't apply system updates

        Returns:
            DrillRunResult with summary
        """
        drill_run_id = str(uuid.uuid4())
        start_time = datetime.now()

        logger.info(
            f"Starting drill cycle {drill_run_id} "
            f"(type={run_type}, dry_run={dry_run})"
        )

        # Create drill run record
        drill_run = DrillRun(
            id=drill_run_id,
            started_at=start_time,
            run_type=RunType(run_type) if isinstance(run_type, str) else run_type,
            status=RunStatus.RUNNING,
            config={
                'scenario_count': scenario_count,
                'complexity_filter': complexity_filter,
                'dry_run': dry_run
            },
            created_at=start_time
        )

        if self.db:
            self._store_drill_run(drill_run)

        try:
            # Step 1: Generate scenarios
            logger.info("Step 1/4: Generating scenarios")
            scenarios = self._generate_scenarios(scenario_count, complexity_filter)

            if not scenarios:
                raise ValueError("No scenarios generated")

            logger.info(f"Generated {len(scenarios)} scenarios")

            # Step 2: Execute scenarios
            logger.info("Step 2/4: Executing scenarios")
            execution_summary = self.drill_executor.run_drill_session(
                scenarios=scenarios,
                drill_run_id=drill_run_id,
                test_all_configurations=False  # Only test default for speed
            )

            # Update drill run with execution results
            drill_run.total_scenarios = len(scenarios)
            drill_run.total_executions = execution_summary['total_executions']
            drill_run.total_cost_usd = execution_summary['total_cost_usd']
            drill_run.average_execution_time_ms = execution_summary.get('average_time_ms')

            if self.db:
                self._update_drill_run(drill_run)

            # Step 3: Picard evaluation
            logger.info("Step 3/4: Picard evaluation")
            evaluation = self.picard_evaluator.evaluate_drill_run(drill_run_id)

            # Link evaluation to drill run
            drill_run.picard_evaluation_id = evaluation.id
            drill_run.average_quality_score = evaluation.overall_score

            if self.db:
                self._update_drill_run(drill_run)

            # Step 4: Apply system updates
            logger.info("Step 4/4: Applying system updates")
            updates_applied = {}

            if not dry_run and self.config['update_config']['auto_apply_updates']:
                # Check if score meets auto-apply threshold
                require_approval_score = self.config['update_config'].get('require_approval_above_score', 90)

                if evaluation.overall_score < require_approval_score:
                    self.system_updater.dry_run = dry_run
                    updates_applied = self.system_updater.apply_recommendations(
                        evaluation=evaluation,
                        auto_apply=True
                    )
                else:
                    logger.info(
                        f"Score {evaluation.overall_score:.1f} >= {require_approval_score}, "
                        f"skipping auto-apply (requires manual approval)"
                    )
                    updates_applied = {'note': 'Manual approval required for high-impact changes'}
            else:
                logger.info("Skipping system updates (dry_run or auto_apply disabled)")
                updates_applied = {'note': 'Updates skipped'}

            drill_run.updates_applied = updates_applied

            # Complete drill run
            drill_run.completed_at = datetime.now()
            drill_run.status = RunStatus.COMPLETED

            if self.db:
                self._update_drill_run(drill_run)

            logger.info(
                f"Drill cycle complete: {drill_run.total_executions} executions, "
                f"${drill_run.total_cost_usd:.4f} cost, "
                f"{evaluation.overall_score:.1f} overall score"
            )

            return DrillRunResult(
                drill_run_id=drill_run_id,
                total_scenarios=drill_run.total_scenarios,
                total_cost=drill_run.total_cost_usd,
                evaluation_summary=evaluation.assessment_summary,
                status=RunStatus.COMPLETED
            )

        except Exception as e:
            logger.error(f"Error during drill cycle: {e}")

            # Mark run as failed
            drill_run.status = RunStatus.FAILED
            drill_run.error_log = str(e)
            drill_run.completed_at = datetime.now()

            if self.db:
                self._update_drill_run(drill_run)

            return DrillRunResult(
                drill_run_id=drill_run_id,
                total_scenarios=0,
                total_cost=0.0,
                evaluation_summary="",
                status=RunStatus.FAILED,
                error=str(e)
            )

    def _generate_scenarios(
        self,
        count: Optional[int],
        complexity_filter: Optional[List[str]]
    ) -> List:
        """Generate scenarios for drill"""
        if count is None:
            count = self.config['weekly_schedule']['scenarios_per_run']

        # Get diverse scenario set
        scenarios = self.scenario_generator.get_diverse_scenario_set(
            total_count=count,
            synthetic_ratio=0.6,
            history_ratio=0.25,
            benchmark_ratio=0.15
        )

        # Apply complexity filter if specified
        if complexity_filter:
            scenarios = [
                s for s in scenarios
                if s.complexity_level.value in complexity_filter or str(s.complexity_level) in complexity_filter
            ]

        # Store scenarios in database if they don't exist
        if self.db:
            for scenario in scenarios:
                try:
                    # Check if scenario exists
                    existing = self.db.table('drill_scenarios').select('id').eq(
                        'id', scenario.id
                    ).execute()

                    if not existing.data:
                        # Insert new scenario
                        data = scenario.to_dict()
                        self.db.table('drill_scenarios').insert(data).execute()
                except Exception as e:
                    logger.warning(f"Could not store scenario {scenario.id}: {e}")

        return scenarios

    def _store_drill_run(self, drill_run: DrillRun):
        """Store drill run in database"""
        try:
            data = drill_run.to_dict()
            self.db.table('drill_runs').insert(data).execute()
            logger.debug(f"Stored drill run {drill_run.id}")
        except Exception as e:
            logger.error(f"Failed to store drill run: {e}")

    def _update_drill_run(self, drill_run: DrillRun):
        """Update drill run in database"""
        try:
            data = drill_run.to_dict()
            self.db.table('drill_runs').update(data).eq('id', drill_run.id).execute()
            logger.debug(f"Updated drill run {drill_run.id}")
        except Exception as e:
            logger.error(f"Failed to update drill run: {e}")

    def get_drill_run_status(self, drill_run_id: str) -> Optional[Dict[str, Any]]:
        """
        Get status of a drill run

        Args:
            drill_run_id: Drill run ID

        Returns:
            Dict with drill run status
        """
        if not self.db:
            return None

        try:
            response = self.db.table('drill_runs').select('*').eq(
                'id', drill_run_id
            ).single().execute()

            if response.data:
                return response.data

            return None

        except Exception as e:
            logger.error(f"Error fetching drill run status: {e}")
            return None

    def get_drill_run_results(self, drill_run_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed results of a drill run

        Args:
            drill_run_id: Drill run ID

        Returns:
            Dict with drill run and evaluation details
        """
        if not self.db:
            return None

        try:
            # Get drill run
            run_response = self.db.table('drill_runs').select('*').eq(
                'id', drill_run_id
            ).single().execute()

            if not run_response.data:
                return None

            drill_run = run_response.data

            # Get evaluation if available
            if drill_run.get('picard_evaluation_id'):
                eval_response = self.db.table('drill_evaluations').select('*').eq(
                    'id', drill_run['picard_evaluation_id']
                ).single().execute()

                drill_run['evaluation'] = eval_response.data if eval_response.data else None

            # Get executions summary
            exec_response = self.db.table('drill_executions').select('*').eq(
                'drill_run_id', drill_run_id
            ).execute()

            drill_run['executions_count'] = len(exec_response.data) if exec_response.data else 0

            return drill_run

        except Exception as e:
            logger.error(f"Error fetching drill run results: {e}")
            return None
