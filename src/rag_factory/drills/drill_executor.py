"""Drill executor for running crew performance tests

Executes scenarios against different LLM tier configurations and collects metrics.
"""

import time
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from ..orchestration.crew_orchestrator import CrewOrchestrator
from .models import (
    DrillScenario,
    DrillExecution,
    ExecutionStatus,
    ComplexityLevel
)

logger = logging.getLogger(__name__)


class DrillExecutor:
    """Executes drill scenarios and collects performance metrics"""

    def __init__(
        self,
        orchestrator: CrewOrchestrator,
        supabase_client=None,
        timeout_ms: int = 30000
    ):
        """
        Initialize drill executor

        Args:
            orchestrator: CrewOrchestrator instance
            supabase_client: Supabase client for storing results
            timeout_ms: Execution timeout in milliseconds
        """
        self.orchestrator = orchestrator
        self.db = supabase_client
        self.timeout_ms = timeout_ms

    def execute_scenario(
        self,
        scenario: DrillScenario,
        tier_config: Dict[str, str],
        drill_run_id: str,
        tier_config_label: str = "custom"
    ) -> DrillExecution:
        """
        Execute a single scenario with specified tier configuration

        Args:
            scenario: The scenario to execute
            tier_config: LLM tier assignments {crew_id: tier}
            drill_run_id: Parent drill run ID
            tier_config_label: Label for this tier config (e.g., "all_premium")

        Returns:
            DrillExecution with results and metrics
        """
        execution_id = str(uuid.uuid4())
        start_time = time.time()
        start_ms = int(start_time * 1000)

        logger.info(
            f"Executing scenario '{scenario.title}' "
            f"with tier config '{tier_config_label}'"
        )

        try:
            # Execute with tier override
            result = self.orchestrator.orchestrate(
                user_request=scenario.user_request,
                context=scenario.context_data,
                tier_override=tier_config if tier_config else None
            )

            # Calculate execution time
            end_time = time.time()
            execution_time_ms = int((end_time - start_time) * 1000)

            # Check timeout
            if execution_time_ms > self.timeout_ms:
                logger.warning(f"Execution exceeded timeout: {execution_time_ms}ms")
                status = ExecutionStatus.TIMEOUT
            else:
                status = ExecutionStatus.SUCCESS

            # Extract metrics from orchestration result
            total_cost = result.estimated_cost
            activated_crew = result.activated_crew
            llm_assignments = result.llm_assignments

            # Build tokens_used dict (if available in future orchestrator versions)
            tokens_used = {}

            # Create execution record
            execution = DrillExecution(
                id=execution_id,
                drill_run_id=drill_run_id,
                scenario_id=scenario.id,
                executed_at=datetime.fromtimestamp(start_time),
                execution_status=status,
                activated_crew=activated_crew,
                llm_tier_assignments=llm_assignments,
                task_complexity=result.task_complexity,
                total_cost_usd=total_cost,
                execution_time_ms=execution_time_ms,
                tokens_used=tokens_used,
                orchestration_result={
                    'picard_reasoning': result.picard_reasoning,
                    'quark_roi_analysis': {
                        'cost_savings': result.quark_roi_analysis.cost_savings,
                        'savings_percentage': result.quark_roi_analysis.savings_percentage,
                        'recommendation': result.quark_roi_analysis.recommendation
                    },
                    'activated_crew': activated_crew,
                    'llm_assignments': llm_assignments
                },
                tier_configuration_label=tier_config_label,
                created_at=datetime.now()
            )

            # Store in database
            if self.db:
                self._store_execution(execution)

            logger.info(
                f"Execution complete: {execution_time_ms}ms, "
                f"${total_cost:.6f}, {len(activated_crew)} crew"
            )

            return execution

        except Exception as e:
            # Handle execution error
            end_time = time.time()
            execution_time_ms = int((end_time - start_time) * 1000)

            logger.error(f"Execution failed: {e}")

            execution = DrillExecution(
                id=execution_id,
                drill_run_id=drill_run_id,
                scenario_id=scenario.id,
                executed_at=datetime.fromtimestamp(start_time),
                execution_status=ExecutionStatus.ERROR,
                activated_crew=[],
                llm_tier_assignments={},
                task_complexity=scenario.complexity_level,
                total_cost_usd=0.0,
                execution_time_ms=execution_time_ms,
                tokens_used={},
                orchestration_result={},
                tier_configuration_label=tier_config_label,
                error_log=str(e),
                created_at=datetime.now()
            )

            # Store error execution
            if self.db:
                self._store_execution(execution)

            return execution

    def _store_execution(self, execution: DrillExecution):
        """Store execution in database"""
        try:
            data = execution.to_dict()
            self.db.table('drill_executions').insert(data).execute()
            logger.debug(f"Stored execution {execution.id}")
        except Exception as e:
            logger.error(f"Failed to store execution: {e}")

    def execute_scenario_matrix(
        self,
        scenario: DrillScenario,
        drill_run_id: str,
        test_configurations: Optional[List[str]] = None
    ) -> List[DrillExecution]:
        """
        Execute scenario against multiple tier configurations

        Args:
            scenario: The scenario to execute
            drill_run_id: Parent drill run ID
            test_configurations: List of tier config labels to test
                Options: "current_default", "all_premium", "all_budget", "mixed_optimized"

        Returns:
            List of executions with different tier configurations
        """
        if test_configurations is None:
            test_configurations = ["current_default", "all_premium", "all_budget"]

        executions = []

        for config_label in test_configurations:
            tier_config = self._get_tier_configuration(config_label, scenario)
            execution = self.execute_scenario(
                scenario=scenario,
                tier_config=tier_config,
                drill_run_id=drill_run_id,
                tier_config_label=config_label
            )
            executions.append(execution)

        logger.info(
            f"Executed scenario '{scenario.title}' with {len(executions)} configurations"
        )

        return executions

    def _get_tier_configuration(
        self,
        config_label: str,
        scenario: DrillScenario
    ) -> Optional[Dict[str, str]]:
        """
        Get tier configuration based on label

        Args:
            config_label: Configuration label
            scenario: Scenario context

        Returns:
            Dict mapping crew_id to tier, or None for default
        """
        # Get crew roster
        crew_ids = list(self.orchestrator.crew_roster.keys())

        if config_label == "current_default":
            # Use orchestrator's default logic (no override)
            return None

        elif config_label == "all_premium":
            # All crew members use premium tier
            return {crew_id: "premium" for crew_id in crew_ids}

        elif config_label == "all_budget":
            # All crew members use budget tier
            return {crew_id: "budget" for crew_id in crew_ids}

        elif config_label == "all_standard":
            # All crew members use standard tier
            return {crew_id: "standard" for crew_id in crew_ids}

        elif config_label == "mixed_optimized":
            # Strategic mix: premium for leaders, budget for implementers
            tier_map = {}
            for crew_id, member in self.orchestrator.crew_roster.items():
                if crew_id in ['captain_picard', 'commander_riker']:
                    tier_map[crew_id] = "premium"
                elif crew_id in ['quark', 'chief_obrien']:
                    tier_map[crew_id] = "budget"
                else:
                    tier_map[crew_id] = "standard"
            return tier_map

        else:
            logger.warning(f"Unknown tier configuration: {config_label}")
            return None

    def run_drill_session(
        self,
        scenarios: List[DrillScenario],
        drill_run_id: str,
        test_all_configurations: bool = False
    ) -> Dict[str, Any]:
        """
        Execute a complete drill session with multiple scenarios

        Args:
            scenarios: List of scenarios to execute
            drill_run_id: Drill run ID
            test_all_configurations: If True, test each scenario with multiple tier configs

        Returns:
            Summary of drill session results
        """
        logger.info(f"Starting drill session with {len(scenarios)} scenarios")

        all_executions = []
        total_cost = 0.0
        success_count = 0
        error_count = 0
        timeout_count = 0

        for idx, scenario in enumerate(scenarios):
            logger.info(f"Processing scenario {idx + 1}/{len(scenarios)}: {scenario.title}")

            try:
                if test_all_configurations:
                    # Test multiple tier configurations
                    executions = self.execute_scenario_matrix(
                        scenario=scenario,
                        drill_run_id=drill_run_id
                    )
                else:
                    # Test only default configuration
                    execution = self.execute_scenario(
                        scenario=scenario,
                        tier_config=None,
                        drill_run_id=drill_run_id,
                        tier_config_label="current_default"
                    )
                    executions = [execution]

                all_executions.extend(executions)

                # Aggregate metrics
                for execution in executions:
                    total_cost += execution.total_cost_usd

                    if execution.execution_status == ExecutionStatus.SUCCESS:
                        success_count += 1
                    elif execution.execution_status == ExecutionStatus.ERROR:
                        error_count += 1
                    elif execution.execution_status == ExecutionStatus.TIMEOUT:
                        timeout_count += 1

            except Exception as e:
                logger.error(f"Failed to execute scenario {scenario.id}: {e}")
                error_count += 1
                continue

        # Calculate summary statistics
        total_executions = len(all_executions)
        success_rate = (success_count / total_executions * 100) if total_executions > 0 else 0
        avg_cost = total_cost / total_executions if total_executions > 0 else 0

        avg_time_ms = sum(e.execution_time_ms for e in all_executions) / len(all_executions) if all_executions else 0

        summary = {
            'drill_run_id': drill_run_id,
            'total_scenarios': len(scenarios),
            'total_executions': total_executions,
            'success_count': success_count,
            'error_count': error_count,
            'timeout_count': timeout_count,
            'success_rate': success_rate,
            'total_cost_usd': total_cost,
            'average_cost_usd': avg_cost,
            'average_time_ms': int(avg_time_ms),
            'executions': [e.to_dict() for e in all_executions]
        }

        logger.info(
            f"Drill session complete: {total_executions} executions, "
            f"{success_rate:.1f}% success rate, ${total_cost:.4f} total cost"
        )

        return summary

    def calculate_quality_scores(
        self,
        execution: DrillExecution,
        scenario: DrillScenario
    ) -> Dict[str, float]:
        """
        Calculate quality scores for an execution

        This is a simplified scoring method. In production, this could involve
        LLM-based evaluation or more sophisticated metrics.

        Args:
            execution: The execution to score
            scenario: The scenario that was executed

        Returns:
            Dict with quality, accuracy, and response_quality scores
        """
        scores = {
            'quality_score': 0.0,
            'accuracy_score': 0.0,
            'response_quality_score': 0.0
        }

        if execution.execution_status != ExecutionStatus.SUCCESS:
            # Failed executions get zero scores
            return scores

        try:
            # Get success criteria
            criteria = scenario.success_criteria

            # Score based on crew selection
            expected_expertise = set(scenario.expected_expertise)
            activated_crew_ids = set(execution.activated_crew)

            # Check if required crew members are present
            crew_match_score = 0.0
            if activated_crew_ids:
                # Get specializations of activated crew
                activated_expertise = set()
                for crew_id in activated_crew_ids:
                    if crew_id in self.orchestrator.crew_roster:
                        member = self.orchestrator.crew_roster[crew_id]
                        activated_expertise.update(member.specialization)

                # Calculate overlap
                overlap = expected_expertise.intersection(activated_expertise)
                if expected_expertise:
                    crew_match_score = len(overlap) / len(expected_expertise) * 100
                else:
                    crew_match_score = 100.0

            # Score based on crew size appropriateness
            crew_size = len(activated_crew_ids)
            min_crew = criteria.get('required_crew_min', 1)
            max_crew = criteria.get('required_crew_max', 10)

            size_score = 100.0
            if crew_size < min_crew:
                size_score = (crew_size / min_crew) * 100
            elif crew_size > max_crew:
                size_score = max(0, 100 - ((crew_size - max_crew) * 10))

            # Score based on cost efficiency
            expected_cost_range = criteria.get('expected_cost_range', [0, 0.1])
            min_cost, max_cost = expected_cost_range
            actual_cost = execution.total_cost_usd

            cost_score = 100.0
            if actual_cost < min_cost:
                cost_score = 100.0  # Under budget is good
            elif actual_cost > max_cost:
                overage = (actual_cost - max_cost) / max_cost
                cost_score = max(0, 100 - (overage * 100))

            # Aggregate scores
            scores['quality_score'] = (crew_match_score + size_score) / 2
            scores['accuracy_score'] = crew_match_score
            scores['response_quality_score'] = (crew_match_score + size_score + cost_score) / 3

        except Exception as e:
            logger.error(f"Error calculating quality scores: {e}")

        return scores

    def update_execution_scores(
        self,
        execution: DrillExecution,
        scenario: DrillScenario
    ):
        """
        Calculate and update quality scores for an execution

        Args:
            execution: The execution to update
            scenario: The scenario that was executed
        """
        scores = self.calculate_quality_scores(execution, scenario)

        execution.quality_score = scores['quality_score']
        execution.accuracy_score = scores['accuracy_score']
        execution.response_quality_score = scores['response_quality_score']

        # Update in database
        if self.db:
            try:
                self.db.table('drill_executions').update({
                    'quality_score': execution.quality_score,
                    'accuracy_score': execution.accuracy_score,
                    'response_quality_score': execution.response_quality_score
                }).eq('id', execution.id).execute()

                logger.debug(f"Updated scores for execution {execution.id}")
            except Exception as e:
                logger.error(f"Failed to update execution scores: {e}")
